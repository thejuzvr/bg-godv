import { describe, it, expect } from 'vitest';
import { computeRepetitionModifier } from '@/ai/brain';

describe('Anti-loop repetition modifier', () => {
  it('returns 1.0 for <=3 recent actions', () => {
    expect(computeRepetitionModifier(0)).toBe(1.0);
    expect(computeRepetitionModifier(3)).toBe(1.0);
  });
  it('returns 0.5 for exactly 4 recent actions', () => {
    expect(computeRepetitionModifier(4)).toBe(0.5);
  });
  it('returns 0.2 for >=5 recent actions', () => {
    expect(computeRepetitionModifier(5)).toBe(0.2);
    expect(computeRepetitionModifier(8)).toBe(0.2);
  });
});


