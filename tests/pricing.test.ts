import { describe, it, expect } from 'vitest';
import { computeBaseValue, computeBuyPrice, computeSellPrice } from '@/services/pricing';

const dummyChar: any = {
  relationships: {},
  skills: { persuasion: 50 }
};
const dummyNpc: any = { id: 'merchant', inventory: [{ itemId: 'weapon_sword_iron', priceModifier: 1 }] };

describe('pricing', () => {
  it('base value scales with weapon damage and rarity', () => {
    const commonSword: any = { id: 'weapon', type: 'weapon', damage: 10, rarity: 'common' };
    const rareSword: any = { id: 'weapon2', type: 'weapon', damage: 10, rarity: 'rare' };
    expect(computeBaseValue(rareSword)).toBeGreaterThan(computeBaseValue(commonSword));
  });

  it('buy price > sell price', () => {
    const item: any = { id: 'weapon_sword_iron', type: 'weapon', damage: 7, rarity: 'common' };
    const buy = computeBuyPrice(dummyChar, dummyNpc, item, 1);
    const sell = computeSellPrice(dummyChar, dummyNpc, item, 1);
    expect(buy).toBeGreaterThan(sell);
  });

  it('higher persuasion lowers buy price', () => {
    const item: any = { id: 'weapon_sword_iron', type: 'weapon', damage: 7, rarity: 'common' };
    const lowPers: any = { relationships: {}, skills: { persuasion: 0 } };
    const highPers: any = { relationships: {}, skills: { persuasion: 100 } };
    const buyLow = computeBuyPrice(lowPers, dummyNpc, item, 1);
    const buyHigh = computeBuyPrice(highPers, dummyNpc, item, 1);
    expect(buyHigh).toBeLessThanOrEqual(buyLow);
  });
});


