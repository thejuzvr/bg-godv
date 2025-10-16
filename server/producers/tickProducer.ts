import 'dotenv/config';
import { enqueueTick, tickQueue } from '../queues/tickQueue';
import * as storage from '../storage';
import { randomUUID } from 'node:crypto';
import { getRedis } from '../redis';

// Tracker for each character's next tick time
interface CharacterTickTracker {
  characterId: string;
  nextTickAt: number;
  isInCombat: boolean;
}

const characterTrackers = new Map<string, CharacterTickTracker>();

function getAdventureTickInterval(): number {
  return (Math.floor(Math.random() * (20 - 5 + 1)) + 5) * 1000; // 5-20 seconds
}

function getCombatTickInterval(): number {
  return 1000; // 1 second for combat
}

export async function startTickProducer(): Promise<never> {
  console.log('[TickProducer] Starting tick producer with dynamic intervals...');
  console.log('[TickProducer] Combat tick: 1 second');
  console.log('[TickProducer] Adventure tick: 5-20 seconds (random)');
  
  const POLL_INTERVAL_MS = 1000; // Check every second
  const realmId = process.env.DEFAULT_REALM_ID || 'global';
  const redis = getRedis();

  // Simple leader election using Redis SET NX PX
  // Only one producer instance should run at a time across replicas
  const leaderKey = 'ticks:producer:leader';
  const leaderTtlMs = 5000; // renew every second; TTL 5s

  while (true) {
    try {
      // Try to acquire or renew leadership
      const nowMs = Date.now();
      const acquired = await redis.set(leaderKey, String(nowMs), 'PX', leaderTtlMs, 'NX');
      if (acquired !== 'OK') {
        // Not a leader; sleep and retry
        await new Promise(r => setTimeout(r, POLL_INTERVAL_MS));
        continue;
      }

      const now = Date.now();
      const characters = await storage.getAllActiveCharacters().catch((e) => {
        console.warn('[TickProducer] getAllActiveCharacters failed, skipping cycle:', e?.message || e);
        return [] as any[];
      });
      
      // Initialize trackers for new characters
      for (const char of characters) {
        if (!characterTrackers.has(char.id)) {
          const isInCombat = char.status === 'in-combat';
          const initialInterval = isInCombat ? getCombatTickInterval() : getAdventureTickInterval();
          
          characterTrackers.set(char.id, {
            characterId: char.id,
            nextTickAt: now + initialInterval,
            isInCombat,
          });
          
          const tickType = isInCombat ? 'бой' : 'приключение';
          const intervalSec = Math.round(initialInterval / 1000);
          console.log(`[TickProducer] Добавлен персонаж ${char.name}: первый тик (${tickType}) через ${intervalSec}с`);
        }
      }
      
      // Remove trackers for characters no longer active
      const activeIds = new Set(characters.map(c => c.id));
      for (const [id, tracker] of characterTrackers.entries()) {
        if (!activeIds.has(id)) {
          characterTrackers.delete(id);
          console.log(`[TickProducer] Удален неактивный персонаж: ${id}`);
        }
      }
      
      // Enqueue ticks for characters whose time has arrived
      let enqueuedCount = 0;
      for (const char of characters) {
        const tracker = characterTrackers.get(char.id);
        
        if (tracker && now >= tracker.nextTickAt) {
          const isInCombat = char.status === 'in-combat';
          const delay = isInCombat ? getCombatTickInterval() : getAdventureTickInterval();
          const tickAt = now + delay;
          const correlationId = randomUUID();
          
          // Per-character guard: prevent duplicate scheduling from overlapping loops
          // Key is short-lived and tied to the next scheduled tick time
          const guardKey = `ticks:guard:${char.id}:${Math.floor(tickAt/1000)}`; // coarse second bucket
          const guardOk = await redis.set(guardKey, '1', 'PX', delay + 2000, 'NX');
          if (guardOk !== 'OK') {
            // already scheduled by another node/loop
            continue;
          }
          
          await enqueueTick({ 
            realmId: (char as any).realmId || realmId, 
            characterId: char.id, 
            tickAt, 
            correlationId 
          });
          
          // Update tracker with next tick time
          tracker.nextTickAt = now + delay;
          tracker.isInCombat = isInCombat;
          enqueuedCount++;
          
          const tickType = isInCombat ? 'бой' : 'приключение';
          const intervalSec = Math.round(delay / 1000);
          console.log(`[TickProducer] ${char.name}: следующий тик (${tickType}) через ${intervalSec}с`);
        }
      }
      
      if (enqueuedCount > 0) {
        const counts = await tickQueue.getJobCounts('delayed', 'waiting', 'active', 'completed', 'failed');
        console.log(`[TickProducer] Enqueued ${enqueuedCount} tick(s) | counts:`, counts);
      }
      
    } catch (err) {
      console.error('[TickProducer] Error while enqueuing ticks:', err);
      // slow down a bit on error
      await new Promise(r => setTimeout(r, 5000));
    }
    
    await new Promise(r => setTimeout(r, POLL_INTERVAL_MS));
  }
}


