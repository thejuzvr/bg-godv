import { describe, it, expect, vi, beforeEach } from 'vitest';

// Shared mutable character stub
let character: any;

const storageId = new URL('../../server/storage.ts', import.meta.url).pathname;
vi.mock(storageId, () => {
  return {
    getCharacterById: async (id: string) => character,
    saveCharacter: async (next: any) => { character = { ...next }; },
  };
});

vi.mock('../../server/game-data-service', () => {
  return {
    gameDataService: {
      getNpcById: async (id: string) => ({ id, name: 'Merchant', description: '', location: 'whiterun', dialogue: [], inventory: [{ itemId: 'weapon_sword_iron', stock: 10, priceModifier: 1 }] }),
      getItemById: async (id: string) => ({ id, name: 'Железный меч', weight: 9, quantity: 1, type: 'weapon', rarity: 'common', damage: 7 }),
      decrementNpcStock: async () => {}
    }
  };
});

describe('npc-actions pricing integration', () => {
  beforeEach(() => {
    character = {
      id: 'u1',
      name: 'Hero',
      inventory: [ { id: 'gold', name: 'Золото', type: 'gold', quantity: 1000, weight: 0 } ],
      relationships: {},
    };
  });

  it('buy flow deducts computed gold and adds item', async () => {
    const goldBefore = character.inventory.find((i: any) => i.id === 'gold').quantity;
    const { tradeWithNPC } = await import('@/actions/npc-actions');
    const res = await tradeWithNPC('u1', 'npc1', 'buy', 'weapon_sword_iron', 1);
    expect(res.success).toBe(true);
    const goldAfter = character.inventory.find((i: any) => i.id === 'gold').quantity;
    expect(goldAfter).toBeLessThan(goldBefore);
    const sword = character.inventory.find((i: any) => i.id === 'weapon_sword_iron');
    expect(sword?.quantity).toBeGreaterThan(0);
  });

  it('sell flow increases gold and removes item', async () => {
    // Ensure we have one sword to sell
    const { tradeWithNPC } = await import('@/actions/npc-actions');
    const ensureBuy = await tradeWithNPC('u1', 'npc1', 'buy', 'weapon_sword_iron', 1);
    expect(ensureBuy.success).toBe(true);
    const goldBefore = character.inventory.find((i: any) => i.id === 'gold').quantity;
    const res = await tradeWithNPC('u1', 'npc1', 'sell', 'weapon_sword_iron', 1);
    expect(res.success).toBe(true);
    const goldAfter = character.inventory.find((i: any) => i.id === 'gold').quantity;
    expect(goldAfter).toBeGreaterThan(goldBefore);
  });
});


