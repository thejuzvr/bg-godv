'use server';

import type { Character, CharacterInventoryItem } from '@/types/character';
import { saveCharacter as saveCharacterToDb } from '@/services/characterService';
import { gameDataService } from '../../../server/game-data-service';
import { allDivinities } from '@/data/divinities';
import { addChronicleEntry } from '@/services/chronicleService';

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

    // Initialize new fields
    character.hasSeenWelcomeMessage = false;
    character.lastLocationArrival = Date.now();
    character.hasCompletedLocationActivity = false;

    switch (character.backstory) {
      case 'noble':
        character.location = 'solitude';
        addItem('armor_fine_clothes', 1);
        addItem('misc_gold_ring', 1);
        character.inventory.find(i => i.id === 'gold')!.quantity = 300;
        character.attributes.intelligence += 2;
        character.attributes.agility += 1;
        character.skills.persuasion += 15;
        character.skills.alchemy += 5;
        break;
      case 'thief':
        character.location = 'riften';
        addItem('misc_lockpicks', 8);
        addItem('weapon_dagger_iron', 1);
        addItem('misc_thief_tools', 1);
        character.inventory.find(i => i.id === 'gold')!.quantity = 75;
        character.attributes.agility += 3;
        character.attributes.intelligence += 1;
        character.skills.lightArmor += 10;
        character.skills.persuasion += 5;
        break;
      case 'scholar':
        character.location = 'winterhold';
        addItem('armor_novice_robes', 1);
        addItem('misc_spell_tome_flames', 1);
        addItem('misc_spell_tome_heal', 1);
        addItem('misc_inkwell', 1);
        character.inventory.find(i => i.id === 'gold')!.quantity = 100;
        character.attributes.intelligence += 4;
        character.attributes.agility += 1;
        character.skills.alchemy += 15;
        character.skills.persuasion += 5;
        break;
      case 'warrior':
        character.location = 'whiterun';
        addItem('armor_worn', 1);
        addItem('weapon_sword_steel', 1);
        addItem('misc_healing_potion', 2);
        character.inventory.find(i => i.id === 'gold')!.quantity = 80;
        character.attributes.strength += 3;
        character.attributes.endurance += 2;
        character.skills.oneHanded += 10;
        character.skills.block += 10;
        character.skills.heavyArmor += 10;
        break;
      case 'shipwrecked':
        character.location = 'dawnstar';
        addItem('armor_clothes_simple', 1);
        addItem('misc_rope', 1);
        addItem('misc_water_skin', 1);
        character.inventory.find(i => i.id === 'gold')!.quantity = 25;
        character.attributes.endurance += 3;
        character.attributes.strength += 1;
        character.skills.lightArmor += 5;
        character.skills.alchemy += 5;
        break;
      case 'left_for_dead':
        character.location = 'bleak_falls_barrow';
        character.stats.health.current = 35;
        addItem('armor_rags', 1);
        addItem('weapon_dagger_rusty', 1);
        addItem('misc_bandage', 3);
        character.inventory.find(i => i.id === 'gold')!.quantity = 15;
        character.attributes.endurance += 2;
        character.attributes.agility += 2;
        character.skills.lightArmor += 8;
        character.skills.oneHanded += 5;
        break;
      case 'companion':
        character.location = 'whiterun';
        addItem('armor_steel_full', 1);
        addItem('weapon_axe_steel', 1);
        addItem('misc_mead', 2);
        character.inventory.find(i => i.id === 'gold')!.quantity = 120;
        character.attributes.strength += 4;
        character.attributes.endurance += 2;
        character.skills.heavyArmor += 15;
        character.skills.oneHanded += 10;
        character.skills.block += 5;
        break;
      case 'escaped_prisoner':
        character.location = 'wilderness';
        addItem('armor_prison_rags', 1);
        addItem('misc_lockpicks', 10);
        addItem('weapon_dagger_rusty', 1);
        character.inventory.find(i => i.id === 'gold')!.quantity = 5;
        character.attributes.agility += 4;
        character.attributes.intelligence += 1;
        character.skills.lightArmor += 12;
        character.skills.persuasion += 8;
        character.skills.oneHanded += 5;
        break;
      case 'mercenary':
        character.location = 'riften';
        addItem('armor_leather', 1);
        addItem('weapon_sword_iron', 1);
        addItem('misc_healing_potion', 1);
        addItem('misc_contract', 1);
        character.inventory.find(i => i.id === 'gold')!.quantity = 150;
        character.attributes.strength += 2;
        character.attributes.endurance += 2;
        character.attributes.agility += 1;
        character.skills.oneHanded += 8;
        character.skills.block += 8;
        character.skills.lightArmor += 8;
        character.skills.persuasion += 5;
        break;
      case 'pilgrim':
        const holdCapitals = ['solitude', 'whiterun', 'windhelm', 'markarth', 'riften'];
        character.location = holdCapitals[Math.floor(Math.random() * holdCapitals.length)];
        addItem('armor_pilgrim_robes', 1);
        addItem('misc_holy_symbol', 1);
        addItem('misc_blessed_water', 2);
        character.inventory.find(i => i.id === 'gold')!.quantity = 60;
        character.attributes.intelligence += 2;
        character.attributes.endurance += 1;
        character.skills.alchemy += 10;
        character.skills.persuasion += 10;
        // Give full divine blessing instead of just favor points
        character.divineFavor = 100; // Full blessing
        character.interventionPower = { current: 100, max: 100 }; // Full intervention power
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
    
    // Create welcome message based on backstory
    const welcomeMessage = createWelcomeMessage(character);
    
    // Сначала сохраняем персонажа (FK на chronicle требует существования записи)
    await saveCharacterToDb(userId, character);

    // Затем пишем событие в летопись
    await addChronicleEntry(userId, { 
      type: 'system', 
      title: 'Начало приключения', 
      description: welcomeMessage, 
      icon: 'Star' 
    });
    return { success: true, welcomeMessage };
  } catch (error) {
    console.error('Error creating character:', error);
    return { success: false, error: 'Failed to create character' };
  }
}

function createWelcomeMessage(character: Character): string {
  const locationNames: Record<string, string> = {
    'solitude': 'Солитьюд',
    'riften': 'Рифтен',
    'winterhold': 'Винтерхолд',
    'whiterun': 'Вайтран',
    'dawnstar': 'Данстар',
    'bleak_falls_barrow': 'Бликфолс Барроу',
    'wilderness': 'Дикие земли',
    'windhelm': 'Виндхельм',
    'markarth': 'Маркарт'
  };

  const divinityNames: Record<string, string> = {
    'akayosh': 'Акатош',
    'arkay': 'Аркей',
    'dibella': 'Дибелла',
    'julianos': 'Юлианос',
    'kynareth': 'Кинарет',
    'mara': 'Мара',
    'stendarr': 'Стендарр',
    'talos': 'Талос',
    'zenithar': 'Зенитар'
  };

  const locationName = locationNames[character.location] || 'неизвестном месте';
  const divinityName = divinityNames[character.patronDeity] || 'божеством';

  const messages: Record<string, string> = {
    'noble': `Добро пожаловать в ${locationName}, благородный ${character.name}! Ваше происхождение открывает многие двери в этом городе. ${divinityName} благословляет ваше путешествие.`,
    'thief': `Тени ${locationName} приветствуют вас, ${character.name}. В этом городе каждый уголок таит возможности для ловкого вора. ${divinityName} наблюдает за вашими делами.`,
    'scholar': `Добро пожаловать в ${locationName}, искатель знаний! Ваш путь к мудрости начинается здесь. ${divinityName} направляет ваше обучение.`,
    'warrior': `Ветеран ${character.name}, ${locationName} нуждается в ваших боевых навыках. Ваш опыт пригодится в этих неспокойных землях. ${divinityName} благословляет ваше оружие.`,
    'shipwrecked': `Вы очнулись на берегу около ${locationName}, ${character.name}. Судьба дала вам второй шанс. ${divinityName} спас вас от морских глубин.`,
    'left_for_dead': `Вы выжили в ${locationName}, ${character.name}. Смерть не смогла забрать вас - возможно, ${divinityName} имеет для вас особые планы.`,
    'companion': `Соратники приветствуют вас в ${locationName}, ${character.name}! Ваша честь и сила будут служить Скайриму. ${divinityName} благословляет ваше братство.`,
    'escaped_prisoner': `Свобода! Вы сбежали и оказались в ${locationName}, ${character.name}. Тюремные стены не смогли удержать вас. ${divinityName} дал вам второй шанс.`,
    'mercenary': `Добро пожаловать в ${locationName}, наемник ${character.name}. В этом городе всегда найдется работа для опытного бойца. ${divinityName} направляет вашу сталь.`,
    'pilgrim': `Благословенны будьте, паломник ${character.name}! ${locationName} приветствует ваше благочестие. ${divinityName} уже благоволит к вам.`
  };

  return messages[character.backstory] || `Добро пожаловать в ${locationName}, ${character.name}! Ваше приключение начинается здесь.`;
}
