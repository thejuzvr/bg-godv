'use server';

import { getCharacterById, saveCharacter } from '../../server/storage';
import { gameDataService } from '../../server/game-data-service';
import type { Character, CharacterInventoryItem } from '@/types/character';
import { computeBuyPrice, computeSellPrice } from '@/services/pricing';

export async function interactWithNPC(userId: string, npcId: string) {
  try {
    const character = await getCharacterById(userId);
    if (!character) {
      return { success: false, error: 'Character not found' };
    }

    const npc = await gameDataService.getNpcById(npcId);
    if (!npc) {
      return { success: false, error: 'NPC not found' };
    }

    if (!character.relationships) {
      character.relationships = {};
    }

    const currentRelationship = character.relationships[npcId] || { level: 0, lastInteraction: 0 };
    
    const relationshipIncrease = Math.floor(Math.random() * 5) + 3;
    const newLevel = Math.min(100, currentRelationship.level + relationshipIncrease);

    character.relationships[npcId] = {
      level: newLevel,
      lastInteraction: Date.now(),
    };

    await saveCharacter(character);

    const randomDialogue = npc.dialogue[Math.floor(Math.random() * npc.dialogue.length)];

    return {
      success: true,
      message: `${npc.name}: "${randomDialogue}"`,
      relationshipChange: relationshipIncrease,
      newRelationshipLevel: newLevel,
    };
  } catch (error) {
    console.error('Error interacting with NPC:', error);
    return { success: false, error: 'Failed to interact with NPC' };
  }
}

export async function tradeWithNPC(
  userId: string,
  npcId: string,
  action: 'buy' | 'sell',
  itemId: string,
  quantity: number = 1
) {
  try {
    const character = await getCharacterById(userId);
    if (!character) {
      return { success: false, error: 'Character not found' };
    }

    const npc = await gameDataService.getNpcById(npcId);
    if (!npc || !npc.inventory) {
      return { success: false, error: 'NPC does not trade' };
    }

    const gold = character.inventory.find((i: CharacterInventoryItem) => i.id === 'gold');
    if (!gold) {
      return { success: false, error: 'No gold found' };
    }

    if (action === 'buy') {
      const npcItem = npc.inventory.find(i => i.itemId === itemId);
      if (!npcItem) {
        return { success: false, error: 'NPC does not have this item' };
      }

      const baseItem = await gameDataService.getItemById(itemId);
      if (!baseItem) {
        return { success: false, error: 'Item data not found' };
      }
      const totalPrice = computeBuyPrice(character as any, npc as any, baseItem as any, quantity);

      if (gold.quantity < totalPrice) {
        return { success: false, error: 'Not enough gold' };
      }

      gold.quantity -= totalPrice;
      
      const existingItem = character.inventory.find((i: CharacterInventoryItem) => i.id === itemId);
      if (existingItem) {
        existingItem.quantity += quantity;
      } else {
        const baseItem = await gameDataService.getItemById(itemId);
        if (!baseItem) {
          return { success: false, error: 'Item data not found' };
        }
        character.inventory.push({
          ...baseItem,
          quantity,
        });
      }

      const relationshipChange = Math.floor(quantity * 2);
      if (!character.relationships) character.relationships = {};
      const currentRel = character.relationships[npcId] || { level: 0, lastInteraction: 0 };
      character.relationships[npcId] = {
        level: Math.min(100, currentRel.level + relationshipChange),
        lastInteraction: Date.now(),
      };

      // Decrement merchant stock when applicable
      try {
        if (npcItem.stock !== undefined && npcItem.stock !== null) {
          await gameDataService.decrementNpcStock(npcId, itemId, quantity);
        }
      } catch (e) {
        console.warn('Failed to decrement NPC stock:', e);
      }

      await saveCharacter(character);

      return {
        success: true,
        message: `Куплено ${quantity}x предметов за ${totalPrice} золота`,
        relationshipChange,
      };
    } else {
      const charItem = character.inventory.find((i: CharacterInventoryItem) => i.id === itemId);
      if (!charItem || charItem.quantity < quantity) {
        return { success: false, error: 'Not enough items to sell' };
      }

      const baseItem = await gameDataService.getItemById(itemId);
      if (!baseItem) {
        return { success: false, error: 'Item data not found' };
      }
      const sellPrice = computeSellPrice(character as any, npc as any, baseItem as any, quantity);
      
      charItem.quantity -= quantity;
      if (charItem.quantity === 0) {
        character.inventory = character.inventory.filter((i: CharacterInventoryItem) => i.id !== itemId);
      }

      gold.quantity += sellPrice;

      await saveCharacter(character);

      return {
        success: true,
        message: `Продано ${quantity}x предметов за ${sellPrice} золота`,
      };
    }
  } catch (error) {
    console.error('Error trading with NPC:', error);
    return { success: false, error: 'Failed to trade' };
  }
}

export async function giftToNPC(userId: string, npcId: string, itemId: string) {
  try {
    const character = await getCharacterById(userId);
    if (!character) {
      return { success: false, error: 'Character not found' };
    }

    const npc = await gameDataService.getNpcById(npcId);
    if (!npc) {
      return { success: false, error: 'NPC not found' };
    }

    const item = character.inventory.find((i: CharacterInventoryItem) => i.id === itemId);
    if (!item || item.quantity < 1) {
      return { success: false, error: 'Item not found in inventory' };
    }

    item.quantity -= 1;
    if (item.quantity === 0) {
      character.inventory = character.inventory.filter((i: CharacterInventoryItem) => i.id !== itemId);
    }

    const relationshipIncrease = Math.floor(Math.random() * 10) + 10;
    if (!character.relationships) character.relationships = {};
    const currentRel = character.relationships[npcId] || { level: 0, lastInteraction: 0 };
    
    character.relationships[npcId] = {
      level: Math.min(100, currentRel.level + relationshipIncrease),
      lastInteraction: Date.now(),
    };

    await saveCharacter(character);

    return {
      success: true,
      message: `${npc.name} принимает ваш подарок с благодарностью!`,
      relationshipChange: relationshipIncrease,
      newRelationshipLevel: character.relationships[npcId].level,
    };
  } catch (error) {
    console.error('Error gifting to NPC:', error);
    return { success: false, error: 'Failed to gift item' };
  }
}

export async function getNPCsByLocation(userId: string) {
  try {
    const character = await getCharacterById(userId);
    if (!character) {
      return { success: false, error: 'Character not found', npcs: [] };
    }

    const allNpcs = await gameDataService.getAllNpcs();
    const locationNPCs = allNpcs.filter(
      npc => npc.location === character.location || npc.location === 'on_road'
    );

    const npcsWithRelationships = locationNPCs.map(npc => ({
      ...npc,
      relationship: character.relationships?.[npc.id] || { level: 0, lastInteraction: 0 },
    }));

    return { success: true, npcs: npcsWithRelationships };
  } catch (error) {
    console.error('Error getting NPCs by location:', error);
    return { success: false, error: 'Failed to get NPCs', npcs: [] };
  }
}
