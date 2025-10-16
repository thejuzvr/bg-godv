import { describe, it, expect } from 'vitest';
import { PRIORITY_RULES } from '@/ai/config/priorities';
import { composeModifierMultiplier } from '@/ai/modifiers';

describe('expanded rules', () => {
  it('overencumbered rule matches', () => {
    const rule = PRIORITY_RULES.overencumbered;
    expect(rule.if({ health: 1, stamina: 1, isInCombat: false, isLocationSafe: true, hasHealingPotion: false, isOverencumbered: true })).toBe(true);
  });
  it('takeQuest rule matches in city', () => {
    const rule = PRIORITY_RULES.takeQuest;
    expect(rule.if({ health: 1, stamina: 1, isInCombat: false, isLocationSafe: true, hasHealingPotion: false, canTakeQuest: true })).toBe(true);
  });
});

describe('learning multiplier bounds (indirect)', () => {
  it('modifier composer works', () => {
    expect(composeModifierMultiplier([{ code: 'luck', multiplier: 0.2 }] as any)).toBeCloseTo(1.2, 5);
  });
});


