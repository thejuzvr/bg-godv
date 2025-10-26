// Event types for real-time system
// All events follow the pattern: category:action:detail

export type EventType = 
  // Character events
  | 'character:stats:updated'
  | 'character:location:changed'
  | 'character:status:changed'
  | 'character:inventory:updated'
  | 'character:level:up'
  | 'character:power:updated'
  | 'character:effects:updated'
  // Market events
  | 'market:price:updated'
  | 'market:trade:completed'
  | 'market:supply:changed'
  // Divine events
  | 'divine:intervention:performed'
  | 'divine:message:sent'
  | 'divine:grace:received'
  // Companion events
  | 'companion:hired'
  | 'companion:activated'
  | 'companion:dismissed'
  | 'companion:stats:updated'
  // Quest events
  | 'quest:accepted'
  | 'quest:progress:updated'
  | 'quest:completed'
  | 'quest:task:completed';

// Base event structure
export interface GameEvent<T = any> {
  type: EventType;
  realmId: string;
  characterId?: string;
  timestamp: number;
  data: T;
}

// Character event payloads
export interface CharacterStatsUpdated {
  characterId: string;
  stats: {
    health?: { current: number; max: number };
    magicka?: { current: number; max: number };
    stamina?: { current: number; max: number };
    fatigue?: { current: number; max: number };
  };
}

export interface CharacterLocationChanged {
  characterId: string;
  oldLocation: string;
  newLocation: string;
  locationName: string;
}

export interface CharacterStatusChanged {
  characterId: string;
  oldStatus: string;
  newStatus: string;
}

export interface CharacterInventoryUpdated {
  characterId: string;
  changes: Array<{
    itemId: string;
    itemName: string;
    quantityDelta: number;
    newQuantity: number;
  }>;
}

export interface CharacterLevelUp {
  characterId: string;
  characterName: string;
  oldLevel: number;
  newLevel: number;
  attributePoints: number;
  skillPoints: number;
}

export interface CharacterPowerUpdated {
  characterId: string;
  interventionPower: {
    current: number;
    max: number;
  };
}

export interface CharacterEffectsUpdated {
  characterId: string;
  effects: Array<{
    id: string;
    name: string;
    type: string;
  }>;
}

// Market event payloads
export interface MarketPriceUpdated {
  itemId: string;
  itemName: string;
  oldPrice: number;
  newPrice: number;
  supply: number;
  demand: number;
}

export interface MarketTradeCompleted {
  characterId: string;
  characterName: string;
  npcId: string;
  npcName: string;
  itemId: string;
  itemName: string;
  quantity: number;
  price: number;
  side: 'buy' | 'sell';
}

export interface MarketSupplyChanged {
  itemId: string;
  supply: number;
  demand: number;
}

// Divine event payloads
export interface DivineInterventionPerformed {
  characterId: string;
  characterName: string;
  type: 'bless' | 'punish' | 'message';
  powerCost: number;
  effect?: string;
}

export interface DivineMessageSent {
  characterId: string;
  message: string;
  powerCost: number;
}

export interface DivineGraceReceived {
  characterId: string;
  characterName: string;
  deityName: string;
  graceName: string;
  graceEffect: string;
}

// Companion event payloads
export interface CompanionHired {
  characterId: string;
  companionId: string;
  companionName: string;
  companionClass: string;
  cost: number;
}

export interface CompanionActivated {
  characterId: string;
  companionId: string;
  companionName: string;
}

export interface CompanionDismissed {
  characterId: string;
  companionId: string;
  companionName: string;
}

export interface CompanionStatsUpdated {
  characterId: string;
  companionId: string;
  stats: {
    health?: { current: number; max: number };
    damage?: number;
    armor?: number;
  };
}

// Quest event payloads
export interface QuestAccepted {
  characterId: string;
  questId: string;
  questTitle: string;
  questType: string;
}

export interface QuestProgressUpdated {
  characterId: string;
  questId: string;
  questTitle: string;
  progress: number;
  completedTasks: number;
  totalTasks: number;
}

export interface QuestCompleted {
  characterId: string;
  questId: string;
  questTitle: string;
  rewards: {
    gold?: number;
    xp?: number;
    items?: Array<{ id: string; quantity: number }>;
  };
}

export interface QuestTaskCompleted {
  characterId: string;
  questId: string;
  taskId: string;
  taskTitle: string;
}

// Helper type to map event types to their payloads
export type EventPayloadMap = {
  'character:stats:updated': CharacterStatsUpdated;
  'character:location:changed': CharacterLocationChanged;
  'character:status:changed': CharacterStatusChanged;
  'character:inventory:updated': CharacterInventoryUpdated;
  'character:level:up': CharacterLevelUp;
  'character:power:updated': CharacterPowerUpdated;
  'character:effects:updated': CharacterEffectsUpdated;
  'market:price:updated': MarketPriceUpdated;
  'market:trade:completed': MarketTradeCompleted;
  'market:supply:changed': MarketSupplyChanged;
  'divine:intervention:performed': DivineInterventionPerformed;
  'divine:message:sent': DivineMessageSent;
  'divine:grace:received': DivineGraceReceived;
  'companion:hired': CompanionHired;
  'companion:activated': CompanionActivated;
  'companion:dismissed': CompanionDismissed;
  'companion:stats:updated': CompanionStatsUpdated;
  'quest:accepted': QuestAccepted;
  'quest:progress:updated': QuestProgressUpdated;
  'quest:completed': QuestCompleted;
  'quest:task:completed': QuestTaskCompleted;
};

