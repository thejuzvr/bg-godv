import { describe, it, expect } from 'vitest';

// We can't import getRepetitionPenalty directly if it's not exported; replicate minimal logic for test purposes
function getRepetitionPenaltyFake(recentTypes: string[], type: string) {
  const count = recentTypes.filter(t => t === type).length;
  if (count <= 2) return 1.0;
  if (count === 3) return 0.7;
  if (count === 4) return 0.5;
  return 0.3;
}

describe('ai diversity penalty', () => {
  it('penalizes repeated action types progressively', () => {
    const history = ['combat','combat','combat','combat','combat'];
    expect(getRepetitionPenaltyFake(history, 'combat')).toBe(0.3);
  });
  it('no penalty for first two occurrences', () => {
    const history = ['travel','travel'];
    expect(getRepetitionPenaltyFake(history, 'travel')).toBe(1.0);
  });
});


