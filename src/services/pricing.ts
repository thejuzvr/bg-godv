// pure pricing utilities; usable on client and server

import type { Character, CharacterInventoryItem } from "@/types/character";
import type { NPC } from "@/types/npc";

function rarityMultiplier(rarity?: string): number {
  switch (rarity) {
    case 'uncommon': return 1.5;
    case 'rare': return 3.0;
    case 'legendary': return 8.0;
    default: return 1.0;
  }
}

export function computeBaseValue(item: Omit<CharacterInventoryItem,'quantity'>): number {
  const rMult = rarityMultiplier(item.rarity as any);
  let base = 5;
  switch (item.type) {
    case 'weapon':
      base = Math.max(5, (item.damage || 1) * 10);
      break;
    case 'armor':
      base = Math.max(5, (item.armor || 1) * 8);
      break;
    case 'potion':
      if (item.effect?.type === 'heal') {
        base = Math.max(5, (item.effect.amount || 0) * 1.5);
      } else if (item.effect?.type === 'buff') {
        const minutes = (item.effect.duration || 60_000) / 60_000;
        const strength = item.effect.amount || 1;
        base = Math.max(8, minutes * Math.min(50, strength * 10));
      }
      break;
    case 'food':
      if (item.effect?.type === 'heal') {
        base = Math.max(2, (item.effect.amount || 1) * 0.8);
      } else {
        const minutes = (item.effect?.duration || 60_000) / 60_000;
        base = Math.max(3, minutes * 2);
      }
      break;
    case 'spell_tome':
      base = 100; // baseline; could adjust by spell rarity if needed
      break;
    case 'misc':
    case 'key_item':
    default:
      base = 20;
  }
  return Math.floor(base * rMult);
}

function relationshipDiscount(character: Character, npc: NPC): number {
  const level = character.relationships?.[npc.id]?.level || 0; // -100..100
  const persuasion = character.skills?.persuasion || 0; // 0..100+
  const relFactor = Math.max(0, level) / 400; // up to 0.25
  const persFactor = Math.min(0.20, persuasion / 500); // up to 0.2
  return Math.min(0.35, relFactor + persFactor);
}

export function computeBuyPrice(character: Character, npc: NPC, item: Omit<CharacterInventoryItem,'quantity'>, quantity: number): number {
  const baseValue = computeBaseValue(item);
  const npcMod = (npc.inventory?.find(i => i.itemId === item.id)?.priceModifier) ?? 1;
  const discount = relationshipDiscount(character, npc);
  const jitter = 0.95 + Math.random() * 0.1; // ±5%
  const unit = Math.max(1, Math.floor(baseValue * npcMod * (1 - discount) * jitter));
  return unit * Math.max(1, quantity);
}

export function computeSellPrice(character: Character, npc: NPC, item: Omit<CharacterInventoryItem,'quantity'>, quantity: number): number {
  const buyUnit = Math.max(1, Math.floor(computeBuyPrice(character, npc, item, 1)));
  const unit = Math.max(1, Math.floor(buyUnit * 0.4));
  return unit * Math.max(1, quantity);
}


