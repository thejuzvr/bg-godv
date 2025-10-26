// NPC Trade Commands
import type { Character, CharacterInventoryItem } from '@/types/character';
import * as storage from '../storage';
import { gameDataService } from '../game-data-service';
import { computeBuyPrice, computeSellPrice } from '@/services/pricing';
import { 
  executeCommand, 
  validateCharacterOwnership, 
  validateRequired,
  type CommandContext,
  type CommandResult
} from './command-handler';

export interface NPCTradeInput {
  npcId: string;
  action: 'buy' | 'sell';
  itemId: string;
  quantity: number;
}

export interface NPCTradeOutput {
  character: Character;
  message: string;
  relationshipChange?: number;
  priceChange?: {
    itemId: string;
    oldPrice: number;
    newPrice: number;
  };
}

/**
 * Trade with NPC - buy or sell items
 */
export async function tradeWithNPC(
  userId: string,
  input: NPCTradeInput
): Promise<CommandResult<NPCTradeOutput>> {
  // Validation
  const validationError = validateRequired(input, ['npcId', 'action', 'itemId', 'quantity']);
  if (validationError) return validationError;

  if (input.quantity <= 0) {
    return { success: false, error: 'Quantity must be positive' };
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
    async (inp: NPCTradeInput, ctx: CommandContext) => {
      const { npcId, action, itemId, quantity } = inp;
      
      // Get NPC
      const npc = await gameDataService.getNpcById(npcId);
      if (!npc || !npc.inventory) {
        return { success: false, error: 'NPC does not trade' };
      }

      let updatedChar = structuredClone(char);
      const gold = updatedChar.inventory.find(i => i.id === 'gold');
      if (!gold) {
        return { success: false, error: 'No gold found' };
      }

      const events: Array<{ type: string; payload: any }> = [];
      let message = '';
      let relationshipChange = 0;

      if (action === 'buy') {
        // BUY from NPC
        const npcItem = npc.inventory.find(i => i.itemId === itemId);
        if (!npcItem) {
          return { success: false, error: 'NPC does not have this item' };
        }

        const baseItem = await gameDataService.getItemById(itemId);
        if (!baseItem) {
          return { success: false, error: 'Item not found' };
        }

        const totalPrice = computeBuyPrice(updatedChar as any, npc as any, baseItem as any, quantity);

        if (gold.quantity < totalPrice) {
          const funnyMessages = [
            `Пытался купить ${baseItem.name}, но в кошельке мышь повесилась...`,
            `Захотел ${baseItem.name}, но денег не хватило. Опять на голодный паек!`,
            `Продавец хмыкнул, когда увидел пустой кошелек. ${baseItem.name} придется подождать.`,
          ];
          return { success: false, error: funnyMessages[Math.floor(Math.random() * funnyMessages.length)] };
        }

        // Deduct gold
        gold.quantity -= totalPrice;

        // Add item to inventory
        const existingItem = updatedChar.inventory.find(i => i.id === itemId);
        if (existingItem) {
          existingItem.quantity += quantity;
        } else {
          updatedChar.inventory.push({
            ...baseItem,
            quantity,
          });
        }

        // Update relationship
        relationshipChange = Math.floor(quantity * 2);
        if (!updatedChar.relationships) updatedChar.relationships = {};
        const currentRel = updatedChar.relationships[npcId] || { level: 0, lastInteraction: 0 };
        updatedChar.relationships[npcId] = {
          level: Math.min(100, currentRel.level + relationshipChange),
          lastInteraction: Date.now(),
        };

        // Decrement merchant stock
        try {
          if (npcItem.stock !== undefined && npcItem.stock !== null) {
            await gameDataService.decrementNpcStock(npcId, itemId, quantity);
          }
        } catch (e) {
          console.warn('Failed to decrement NPC stock:', e);
        }

        message = `Куплено ${quantity}x ${baseItem.name} за ${totalPrice} золота`;

        // Emit events
        events.push(
          {
            type: 'character:inventory:updated',
            payload: {
              characterId: ctx.characterId,
              changes: [
                { itemId: 'gold', itemName: 'Золото', quantityDelta: -totalPrice, newQuantity: gold.quantity },
                { itemId, itemName: baseItem.name, quantityDelta: quantity, newQuantity: (existingItem?.quantity || 0) + quantity },
              ],
            },
          },
          {
            type: 'market:trade:completed',
            payload: {
              characterId: ctx.characterId,
              characterName: updatedChar.name,
              npcId,
              npcName: npc.name,
              itemId,
              itemName: baseItem.name,
              quantity,
              price: totalPrice,
              side: 'buy',
            },
          }
        );

      } else {
        // SELL to NPC
        const charItem = updatedChar.inventory.find(i => i.id === itemId);
        if (!charItem || charItem.quantity < quantity) {
          return { success: false, error: 'Not enough items to sell' };
        }

        const baseItem = await gameDataService.getItemById(itemId);
        if (!baseItem) {
          return { success: false, error: 'Item not found' };
        }

        const sellPrice = computeSellPrice(updatedChar as any, npc as any, baseItem as any, quantity);

        // Remove item from inventory
        charItem.quantity -= quantity;
        if (charItem.quantity === 0) {
          updatedChar.inventory = updatedChar.inventory.filter(i => i.id !== itemId);
        }

        // Add gold
        gold.quantity += sellPrice;

        message = `Продано ${quantity}x ${baseItem.name} за ${sellPrice} золота`;

        // Emit events
        events.push(
          {
            type: 'character:inventory:updated',
            payload: {
              characterId: ctx.characterId,
              changes: [
                { itemId, itemName: baseItem.name, quantityDelta: -quantity, newQuantity: charItem.quantity },
                { itemId: 'gold', itemName: 'Золото', quantityDelta: sellPrice, newQuantity: gold.quantity },
              ],
            },
          },
          {
            type: 'market:trade:completed',
            payload: {
              characterId: ctx.characterId,
              characterName: updatedChar.name,
              npcId,
              npcName: npc.name,
              itemId,
              itemName: baseItem.name,
              quantity,
              price: sellPrice,
              side: 'sell',
            },
          }
        );
      }

      // Save character
      await storage.saveCharacter(updatedChar);

      return {
        success: true,
        data: {
          character: updatedChar,
          message,
          relationshipChange,
        },
        events,
      };
    },
    input,
    context
  );
}

/**
 * Interact with NPC (talk, gift, etc)
 */
export async function interactWithNPC(
  userId: string,
  npcId: string
): Promise<CommandResult<{ message: string; relationshipChange: number; newLevel: number }>> {
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
    async (_, ctx: CommandContext) => {
      const npc = await gameDataService.getNpcById(npcId);
      if (!npc) {
        return { success: false, error: 'NPC not found' };
      }

      let updatedChar = structuredClone(char);
      
      if (!updatedChar.relationships) {
        updatedChar.relationships = {};
      }

      const currentRelationship = updatedChar.relationships[npcId] || { level: 0, lastInteraction: 0 };
      const relationshipIncrease = Math.floor(Math.random() * 5) + 3;
      const newLevel = Math.min(100, currentRelationship.level + relationshipIncrease);

      updatedChar.relationships[npcId] = {
        level: newLevel,
        lastInteraction: Date.now(),
      };

      await storage.saveCharacter(updatedChar);

      const randomDialogue = npc.dialogue[Math.floor(Math.random() * npc.dialogue.length)];
      const message = `${npc.name}: "${randomDialogue}"`;

      // No events for simple interaction (minor optimization)
      return {
        success: true,
        data: {
          message,
          relationshipChange: relationshipIncrease,
          newLevel,
        },
      };
    },
    { npcId } as any,
    context
  );
}

