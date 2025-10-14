import { describe, it, expect } from 'vitest';
import { weightedSample, applyVarietyBoost, selectActionSimple } from '@/ai/policy';
import { DEFAULT_POLICY_CONFIG } from '@/ai/policy.config';

// Minimal Action shape for tests
type TestAction = {
  name: string;
  type: 'combat' | 'quest' | 'explore' | 'travel' | 'rest' | 'learn' | 'social' | 'misc' | 'system' | 'trading';
};

describe('policy.weightedSample', () => {
  it('samples higher-weight items more often', () => {
    const items = [
      { weight: 1 },
      { weight: 9 },
    ];
    let c1 = 0, c2 = 0;
    for (let i = 0; i < 5000; i++) {
      const picked = weightedSample(items)!;
      if (picked === items[0]) c1++; else c2++;
    }
    // Second should be picked ~9x more often; allow tolerance
    expect(c2).toBeGreaterThan(c1 * 4);
  });
});

describe('policy.applyVarietyBoost', () => {
  const makeAction = (name: string, type: TestAction['type']) => ({ name, type } as any);
  const base = 1;

  it('boosts categories not used recently', () => {
    const character: any = { actionHistory: [
      { type: 'combat', timestamp: Date.now() - 1000 },
      { type: 'combat', timestamp: Date.now() - 2000 },
    ]};
    const actions = [
      { action: makeAction('fight', 'combat'), baseWeight: base },
      { action: makeAction('quest', 'quest'), baseWeight: base },
    ];
    const boosted = applyVarietyBoost(actions as any, character, 10);
    const fight = boosted.find(b => (b as any).action.type === 'combat')!;
    const quest = boosted.find(b => (b as any).action.type === 'quest')!;
    // quest should have higher weight due to fewer recent uses
    expect((quest as any).weight).toBeGreaterThan((fight as any).weight);
  });
});

describe('policy.selectActionSimple', () => {
  const makeAction = (name: string, type: TestAction['type']) => ({
    name,
    type,
    canPerform: () => true,
    perform: async () => ({ character: {}, logMessage: '' }),
  } as any);

  it('applies system baseline to allow occasional system actions', () => {
    const character: any = { actionHistory: [] };
    const gameData: any = {};
    const candidates = [
      makeAction('equip', 'system'),
      makeAction('wander', 'explore'),
    ];
    let systemPicked = 0;
    for (let i = 0; i < 1000; i++) {
      const picked = selectActionSimple(candidates as any, { character, gameData }, DEFAULT_POLICY_CONFIG);
      if (picked.type === 'system') systemPicked++;
    }
    expect(systemPicked).toBeGreaterThan(0); // Should happen sometimes
  });

  it('respects category base weights (trading close to social)', () => {
    const character: any = { actionHistory: [] };
    const gameData: any = {};
    const candidates = [
      makeAction('talk', 'social'),
      makeAction('sell', 'trading'),
    ];
    let social = 0, trading = 0;
    for (let i = 0; i < 3000; i++) {
      const picked = selectActionSimple(candidates as any, { character, gameData }, DEFAULT_POLICY_CONFIG);
      if (picked.type === 'social') social++; else trading++;
    }
    // Both categories should be frequently selected; difference should not be extreme
    const ratio = social / Math.max(1, trading);
    expect(ratio).toBeGreaterThan(0.5);
    expect(ratio).toBeLessThan(2.0);
  });
});


