import { describe, it, expect } from 'vitest';
import { mapD20 } from '@/lib/dice';

describe('dice utilities', () => {
  it('maps d20 roll to ranges', () => {
    expect(mapD20(1, { low: 1, mid: 2, high: 3 })).toBe(1);
    expect(mapD20(10, { low: 1, mid: 2, high: 3 })).toBe(2);
    expect(mapD20(20, { low: 1, mid: 2, high: 3 })).toBe(3);
  });
});


