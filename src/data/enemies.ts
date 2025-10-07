
import type { Enemy } from '@/types/enemy';

export const initialEnemies: Enemy[] = [
  { id: 'wolf', name: 'Волк', health: 20, damage: 3, xp: 15, level: 1, armor: 11 },
  { 
    id: 'frost_spider', 
    name: 'Морозный паук', 
    health: 30, 
    damage: 4, 
    xp: 25,
    level: 2,
    armor: 12,
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
  { id: 'bandit', name: 'Бандит', health: 40, damage: 5, xp: 30, level: 2, armor: 12 },
  { id: 'draugr', name: 'Драугр', health: 50, damage: 6, xp: 40, level: 3, armor: 13 },
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
  { id: 'falmer', name: 'Фалмер', health: 40, damage: 7, xp: 50, level: 5, armor: 11 },
  { id: 'sabre_cat', name: 'Саблезуб', health: 60, damage: 8, xp: 75, level: 6, armor: 12 },
  { id: 'bandit_marauder', name: 'Бандит-мародер', health: 70, damage: 8, xp: 50, level: 4, armor: 14 },
  { id: 'draugr_wight', name: 'Драугр-страж', health: 80, damage: 9, xp: 60, level: 4, armor: 15 },
  { id: 'spriggan', name: 'Озлобленный спригган', health: 45, damage: 6, xp: 45, level: 3, armor: 10 },
  { id: 'bandit_chief', name: 'Главарь бандитов', health: 100, damage: 10, xp: 100, isUnique: true, level: 5, armor: 15 },
  { id: 'goblin', name: 'Гоблин', health: 18, damage: 4, xp: 12, level: 1, armor: 10 },
  { id: 'ice_wraith', name: 'Ледяное привидение', health: 70, damage: 10, xp: 120, level: 7, armor: 13 },
  { id: 'necromancer', name: 'Некромант', health: 55, damage: 7, xp: 90, level: 8, armor: 11 }, // damage is lower because they cast spells
  { id: 'mudcrab', name: 'Грязекраб', health: 15, damage: 2, xp: 10, level: 1, armor: 12 },
  { id: 'bee_swarm', name: 'Рой пчёл', health: 10, damage: 1, xp: 5, level: 1 }, // No armor, will be calculated
];
