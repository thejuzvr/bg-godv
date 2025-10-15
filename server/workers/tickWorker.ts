import 'dotenv/config';
import { Worker, Job } from 'bullmq';
import { getRedis } from '../redis';
import type { TickJob } from '../queues/tickQueue';
import * as storage from '../storage';
import { processGameTick } from '../../src/ai/game-engine';
import { gameDataService } from '../game-data-service';
import { getRedis } from '../redis';
import { insertCharacterSnapshot, cleanupOldSnapshots } from '../storage';

type ProcessResult = {
  ok: true;
} | {
  ok: false; error: string;
};

// simple in-Redis idempotency key with short TTL to protect against quick retries
async function withIdempotency<T>(key: string, ttlMs: number, fn: () => Promise<T>): Promise<T | null> {
  const redis = getRedis();
  const set = await redis.set(key, '1', { NX: true, PX: ttlMs });
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
      // static imports remain on the engine side for now
    };
  }
  return cachedGameData;
}

const concurrency = Number(process.env.QUEUE_CONCURRENCY || '4');

export const tickWorker = new Worker<TickJob>('ticks', async (job: Job<TickJob>): Promise<ProcessResult> => {
  const { realmId, characterId, tickAt, correlationId } = job.data;

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
    for (const message of tickResult.adventureLog) {
      await storage.addOfflineEvent(characterId, { type: 'system', message });
    }
    for (const message of tickResult.combatLog) {
      await storage.addOfflineEvent(characterId, { type: 'combat', message });
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
    const ok = await pub.set(snapKey, '1', 'NX', 'PX', 10 * 60 * 1000);
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
  connection: getRedis(),
  concurrency,
});


