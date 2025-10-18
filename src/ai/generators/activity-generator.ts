export type GeneratedActivity = {
  id: string;
  type: 'fetch' | 'social' | 'explore' | 'delivery' | 'gather';
  name: string;
  description: string;
  duration: number; // ms
  rewards: {
    gold?: number;
    xp?: number;
    items?: string[];
    reputation?: { factionId: string; amount: number };
  };
  location: string;
  difficulty: number; // 1-10
};

export function generateCityActivities(location: string, characterLevel: number): GeneratedActivity[] {
  const base: GeneratedActivity[] = [];
  const isOutskirts = /_outskirts$/.test(location);
  base.push({
    id: `fetch_apples_${location}`,
    type: 'fetch',
    name: 'Принести яблоки торговцу',
    description: 'Собрать 5 яблок для лавочника на рынке.',
    duration: isOutskirts ? 60_000 : 90_000,
    rewards: { gold: 40 + Math.floor(characterLevel * 3), xp: 15 },
    location,
    difficulty: 1,
  });
  base.push({
    id: `talk_townsfolk_${location}`,
    type: 'social',
    name: 'Поболтать с горожанами',
    description: 'Узнать свежие новости и слухи в таверне.',
    duration: isOutskirts ? 45_000 : 60_000,
    rewards: { xp: 10 },
    location,
    difficulty: 1,
  });
  base.push({
    id: `delivery_parcel_${location}`,
    type: 'delivery',
    name: 'Доставить посылку',
    description: 'Отнести сверток в соседний квартал.',
    duration: isOutskirts ? 50_000 : 75_000,
    rewards: { gold: 55 + Math.floor(characterLevel * 2), xp: 12 },
    location,
    difficulty: 1,
  });
  base.push({
    id: `gather_herbs_${location}`,
    type: 'gather',
    name: 'Собрать лечебные травы',
    description: 'Соберите несколько трав для местного алхимика.',
    duration: isOutskirts ? 90_000 : 120_000,
    rewards: { gold: 35 + Math.floor(characterLevel * 3), xp: 18, items: ['herb_green', 'herb_red'] },
    location,
    difficulty: 2,
  });
  base.push({
    id: `help_guard_${location}`,
    type: 'social',
    name: 'Помочь городской страже',
    description: 'Отнести записку капитану стражи и вернуться.',
    duration: isOutskirts ? 80_000 : 110_000,
    rewards: { gold: 70 + Math.floor(characterLevel * 2), xp: 20, reputation: { factionId: 'guards', amount: 1 } },
    location,
    difficulty: 2,
  });
  base.push({
    id: `street_performance_${location}`,
    type: 'social',
    name: 'Уличное выступление',
    description: 'Немного поплясать и попеть, чтобы поднять настроение.',
    duration: isOutskirts ? 40_000 : 60_000,
    rewards: { gold: 20 + Math.floor(Math.random() * 20), xp: 8 },
    location,
    difficulty: 1,
  });

  // Outskirts-specific quick activities
  if (isOutskirts) {
    base.push({
      id: `train_yard_${location}`,
      type: 'gather',
      name: 'Потренироваться на площадке',
      description: 'Немного размяться с манекенами и отработать удары.',
      duration: 50_000,
      rewards: { xp: 12 },
      location,
      difficulty: 1,
    });
    base.push({
      id: `dice_game_${location}`,
      type: 'social',
      name: 'Сыграть в кости',
      description: 'Пара быстрых раундов с местными. Удача улыбнётся... или нет.',
      duration: 45_000,
      rewards: { gold: Math.max(0, 10 + Math.floor((Math.random() - 0.5) * 40)), xp: 6 },
      location,
      difficulty: 1,
    });
  }
  return base;
}


