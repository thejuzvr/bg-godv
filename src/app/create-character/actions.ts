'use server';

import type { Character, CharacterInventoryItem } from '@/types/character';
import { saveCharacter as saveCharacterToDb } from '@/services/characterService';
import { gameDataService } from '../../../server/game-data-service';
import { allDivinities } from '@/data/divinities';

export async function createCharacter(userId: string, character: Character) {
  try {
    // Load items from database for backstory-specific inventory
    const allItems = await gameDataService.getAllItems();
    
    // Add backstory-specific items and bonuses
    const addItem = (itemId: string, quantity: number) => {
      const baseItem = allItems.find(i => i.id === itemId);
      if (baseItem) {
        character.inventory.push({ ...baseItem, quantity });
      }
    };

    switch (character.backstory) {
      case 'noble':
        character.location = 'solitude';
        addItem('armor_fine_clothes', 1);
        character.inventory.find(i => i.id === 'gold')!.quantity = 250;
        character.attributes.intelligence += 1;
        character.skills.persuasion += 10;
        break;
      case 'thief':
        character.location = 'riften';
        addItem('misc_lockpicks', 5);
        addItem('weapon_dagger_iron', 1);
        character.attributes.agility += 2;
        character.skills.lightArmor += 5;
        break;
      case 'scholar':
        character.location = 'winterhold';
        addItem('armor_novice_robes', 1);
        addItem('misc_spell_tome_flames', 1);
        character.attributes.intelligence += 3;
        character.skills.alchemy += 10;
        break;
      case 'warrior':
        character.location = 'whiterun';
        addItem('armor_worn', 1);
        addItem('weapon_sword_steel', 1);
        character.attributes.strength += 2;
        character.attributes.endurance += 1;
        character.skills.oneHanded += 5;
        character.skills.block += 5;
        character.skills.heavyArmor += 5;
        break;
      case 'shipwrecked':
        character.location = 'dawnstar';
        addItem('armor_clothes_simple', 1);
        character.attributes.endurance += 2;
        break;
      case 'left_for_dead':
        character.location = 'bleak_falls_barrow';
        character.stats.health.current = 35;
        addItem('armor_rags', 1);
        addItem('weapon_dagger_rusty', 1);
        character.attributes.endurance += 1;
        character.attributes.agility += 1;
        break;
      case 'companion':
        character.location = 'whiterun';
        addItem('armor_steel_full', 1);
        addItem('weapon_axe_steel', 1);
        character.attributes.strength += 3;
        character.skills.heavyArmor += 10;
        break;
      default:
        addItem('gold', 50);
    }

    // Add racial bonuses
    if (character.race === 'altmer') {
      character.attributes.intelligence += 2;
    } else if (character.race === 'nord') {
      character.attributes.endurance += 1;
      character.attributes.strength += 1;
    } else if (character.race === 'argonian') {
      character.attributes.endurance += 2;
    } else if (character.race === 'khajiit' || character.race === 'bosmer') {
      character.attributes.agility += 2;
    }

    // Apply divinity passive effect
    const chosenDivinity = allDivinities.find(d => d.id === character.patronDeity);
    if (chosenDivinity) {
      character = chosenDivinity.passiveEffect.apply(character);
    }

    // Recalculate max stats based on final attributes
    character.stats.health.max = 80 + character.attributes.endurance * 10;
    character.stats.magicka.max = 80 + character.attributes.intelligence * 10;
    character.stats.stamina.max = 80 + (character.attributes.strength + character.attributes.endurance) * 5;
    character.stats.health.current = character.stats.health.max;
    character.stats.magicka.current = character.stats.magicka.max;
    character.stats.stamina.current = character.stats.stamina.max;
    
    await saveCharacterToDb(userId, character);
    return { success: true };
  } catch (error) {
    console.error('Error creating character:', error);
    return { success: false, error: 'Failed to create character' };
  }
}
