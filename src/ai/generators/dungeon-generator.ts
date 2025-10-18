export type DungeonActivity = {
  id: string;
  type: 'explore' | 'gather' | 'puzzle' | 'trap' | 'treasure';
  name: string;
  description: string;
  duration: number; // ms
  rewards?: { gold?: number; xp?: number; items?: string[] };
  danger?: { damageMin: number; damageMax: number };
};

export function generateDungeonActivities(location: string, level: number): DungeonActivity[] {
  const out: DungeonActivity[] = [];
  out.push({
    id: `search_chamber_${location}`,
    type: 'explore',
    name: 'Обыскать зал',
    description: 'Исследовать каменные ниши и сломанные саркофаги.',
    duration: 70_000,
    rewards: { gold: 20 + Math.floor(level * 5), xp: 12 },
  });
  out.push({
    id: `disarm_trap_${location}`,
    type: 'trap',
    name: 'Обезвредить ловушку',
    description: 'Найти и обезвредить настенную ловушку.',
    duration: 50_000,
    rewards: { xp: 15 },
    danger: { damageMin: 5, damageMax: 15 },
  });
  out.push({
    id: `secret_door_${location}`,
    type: 'puzzle',
    name: 'Тайная дверь',
    description: 'Разгадать символы и открыть скрытый проход.',
    duration: 90_000,
    rewards: { items: ['ancient_scroll'], xp: 20 },
  });
  out.push({
    id: `treasure_cache_${location}`,
    type: 'treasure',
    name: 'Тайник сокровищ',
    description: 'Найти крошечный тайник между плитами.',
    duration: 40_000,
    rewards: { gold: 60 + Math.floor(level * 10), items: ['gem_quartz'] },
  });
  return out;
}


