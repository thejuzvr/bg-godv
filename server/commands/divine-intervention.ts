// Divine Intervention Commands
import type { Character } from '@/types/character';
import * as storage from '../storage';
import { 
  executeCommand, 
  validateCharacterOwnership, 
  validateRequired,
  type CommandContext,
  type CommandResult
} from './command-handler';

export interface DivineInterventionInput {
  type: 'bless' | 'punish';
}

export interface DivineMessageInput {
  text: string;
}

export interface DivineInterventionOutput {
  character: Character;
  message: string;
  actionDescription: string;
}

const INTERVENTION_COST = 50;
const MESSAGE_COST = 10;

/**
 * Perform divine intervention (bless or punish)
 */
export async function performDivineIntervention(
  userId: string,
  input: DivineInterventionInput
): Promise<CommandResult<DivineInterventionOutput>> {
  // Validation
  const validationError = validateRequired(input, ['type']);
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
    async (inp: DivineInterventionInput, ctx: CommandContext) => {
      let updatedChar = structuredClone(char);
      let actionDescription = '';

      // Check power
      if (updatedChar.interventionPower.current < INTERVENTION_COST) {
        return {
          success: false,
          error: `Недостаточно силы для вмешательства. Текущая сила: ${updatedChar.interventionPower.current}/${updatedChar.interventionPower.max}.`,
        };
      }

      // Deduct power
      updatedChar.interventionPower.current -= INTERVENTION_COST;

      if (inp.type === 'bless') {
        const blessings = [
          'full_heal',
          'gold_gift',
          'xp_gift',
          'mood_boost',
          'random_item',
        ];
        const blessing = blessings[Math.floor(Math.random() * blessings.length)];

        switch (blessing) {
          case 'full_heal':
            updatedChar.stats.health.current = updatedChar.stats.health.max;
            updatedChar.stats.magicka.current = updatedChar.stats.magicka.max;
            updatedChar.stats.stamina.current = updatedChar.stats.stamina.max;
            actionDescription = `${updatedChar.name} чувствует как божественная сила исцеляет все его раны!`;
            break;
          case 'gold_gift':
            const goldAmount = Math.floor(Math.random() * 200) + 100;
            const goldItem = updatedChar.inventory.find(i => i.id === 'gold');
            if (goldItem) goldItem.quantity += goldAmount;
            actionDescription = `Золотые монеты падают с небес! ${updatedChar.name} получает ${goldAmount} золота.`;
            break;
          case 'xp_gift':
            const xpAmount = Math.floor(Math.random() * 150) + 50;
            updatedChar.xp.current += xpAmount;
            actionDescription = `Внезапное озарение! ${updatedChar.name} получает ${xpAmount} опыта.`;
            break;
          case 'mood_boost':
            updatedChar.mood = Math.min(100, updatedChar.mood + 30);
            actionDescription = `${updatedChar.name} чувствует небывалый прилив вдохновения и бодрости!`;
            break;
          case 'random_item':
            // Simple random potion
            const hasPotion = updatedChar.inventory.find(i => i.id === 'potion_health_weak');
            if (hasPotion) {
              hasPotion.quantity += 3;
            } else {
              updatedChar.inventory.push({
                id: 'potion_health_weak',
                name: 'Слабое зелье здоровья',
                weight: 0.5,
                type: 'potion',
                quantity: 3,
              } as any);
            }
            actionDescription = `Из воздуха материализуются 3 зелья здоровья!`;
            break;
        }
      } else {
        const punishments = [
          'damage',
          'gold_loss',
          'mood_penalty',
          'fatigue',
        ];
        const punishment = punishments[Math.floor(Math.random() * punishments.length)];

        switch (punishment) {
          case 'damage':
            const damage = Math.floor(updatedChar.stats.health.max * 0.2);
            updatedChar.stats.health.current = Math.max(1, updatedChar.stats.health.current - damage);
            actionDescription = `Божественный гнев обрушивается на ${updatedChar.name}! Он получает ${damage} урона.`;
            break;
          case 'gold_loss':
            const goldLoss = Math.floor(Math.random() * 50) + 20;
            const goldItem = updatedChar.inventory.find(i => i.id === 'gold');
            if (goldItem) {
              goldItem.quantity = Math.max(0, goldItem.quantity - goldLoss);
              actionDescription = `Кошелек ${updatedChar.name} внезапно полегчал на ${goldLoss} золота.`;
            } else {
              actionDescription = `Божество хотело наказать ${updatedChar.name} потерей золота, но в кошельке и так пусто.`;
            }
            break;
          case 'mood_penalty':
            updatedChar.mood = Math.max(0, updatedChar.mood - 20);
            actionDescription = `${updatedChar.name} чувствует тяжесть божественного неодобрения.`;
            break;
          case 'fatigue':
            updatedChar.stats.fatigue.current = Math.min(
              updatedChar.stats.fatigue.max,
              updatedChar.stats.fatigue.current + 30
            );
            actionDescription = `${updatedChar.name} внезапно чувствует усталость.`;
            break;
        }
      }

      // Save character
      await storage.saveCharacter(updatedChar);

      // Prepare events
      const events: Array<{ type: string; payload: any }> = [
        {
          type: 'divine:intervention:performed',
          payload: {
            characterId: ctx.characterId,
            characterName: updatedChar.name,
            type: inp.type,
            powerCost: INTERVENTION_COST,
            effect: actionDescription,
          },
        },
        {
          type: 'character:power:updated',
          payload: {
            characterId: ctx.characterId,
            interventionPower: {
              current: updatedChar.interventionPower.current,
              max: updatedChar.interventionPower.max,
            },
          },
        },
        {
          type: 'character:stats:updated',
          payload: {
            characterId: ctx.characterId,
            stats: {
              health: updatedChar.stats.health,
              magicka: updatedChar.stats.magicka,
              stamina: updatedChar.stats.stamina,
              fatigue: updatedChar.stats.fatigue,
            },
          },
        },
      ];

      return {
        success: true,
        data: {
          character: updatedChar,
          message: actionDescription,
          actionDescription,
        },
        events,
      };
    },
    input,
    context
  );
}

/**
 * Send divine message to character
 */
export async function sendDivineMessage(
  userId: string,
  input: DivineMessageInput
): Promise<CommandResult<{ messageId: string }>> {
  // Validation
  const validationError = validateRequired(input, ['text']);
  if (validationError) return validationError;

  if (input.text.length > 200) {
    return {
      success: false,
      error: 'Message too long (max 200 characters)',
    };
  }

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
    async (inp: DivineMessageInput, ctx: CommandContext) => {
      // Check power
      if (char.interventionPower.current < MESSAGE_COST) {
        return {
          success: false,
          error: `Недостаточно силы для отправки сообщения. Требуется: ${MESSAGE_COST}, доступно: ${char.interventionPower.current}`,
        };
      }

      // Deduct power
      const updatedChar = structuredClone(char);
      updatedChar.interventionPower.current -= MESSAGE_COST;
      await storage.saveCharacter(updatedChar);

      // Create divine message in DB
      const { db } = await import('../storage');
      const schema = await import('../../shared/schema');
      const [row] = await db.insert(schema.divineMessages).values({
        characterId: ctx.characterId,
        text: inp.text,
        createdAt: Date.now(),
        processedAt: null,
      }).returning();

      // Prepare events
      const events: Array<{ type: string; payload: any }> = [
        {
          type: 'divine:message:sent',
          payload: {
            characterId: ctx.characterId,
            message: inp.text,
            powerCost: MESSAGE_COST,
          },
        },
        {
          type: 'character:power:updated',
          payload: {
            characterId: ctx.characterId,
            interventionPower: {
              current: updatedChar.interventionPower.current,
              max: updatedChar.interventionPower.max,
            },
          },
        },
      ];

      return {
        success: true,
        data: {
          messageId: (row as any).id,
        },
        events,
      };
    },
    input,
    context
  );
}

