import type { Character } from "@/types/character";
import type { CharacterRepository } from "./characterService";
import * as storage from "../../server/storage";

export class PostgresCharacterRepository implements CharacterRepository {
  async saveCharacter(userId: string, characterData: Character): Promise<void> {
    if (!userId) {
      throw new Error("Пользователь не аутентифицирован. Невозможно сохранить героя.");
    }
    
    // Ensure user exists in database
    try {
      await storage.getUserById(userId);
    } catch {
      // User doesn't exist, silently fail (they need to be created first)
      console.warn(`User ${userId} not found in database, cannot save character`);
      throw new Error("Пользователь не найден в базе данных");
    }
    
    const finalCharacterData = { ...characterData, id: userId, lastUpdatedAt: Date.now() };
    await storage.saveCharacter(finalCharacterData);
  }

  async fetchCharacter(userId: string): Promise<Character | null> {
    if (!userId) return null;

    const charData = await storage.getCharacterById(userId);
    if (!charData) return null;

    // Ensure backward compatibility with default values
    const character: Character = {
      ...(charData as any),
      inventory: charData.inventory || [],
      equippedItems: charData.equippedItems || {},
      factions: charData.factions || {},
      patronDeity: (charData.patronDeity as any) || 'akatosh',
      divineFavor: charData.divineFavor || 0,
      templeProgress: charData.templeProgress || 0,
      templeCompletedFor: (charData.templeCompletedFor as any) || null,
      interventionPower: charData.interventionPower || { current: 100, max: 100 },
      divineSuggestion: charData.divineSuggestion || null,
      divineDestinationId: charData.divineDestinationId || null,
      pendingTravel: charData.pendingTravel || null,
      season: (charData.season as any) || 'Summer',
      weather: (charData.weather as any) || 'Clear',
      knownSpells: charData.knownSpells || [],
      completedQuests: charData.completedQuests || [],
      actionCooldowns: charData.actionCooldowns || {},
      visitedLocations: charData.visitedLocations || [],
      activeCryptQuest: charData.activeCryptQuest || null,
      lastUpdatedAt: charData.lastUpdatedAt || Date.now(),
      gameDate: charData.gameDate || Date.now(),
      mood: charData.mood ?? 50,
      attributes: charData.attributes || { strength: 10, agility: 10, intelligence: 10, endurance: 10 },
      skills: charData.skills || { oneHanded: 15, block: 15, heavyArmor: 15, lightArmor: 15, persuasion: 15, alchemy: 15 },
      points: charData.points || { attribute: 0, skill: 0 },
      unlockedPerks: charData.unlockedPerks || [],
      preferences: { autoAssignPoints: false, autoEquip: true, ...charData.preferences },
      analytics: charData.analytics || { killedEnemies: {}, diceRolls: { d20: Array(21).fill(0) }, encounteredEnemies: [], epicPhrases: [] },
      actionHistory: charData.actionHistory || [],
      effects: charData.effects || [],
      // Hydrate unlocked achievements from DB field or from preferences fallback
      unlockedAchievements: (charData as any).unlockedAchievements || ((charData as any).preferences?.unlockedAchievements) || [],
    };

    // Ensure gold exists in inventory for backward compatibility
    if (!character.inventory.some(i => i.id === 'gold')) {
      character.inventory.push({ id: 'gold', name: 'Золото', type: 'gold', quantity: 0, weight: 0 });
    }

    // Ensure epic phrases array exists
    if (!character.analytics.epicPhrases) {
      character.analytics.epicPhrases = [];
    }

    // Ensure fatigue stat exists
    if (!character.stats.fatigue) {
      character.stats.fatigue = { current: 0, max: 100 };
    }

    return character;
  }
}
