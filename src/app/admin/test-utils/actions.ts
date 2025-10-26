"use server";

import * as storage from "../../../../server/storage";
import { getCharacterById } from "@/services/characterService";

export type TestResult = {
  success: boolean;
  message: string;
  error?: string;
};

export async function fixCharacterState(userId: string): Promise<TestResult> {
  if (!userId) {
    return { success: false, message: 'User ID is required.', error: "Необходим ID пользователя." };
  }

  try {
    const character = await storage.getCharacterById(userId);

    if (!character) {
      return { success: false, message: "Character not found.", error: `Герой с ID ${userId} не найден.` };
    }

    // Fix character state by updating to safe defaults
    const updates = {
      ...character,
      status: 'idle',
      combat: null,
      currentAction: null,
      sleepUntil: null,
      respawnAt: null,
      deathOccurredAt: null,
      activeSovngardeQuest: null,
      location: 'whiterun',
      effects: [],
      stats: {
        ...character.stats,
        health: {
          ...character.stats.health,
          current: character.stats.health.max
        }
      }
    };

    await storage.saveCharacter(updates);

    return { success: true, message: `Успешно исправлено состояние героя ${character.name}. Он был перемещен в Вайтран с полным здоровьем.` };
  } catch (error: any) {
    console.error(`Error fixing character state for ${userId}:`, error);
    return { success: false, message: "Failed to fix character state.", error: error.message };
  }
}

export async function resetCharacterToWhiterun(userId: string): Promise<TestResult> {
  if (!userId) {
    return { success: false, message: 'User ID is required.', error: "Необходим ID пользователя." };
  }

  try {
    const character = await storage.getCharacterById(userId);

    if (!character) {
      return { success: false, message: "Character not found.", error: `Герой с ID ${userId} не найден.` };
    }

    const updates = {
      ...character,
      location: 'whiterun',
      status: 'idle',
      stats: {
        ...character.stats,
        health: {
          ...character.stats.health,
          current: character.stats.health.max
        }
      }
    };

    await storage.saveCharacter(updates);

    return { success: true, message: `${character.name} телепортирован в Вайтран с полным здоровьем.` };
  } catch (error: any) {
    console.error(`Error teleporting character ${userId}:`, error);
    return { success: false, message: "Failed to teleport character.", error: error.message };
  }
}

export async function healCharacter(userId: string): Promise<TestResult> {
  if (!userId) {
    return { success: false, message: 'User ID is required.', error: "Необходим ID пользователя." };
  }

  try {
    const character = await storage.getCharacterById(userId);

    if (!character) {
      return { success: false, message: "Character not found.", error: `Герой с ID ${userId} не найден.` };
    }

    const updates = {
      ...character,
      stats: {
        ...character.stats,
        health: {
          ...character.stats.health,
          current: character.stats.health.max
        }
      }
    };

    await storage.saveCharacter(updates);

    return { success: true, message: `${character.name} полностью вылечен (${character.stats.health.max} HP).` };
  } catch (error: any) {
    console.error(`Error healing character ${userId}:`, error);
    return { success: false, message: "Failed to heal character.", error: error.message };
  }
}

export async function addGoldToCharacter(userId: string, amount: number): Promise<TestResult> {
  if (!userId) {
    return { success: false, message: 'User ID is required.', error: "Необходим ID пользователя." };
  }

  if (!amount || amount <= 0) {
    return { success: false, message: 'Invalid amount.', error: "Некорректная сумма." };
  }

  try {
    const character = await storage.getCharacterById(userId);

    if (!character) {
      return { success: false, message: "Character not found.", error: `Герой с ID ${userId} не найден.` };
    }

    const goldItem = character.inventory.find(item => item.id === 'gold');
    
    if (goldItem) {
      goldItem.quantity += amount;
    } else {
      character.inventory.push({
        id: 'gold',
        name: 'Золото',
        quantity: amount,
        type: 'currency',
      });
    }

    await storage.saveCharacter(character);

    return { success: true, message: `Добавлено ${amount} золота персонажу ${character.name}.` };
  } catch (error: any) {
    console.error(`Error adding gold to character ${userId}:`, error);
    return { success: false, message: "Failed to add gold.", error: error.message };
  }
}

export async function clearCharacterCombat(userId: string): Promise<TestResult> {
  if (!userId) {
    return { success: false, message: 'User ID is required.', error: "Необходим ID пользователя." };
  }

  try {
    const character = await storage.getCharacterById(userId);

    if (!character) {
      return { success: false, message: "Character not found.", error: `Герой с ID ${userId} не найден.` };
    }

    const updates = {
      ...character,
      combat: null,
      status: 'idle',
    };

    await storage.saveCharacter(updates);

    return { success: true, message: `Бой для ${character.name} очищен, статус изменен на idle.` };
  } catch (error: any) {
    console.error(`Error clearing combat for ${userId}:`, error);
    return { success: false, message: "Failed to clear combat.", error: error.message };
  }
}

export async function testAITick(userId: string): Promise<TestResult> {
  if (!userId) {
    return { success: false, message: 'User ID is required.', error: "Необходим ID пользователя." };
  }

  try {
    const character = await storage.getCharacterById(userId);

    if (!character) {
      return { success: false, message: "Character not found.", error: `Герой с ID ${userId} не найден.` };
    }

    // Импортируем функцию для обработки тика
    const { processCharacterTick } = await import("../../../../server/background-worker");
    
    await processCharacterTick(character);

    return { success: true, message: `AI тик успешно выполнен для ${character.name}.` };
  } catch (error: any) {
    console.error(`Error running AI tick for ${userId}:`, error);
    return { success: false, message: "Failed to run AI tick.", error: error.message };
  }
}
