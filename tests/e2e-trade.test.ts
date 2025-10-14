import { describe, it, expect, vi } from 'vitest';

// Minimal in-memory stubs for storage and game-data-service used by server actions
const gdsId = new URL('../../server/game-data-service.ts', import.meta.url).pathname;
vi.mock(gdsId, () => {
  return {
    gameDataService: {
      getNpcById: async (id: string) => ({ id, name: 'Merchant', description: '', location: 'whiterun', dialogue: [], inventory: [{ itemId: 'weapon_sword_iron', stock: 10, priceModifier: 1 }] }),
      getItemById: async (id: string) => ({ id, name: 'Железный меч', weight: 9, quantity: 1, type: 'weapon', rarity: 'common', damage: 7 }),
      decrementNpcStock: async () => {}
    }
  };
});

const storageId = new URL('../../server/storage.ts', import.meta.url).pathname;
vi.mock(storageId, () => {
  let char: any = {
    id: 'u1',
    name: 'Hero',
    inventory: [ { id: 'gold', name: 'Золото', type: 'gold', quantity: 1000, weight: 0 } ],
    relationships: {},
  };
  return {
    getCharacterById: async (id: string) => ({ ...char }),
    saveCharacter: async (next: any) => { char = { ...next }; },
  };
});

describe('e2e tradeWithNPC smoke', () => {
  it('buys an item and deducts gold', async () => {
    const { tradeWithNPC } = await import('@/actions/npc-actions');
    const result = await tradeWithNPC('u1', 'npc1', 'buy', 'weapon_sword_iron', 1);
    expect(result.success).toBe(true);
  });
});


