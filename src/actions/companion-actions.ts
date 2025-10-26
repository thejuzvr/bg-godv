'use server';

import { getCharacterById, saveCharacter } from '../../server/storage';
import * as companionService from '@/services/companionService';
import { companionTemplates, generateCompanionFromTemplate } from '@/data/companions';
import type { CompanionTemplate } from '@/types/companion';
import { companionHiredEvent, companionLeftEvent } from '@/services/companionEventService';

/**
 * Нанять компаньона из шаблона
 */
export async function hireCompanionAction(
  userId: string,
  templateId: string
) {
  // Use new command handler with real-time events
  try {
    const { hireCompanion } = await import('../../server/commands/companion');
    const result = await hireCompanion(userId, { templateId });
    
    if (!result.success) {
      return { success: false, error: result.error };
    }
    
    return {
      success: true,
      message: result.data!.message,
      companion: result.data!.companion,
    };
  } catch (error) {
    console.error('Error hiring companion:', error);
    return { success: false, error: 'Не удалось нанять компаньона' };
  }
}

// Legacy implementation (kept for reference)
async function hireCompanionActionLegacy(
  userId: string,
  templateId: string
) {
  try {
    const character = await getCharacterById(userId);
    if (!character) {
      return { success: false, error: 'Персонаж не найден' };
    }

    const template = companionTemplates.find(t => t.id === templateId);
    if (!template) {
      return { success: false, error: 'Шаблон компаньона не найден' };
    }

    // Проверка доступности в локации
    if (!template.availableAt.includes(character.location)) {
      return { success: false, error: 'Этот компаньон недоступен в данной локации' };
    }

    // Проверка золота
    const goldItem = character.inventory.find(i => i.id === 'gold');
    if (!goldItem || goldItem.quantity < template.recruitCost) {
      return { 
        success: false, 
        error: `Недостаточно золота. Нужно ${template.recruitCost}, есть ${goldItem?.quantity || 0}` 
      };
    }

    // Генерация компаньона
    const generatedCompanion = generateCompanionFromTemplate(template);
    
    // Найм через сервис
    const result = await companionService.hireCompanion({
      characterId: userId,
      npcId: templateId, // Используем templateId как npcId
      template: {
        ...template,
        name: generatedCompanion.name,
        baseStats: {
          health: generatedCompanion.stats.health.max,
          damage: generatedCompanion.stats.damage,
          armor: generatedCompanion.stats.defense,
        },
        baseSkills: {
          combat: generatedCompanion.skills.combat,
          magic: generatedCompanion.skills.magic,
          stealth: generatedCompanion.skills.survival, // Используем survival как stealth
        },
      },
    });

    if (!result.ok) {
      return { success: false, error: result.error || 'Не удалось нанять компаньона' };
    }

    // Списываем золото
    goldItem.quantity -= template.recruitCost;
    await saveCharacter(character);

    // Записываем событие в журнал
    await companionHiredEvent(
      userId, 
      result.companion?.name || generatedCompanion.name,
      character.location,
      template.recruitCost
    );

    return {
      success: true,
      message: `${result.companion?.name} присоединился к вашему отряду! (${generatedCompanion.dialogues.onRecruit})`,
      companion: result.companion,
    };
  } catch (error) {
    console.error('Error hiring companion:', error);
    return { success: false, error: 'Не удалось нанять компаньона' };
  }
}

/**
 * Активировать компаньона (сделать активным спутником)
 */
export async function activateCompanionAction(
  userId: string,
  companionId: string
) {
  // Use new command handler with real-time events
  try {
    const { activateCompanion } = await import('../../server/commands/companion');
    const result = await activateCompanion(userId, { companionId });
    
    if (!result.success) {
      return { success: false, error: result.error };
    }

    return {
      success: true,
      message: result.data!.message,
    };
  } catch (error) {
    console.error('Error activating companion:', error);
    return { success: false, error: 'Не удалось активировать компаньона' };
  }
}

/**
 * Деактивировать компаньона (убрать из активных)
 */
export async function deactivateCompanionAction(userId: string) {
  // Use new command handler with real-time events
  try {
    const { deactivateCompanion } = await import('../../server/commands/companion');
    const result = await deactivateCompanion(userId);
    
    if (!result.success) {
      return { success: false, error: result.error };
    }

    return {
      success: true,
      message: result.data!.message,
    };
  } catch (error) {
    console.error('Error deactivating companion:', error);
    return { success: false, error: 'Не удалось деактивировать компаньона' };
  }
}

/**
 * Уволить компаньона
 */
export async function dismissCompanionAction(
  userId: string,
  companionId: string
) {
  // Use new command handler with real-time events
  try {
    const { dismissCompanion } = await import('../../server/commands/companion');
    const result = await dismissCompanion(userId, { companionId });
    
    if (!result.success) {
      return { success: false, error: result.error };
    }

    return {
      success: true,
      message: result.data!.message,
    };
  } catch (error) {
    console.error('Error dismissing companion:', error);
    return { success: false, error: 'Не удалось уволить компаньона' };
  }
}

/**
 * Получить всех нанятых компаньонов персонажа
 */
export async function getCompanionsAction(userId: string) {
  try {
    const companions = await companionService.listCharacterCompanions(userId);
    return { success: true, companions };
  } catch (error) {
    console.error('Error getting companions:', error);
    return { success: false, companions: [], error: 'Не удалось получить компаньонов' };
  }
}

/**
 * Получить активного компаньона
 */
export async function getActiveCompanionAction(userId: string) {
  try {
    const companion = await companionService.getActiveCompanion(userId);
    return { success: true, companion };
  } catch (error) {
    console.error('Error getting active companion:', error);
    return { success: false, companion: null, error: 'Не удалось получить активного компаньона' };
  }
}
