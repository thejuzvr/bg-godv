import 'dotenv/config';
import * as storage from './storage';
import { processGameTick } from '../src/ai/game-engine';
import type { Character } from '../src/types/character';
import type { GameData } from '../src/services/gameDataService';
import { addOfflineEvent, cleanupOldEvents } from '../src/services/offlineEventsService';
import { gameDataService } from './game-data-service';
import { getRedis } from './redis';
import { buildDailyDigest } from './digest/digestService';
import { getActiveTelegramSubscriptions, setTelegramLastSentAt } from './storage';

// Import static game data (not yet in DB)
import { initialQuests } from '../src/data/quests';
import { initialEvents } from '../src/data/events';
import { initialCityEvents } from '../src/data/cityEvents';
import { initialSovngardeQuests } from '../src/data/sovngarde';

// Cache game data
let gameData: GameData | null = null;

async function loadGameData(): Promise<GameData> {
  if (!gameData) {
    // Load data from PostgreSQL
    const [items, enemies, locations, npcs] = await Promise.all([
      gameDataService.getAllItems(),
      gameDataService.getAllEnemies(),
      gameDataService.getAllLocations(),
      gameDataService.getAllNpcs(),
    ]);
    
    gameData = {
      items,
      enemies,
      locations,
      npcs,
      // Still using static imports for these (not yet migrated to DB)
      quests: initialQuests,
      events: initialEvents,
      cityEvents: initialCityEvents,
      sovngardeQuests: initialSovngardeQuests,
    };
  }
  return gameData;
}

// Tracker for each character's next tick time
interface CharacterTickTracker {
  characterId: string;
  nextTickAt: number;
  isInCombat: boolean;
}

const characterTrackers = new Map<string, CharacterTickTracker>();

/**
 * Get random interval for adventure tick (15-40 seconds)
 */
function getAdventureTickInterval(): number {
  return (Math.floor(Math.random() * (40 - 15 + 1)) + 15) * 1000; // 15-40 seconds in ms
}

/**
 * Get random interval for combat tick (3-5 seconds)
 */
function getCombatTickInterval(): number {
  return (Math.floor(Math.random() * (5 - 3 + 1)) + 3) * 1000; // 3-5 seconds in ms
}

async function processCharacter(character: Character, gameData: GameData): Promise<void> {
  try {
    const wasInCombat = character.status === 'in-combat';
    
    // Process one game tick for this character
    const result = await processGameTick(character, gameData);
    
    const isNowInCombat = result.updatedCharacter.status === 'in-combat';
    
    // Save updated character state
    await storage.saveCharacter(result.updatedCharacter);
    
    // Log offline events with staggered timestamps to avoid identical times
    const baseTs = Date.now();
    let offset = 0;
    for (const message of result.adventureLog) {
      await addOfflineEvent(character.id, {
        type: 'system',
        message,
        // @ts-ignore allow timestamp passthrough to storage layer
        timestamp: baseTs + offset,
      } as any);
      offset += 500;
    }
    // Log combat events
    for (const message of result.combatLog) {
      await addOfflineEvent(character.id, {
        type: 'combat',
        message,
        // @ts-ignore allow timestamp passthrough to storage layer
        timestamp: baseTs + offset,
      } as any);
      offset += 500;
    }
    
    // Update last processed timestamp
    await storage.updateCharacterLastProcessed(character.id, Date.now());
    
    // Publish realtime update (legacy mode) so clients receive WS events without BullMQ
    try {
      const pub = getRedis();
      const c: any = result.updatedCharacter as any;
      await pub.publish('ws:tick', JSON.stringify({
        realmId: c.realmId || 'global',
        characterId: character.id,
        tickAt: Date.now(),
        updatedAt: Date.now(),
        summary: {
          status: c.status,
          location: c.location,
          hp: c.stats?.health?.current,
        },
      }));
    } catch {}

    // Update tracker with next tick time based on combat status
    const tracker = characterTrackers.get(character.id);
    if (tracker) {
      const nextInterval = isNowInCombat ? getCombatTickInterval() : getAdventureTickInterval();
      tracker.nextTickAt = Date.now() + nextInterval;
      tracker.isInCombat = isNowInCombat;
      
      const tickType = isNowInCombat ? 'бой' : 'приключение';
      const intervalSec = Math.round(nextInterval / 1000);
      console.log(`[Background Worker] ${character.name} (${character.id}): следующий тик (${tickType}) через ${intervalSec}с`);
    }
    
  } catch (error) {
    console.error(`[Background Worker] Error processing character ${character.id}:`, error);
  }
}

export async function runBackgroundWorker() {
  console.log('[Background Worker] Starting background worker with dynamic tick intervals...');
  console.log('[Background Worker] Combat tick: 3-5 seconds (random)');
  console.log('[Background Worker] Adventure tick: 15-40 seconds (random)');
  
  // Load game data once from PostgreSQL
  const data = await loadGameData();
  
  // Cleanup counter - run cleanup every 10 minutes
  let cleanupCounter = 0;
  const CHECK_INTERVAL = 1000; // Check every second
  const CLEANUP_EVERY_MS = 10 * 60 * 1000; // 10 minutes
  const RESTOCK_AT_HOUR = 2; // 2:00 local time
  let lastCleanup = Date.now();
  let lastRestockDay: number | null = null;
  const DIGEST_HOUR_UTC = Number(process.env.DIGEST_HOUR_UTC || '7');
  let lastDigestDay: number | null = null;
  
  // Main loop
  while (true) {
    try {
      const now = Date.now();
      
      // Get all active characters
      const characters = await storage.getAllActiveCharacters();
      
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
          console.log(`[Background Worker] Добавлен персонаж ${char.name}: первый тик (${tickType}) через ${intervalSec}с`);
        }
      }
      
      // Remove trackers for characters no longer active
      const activeIds = new Set(characters.map(c => c.id));
      for (const [id, tracker] of characterTrackers.entries()) {
        if (!activeIds.has(id)) {
          characterTrackers.delete(id);
          console.log(`[Background Worker] Удален неактивный персонаж: ${id}`);
        }
      }
      
      // Process characters whose tick time has arrived
      let processedCount = 0;
      for (const char of characters) {
        const tracker = characterTrackers.get(char.id);
        
        if (tracker && now >= tracker.nextTickAt) {
          const character = char as unknown as Character;
          await processCharacter(character, data);
          processedCount++;
        }
      }
      
      if (processedCount > 0) {
        console.log(`[Background Worker] Обработано ${processedCount} персонажей в этом цикле`);
      }
      
      // Periodic cleanup of old read offline events
      if (now - lastCleanup >= CLEANUP_EVERY_MS) {
        console.log('[Background Worker] Запуск периодической очистки старых событий...');
        for (const char of characters) {
          try {
            await cleanupOldEvents(char.id);
          } catch (error) {
            console.error(`[Background Worker] Ошибка очистки событий для ${char.id}:`, error);
          }
        }
        lastCleanup = now;
      }

      // Nightly merchant restock at ~02:00 once per day
      const current = new Date();
      const isRestockHour = current.getHours() === RESTOCK_AT_HOUR;
      const dayKey = current.getFullYear() * 1000 + current.getMonth() * 50 + current.getDate();
      if (isRestockHour && lastRestockDay !== dayKey) {
        try {
          const count = await gameDataService.nightlyRestockAllMerchants();
          console.log(`[Background Worker] Nightly restock complete: ${count} merchants updated.`);
          lastRestockDay = dayKey;
        } catch (e) {
          console.error('[Background Worker] Nightly restock failed:', e);
        }
      }

      // Daily Telegram digest in legacy mode (UTC hour), once per day
      const telegramEnabled = String(process.env.TELEGRAM_ENABLED || '').toLowerCase() === 'true';
      const utc = new Date();
      const utcDayKey = utc.getUTCFullYear() * 1000 + utc.getUTCMonth() * 50 + utc.getUTCDate();
      const isDigestHour = utc.getUTCHours() === DIGEST_HOUR_UTC;
      if (telegramEnabled && isDigestHour && lastDigestDay !== utcDayKey) {
        try {
          const subs = await getActiveTelegramSubscriptions();
          const since = Date.now() - 24 * 60 * 60 * 1000;
          const token = process.env.TELEGRAM_BOT_TOKEN;
          const canSend = Boolean(token);
          let sent = 0;
          for (const sub of subs as any[]) {
            const text = await buildDailyDigest((sub as any).userId, since);
            if (!text) continue;
            if (!canSend) {
              console.log('[Telegram] Disabled or missing token; would send digest for', (sub as any).userId);
              await setTelegramLastSentAt((sub as any).id, Date.now());
              sent++;
              continue;
            }
            try {
              const resp = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ chat_id: (sub as any).chatId, text }),
              });
              if (resp.ok) {
                await setTelegramLastSentAt((sub as any).id, Date.now());
                sent++;
              } else {
                const body = await resp.text();
                console.error('[Telegram] legacy sendMessage failed', resp.status, body);
              }
            } catch (e) {
              console.error('[Telegram] legacy sendMessage error', e);
            }
          }
          if (sent > 0) {
            console.log(`[Background Worker] Sent ${sent} daily digests (legacy mode).`);
          }
          lastDigestDay = utcDayKey;
        } catch (e) {
          console.error('[Background Worker] Daily digest (legacy) failed:', e);
        }
      }
      
      // Wait a short interval before next check
      await new Promise(resolve => setTimeout(resolve, CHECK_INTERVAL));
    } catch (error) {
      console.error('[Background Worker] Error in main loop:', error);
      // Wait a bit longer on error to avoid spam
      await new Promise(resolve => setTimeout(resolve, 10000));
    }
  }
}
