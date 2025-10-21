export const SHOUT_USE_CHANCE = 0.18; // probability per hero turn to use shout if available

// Loot rarity base chances per enemy kill (independent rolls per tier)
// Move balancing knobs here instead of hardcoding in logic.
export const LOOT_TIER_BASE_CHANCES: Record<'common' | 'uncommon' | 'rare' | 'legendary', number> = {
  common: 0.60,
  uncommon: 0.30,
  rare: 0.08,
  legendary: 0.02,
};

// Future: knobs for event probabilities, loot scaling, etc.

