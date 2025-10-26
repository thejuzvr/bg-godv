// Companion Commands
import type { Character } from '@/types/character';
import * as storage from '../storage';
import * as companionService from '@/services/companionService';
import { companionTemplates, generateCompanionFromTemplate } from '@/data/companions';
import { 
  executeCommand, 
  validateCharacterOwnership, 
  validateRequired,
  type CommandContext,
  type CommandResult
} from './command-handler';

export interface HireCompanionInput {
  templateId: string;
}

export interface ActivateCompanionInput {
  companionId: string;
}

export interface DismissCompanionInput {
  companionId: string;
}

export interface HireCompanionOutput {
  character: Character;
  companion: any;
  message: string;
}

/**
 * Hire a companion from template
 */
export async function hireCompanion(
  userId: string,
  input: HireCompanionInput
): Promise<CommandResult<HireCompanionOutput>> {
  // Validation
  const validationError = validateRequired(input, ['templateId']);
  if (validationError) return validationError;

  const character = await storage.getCharacterById(userId);
  const ownershipError = validateCharacterOwnership(character, userId);
  if (ownershipError) return ownershipError;

  const char = character as Character;
  const context: CommandContext = {
    userId,
    characterId: userId,
    realmId: (char as any).realmId || 'global',
    timestamp: Date.now(),
  };

  return executeCommand(
    async (inp: HireCompanionInput, ctx: CommandContext) => {
      const template = companionTemplates.find(t => t.id === inp.templateId);
      if (!template) {
        return { success: false, error: 'Шаблон компаньона не найден' };
      }

      // Check location availability
      if (!template.availableAt.includes(char.location)) {
        return { success: false, error: 'Этот компаньон недоступен в данной локации' };
      }

      // Check gold
      const updatedChar = structuredClone(char);
      const goldItem = updatedChar.inventory.find(i => i.id === 'gold');
      if (!goldItem || goldItem.quantity < template.recruitCost) {
        return { 
          success: false, 
          error: `Недостаточно золота. Нужно ${template.recruitCost}, есть ${goldItem?.quantity || 0}` 
        };
      }

      // Generate companion
      const generatedCompanion = generateCompanionFromTemplate(template);
      
      // Hire through service
      const result = await companionService.hireCompanion({
        characterId: ctx.characterId,
        npcId: inp.templateId,
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
            stealth: generatedCompanion.skills.survival,
          },
        },
      });

      if (!result.ok) {
        return { success: false, error: result.error || 'Не удалось нанять компаньона' };
      }

      // Deduct gold
      goldItem.quantity -= template.recruitCost;
      await storage.saveCharacter(updatedChar);

      // Prepare events
      const events: Array<{ type: string; payload: any }> = [
        {
          type: 'companion:hired',
          payload: {
            characterId: ctx.characterId,
            companionId: result.companion?.id,
            companionName: result.companion?.name || generatedCompanion.name,
            companionClass: result.companion?.class || template.class,
            cost: template.recruitCost,
          },
        },
        {
          type: 'character:inventory:updated',
          payload: {
            characterId: ctx.characterId,
            changes: [
              { 
                itemId: 'gold', 
                itemName: 'Золото', 
                quantityDelta: -template.recruitCost, 
                newQuantity: goldItem.quantity 
              },
            ],
          },
        },
      ];

      // Log to offline events
      try {
        const { addOfflineEvent } = await import('@/services/offlineEventsService');
        await addOfflineEvent(ctx.characterId, {
          type: 'companion',
          message: `${result.companion?.name} присоединился к вашему отряду! (${generatedCompanion.dialogues.onRecruit})`,
        } as any);
      } catch {}

      return {
        success: true,
        data: {
          character: updatedChar,
          companion: result.companion,
          message: `${result.companion?.name} присоединился к вашему отряду!`,
        },
        events,
      };
    },
    input,
    context
  );
}

/**
 * Activate companion (make active)
 */
export async function activateCompanion(
  userId: string,
  input: ActivateCompanionInput
): Promise<CommandResult<{ message: string }>> {
  // Validation
  const validationError = validateRequired(input, ['companionId']);
  if (validationError) return validationError;

  const character = await storage.getCharacterById(userId);
  const ownershipError = validateCharacterOwnership(character, userId);
  if (ownershipError) return ownershipError;

  const context: CommandContext = {
    userId,
    characterId: userId,
    realmId: (character as any).realmId || 'global',
    timestamp: Date.now(),
  };

  return executeCommand(
    async (inp: ActivateCompanionInput, ctx: CommandContext) => {
      const result = await companionService.setActiveCompanion(ctx.characterId, inp.companionId);
      
      if (!result.ok) {
        return { success: false, error: result.error || 'Не удалось активировать компаньона' };
      }

      // Get companion details for event
      const companions = await companionService.listCharacterCompanions(ctx.characterId);
      const companion = companions.find((c: any) => c.id === inp.companionId);

      // Prepare events
      const events: Array<{ type: string; payload: any }> = [
        {
          type: 'companion:activated',
          payload: {
            characterId: ctx.characterId,
            companionId: inp.companionId,
            companionName: companion?.name || 'Компаньон',
          },
        },
      ];

      return {
        success: true,
        data: {
          message: 'Компаньон активирован и готов к приключениям!',
        },
        events,
      };
    },
    input,
    context
  );
}

/**
 * Deactivate companion
 */
export async function deactivateCompanion(
  userId: string
): Promise<CommandResult<{ message: string }>> {
  const character = await storage.getCharacterById(userId);
  const ownershipError = validateCharacterOwnership(character, userId);
  if (ownershipError) return ownershipError;

  const context: CommandContext = {
    userId,
    characterId: userId,
    realmId: (character as any).realmId || 'global',
    timestamp: Date.now(),
  };

  return executeCommand(
    async (_, ctx: CommandContext) => {
      // Get current active companion before deactivating
      const activeCompanion = await companionService.getActiveCompanion(ctx.characterId);
      
      const result = await companionService.setActiveCompanion(ctx.characterId, null);
      
      if (!result.ok) {
        return { success: false, error: result.error || 'Не удалось деактивировать компаньона' };
      }

      // Prepare events
      const events: Array<{ type: string; payload: any }> = [];
      
      if (activeCompanion) {
        events.push({
          type: 'companion:activated',
          payload: {
            characterId: ctx.characterId,
            companionId: null,
            companionName: null,
          },
        });
      }

      return {
        success: true,
        data: {
          message: 'Компаньон отправлен в лагерь',
        },
        events,
      };
    },
    {} as any,
    context
  );
}

/**
 * Dismiss companion
 */
export async function dismissCompanion(
  userId: string,
  input: DismissCompanionInput
): Promise<CommandResult<{ message: string }>> {
  // Validation
  const validationError = validateRequired(input, ['companionId']);
  if (validationError) return validationError;

  const character = await storage.getCharacterById(userId);
  const ownershipError = validateCharacterOwnership(character, userId);
  if (ownershipError) return ownershipError;

  const context: CommandContext = {
    userId,
    characterId: userId,
    realmId: (character as any).realmId || 'global',
    timestamp: Date.now(),
  };

  return executeCommand(
    async (inp: DismissCompanionInput, ctx: CommandContext) => {
      // Get companion name before dismissing
      const companions = await companionService.listCharacterCompanions(ctx.characterId);
      const companion = companions.find((c: any) => c.id === inp.companionId);
      
      const result = await companionService.dismissCompanion(ctx.characterId, inp.companionId);
      
      if (!result.ok) {
        return { success: false, error: result.error || 'Не удалось уволить компаньона' };
      }

      // Prepare events
      const events: Array<{ type: string; payload: any }> = [
        {
          type: 'companion:dismissed',
          payload: {
            characterId: ctx.characterId,
            companionId: inp.companionId,
            companionName: companion?.name || 'Компаньон',
          },
        },
      ];

      // Log to offline events
      try {
        const { addOfflineEvent } = await import('@/services/offlineEventsService');
        if (companion) {
          await addOfflineEvent(ctx.characterId, {
            type: 'companion',
            message: `${companion.name} покинул отряд (уволен игроком)`,
          } as any);
        }
      } catch {}

      return {
        success: true,
        data: {
          message: 'Компаньон покинул отряд',
        },
        events,
      };
    },
    input,
    context
  );
}

