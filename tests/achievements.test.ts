import { describe, it, expect } from 'vitest';
import { evaluateAchievements } from '@/services/achievementsService';

const baseChar: any = {
  id: 'u1',
  level: 1,
  deaths: 0,
  visitedLocations: [],
  inventory: [{ id: 'gold', name: 'Золото', type: 'gold', quantity: 0, weight: 0 }],
  analytics: { killedEnemies: {}, diceRolls: { d20: Array(21).fill(0) }, encounteredEnemies: [], epicPhrases: [] },
  unlockedAchievements: [],
};

const gameData: any = {
  locations: [
    { id: 'solitude', type: 'city' },
    { id: 'windhelm', type: 'city' },
    { id: 'whiterun', type: 'city' },
    { id: 'markarth', type: 'city' },
    { id: 'riften', type: 'city' },
  ]
};

describe('achievements', () => {
  it('unlocks level_10 at level >= 10', () => {
    const c = { ...baseChar, level: 10 };
    const unlocks = evaluateAchievements(c, gameData);
    expect(unlocks.find(u => u.id === 'level_10')).toBeTruthy();
  });

  it('unlocks rich_man when gold >= 10k', () => {
    const c = { ...baseChar, inventory: [{ id: 'gold', name: 'Золото', type: 'gold', quantity: 10000, weight: 0 }] };
    const unlocks = evaluateAchievements(c, gameData);
    expect(unlocks.find(u => u.id === 'rich_man')).toBeTruthy();
  });

  it('unlocks explorer when all major cities visited', () => {
    const c = { ...baseChar, visitedLocations: ['solitude','windhelm','whiterun','markarth','riften'] };
    const unlocks = evaluateAchievements(c, gameData);
    expect(unlocks.find(u => u.id === 'explorer')).toBeTruthy();
  });
});


