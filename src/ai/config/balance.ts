export const SHOUT_USE_CHANCE = 0.18; // probability per hero turn to use shout if available

// Future: knobs for event probabilities, loot scaling, etc.

// Loot probabilities per rarity tier (base chances, 0..1)
export const LOOT_TIER_BASE_CHANCES = {
  common: 0.6,
  uncommon: 0.3,
  rare: 0.08,
  legendary: 0.02,
} as const;

// Bonus to loot odds when the hero has 'lucky' effect (multiplier applied to tier chance)
export const LUCKY_LOOT_CHANCE_BONUS = 0.15; // +15%

// Global loot quantity level scaling per level delta (e.g., +10% per level over 1)
export const LOOT_LEVEL_QUANTITY_MULTIPLIER = 0.10;

