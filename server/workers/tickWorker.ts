import 'dotenv/config';
import { Worker, Job } from 'bullmq';
import { getRedis } from '../redis';
import type { TickJob } from '../queues/tickQueue';
import * as storage from '../storage';
import { processGameTick } from '../../src/ai/game-engine';
import { gameDataService } from '../game-data-service';
import { insertCharacterSnapshot, cleanupOldSnapshots } from '../storage';

// Import static game data (not yet in DB)
import { initialQuests } from '../../src/data/quests';
import { initialEvents } from '../../src/data/events';
import { initialCityEvents } from '../../src/data/cityEvents';
import { initialSovngardeQuests } from '../../src/data/sovngarde';

type ProcessResult = {
  ok: true;
} | {
  ok: false; error: string;
};

// simple in-Redis idempotency key with short TTL to protect against quick retries
async function withIdempotency<T>(key: string, ttlMs: number, fn: () => Promise<T>): Promise<T | null> {
  const redis = getRedis();
  const set = await redis.set(key, '1', 'PX', ttlMs, 'NX');
  if (set !== 'OK') return null; // already processed recently
  try {
    return await fn();
  } finally {
    // let TTL expire; do not delete to avoid races
  }
}

let cachedGameData: any | null = null;
async function getGameData() {
  if (!cachedGameData) {
    const [items, enemies, locations, npcs] = await Promise.all([
      gameDataService.getAllItems(),
      gameDataService.getAllEnemies(),
      gameDataService.getAllLocations(),
      gameDataService.getAllNpcs(),
    ]);
    cachedGameData = {
      items, enemies, locations, npcs,
      // Static imports (not yet migrated to DB)
      quests: initialQuests,
      events: initialEvents,
      cityEvents: initialCityEvents,
      sovngardeQuests: initialSovngardeQuests,
    };
  }
  return cachedGameData;
}

const concurrency = Number(process.env.QUEUE_CONCURRENCY || '4');

export const tickWorker = new Worker<TickJob>('ticks', async (job: Job<TickJob>): Promise<ProcessResult> => {
  const { realmId, characterId, tickAt, correlationId } = job.data;
  try {
    console.log(`[TickWorker] processing tick for ${characterId} at ${new Date(tickAt).toISOString()}`);
  } catch {}

  const idemKey = `tick:${realmId}:${characterId}:${tickAt}`;
  const result = await withIdempotency(idemKey, 5 * 60 * 1000, async () => {
    // Load character
    const character = await storage.getCharacterById(characterId);
    if (!character) {
      return { ok: false as const, error: `Character ${characterId} not found` };
    }

    const data = await getGameData();
    const thoughts = await gameDataService.getAllThoughts();
    const tickResult = await processGameTick(character as any, { ...data, thoughts });

    // Persist updated character atomically where possible
    await storage.saveCharacter(tickResult.updatedCharacter);
    await storage.updateCharacterLastProcessed(characterId, Date.now());

    // Update hot cache (write-through)
    try {
      const redis = getRedis();
      await redis.set(`char:hot:${characterId}`, JSON.stringify(tickResult.updatedCharacter), 'EX', 60);
    } catch {}

    // Persist logs as offline events (keeps fixed-size buffer)
    // Stagger timestamps within a single tick to avoid identical times for thought+event
    const baseTs = Date.now();
    let offset = 0;
    for (const message of tickResult.adventureLog) {
      await storage.addOfflineEvent(characterId, { type: 'system', message, timestamp: baseTs + offset });
      offset += 500; // 0.5s between messages for readability
    }
    for (const message of tickResult.combatLog) {
      await storage.addOfflineEvent(characterId, { type: 'combat', message, timestamp: baseTs + offset });
      offset += 500;
    }

    // Persist chronicle outbox
    if (tickResult.chronicleEntries && tickResult.chronicleEntries.length > 0) {
      for (const entry of tickResult.chronicleEntries) {
        await storage.addChronicleEntry(characterId, entry as any);
      }
    }

    // Publish realtime update
    const pub = getRedis();
    await pub.publish('ws:tick', JSON.stringify({
      realmId,
      characterId,
      tickAt,
      correlationId,
      updatedAt: Date.now(),
      summary: {
        status: (tickResult.updatedCharacter as any).status,
        location: (tickResult.updatedCharacter as any).location,
        hp: (tickResult.updatedCharacter as any).stats?.health?.current,
      },
    }));

    // Throttled snapshot every 10 minutes per character
    const snapKey = `snap:lock:${realmId}:${characterId}`;
    const ok = await pub.set(snapKey, '1', 'PX', 10 * 60 * 1000, 'NX');
    if (ok === 'OK') {
      const c = tickResult.updatedCharacter as any;
      const summary = {
        level: c.level,
        location: c.location,
        status: c.status,
        hp: c.stats?.health?.current,
        mp: c.stats?.magicka?.current,
        sp: c.stats?.stamina?.current,
        gold: (c.inventory?.find((i: any) => i.id === 'gold')?.quantity) || 0,
      };
      await insertCharacterSnapshot(realmId, characterId, Date.now(), summary);
      // GC to keep latest N snapshots
      await cleanupOldSnapshots(characterId, 200);
    }

    return { ok: true as const };
  });

  if (!result) {
    // duplicate; treat as success
    return { ok: true };
  }
  return result;
}, {
  connection: getRedis().duplicate(),
  concurrency,
  prefix: 'bull',
  autorun: true,
});

// Local visibility of worker lifecycle (in addition to run-worker.ts)
try {
  tickWorker.on('ready', () => console.log('[TickWorker] ready'));
  tickWorker.on('error', (err) => console.error('[TickWorker] error', err));
} catch {}


