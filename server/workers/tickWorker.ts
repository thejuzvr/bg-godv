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

// Debug flag (opt-in via env). Safe, no-op when disabled
const DEBUG_TICKWORKER = String(process.env.DEBUG_TICKWORKER || '').toLowerCase() === 'true';
function dbg(...args: any[]) {
  if (!DEBUG_TICKWORKER) return;
  try {
    console.log('[TickWorker:debug]', ...args);
  } catch {}
}

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
    dbg('Loaded character snapshot', {
      id: characterId,
      status: (character as any)?.status,
      location: (character as any)?.location,
      currentAction: (character as any)?.currentAction?.type,
    });
    // Fallback to static thoughts if DB returns none (allow analytics to proceed)
    let t = thoughts;
    try {
      if (!Array.isArray(thoughts) || thoughts.length === 0) {
        // Static fallback: derive from getFallbackThought by sampling generic sets
        const mod = await import('../../src/data/thoughts');
        const fallbackList: string[] = [];
        try {
          // build a small pool from a few categories to avoid empty DB
          const anyMod: any = mod as any;
          const pool = ([] as string[])
            .concat(anyMod?.default?.generic_neutral || [])
            .concat(anyMod?.default?.generic_happy || [])
            .concat(anyMod?.default?.generic_sad || []);
          fallbackList.push(...pool.slice(0, 50));
        } catch {}
        t = fallbackList.length > 0 ? fallbackList.map((text) => ({ id: text, text, tags: [], conditions: null, weight: 1, locale: 'ru', isEnabled: true })) : [];
      }
    } catch {}
    const tickResult = await processGameTick(character as any, { ...data, thoughts: t });
    dbg('Tick result summary', {
      advCount: tickResult.adventureLog.length,
      combatCount: tickResult.combatLog.length,
      chronicleCount: (tickResult.chronicleEntries || []).length,
      nextStatus: (tickResult.updatedCharacter as any)?.status,
      nextLocation: (tickResult.updatedCharacter as any)?.location,
    });

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
    if (DEBUG_TICKWORKER) {
      try {
        dbg('Persisting logs', {
          advSample: tickResult.adventureLog.slice(0, 3),
          combatSample: tickResult.combatLog.slice(0, 3),
        });
      } catch {}
    }
    for (const message of tickResult.adventureLog) {
      await storage.addOfflineEvent(characterId, { type: 'system', message, timestamp: baseTs + offset });
      offset += 500; // 0.5s between messages for readability
    }
    for (const message of tickResult.combatLog) {
      await storage.addOfflineEvent(characterId, { type: 'combat', message, timestamp: baseTs + offset });
      offset += 500;
    }
    dbg('Persisted offline events', { total: (tickResult.adventureLog.length + tickResult.combatLog.length) });

    // Persist chronicle outbox
    if (tickResult.chronicleEntries && tickResult.chronicleEntries.length > 0) {
      for (const entry of tickResult.chronicleEntries) {
        await storage.addChronicleEntry(characterId, entry as any);
      }
    }

    // Mini-multiplayer encounters in cities/taverns (single-sided log)
    try {
      const currentChar = tickResult.updatedCharacter as any;
      const locations = (data as any).locations as any[];
      const here = locations?.find(l => l.id === currentChar.location);
      if (here && (here.type === 'city' || here.type === 'tavern')) {
        const redis = getRedis();
        const others = (await storage.getAllActiveCharacters()).filter((c: any) => (
          c.id !== currentChar.id &&
          (c.realmId || realmId) === (currentChar.realmId || realmId) &&
          c.location === currentChar.location
        ));
        if (others.length > 0) {
          const pick = others[Math.floor(Math.random() * others.length)];
          const cooldownKey = `mm:seen:${currentChar.id}:${currentChar.location}`;
          const nx = await redis.set(cooldownKey, '1', 'PX', 10 * 60 * 1000, 'NX');
          if (nx === 'OK') {
            const chance = here.type === 'tavern' ? 0.10 : 0.05;
            if (Math.random() < chance) {
              const enemyName = (currentChar.analytics?.encounteredEnemies || [])[0];
              const message = (currentChar.status === 'in-combat' && enemyName)
                ? `Пока дрался с ${enemyName} увидел как ${pick.name} своровал у него пару монет — чертовски хорош!`
                : `Видел ${pick.name} в таверне, не ожидал что кто-то может выпить бочонок скумы`;
              await storage.addOfflineEvent(currentChar.id, { type: 'system' as any, message, timestamp: Date.now() + 250 });
            }
          }
        }
      }
    } catch {}

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


