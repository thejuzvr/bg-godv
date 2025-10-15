

import type { ActiveSovngardeQuest } from "./sovngarde";
import type { Rarity } from "./item";
import type { DivinityId } from "./divinity";

export type CharacterStatus = 'idle' | 'in-combat' | 'dead' | 'sleeping' | 'busy' | 'exploring';

export type EquipmentSlot = 'head' | 'torso' | 'legs' | 'hands' | 'feet' | 'ring' | 'amulet' | 'weapon';

export type Season = 'Summer' | 'Autumn' | 'Winter' | 'Spring';
export type Weather = 'Clear' | 'Cloudy' | 'Rain' | 'Snow' | 'Fog';
export type TimeOfDay = 'night' | 'morning' | 'day' | 'evening';

export interface WeatherEffect {
  attackModifier: number; // Modifier to attack rolls
  stealthModifier: number; // Modifier to stealth actions
  findChanceModifier: number; // Modifier to item finding chance (as multiplier)
  fatigueModifier: number; // Modifier to fatigue gain (as multiplier)
  moodModifier: number; // Modifier to mood changes
  regenModifier: { // Modifier to regeneration rates
    health: number;
    magicka: number;
    stamina: number;
    fatigue: number;
  };
}

export interface TimeOfDayEffect {
  findChanceModifier: number; // Modifier to item finding chance (as multiplier)
  enemyStrengthModifier: number; // Modifier to enemy strength (as multiplier)
  stealthModifier: number; // Modifier to stealth actions
  fleeChanceModifier: number; // Modifier to flee chance
  regenModifier: { // Modifier to regeneration rates
    health: number;
    magicka: number;
    stamina: number;
    fatigue: number;
  };
  npcAvailability: boolean; // Whether NPCs are available for trading
}

export interface Analytics {
    killedEnemies: Record<string, number>; // { [enemyId]: count }
    diceRolls: {
        d20: number[]; // Array of size 21, index corresponds to roll result (1-20)
    };
    encounteredEnemies: string[]; // List of unique enemy IDs
    epicPhrases: string[];
}


export interface CharacterAttributes {
  strength: number; // Влияет на урон в ближнем бою, переносимый вес
  agility: number; // Влияет на шанс уворота, критический удар
  intelligence: number; // Влияет на урон от заклинаний, макс. ману
  endurance: number; // Влияет на макс. здоровье, сопротивления
}

export interface CharacterSkills {
  oneHanded: number; // Урон одноручным оружием
  block: number; // Эффективность блока
  heavyArmor: number; // Эффективность тяжелой брони
  lightArmor: number; // Эффективность легкой брони, уворот
  persuasion: number; // Шанс на лучшие цены, доп. диалоги
  alchemy: number; // Эффективность зелий
}

export interface CharacterPoints {
  attribute: number;
  skill: number;
}


export interface CombatState {
    enemyId: string;
    enemy: {
        name: string;
        health: { current: number; max: number };
        damage: number;
        xp: number;
        armor: number; // Enemy armor class for defense rolls
        appliesEffect?: {
            id: string;
            name: string;
            description: string;
            icon: string;
            type: "debuff";
            chance: number;
            duration: number;
            value?: number;
        } | null;
    };
    onWinQuestId?: string | null;
    fleeAttempted?: boolean;
    lastRoll?: {
      actor: 'hero' | 'enemy';
      action: string;
      roll: number;
      bonus: number;
      total: number;
      target: number;
      success: boolean;
    } | null;
    
    // Combat analytics tracking
    characterHealthStart?: number;
    enemyHealthStart?: number;
    rounds?: number;
    totalDamageDealt?: number;
    totalDamageTaken?: number;
    combatLog?: string[];
}

export interface CharacterStats {
  health: { current: number; max: number };
  magicka: { current: number; max: number };
  stamina: { current: number; max: number };
  fatigue: { current: number; max: number };
}

export type ItemType = 'weapon' | 'armor' | 'potion' | 'misc' | 'gold' | 'spell_tome' | 'key_item' | 'learning_book' | 'food';

export interface CharacterInventoryItem {
    id: string; // The ID of the base item from the 'items' collection
    name: string;
    weight: number;
    quantity: number;
    type: ItemType;
    rarity?: Rarity;
    equipmentSlot?: EquipmentSlot;
    damage?: number;
    armor?: number;
    effect?: {
        id?: string; // Unique ID for the effect, used to check if it's already active
        type: 'heal' | 'buff';
        stat: string;
        amount: number;
        duration?: number; // in ms
        description?: string;
        icon?: string;
    };
    spellId?: string;
    learningEffect?: {
        id: string;
        name: string;
        description: string;
        duration: number;
        icon: string;
    };
}

export interface ActiveEffect {
    id: string;
    name: string;
    description: string;
    icon: string;
    type: 'buff' | 'debuff' | 'permanent';
    expiresAt: number; // For permanent, this can be a huge number
    value?: number;
    // Optional effect-specific state (real-time timestamps used)
    data?: {
        hungerLevel?: number; // 0..N stages
        lastFedAt?: number; // Date.now() when last feeding/hunt happened
        penaltyBoostUntil?: number; // real-time until which penalties are doubled (crit fail)
    };
}

export type ActionType = 'quest' | 'travel' | 'sovngarde_quest' | 'explore' | 'trading' | 'jail' | 'rest' | 'travel_rest';

export interface ActiveAction {
    type: ActionType;
    name:string;
    description: string;
    startedAt: number;
    duration: number;
    originalDuration?: number;
    // Optional context for different action types
    destinationId?: string;
    questId?: string;
    sovngardeQuestId?: string;
}

export interface FactionStatus {
  reputation: number;
}

export interface ActiveCryptQuest {
    cryptId: string;
    clawId: string;
    stage: number;
    stageName: string;
    stageDescription: string;
    startedAt: number;
    duration: number;
}

export type ActionHistoryEntry = {
    type: 'combat' | 'quest' | 'explore' | 'travel' | 'rest' | 'learn' | 'social' | 'misc' | 'system';
    timestamp: number;
};


export interface Character {
  id: string; // Will be the user's auth ID
  name: string;
  gender: string;
  race: string;
  backstory: string;
  patronDeity: DivinityId;
  level: number;
  xp: { current: number, required: number };
  stats: CharacterStats;
  attributes: CharacterAttributes;
  skills: CharacterSkills;
  points: CharacterPoints;
  location: string; // e.g., 'whiterun'
  inventory: CharacterInventoryItem[];
  equippedItems: Partial<Record<EquipmentSlot, string>>; // map from slot to item ID
  factions: Partial<Record<string, FactionStatus>>;
  status: CharacterStatus;
  combat: CombatState | null;
  sleepUntil: number | null;
  respawnAt: number | null;
  deathOccurredAt: number | null;
  activeSovngardeQuest: ActiveSovngardeQuest | null;
  activeCryptQuest: ActiveCryptQuest | null;
  createdAt: number;
  lastUpdatedAt: number; // Timestamp of the last time the character state was saved
  deaths: number;
  effects: ActiveEffect[];
  knownSpells?: string[];
  currentAction: ActiveAction | null;
  interventionPower: { current: number; max: number };
  divineSuggestion: string | null; // Name of the suggested action
  divineDestinationId: string | null;
  pendingTravel: { destinationId: string; remainingDuration: number; originalDuration: number; } | null;
  completedQuests: string[];
  season: Season;
  weather: Weather;
  timeOfDay: TimeOfDay;
  actionCooldowns: Partial<Record<string, number>>;
  visitedLocations: string[];
  gameDate: number; // In-game time as a timestamp
  mood: number; // 0-100, 50 is neutral
  unlockedPerks?: string[];
  preferences?: {
    autoAssignPoints?: boolean;
    autoEquip?: boolean;
  };
  analytics: Analytics;
  divineFavor: number; // 0-100, progress to next major blessing
  templeProgress: number; // gold contributed
  templeCompletedFor?: DivinityId | null; // Tracks if a temple has been completed
  relationships: Record<string, { level: number; lastInteraction: number }>; // NPC relationships: level from -100 to +100
  actionHistory: ActionHistoryEntry[]; // History of recent actions for AI decision making
  unlockedAchievements?: string[]; // IDs from data/achievements, persisted
  lastThoughtTime?: number; // Timestamp of last thought generation to prevent spam
  hasSeenWelcomeMessage?: boolean; // Whether character has seen their welcome message
  lastLocationArrival?: number; // Timestamp when character arrived at current location
  hasCompletedLocationActivity?: boolean; // Whether character has completed quest/rest at current location
}

export type WorldState = {
  isIdle: boolean;
  isInCombat: boolean;
  isDead: boolean;
  isLocationSafe: boolean;
  isTired: boolean;
  canTakeQuest: boolean;
  isInjured: boolean;
  isBadlyInjured: boolean;
  hasEnoughGoldForRest: boolean;
  hasEnoughGoldForSleep: boolean;
  hasEnoughGoldForDonation: boolean;
  hasHealingPotion: boolean;
  hasUnreadTome: boolean;
  hasUnreadLearningBook?: boolean;
  hasKeyItem: boolean;
  isWellRested: boolean;
  canExploreCity: boolean;
  isOverencumbered: boolean;
  hasPoisonDebuff: boolean;
  hasBuffPotion: boolean;
  // Disease-related flags
  hasVampirism?: boolean;
  hasLycanthropy?: boolean;
  isHungry?: boolean;
  // Time and weather state
  timeOfDay: TimeOfDay;
  isNightTime: boolean;
  weatherModifier: number;
  weatherEffect: WeatherEffect;
  timeOfDayEffect: TimeOfDayEffect;
};
