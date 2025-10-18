export type QuestStep = {
  type: 'travel' | 'combat' | 'interact' | 'gather';
  description: string;
  target?: string;
  duration?: number;
};

export type MultiStepQuest = {
  id: string;
  steps: QuestStep[];
  currentStep: number;
  rewards: { gold?: number; xp?: number; items?: string[] };
};

export function generateMultiStepQuest(characterLevel: number, location: string): MultiStepQuest {
  const id = `msq_${location}_${Date.now()}`;
  // Simple destination mapping by city; fallback to bleak_falls_barrow
  const cityToDungeon: Record<string, string> = {
    whiterun: 'bleak_falls_barrow',
    solitude: 'bleak_falls_barrow',
    windhelm: 'bleak_falls_barrow',
    markarth: 'bleak_falls_barrow',
    riften: 'bleak_falls_barrow',
  };
  const travelTarget = cityToDungeon[location] || 'bleak_falls_barrow';
  const steps: QuestStep[] = [
    { type: 'travel', description: 'Отправиться к старым руинам за городом', target: travelTarget, duration: 120_000 },
    { type: 'gather', description: 'Собрать древние обломки внутри руин', duration: 90_000 },
    { type: 'combat', description: 'Победить сторожа руин', target: 'draugr_wight' },
    { type: 'interact', description: 'Осмотреть алтарь и забрать находку', duration: 45_000 },
    // Small extension: return to the city and report back
    { type: 'travel', description: 'Вернуться в город и найти заказчика', target: location, duration: 120_000 },
    { type: 'interact', description: 'Передать находку и получить награду', duration: 30_000 },
  ];
  return { id, steps, currentStep: 0, rewards: { gold: 150 + characterLevel * 20, xp: 120 } };
}


