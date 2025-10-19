import { describe, it, expect } from 'vitest';
import { performCraft } from '@/services/craftingService';

describe('crafting perform', () => {
  it('fails when recipe missing', async () => {
    const res = await performCraft({ id: 'u', inventory: [], xp: { current: 0, required: 100 }, skills: {} } as any, 'nope');
    expect('error' in res).toBe(true);
  });
});


