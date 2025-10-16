import { describe, it, expect } from 'vitest';
import { priorityToBaseWeight, PRIORITY_RULES } from '@/ai/config/priorities';
import { composeModifierMultiplier } from '@/ai/modifiers';

describe('priority config', () => {
  it('priorityToBaseWeight increases with priority', () => {
    expect(priorityToBaseWeight('LOW')).toBeLessThan(priorityToBaseWeight('MEDIUM'));
    expect(priorityToBaseWeight('MEDIUM')).toBeLessThan(priorityToBaseWeight('HIGH'));
    expect(priorityToBaseWeight('HIGH')).toBeLessThan(priorityToBaseWeight('URGENT'));
  });

  it('healthCritical rule matches correctly', () => {
    const rule = PRIORITY_RULES.healthCritical;
    expect(rule.if({ health: 0.2, stamina: 1, isInCombat: false, isLocationSafe: true, hasHealingPotion: true })).toBe(true);
    expect(rule.if({ health: 0.3, stamina: 1, isInCombat: false, isLocationSafe: true, hasHealingPotion: true })).toBe(false);
  });
});

describe('modifiers', () => {
  it('composeModifierMultiplier sums percentages', () => {
    const mult = composeModifierMultiplier([
      { code: 'luck', multiplier: 0.2 },
      { code: 'blessing', multiplier: 0.1 },
    ] as any);
    expect(mult).toBeCloseTo(1.3, 5);
  });
});


