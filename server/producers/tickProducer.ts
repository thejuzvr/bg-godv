import 'dotenv/config';
import { enqueueTick } from '../queues/tickQueue';
import * as storage from '../storage';

function getAdventureTickInterval(): number {
  return (Math.floor(Math.random() * (40 - 15 + 1)) + 15) * 1000;
}

function getCombatTickInterval(): number {
  return (Math.floor(Math.random() * (5 - 3 + 1)) + 3) * 1000;
}

export async function startTickProducer(): Promise<never> {
  const POLL_INTERVAL_MS = 1000;
  const realmId = process.env.DEFAULT_REALM_ID || 'global';

  // simple throttle to avoid spamming the queue when nothing changes
  while (true) {
    try {
      const now = Date.now();
      const characters = await storage.getAllActiveCharacters().catch((e) => {
        console.warn('[TickProducer] getAllActiveCharacters failed, skipping cycle:', e?.message || e);
        return [] as any[];
      });
      for (const char of characters) {
        const inCombat = (char as any).status === 'in-combat';
        const delay = inCombat ? getCombatTickInterval() : getAdventureTickInterval();
        const tickAt = now + delay;
        const correlationId = crypto.randomUUID();
        await enqueueTick({ realmId: (char as any).realmId || realmId, characterId: (char as any).id, tickAt, correlationId });
      }
    } catch (err) {
      console.error('[TickProducer] Error while enqueuing ticks:', err);
      // slow down a bit on error
      await new Promise(r => setTimeout(r, 5000));
    }
    await new Promise(r => setTimeout(r, POLL_INTERVAL_MS));
  }
}


