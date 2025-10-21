export const SHOUT_USE_CHANCE = 0.18; // probability per hero turn to use shout if available

// Base chances per loot tier used by AI loot rolls
export const LOOT_TIER_BASE_CHANCES = {
  common: 0.75,
  uncommon: 0.45,
  rare: 0.18,
  legendary: 0.05,
} as const;

// Spell element balance knobs and simple matchup multipliers
import type { Spell } from '@/types/spell';

const UNDEAD_IDS = new Set([
  'draugr',
  'draugr_overlord',
  'draugr_wight',
  'vampire_thrall',
  'vampire_master',
]);

const FROST_ASPECT_IDS = new Set([
  'ice_wraith',
]);

/**
 * Returns a damage multiplier for a spell against a specific enemy id.
 * Lightweight balance pass; keep conservative to avoid power creep.
 */
export function getSpellDamageMultiplier(spell: Spell, enemyId: string): number {
  const element = (spell as any).element as string | undefined;
  if (!element) return 1.0;

  // Holy vs undead
  if (element === 'holy' && UNDEAD_IDS.has(enemyId)) return 1.5;
  // Fire vs frost-aspect creatures
  if (element === 'fire' && FROST_ASPECT_IDS.has(enemyId)) return 1.4;
  // Shock gets a light universal nudge (rarely resisted) — keep tiny
  if (element === 'shock') return 1.05;
  return 1.0;
}

// Future: more knobs for event probabilities, loot scaling, etc.

