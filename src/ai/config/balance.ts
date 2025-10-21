export const SHOUT_USE_CHANCE = 0.18; // probability per hero turn to use shout if available

// Loot drop chances by rarity tier
export const LOOT_TIER_BASE_CHANCES = {
  common: 0.70,      // 70% chance for common loot
  uncommon: 0.35,    // 35% chance for uncommon loot
  rare: 0.12,        // 12% chance for rare loot
  legendary: 0.03,   // 3% chance for legendary loot
};

// Spell damage multipliers by element vs enemy type
export function getSpellDamageMultiplier(spell: { element?: string }, enemyId: string): number {
  if (!spell.element) return 1.0;
  
  // Fire is strong against undead and ice enemies
  if (spell.element === 'fire') {
    if (enemyId.includes('draugr') || enemyId.includes('skeleton')) return 1.3;
    if (enemyId.includes('frost') || enemyId.includes('ice')) return 1.4;
    if (enemyId.includes('flame') || enemyId.includes('fire')) return 0.7;
  }
  
  // Frost is strong against living creatures
  if (spell.element === 'frost') {
    if (enemyId.includes('wolf') || enemyId.includes('bear') || enemyId.includes('bandit')) return 1.3;
    if (enemyId.includes('frost') || enemyId.includes('ice')) return 0.7;
  }
  
  // Shock is neutral but slightly stronger vs magical enemies
  if (spell.element === 'shock') {
    if (enemyId.includes('mage') || enemyId.includes('atronach')) return 1.2;
  }
  
  return 1.0;
}

// Future: knobs for event probabilities, loot scaling, etc.
