
import type { CharacterInventoryItem } from "@/types/character";
import type { Rarity } from "@/types/item";

// The base item definition, quantity will be added when it's in inventory
export type BaseItem = Omit<CharacterInventoryItem, 'quantity'> & { 
    rarity?: Rarity;
    learningEffect?: {
        id: string;
        name: string;
        description: string;
        duration: number;
        icon: string;
    }
};

export const initialItems: BaseItem[] = [
  // === FOOD ===
  { id: 'food_bread', name: 'Хлеб', weight: 0.2, type: 'food', rarity: 'common', effect: { type: 'heal', stat: 'health', amount: 5 } },
  { id: 'food_cheese', name: 'Козий сыр', weight: 0.3, type: 'food', rarity: 'common', effect: { type: 'heal', stat: 'health', amount: 8 } },
  { 
    id: 'food_venison', 
    name: 'Жареная оленина', 
    weight: 0.8, 
    type: 'food', 
    rarity: 'uncommon', 
    effect: { 
      id: 'buff_well_fed', 
      type: 'buff', 
      stat: 'stamina', 
      amount: 10, 
      duration: 10 * 60 * 1000, 
      description: 'Вы чувствуете себя сытым и полным сил. Максимальный запас сил увеличен.', 
      icon: 'Drumstick' 
    } 
  },
  { 
    id: 'food_salmon', 
    name: 'Запеченный лосось', 
    weight: 0.5, 
    type: 'food', 
    rarity: 'uncommon', 
    effect: { 
      id: 'buff_intellect', 
      type: 'buff', 
      stat: 'magicka', 
      amount: 10, 
      duration: 10 * 60 * 1000, 
      description: 'Улучшает концентрацию. Максимальный запас магии увеличен.', 
      icon: 'Brain'
    } 
  },
  
  // === POTIONS ===
  { id: 'potion_health_weak', name: 'Слабый эликсир здоровья', weight: 0.5, type: 'potion', rarity: 'common', effect: { type: 'heal', stat: 'health', amount: 25 } },
  { id: 'potion_health_strong', name: 'Сильный эликсир здоровья', weight: 0.5, type: 'potion', rarity: 'uncommon', effect: { type: 'heal', stat: 'health', amount: 75 } },
  { id: 'potion_magicka_weak', name: 'Слабый эликсир магии', weight: 0.5, type: 'potion', rarity: 'common', effect: { type: 'heal', stat: 'magicka', amount: 25 } },
  { id: 'potion_magicka_strong', name: 'Сильный эликсир магии', weight: 0.5, type: 'potion', rarity: 'uncommon', effect: { type: 'heal', stat: 'magicka', amount: 75 } },
  { id: 'potion_stamina_weak', name: 'Слабый эликсир запаса сил', weight: 0.5, type: 'potion', rarity: 'common', effect: { type: 'heal', stat: 'stamina', amount: 25 } },
  { id: 'potion_stamina_strong', name: 'Сильный эликсир запаса сил', weight: 0.5, type: 'potion', rarity: 'uncommon', effect: { type: 'heal', stat: 'stamina', amount: 75 } },
  { 
    id: 'potion_strength_weak', 
    name: 'Слабый эликсир силы', 
    weight: 0.5, 
    type: 'potion', 
    rarity: 'uncommon',
    effect: {
      id: 'buff_strength_weak',
      type: 'buff', 
      stat: 'damage', 
      amount: 1.1, // 10% damage increase
      duration: 60000, // 1 minute
      description: 'Увеличивает наносимый урон на 10% на 1 минуту.',
      icon: 'Sword'
    } 
  },
  
  // === WEAPONS ===
  // Iron
  { id: 'weapon_dagger_iron', name: 'Железный кинжал', weight: 2, type: 'weapon', rarity: 'common', damage: 4, equipmentSlot: 'weapon' },
  { id: 'weapon_sword_iron', name: 'Железный меч', weight: 9, type: 'weapon', rarity: 'common', damage: 7, equipmentSlot: 'weapon' },
  { id: 'weapon_axe_iron', name: 'Железный топор', weight: 11, type: 'weapon', rarity: 'common', damage: 8, equipmentSlot: 'weapon' },
  { id: 'weapon_mace_iron', name: 'Железная булава', weight: 13, type: 'weapon', rarity: 'common', damage: 9, equipmentSlot: 'weapon' },
  // Steel
  { id: 'weapon_dagger_steel', name: 'Стальной кинжал', weight: 2.5, type: 'weapon', rarity: 'uncommon', damage: 5, equipmentSlot: 'weapon' },
  { id: 'weapon_sword_steel', name: 'Стальной меч', weight: 10, type: 'weapon', rarity: 'uncommon', damage: 8, equipmentSlot: 'weapon' },
  { id: 'weapon_axe_steel', name: 'Стальной боевой топор', weight: 12, type: 'weapon', rarity: 'uncommon', damage: 9, equipmentSlot: 'weapon' },
  { id: 'weapon_mace_steel', name: 'Стальная булава', weight: 14, type: 'weapon', rarity: 'uncommon', damage: 10, equipmentSlot: 'weapon' },
  // Orcish
  { id: 'weapon_dagger_orcish', name: 'Орочий кинжал', weight: 3, type: 'weapon', rarity: 'uncommon', damage: 6, equipmentSlot: 'weapon' },
  { id: 'weapon_sword_orcish', name: 'Орочий меч', weight: 11, type: 'weapon', rarity: 'uncommon', damage: 9, equipmentSlot: 'weapon' },
  { id: 'weapon_axe_orcish', name: 'Орочий топор', weight: 13, type: 'weapon', rarity: 'uncommon', damage: 10, equipmentSlot: 'weapon' },
  { id: 'weapon_mace_orcish', name: 'Орочья булава', weight: 15, type: 'weapon', rarity: 'uncommon', damage: 11, equipmentSlot: 'weapon' },
  // Dwarven
  { id: 'weapon_dagger_dwarven', name: 'Двемерский кинжал', weight: 3.5, type: 'weapon', rarity: 'rare', damage: 7, equipmentSlot: 'weapon' },
  { id: 'weapon_sword_dwarven', name: 'Двемерский меч', weight: 12, type: 'weapon', rarity: 'rare', damage: 10, equipmentSlot: 'weapon' },
  { id: 'weapon_axe_dwarven', name: 'Двемерский топор', weight: 14, type: 'weapon', rarity: 'rare', damage: 12, equipmentSlot: 'weapon' },
  { id: 'weapon_mace_dwarven', name: 'Двемерская булава', weight: 16, type: 'weapon', rarity: 'rare', damage: 13, equipmentSlot: 'weapon' },
  // Elven
  { id: 'weapon_dagger_elven', name: 'Эльфийский кинжал', weight: 2, type: 'weapon', rarity: 'rare', damage: 8, equipmentSlot: 'weapon' },
  { id: 'weapon_sword_elven', name: 'Эльфийский меч', weight: 9, type: 'weapon', rarity: 'rare', damage: 11, equipmentSlot: 'weapon' },
  { id: 'weapon_axe_elven', name: 'Эльфийский топор', weight: 11, type: 'weapon', rarity: 'rare', damage: 13, equipmentSlot: 'weapon' },
  { id: 'weapon_mace_elven', name: 'Эльфийская булава', weight: 13, type: 'weapon', rarity: 'rare', damage: 14, equipmentSlot: 'weapon' },
  // Misc
  { id: 'weapon_dagger_rusty', name: 'Ржавый кинжал', weight: 2, type: 'weapon', rarity: 'common', damage: 3, equipmentSlot: 'weapon' },


  // === ARMOR ===
  // Iron
  { id: 'armor_helmet_iron', name: 'Железный шлем', weight: 4, type: 'armor', rarity: 'common', armor: 8, equipmentSlot: 'head' },
  { id: 'armor_cuirass_iron', name: 'Железная броня', weight: 20, type: 'armor', rarity: 'common', armor: 15, equipmentSlot: 'torso' },
  { id: 'armor_gauntlets_iron', name: 'Железные перчатки', weight: 4, type: 'armor', rarity: 'common', armor: 5, equipmentSlot: 'hands' },
  { id: 'armor_boots_iron', name: 'Железные сапоги', weight: 4, type: 'armor', rarity: 'common', armor: 5, equipmentSlot: 'feet' },
  { id: 'armor_greaves_iron', name: 'Железные поножи', weight: 10, type: 'armor', rarity: 'common', armor: 8, equipmentSlot: 'legs' },
  // Steel
  { id: 'armor_helmet_steel', name: 'Стальной шлем', weight: 5, type: 'armor', rarity: 'uncommon', armor: 10, equipmentSlot: 'head' },
  { id: 'armor_cuirass_steel', name: 'Стальная броня', weight: 25, type: 'armor', rarity: 'uncommon', armor: 20, equipmentSlot: 'torso' },
  { id: 'armor_gauntlets_steel', name: 'Стальные перчатки', weight: 5, type: 'armor', rarity: 'uncommon', armor: 7, equipmentSlot: 'hands' },
  { id: 'armor_boots_steel', name: 'Стальные сапоги', weight: 5, type: 'armor', rarity: 'uncommon', armor: 7, equipmentSlot: 'feet' },
  { id: 'armor_greaves_steel', name: 'Стальные поножи', weight: 12, type: 'armor', rarity: 'uncommon', armor: 10, equipmentSlot: 'legs' },
  // Orcish
  { id: 'armor_helmet_orcish', name: 'Орочий шлем', weight: 6, type: 'armor', rarity: 'uncommon', armor: 12, equipmentSlot: 'head' },
  { id: 'armor_cuirass_orcish', name: 'Орочья броня', weight: 30, type: 'armor', rarity: 'uncommon', armor: 25, equipmentSlot: 'torso' },
  { id: 'armor_gauntlets_orcish', name: 'Орочьи перчатки', weight: 6, type: 'armor', rarity: 'uncommon', armor: 9, equipmentSlot: 'hands' },
  { id: 'armor_boots_orcish', name: 'Орочьи сапоги', weight: 6, type: 'armor', rarity: 'uncommon', armor: 9, equipmentSlot: 'feet' },
  { id: 'armor_greaves_orcish', name: 'Орочьи поножи', weight: 15, type: 'armor', rarity: 'uncommon', armor: 12, equipmentSlot: 'legs' },
  // Dwarven
  { id: 'armor_helmet_dwarven', name: 'Двемерский шлем', weight: 7, type: 'armor', rarity: 'rare', armor: 14, equipmentSlot: 'head' },
  { id: 'armor_cuirass_dwarven', name: 'Двемерская броня', weight: 35, type: 'armor', rarity: 'rare', armor: 30, equipmentSlot: 'torso' },
  { id: 'armor_gauntlets_dwarven', name: 'Двемерские перчатки', weight: 7, type: 'armor', rarity: 'rare', armor: 11, equipmentSlot: 'hands' },
  { id: 'armor_boots_dwarven', name: 'Двемерские сапоги', weight: 7, type: 'armor', rarity: 'rare', armor: 11, equipmentSlot: 'feet' },
  { id: 'armor_greaves_dwarven', name: 'Двемерские поножи', weight: 17, type: 'armor', rarity: 'rare', armor: 14, equipmentSlot: 'legs' },
  // Elven
  { id: 'armor_helmet_elven', name: 'Эльфийский шлем', weight: 3, type: 'armor', rarity: 'rare', armor: 11, equipmentSlot: 'head' },
  { id: 'armor_cuirass_elven', name: 'Эльфийская броня', weight: 15, type: 'armor', rarity: 'rare', armor: 22, equipmentSlot: 'torso' },
  { id: 'armor_gauntlets_elven', name: 'Эльфийские перчатки', weight: 3, type: 'armor', rarity: 'rare', armor: 8, equipmentSlot: 'hands' },
  { id: 'armor_boots_elven', name: 'Эльфийские сапоги', weight: 3, type: 'armor', rarity: 'rare', armor: 8, equipmentSlot: 'feet' },
  { id: 'armor_greaves_elven', name: 'Эльфийские поножи', weight: 8, type: 'armor', rarity: 'rare', armor: 11, equipmentSlot: 'legs' },
  // Misc Armor
  { id: 'armor_bracers_leather', name: 'Кожаные наручи', weight: 1, type: 'armor', rarity: 'common', armor: 3, equipmentSlot: 'hands' },
  { id: 'armor_fine_clothes', name: 'Дорогая одежда', weight: 2, type: 'armor', rarity: 'uncommon', armor: 2, equipmentSlot: 'torso' },
  { id: 'armor_worn', name: 'Поношенная броня', weight: 20, type: 'armor', rarity: 'common', armor: 15, equipmentSlot: 'torso' },
  { id: 'armor_novice_robes', name: 'Роба новичка', weight: 1, type: 'armor', rarity: 'common', armor: 1, equipmentSlot: 'torso' },
  { id: 'armor_clothes_simple', name: 'Простая одежда', weight: 2, type: 'armor', rarity: 'common', armor: 1, equipmentSlot: 'torso' },
  { id: 'armor_rags', name: 'Обрывки одежды', weight: 1, type: 'armor', rarity: 'common', armor: 0, equipmentSlot: 'torso' },
  { id: 'armor_steel_full', name: 'Стальная броня', weight: 25, type: 'armor', rarity: 'uncommon', armor: 20, equipmentSlot: 'torso' },
  
  // === RINGS & AMULETS ===
  { id: 'amulet_of_strength', name: 'Амулет силы', weight: 0.5, type: 'armor', rarity: 'uncommon', armor: 0, equipmentSlot: 'amulet' },
  { id: 'amulet_of_health', name: 'Амулет здоровья', weight: 0.5, type: 'armor', rarity: 'rare', armor: 0, equipmentSlot: 'amulet' },
  { id: 'ring_of_agility', name: 'Кольцо ловкости', weight: 0.2, type: 'armor', rarity: 'uncommon', armor: 0, equipmentSlot: 'ring' },

  // === MISC ===
  { id: 'misc_lockpicks', name: 'Отмычки', weight: 0.1, type: 'misc', rarity: 'common' },
  { id: 'item_wine_fine', name: 'Прекрасное вино', weight: 0.7, type: 'misc', rarity: 'uncommon' },
  { id: 'misc_gem_amethyst', name: 'Аметист', weight: 0.1, type: 'misc', rarity: 'rare' },
  { id: 'misc_scrap_metal', name: 'Металлический хлам', weight: 1.5, type: 'misc', rarity: 'common' },

  // === SPELL TOMES ===
  { id: 'tome_flames', name: 'Том заклинаний: Пламя', weight: 1, type: 'spell_tome', rarity: 'common', spellId: 'flames' },
  { id: 'misc_spell_tome_flames', name: 'Том заклинаний: Пламя', weight: 1, type: 'spell_tome', rarity: 'common', spellId: 'flames' },
  { id: 'tome_healing_touch', name: 'Том заклинаний: Исцеляющее касание', weight: 1, type: 'spell_tome', rarity: 'common', spellId: 'healing_touch' },
  { id: 'tome_ice_spike', name: 'Том заклинаний: Ледяное копье', weight: 1, type: 'spell_tome', rarity: 'uncommon', spellId: 'ice_spike' },
  { id: 'tome_lightning_bolt', name: 'Том заклинаний: Разряд молнии', weight: 1, type: 'spell_tome', rarity: 'uncommon', spellId: 'lightning_bolt' },
  { id: 'tome_fireball', name: 'Том заклинаний: Огненный шар', weight: 1, type: 'spell_tome', rarity: 'rare', spellId: 'fireball' },
  { id: 'tome_fast_healing', name: 'Том заклинаний: Быстрое лечение', weight: 1, type: 'spell_tome', rarity: 'uncommon', spellId: 'fast_healing' },
  { id: 'tome_oakflesh', name: 'Том заклинаний: Дубовая плоть', weight: 1, type: 'spell_tome', rarity: 'uncommon', spellId: 'oakflesh' },
  { id: 'tome_vampiric_drain', name: 'Том заклинаний: Вампирское высасывание', weight: 1, type: 'spell_tome', rarity: 'rare', spellId: 'vampiric_drain' },
  { id: 'tome_energize', name: 'Том заклинаний: Прилив сил', weight: 1, type: 'spell_tome', rarity: 'common', spellId: 'energize' },
  { id: 'tome_sun_fire', name: 'Том заклинаний: Солнечный огонь', weight: 1, type: 'spell_tome', rarity: 'uncommon', spellId: 'sun_fire' },
  { id: 'tome_close_wounds', name: 'Том заклинаний: Закрыть раны', weight: 1, type: 'spell_tome', rarity: 'rare', spellId: 'close_wounds' },
  { id: 'tome_arcane_intellect', name: 'Том заклинаний: Тайный интеллект', weight: 1, type: 'spell_tome', rarity: 'rare', spellId: 'arcane_intellect' },


  // === KEY ITEMS ===
  { id: 'item_key_dragon_claw', name: 'Древний драконий коготь', weight: 1, type: 'key_item', rarity: 'legendary' },

  // === FACTION ITEMS ===
  { id: 'weapon_skyforge_sword', name: 'Небесный стальной меч', weight: 10, type: 'weapon', rarity: 'rare', damage: 12, equipmentSlot: 'weapon' },
  { id: 'armor_thieves_hood', name: 'Капюшон Гильдии Воров', weight: 1, type: 'armor', rarity: 'rare', armor: 5, equipmentSlot: 'head'},
  { id: 'item_poison_deadly', name: 'Смертельный яд', weight: 0.5, type: 'misc', rarity: 'rare'},

  // === LEARNING BOOKS ===
  { 
    id: 'book_art_of_blade', 
    name: 'Книга: Искусство клинка', 
    weight: 1, 
    type: 'learning_book', 
    rarity: 'uncommon', 
    learningEffect: { 
        id: 'learning_art_of_blade', 
        name: 'Вдохновение: Искусство клинка', 
        description: 'Временно повышает тягу к сражениям и приключениям.', 
        duration: 30 * 60 * 1000, 
        icon: 'Sword' 
    } 
  },
  { 
    id: 'book_pilgrims_guide', 
    name: 'Книга: Путеводитель пилигрима', 
    weight: 1, 
    type: 'learning_book', 
    rarity: 'uncommon', 
    learningEffect: { 
        id: 'learning_pilgrims_guide', 
        name: 'Вдохновение: Дух странствий', 
        description: 'Временно повышает желание путешествовать и исследовать мир.', 
        duration: 30 * 60 * 1000, 
        icon: 'Map' 
    } 
  },
  
  // === DIVINE ARTIFACTS ===
  { id: 'artifact_akatosh_hourglass', name: 'Песочные часы Акатоша', weight: 1, type: 'armor', rarity: 'legendary', equipmentSlot: 'amulet' },
  { id: 'artifact_arkay_ward', name: 'Оберег Аркея', weight: 1, type: 'armor', rarity: 'legendary', equipmentSlot: 'amulet' },
  { id: 'artifact_dibella_brush', name: 'Кисть Дибеллы', weight: 0.5, type: 'weapon', rarity: 'legendary', damage: 5, equipmentSlot: 'weapon' },
  { id: 'artifact_julianos_tome', name: 'Фолиант Юлианоса', weight: 2, type: 'armor', rarity: 'legendary', armor: 2, equipmentSlot: 'ring' },
  { id: 'artifact_kynareth_feather', name: 'Перо Кинарет', weight: 0.1, type: 'armor', rarity: 'legendary', equipmentSlot: 'ring' },
  { id: 'artifact_mara_bond', name: 'Узы Мары', weight: 0.2, type: 'armor', rarity: 'legendary', equipmentSlot: 'ring' },
  { id: 'artifact_stendarr_hammer', name: 'Молот Стендарра', weight: 18, type: 'weapon', rarity: 'legendary', damage: 25, equipmentSlot: 'weapon' },
  { id: 'artifact_talos_armor', name: 'Доспех Талоса', weight: 30, type: 'armor', rarity: 'legendary', armor: 40, equipmentSlot: 'torso' },
  { id: 'artifact_zenithar_coin', name: 'Монета Зенитара', weight: 0.1, type: 'armor', rarity: 'legendary', equipmentSlot: 'amulet' },

  // === GLASS WEAPONS (SERIOUS) ===
  { id: 'weapon_dagger_glass', name: 'Стеклянный кинжал', weight: 4.5, type: 'weapon', rarity: 'rare', damage: 9, equipmentSlot: 'weapon' },
  { id: 'weapon_sword_glass', name: 'Стеклянный меч', weight: 14, type: 'weapon', rarity: 'rare', damage: 14, equipmentSlot: 'weapon' },
  { id: 'weapon_axe_glass', name: 'Стеклянный топор', weight: 16, type: 'weapon', rarity: 'rare', damage: 15, equipmentSlot: 'weapon' },

  // === EBONY WEAPONS (SERIOUS) ===
  { id: 'weapon_dagger_ebony', name: 'Эбонитовый кинжал', weight: 5, type: 'weapon', rarity: 'legendary', damage: 10, equipmentSlot: 'weapon' },
  { id: 'weapon_sword_ebony', name: 'Эбонитовый меч', weight: 16, type: 'weapon', rarity: 'legendary', damage: 16, equipmentSlot: 'weapon' },
  { id: 'weapon_axe_ebony', name: 'Эбонитовый топор', weight: 20, type: 'weapon', rarity: 'legendary', damage: 18, equipmentSlot: 'weapon' },

  // === DAEDRIC WEAPONS (SERIOUS) ===
  { id: 'weapon_dagger_daedric', name: 'Даэдрический кинжал', weight: 6, type: 'weapon', rarity: 'legendary', damage: 11, equipmentSlot: 'weapon' },
  { id: 'weapon_sword_daedric', name: 'Даэдрический меч', weight: 18, type: 'weapon', rarity: 'legendary', damage: 20, equipmentSlot: 'weapon' },
  { id: 'weapon_axe_daedric', name: 'Даэдрический топор', weight: 22, type: 'weapon', rarity: 'legendary', damage: 22, equipmentSlot: 'weapon' },

  // === DRAGON WEAPONS & ARMOR (SERIOUS) ===
  { id: 'weapon_sword_dragonbone', name: 'Драконий меч', weight: 19, type: 'weapon', rarity: 'legendary', damage: 21, equipmentSlot: 'weapon' },
  { id: 'armor_helmet_dragonscale', name: 'Чешуйчатый драконий шлем', weight: 5, type: 'armor', rarity: 'legendary', armor: 17, equipmentSlot: 'head' },
  { id: 'armor_cuirass_dragonplate', name: 'Пластинчатая драконья броня', weight: 40, type: 'armor', rarity: 'legendary', armor: 46, equipmentSlot: 'torso' },

  // === MEME ITEMS (HUMOR) ===
  { id: 'food_sweetroll', name: 'Сладкая булочка', weight: 0.2, type: 'food', rarity: 'legendary', effect: { type: 'heal', stat: 'health', amount: 100, description: 'Легендарная сладкая булочка! Кто-то украл её?', icon: 'Cookie' } },
  { id: 'food_stolen_sweetroll', name: 'Украденная сладкая булочка', weight: 0.2, type: 'food', rarity: 'legendary', effect: { type: 'heal', stat: 'health', amount: 150, description: 'Вкус запретного плода особенно сладок!', icon: 'Cookie' } },
  { id: 'misc_arrow_in_knee', name: 'Стрела в колено', weight: 0.1, type: 'misc', rarity: 'legendary' },
  { id: 'misc_bucket', name: 'Ведро', weight: 2, type: 'armor', rarity: 'uncommon', armor: 1, equipmentSlot: 'head' },
  { id: 'food_cheese_wheel', name: 'Колесо сыра', weight: 3, type: 'food', rarity: 'rare', effect: { type: 'heal', stat: 'health', amount: 50 } },
  { id: 'food_cabbage', name: 'Капуста', weight: 0.25, type: 'food', rarity: 'common', effect: { type: 'heal', stat: 'health', amount: 1 } },
  { id: 'misc_wooden_plate', name: 'Деревянная тарелка', weight: 0.3, type: 'misc', rarity: 'uncommon' },
  { id: 'potion_skooma', name: 'Скума', weight: 0.5, type: 'potion', rarity: 'rare', effect: { type: 'heal', stat: 'stamina', amount: 100 } },
  { id: 'misc_moon_sugar', name: 'Лунный сахар', weight: 0.1, type: 'misc', rarity: 'rare' },
  { id: 'food_fishstick', name: 'Рыбная палочка', weight: 0.2, type: 'food', rarity: 'legendary', effect: { type: 'heal', stat: 'health', amount: 1, description: 'Любимое блюдо Шеогората!', icon: 'Fish' } },
  { id: 'weapon_fork_sheogorath', name: 'Вилка Шеогората', weight: 0.2, type: 'weapon', rarity: 'legendary', damage: 2, equipmentSlot: 'weapon' },
  { id: 'weapon_cheese_dagger', name: 'Сырный кинжал', weight: 0.5, type: 'weapon', rarity: 'legendary', damage: 3, equipmentSlot: 'weapon' },
  { id: 'misc_basket', name: 'Корзина', weight: 1, type: 'armor', rarity: 'common', armor: 0, equipmentSlot: 'head' },
  { id: 'misc_nazeem_ashes', name: 'Прах Назима', weight: 0.1, type: 'misc', rarity: 'legendary' },
  { id: 'food_chicken', name: 'Курица', weight: 1, type: 'food', rarity: 'uncommon', effect: { type: 'heal', stat: 'health', amount: 15, description: 'Не трогай кур в Скайриме!', icon: 'Bird' } },
  { id: 'armor_vest_adoring_fan', name: 'Жилет Восторженного Фаната', weight: 1, type: 'armor', rarity: 'rare', armor: 1, equipmentSlot: 'torso' },
  
  // === LEARNING BOOKS (MEME) ===
  { 
    id: 'book_cloud_district', 
    name: 'Книга: Ты часто бываешь в Облачном квартале?', 
    weight: 1, 
    type: 'learning_book', 
    rarity: 'legendary', 
    learningEffect: { 
      id: 'learning_cloud_district', 
      name: 'Проклятие Назима', 
      description: 'Теперь ты ТОЧНО не бываешь в Облачном квартале.', 
      duration: 60 * 60 * 1000, 
      icon: 'CloudOff' 
    } 
  },
  { 
    id: 'book_lusty_argonian', 
    name: 'Книга: Похотливая аргонианка', 
    weight: 1, 
    type: 'learning_book', 
    rarity: 'rare', 
    learningEffect: { 
      id: 'learning_lusty', 
      name: 'Культурное просвещение', 
      description: 'Ты узнал... много нового об аргонианской культуре.', 
      duration: 15 * 60 * 1000, 
      icon: 'BookOpen' 
    } 
  },
  { 
    id: 'book_maiq_lies', 
    name: "Книга: Ложь М'Айка", 
    weight: 1, 
    type: 'learning_book', 
    rarity: 'legendary', 
    learningEffect: { 
      id: 'learning_maiq', 
      name: "Мудрость М'Айка", 
      description: "М'Айк видел многое. М'Айк знает многое. Но М'Айк лжёт!", 
      duration: 30 * 60 * 1000, 
      icon: 'Cat' 
    } 
  },

  // === SERIOUS UNIQUE WEAPONS ===
  { id: 'weapon_mehrunes_razor', name: "Бритва Мерунеса", weight: 3, type: 'weapon', rarity: 'legendary', damage: 11, equipmentSlot: 'weapon' },
  { id: 'weapon_chillrend', name: 'Леденец', weight: 16, type: 'weapon', rarity: 'legendary', damage: 15, equipmentSlot: 'weapon' },
  { id: 'weapon_dawnbreaker', name: 'Рассветная Погибель', weight: 10, type: 'weapon', rarity: 'legendary', damage: 16, equipmentSlot: 'weapon' },
  { id: 'weapon_wabbajack', name: 'Ваббаджек', weight: 10, type: 'weapon', rarity: 'legendary', damage: 1, equipmentSlot: 'weapon' },
  { id: 'weapon_bloodskal_blade', name: 'Клинок Кровавого Скала', weight: 15, type: 'weapon', rarity: 'legendary', damage: 17, equipmentSlot: 'weapon' },

  // === SERIOUS ARMOR SETS ===
  { id: 'armor_nightingale_hood', name: 'Капюшон Соловья', weight: 2, type: 'armor', rarity: 'legendary', armor: 12, equipmentSlot: 'head' },
  { id: 'armor_nightingale_armor', name: 'Доспех Соловья', weight: 18, type: 'armor', rarity: 'legendary', armor: 34, equipmentSlot: 'torso' },
  { id: 'armor_dark_brotherhood_shroud', name: 'Саван Тёмного Братства', weight: 3, type: 'armor', rarity: 'rare', armor: 16, equipmentSlot: 'torso' },
  { id: 'armor_blades_helmet', name: 'Шлем Клинков', weight: 4, type: 'armor', rarity: 'rare', armor: 13, equipmentSlot: 'head' },
  { id: 'armor_vampire_royal', name: 'Королевские вампирские доспехи', weight: 9, type: 'armor', rarity: 'legendary', armor: 30, equipmentSlot: 'torso' },

  // === POTIONS & SCROLLS (SERIOUS) ===
  { id: 'potion_invisibility', name: 'Эликсир невидимости', weight: 0.5, type: 'potion', rarity: 'rare', effect: { type: 'buff', stat: 'invisibility', amount: 1, duration: 30000 } },
  { id: 'scroll_fireball', name: 'Свиток огненного шара', weight: 0.3, type: 'misc', rarity: 'uncommon' },
  { id: 'scroll_blizzard', name: 'Свиток метели', weight: 0.3, type: 'misc', rarity: 'rare' },
  { id: 'misc_soul_gem_grand', name: 'Великий камень душ', weight: 1, type: 'misc', rarity: 'rare' },
  { id: 'misc_black_soul_gem', name: 'Чёрный камень душ', weight: 1, type: 'misc', rarity: 'legendary' },

  // === MISC RARE ITEMS (MIX) ===
  { id: 'misc_skeleton_key', name: 'Скелетный ключ', weight: 0.5, type: 'misc', rarity: 'legendary' },
  { id: 'misc_elder_scroll', name: 'Древний Свиток', weight: 20, type: 'misc', rarity: 'legendary' },
  { id: 'food_sweetroll_of_power', name: 'Сладкая булочка силы', weight: 0.3, type: 'food', rarity: 'legendary', effect: { id: 'buff_sweetroll_power', type: 'buff', stat: 'damage', amount: 1.5, duration: 300000, description: 'Невероятная мощь сладкой булочки!', icon: 'Zap' } },
  { id: 'misc_mudcrab_chitin', name: 'Хитин грязевого краба', weight: 0.5, type: 'misc', rarity: 'uncommon' },
  { id: 'misc_dragon_scale', name: 'Драконья чешуя', weight: 3, type: 'misc', rarity: 'legendary' },
  { id: 'misc_dragon_bone', name: 'Драконья кость', weight: 15, type: 'misc', rarity: 'legendary' },
  
  // === FOOD (MORE VARIETY) ===
  { id: 'food_apple', name: 'Яблоко', weight: 0.1, type: 'food', rarity: 'common', effect: { type: 'heal', stat: 'health', amount: 2 } },
  { id: 'food_potato', name: 'Картофель', weight: 0.2, type: 'food', rarity: 'common', effect: { type: 'heal', stat: 'health', amount: 1 } },
  { id: 'food_tomato', name: 'Помидор', weight: 0.1, type: 'food', rarity: 'common', effect: { type: 'heal', stat: 'health', amount: 1 } },
  { id: 'food_horker_meat', name: 'Мясо моржа', weight: 2, type: 'food', rarity: 'uncommon', effect: { type: 'heal', stat: 'health', amount: 10 } },
  { id: 'food_mammoth_steak', name: 'Стейк из мамонта', weight: 3, type: 'food', rarity: 'rare', effect: { id: 'buff_mammoth', type: 'buff', stat: 'stamina', amount: 20, duration: 600000, description: 'Могучий стейк из мамонта!', icon: 'Beef' } },
  { id: 'food_mead_honningbrew', name: 'Мёд Хоннингбрю', weight: 0.5, type: 'food', rarity: 'uncommon', effect: { type: 'heal', stat: 'stamina', amount: 15 } },
  { id: 'food_black_briar_mead', name: 'Мёд Чёрный Вереск', weight: 0.5, type: 'food', rarity: 'rare', effect: { type: 'heal', stat: 'stamina', amount: 25 } },

  // === MISC GEMS ===
  { id: 'misc_gem_ruby', name: 'Рубин', weight: 0.1, type: 'misc', rarity: 'rare' },
  { id: 'misc_gem_emerald', name: 'Изумруд', weight: 0.1, type: 'misc', rarity: 'rare' },
  { id: 'misc_gem_diamond', name: 'Алмаз', weight: 0.1, type: 'misc', rarity: 'legendary' },
  { id: 'misc_flawless_diamond', name: 'Безупречный алмаз', weight: 0.1, type: 'misc', rarity: 'legendary' },

  // === ALCHEMY INGREDIENTS ===
  { id: 'ingredient_blue_mountain_flower', name: 'Голубой горный цветок', weight: 0.1, type: 'misc', rarity: 'common' },
  { id: 'ingredient_lavender', name: 'Лаванда', weight: 0.1, type: 'misc', rarity: 'common' },
  { id: 'ingredient_red_mountain_flower', name: 'Красный горный цветок', weight: 0.1, type: 'misc', rarity: 'common' },
  { id: 'ingredient_thistle_branch', name: 'Ветка чертополоха', weight: 0.1, type: 'misc', rarity: 'common' },
  { id: 'ingredient_creep_cluster', name: 'Ползучий кластер', weight: 0.1, type: 'misc', rarity: 'uncommon' },
  { id: 'ingredient_dragons_tongue', name: 'Драконий язык', weight: 0.1, type: 'misc', rarity: 'uncommon' },
  { id: 'ingredient_fire_salts', name: 'Огненные соли', weight: 0.1, type: 'misc', rarity: 'uncommon' },
  { id: 'ingredient_frost_salts', name: 'Ледяные соли', weight: 0.1, type: 'misc', rarity: 'uncommon' },
  { id: 'ingredient_void_salts', name: 'Соли пустоты', weight: 0.1, type: 'misc', rarity: 'rare' },
  { id: 'ingredient_daedra_heart', name: 'Сердце даэдра', weight: 0.5, type: 'misc', rarity: 'legendary' },

  // === ORE & CRAFTING MATERIALS ===
  { id: 'ore_iron', name: 'Железная руда', weight: 1, type: 'misc', rarity: 'common' },
  { id: 'ore_silver', name: 'Серебряная руда', weight: 1, type: 'misc', rarity: 'uncommon' },
  { id: 'ore_gold', name: 'Золотая руда', weight: 1, type: 'misc', rarity: 'uncommon' },
  { id: 'ore_ebony', name: 'Эбонитовая руда', weight: 1, type: 'misc', rarity: 'rare' },
  { id: 'ore_daedric', name: 'Даэдрическая руда', weight: 1, type: 'misc', rarity: 'legendary' },
  { id: 'leather_strips', name: 'Кожаные полоски', weight: 0.5, type: 'misc', rarity: 'common' },
  { id: 'leather', name: 'Кожа', weight: 1, type: 'misc', rarity: 'common' },
  { id: 'wolf_pelt', name: 'Волчья шкура', weight: 2, type: 'misc', rarity: 'common' },
  { id: 'bear_pelt', name: 'Медвежья шкура', weight: 3, type: 'misc', rarity: 'uncommon' },
  { id: 'sabre_cat_pelt', name: 'Шкура саблезуба', weight: 2.5, type: 'misc', rarity: 'uncommon' },

  // === FOOD VARIETY ===
  { id: 'food_raw_meat', name: 'Сырое мясо', weight: 1, type: 'food', rarity: 'common', effect: { type: 'heal', stat: 'health', amount: 3 } },
  { id: 'food_cooked_meat', name: 'Жареное мясо', weight: 1, type: 'food', rarity: 'common', effect: { type: 'heal', stat: 'health', amount: 8 } },
  { id: 'food_venison_raw', name: 'Сырая оленина', weight: 1.5, type: 'food', rarity: 'common', effect: { type: 'heal', stat: 'health', amount: 4 } },
  { id: 'food_salmon_raw', name: 'Сырой лосось', weight: 0.8, type: 'food', rarity: 'common', effect: { type: 'heal', stat: 'health', amount: 5 } },
  { id: 'food_honey', name: 'Мёд', weight: 0.3, type: 'food', rarity: 'uncommon', effect: { type: 'heal', stat: 'health', amount: 6 } },
  { id: 'food_cheese_wheel_small', name: 'Маленькое колесо сыра', weight: 1, type: 'food', rarity: 'common', effect: { type: 'heal', stat: 'health', amount: 12 } },

  // === POISON INGREDIENTS ===
  { id: 'poison_ingredient_nightshade', name: 'Паслён', weight: 0.1, type: 'misc', rarity: 'uncommon' },
  { id: 'poison_ingredient_deathbell', name: 'Колокольчик смерти', weight: 0.1, type: 'misc', rarity: 'rare' },
  { id: 'poison_ingredient_venom', name: 'Яд', weight: 0.2, type: 'misc', rarity: 'uncommon' },
  { id: 'poison_ingredient_spider_venom', name: 'Паучий яд', weight: 0.1, type: 'misc', rarity: 'common' },
];
