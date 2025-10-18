import { describe, it, expect } from 'vitest';
import { generateCityActivities } from '@/ai/generators/activity-generator';
import { generateDungeonActivities } from '@/ai/generators/dungeon-generator';

describe('Activity Generators', () => {
  it('generates non-empty city activities with expected fields', () => {
    const acts = generateCityActivities('whiterun', 5);
    expect(Array.isArray(acts)).toBe(true);
    expect(acts.length).toBeGreaterThan(0);
    for (const a of acts) {
      expect(a.id).toBeTypeOf('string');
      expect(a.name).toBeTypeOf('string');
      expect(a.description).toBeTypeOf('string');
      expect(typeof a.duration).toBe('number');
      expect(typeof a.difficulty).toBe('number');
      expect(a.location).toBe('whiterun');
    }
  });

  it('generates non-empty dungeon activities with expected fields', () => {
    const acts = generateDungeonActivities('bleak_falls_barrow', 7);
    expect(Array.isArray(acts)).toBe(true);
    expect(acts.length).toBeGreaterThan(0);
    for (const a of acts) {
      expect(a.id).toBeTypeOf('string');
      expect(a.name).toBeTypeOf('string');
      expect(a.description).toBeTypeOf('string');
      expect(typeof a.duration).toBe('number');
    }
  });
});


