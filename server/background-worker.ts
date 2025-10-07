import 'dotenv/config';
import * as storage from './storage';
import { processGameTick } from '../src/ai/game-engine';
import type { Character } from '../src/types/character';
import type { GameData } from '../src/services/gameDataService';
import { addOfflineEvent, cleanupOldEvents } from '../src/services/offlineEventsService';
import { gameDataService } from './game-data-service';


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

async function processCharacter(character: Character, gameData: GameData): Promise<void> {
  try {
    // Process one game tick for this character
    const result = await processGameTick(character, gameData);
    
    // Save updated character state
    await storage.saveCharacter(result.updatedCharacter);
    
    // Log offline events (adventure log)
    for (const message of result.adventureLog) {
      await addOfflineEvent(character.id, {
        type: 'system',
        message,
      });
    }
    
    // Log combat events
    for (const message of result.combatLog) {
      await addOfflineEvent(character.id, {
        type: 'combat',
        message,
      });
    }
    
    // Update last processed timestamp
    await storage.updateCharacterLastProcessed(character.id, Date.now());
    
    console.log(`[Background Worker] Processed character: ${character.name} (${character.id})`);
  } catch (error) {
    console.error(`[Background Worker] Error processing character ${character.id}:`, error);
  }
}

export async function runBackgroundWorker() {
  console.log('[Background Worker] Starting background worker...');
  
  // Load game data once from PostgreSQL
  const data = await loadGameData();
  
  // Cleanup counter - run cleanup every 10 minutes (200 ticks * 3s = 600s = 10min)
  let cleanupCounter = 0;
  const CLEANUP_INTERVAL = 200;
  
  // Main loop
  while (true) {
    try {
      // Get all active characters
      const characters = await storage.getAllActiveCharacters();
      
      console.log(`[Background Worker] Processing ${characters.length} active characters...`);
      
      // Process each character
      for (const char of characters) {
        // Cast to Character type (from database type)
        const character = char as unknown as Character;
        await processCharacter(character, data);
      }
      
      // Periodic cleanup of old read offline events (every 10 minutes)
      cleanupCounter++;
      if (cleanupCounter >= CLEANUP_INTERVAL) {
        console.log('[Background Worker] Running periodic cleanup of old events...');
        for (const char of characters) {
          try {
            await cleanupOldEvents(char.id);
          } catch (error) {
            console.error(`[Background Worker] Error cleaning up events for ${char.id}:`, error);
          }
        }
        cleanupCounter = 0;
      }
      
      // Wait 3 seconds before next tick (same as client)
      await new Promise(resolve => setTimeout(resolve, 3000));
    } catch (error) {
      console.error('[Background Worker] Error in main loop:', error);
      // Wait a bit longer on error to avoid spam
      await new Promise(resolve => setTimeout(resolve, 10000));
    }
  }
}
