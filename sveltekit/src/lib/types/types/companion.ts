/**
 * Companion System Types
 * Companions are AI-controlled allies that travel with the hero
 */

export type CompanionClass = 'warrior' | 'mage' | 'rogue' | 'healer' | 'ranger';
export type CompanionRarity = 'common' | 'uncommon' | 'rare' | 'legendary';

export interface CompanionStats {
  health: { current: number; max: number };
  damage: number; // Base damage contribution in combat
  defense: number; // Armor/defense bonus to hero
}

export interface CompanionSkills {
  combat: number; // Combat effectiveness (0-100)
  survival: number; // Reduces travel fatigue, helps with resources
  magic: number; // Magical support abilities
  social: number; // Helps with NPC interactions and trading
}

export interface CompanionAbility {
  id: string;
  name: string;
  description: string;
  type: 'combat' | 'support' | 'passive';
  cooldown?: number; // in milliseconds
  effect: {
    damageBonus?: number;
    defenseBonus?: number;
    healAmount?: number;
    buffDuration?: number;
  };
}

export interface CompanionPersonality {
  brave: number; // -100 to 100 (affects combat behavior)
  friendly: number; // -100 to 100 (affects social interactions)
  greedy: number; // -100 to 100 (affects loot sharing)
  loyal: number; // 0 to 100 (affects chance of leaving)
}

export interface Companion {
  id: string;
  name: string;
  class: CompanionClass;
  rarity: CompanionRarity;
  level: number;
  stats: CompanionStats;
  skills: CompanionSkills;
  personality: CompanionPersonality;
  abilities: CompanionAbility[];
  
  // Relationship with hero
  loyalty: number; // 0-100, affects performance and desertion chance
  mood: number; // 0-100, temporary state
  
  // Resource consumption
  upkeepCost: number; // Gold per day (in-game time)
  foodConsumption: number; // Food items per day
  lastFed?: number; // Timestamp of last feeding
  lastPaid?: number; // Timestamp of last payment
  
  // Acquisition
  acquiredAt: number; // Timestamp when companion joined
  acquiredLocation: string; // Where they were recruited
  
  // Status
  isActive: boolean; // Currently traveling with hero
  isInjured: boolean; // Temporarily unavailable
  injuredUntil?: number; // When they recover
  
  // Visual/flavor
  portrait?: string; // Avatar image path
  bio: string; // Backstory/description
  dialogues: {
    onRecruit: string;
    onCombatWin: string[];
    onCombatLoss: string[];
    onLowMood: string[];
    onHighMood: string[];
    onLeaving: string;
  };
}

/**
 * Companion template for spawning new companions
 */
export interface CompanionTemplate {
  id: string;
  namePool: string[]; // Random names to pick from
  class: CompanionClass;
  rarity: CompanionRarity;
  baseStats: CompanionStats;
  baseSkills: CompanionSkills;
  availableAbilities: CompanionAbility[];
  personalityRange: {
    brave: [number, number];
    friendly: [number, number];
    greedy: [number, number];
  };
  upkeepCost: number;
  foodConsumption: number;
  bio: string;
  dialogueTemplates: {
    onRecruit: string[];
    onCombatWin: string[];
    onCombatLoss: string[];
    onLowMood: string[];
    onHighMood: string[];
    onLeaving: string[];
  };
  // Where this companion can be recruited
  availableAt: string[]; // Location IDs
  recruitCost: number; // Gold cost to recruit
}

