
import type { Enemy } from '@/types/enemy';

export const initialEnemies: Enemy[] = [
  { 
    id: 'wolf', 
    name: 'Волк', 
    health: 20, 
    damage: 3, 
    xp: 15, 
    level: 1, 
    armor: 11,
    lootTable: {
      common: [
        { id: 'food_raw_meat', quantity: 1, chance: 0.8 },
        { id: 'wolf_pelt', quantity: 1, chance: 0.6 },
        { id: 'leather', quantity: 1, chance: 0.4 }
      ],
      uncommon: [
        { id: 'food_cooked_meat', quantity: 1, chance: 0.3 },
        { id: 'leather_strips', quantity: 2, chance: 0.2 }
      ],
      rare: [],
      legendary: [],
      goldChance: 0.3,
      goldMin: 5,
      goldMax: 15
    }
  },
  { 
    id: 'frost_spider', 
    name: 'Морозный паук', 
    health: 30, 
    damage: 4, 
    xp: 25,
    level: 2,
    armor: 12,
    lootTable: {
      common: [
        { id: 'poison_ingredient_spider_venom', quantity: 1, chance: 0.7 },
        { id: 'ingredient_blue_mountain_flower', quantity: 1, chance: 0.4 }
      ],
      uncommon: [
        { id: 'ingredient_frost_salts', quantity: 1, chance: 0.3 }
      ],
      rare: [],
      legendary: [],
      goldChance: 0.4,
      goldMin: 8,
      goldMax: 20
    },
    appliesEffect: {
      id: 'weak_poison',
      name: 'Слабый яд',
      description: 'Теряет 2 здоровья каждую секунду.',
      icon: 'Biohazard',
      type: 'debuff',
      chance: 0.2, // 20% chance to apply
      duration: 10000, // 10 seconds
      value: 2, // 2 damage per tick
    }
  },
  { 
    id: 'bandit', 
    name: 'Бандит', 
    health: 40, 
    damage: 5, 
    xp: 30, 
    level: 2, 
    armor: 12,
    lootTable: {
      common: [
        { id: 'misc_lockpicks', quantity: 2, chance: 0.6 },
        { id: 'food_cheese', quantity: 1, chance: 0.5 },
        { id: 'weapon_dagger_iron', quantity: 1, chance: 0.3 }
      ],
      uncommon: [
        { id: 'weapon_sword_iron', quantity: 1, chance: 0.2 },
        { id: 'armor_helmet_iron', quantity: 1, chance: 0.15 }
      ],
      rare: [],
      legendary: [],
      goldChance: 0.7,
      goldMin: 15,
      goldMax: 35
    }
  },
  { 
    id: 'draugr', 
    name: 'Драугр', 
    health: 50, 
    damage: 6, 
    xp: 40, 
    level: 3, 
    armor: 13,
    lootTable: {
      common: [
        { id: 'ore_iron', quantity: 1, chance: 0.6 },
        { id: 'ingredient_red_mountain_flower', quantity: 1, chance: 0.4 }
      ],
      uncommon: [
        { id: 'ore_silver', quantity: 1, chance: 0.3 },
        { id: 'weapon_sword_iron', quantity: 1, chance: 0.2 }
      ],
      rare: [
        { id: 'misc_gem_amethyst', quantity: 1, chance: 0.1 }
      ],
      legendary: [],
      goldChance: 0.6,
      goldMin: 20,
      goldMax: 45
    }
  },
  { 
    id: 'draugr_overlord', 
    name: 'Драугр-Владыка', 
    health: 180, 
    damage: 18, 
    xp: 200, 
    level: 10,
    armor: 16,
    isUnique: true,
    guaranteedDrop: [{ id: 'item_key_dragon_claw', quantity: 1 }],
  },
  { 
    id: 'falmer', 
    name: 'Фалмер', 
    health: 40, 
    damage: 7, 
    xp: 50, 
    level: 5, 
    armor: 11,
    lootTable: {
      common: [
        { id: 'ingredient_creep_cluster', quantity: 1, chance: 0.8 },
        { id: 'ore_iron', quantity: 1, chance: 0.6 }
      ],
      uncommon: [
        { id: 'ingredient_dragons_tongue', quantity: 1, chance: 0.4 },
        { id: 'ore_silver', quantity: 1, chance: 0.3 }
      ],
      rare: [
        { id: 'misc_gem_emerald', quantity: 1, chance: 0.15 }
      ],
      legendary: [],
      goldChance: 0.5,
      goldMin: 25,
      goldMax: 55
    }
  },
  { 
    id: 'sabre_cat', 
    name: 'Саблезуб', 
    health: 60, 
    damage: 8, 
    xp: 75, 
    level: 6, 
    armor: 12,
    lootTable: {
      common: [
        { id: 'sabre_cat_pelt', quantity: 1, chance: 0.9 },
        { id: 'food_raw_meat', quantity: 2, chance: 0.7 }
      ],
      uncommon: [
        { id: 'food_cooked_meat', quantity: 1, chance: 0.4 },
        { id: 'leather', quantity: 2, chance: 0.3 }
      ],
      rare: [
        { id: 'misc_gem_ruby', quantity: 1, chance: 0.1 }
      ],
      legendary: [],
      goldChance: 0.6,
      goldMin: 30,
      goldMax: 65
    }
  },
  { 
    id: 'bandit_marauder', 
    name: 'Бандит-мародер', 
    health: 70, 
    damage: 8, 
    xp: 50, 
    level: 4, 
    armor: 14,
    lootTable: {
      common: [
        { id: 'misc_lockpicks', quantity: 3, chance: 0.7 },
        { id: 'weapon_sword_iron', quantity: 1, chance: 0.5 }
      ],
      uncommon: [
        { id: 'weapon_sword_steel', quantity: 1, chance: 0.3 },
        { id: 'armor_cuirass_iron', quantity: 1, chance: 0.25 }
      ],
      rare: [
        { id: 'misc_gem_amethyst', quantity: 1, chance: 0.1 }
      ],
      legendary: [],
      goldChance: 0.8,
      goldMin: 25,
      goldMax: 50
    }
  },
  { 
    id: 'draugr_wight', 
    name: 'Драугр-страж', 
    health: 80, 
    damage: 9, 
    xp: 60, 
    level: 4, 
    armor: 15,
    lootTable: {
      common: [
        { id: 'ore_silver', quantity: 1, chance: 0.7 },
        { id: 'ingredient_red_mountain_flower', quantity: 2, chance: 0.5 }
      ],
      uncommon: [
        { id: 'ore_gold', quantity: 1, chance: 0.4 },
        { id: 'weapon_sword_steel', quantity: 1, chance: 0.3 }
      ],
      rare: [
        { id: 'misc_gem_emerald', quantity: 1, chance: 0.15 }
      ],
      legendary: [],
      goldChance: 0.7,
      goldMin: 30,
      goldMax: 60
    }
  },
  { 
    id: 'spriggan', 
    name: 'Озлобленный спригган', 
    health: 45, 
    damage: 6, 
    xp: 45, 
    level: 3, 
    armor: 10,
    lootTable: {
      common: [
        { id: 'ingredient_blue_mountain_flower', quantity: 2, chance: 0.8 },
        { id: 'ingredient_lavender', quantity: 1, chance: 0.6 }
      ],
      uncommon: [
        { id: 'ingredient_thistle_branch', quantity: 1, chance: 0.5 },
        { id: 'ingredient_creep_cluster', quantity: 1, chance: 0.3 }
      ],
      rare: [
        { id: 'ingredient_dragons_tongue', quantity: 1, chance: 0.2 }
      ],
      legendary: [],
      goldChance: 0.4,
      goldMin: 20,
      goldMax: 40
    }
  },
  // === DISEASE SOURCES ===
  {
    id: 'vampire_thrall',
    name: 'Прислужник вампира',
    health: 55,
    damage: 7,
    xp: 80,
    level: 5,
    armor: 12,
    lootTable: {
      common: [ { id: 'misc_lockpicks', quantity: 1, chance: 0.6 } ],
      uncommon: [ { id: 'potion_health_weak', quantity: 1, chance: 0.25 } ],
      rare: [],
      legendary: [],
      goldChance: 0.6,
      goldMin: 20,
      goldMax: 45
    },
    appliesEffect: {
      id: 'disease_vampirism',
      name: 'Вампиризм',
      description: 'Нечистая кровь наполняет вены. Днем мучительно, ночью терпимо. Требуется кровь.',
      icon: 'Moon',
      type: 'debuff',
      chance: 0.15,
      duration: 0
    }
  },
  {
    id: 'vampire_master',
    name: 'Повелитель вампиров',
    health: 110,
    damage: 14,
    xp: 220,
    level: 10,
    armor: 15,
    isUnique: false,
    lootTable: {
      common: [ { id: 'misc_lockpicks', quantity: 2, chance: 0.7 } ],
      uncommon: [ { id: 'potion_health_weak', quantity: 1, chance: 0.35 } ],
      rare: [],
      legendary: [],
      goldChance: 0.8,
      goldMin: 40,
      goldMax: 90
    },
    appliesEffect: {
      id: 'disease_vampirism',
      name: 'Вампиризм',
      description: 'Нечистая кровь наполняет вены. Днем мучительно, ночью терпимо. Требуется кровь.',
      icon: 'Moon',
      type: 'debuff',
      chance: 0.25,
      duration: 0
    }
  },
  {
    id: 'werewolf',
    name: 'Оборотень',
    health: 95,
    damage: 13,
    xp: 180,
    level: 9,
    armor: 14,
    lootTable: {
      common: [ { id: 'wolf_pelt', quantity: 2, chance: 0.9 } ],
      uncommon: [ { id: 'leather', quantity: 2, chance: 0.4 } ],
      rare: [],
      legendary: [],
      goldChance: 0.3,
      goldMin: 10,
      goldMax: 25
    },
    appliesEffect: {
      id: 'disease_lycanthropy',
      name: 'Ликантропия',
      description: 'Древнее проклятие луны. Ночью сильнее, но растёт звериный голод.',
      icon: 'PawPrint',
      type: 'debuff',
      chance: 0.18,
      duration: 0
    }
  },
  {
    id: 'werewolf_alpha',
    name: 'Вожак оборотней',
    health: 140,
    damage: 18,
    xp: 300,
    level: 12,
    armor: 16,
    isUnique: false,
    lootTable: {
      common: [ { id: 'wolf_pelt', quantity: 3, chance: 0.95 } ],
      uncommon: [ { id: 'leather', quantity: 3, chance: 0.5 } ],
      rare: [],
      legendary: [],
      goldChance: 0.3,
      goldMin: 20,
      goldMax: 40
    },
    appliesEffect: {
      id: 'disease_lycanthropy',
      name: 'Ликантропия',
      description: 'Древнее проклятие луны. Ночью сильнее, но растёт звериный голод.',
      icon: 'PawPrint',
      type: 'debuff',
      chance: 0.25,
      duration: 0
    }
  },
  { id: 'bandit_chief', name: 'Главарь бандитов', health: 100, damage: 10, xp: 100, isUnique: true, level: 5, armor: 15 },
  { id: 'goblin', name: 'Гоблин', health: 18, damage: 4, xp: 12, level: 1, armor: 10 },
  { id: 'ice_wraith', name: 'Ледяное привидение', health: 70, damage: 10, xp: 120, level: 7, armor: 13 },
  { id: 'necromancer', name: 'Некромант', health: 55, damage: 7, xp: 90, level: 8, armor: 11 }, // damage is lower because they cast spells
  { id: 'mudcrab', name: 'Грязекраб', health: 15, damage: 2, xp: 10, level: 1, armor: 12 },
  { id: 'bee_swarm', name: 'Рой пчёл', health: 10, damage: 1, xp: 5, level: 1 }, // No armor, will be calculated
];
