import { pgTable, text, integer, bigint, jsonb, timestamp, boolean, varchar, real } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: text('id').primaryKey(), // Auto-generated UUID
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  isAdmin: boolean('is_admin').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  lastLogin: timestamp('last_login'),
});

export const sessions = pgTable('sessions', {
  token: text('token').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  expiresAt: bigint('expires_at', { mode: 'number' }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const characters = pgTable('characters', {
  id: text('id').primaryKey(), // Will be the user's auth ID
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  
  // Basic info
  name: text('name').notNull(),
  gender: text('gender').notNull(),
  race: text('race').notNull(),
  backstory: text('backstory').notNull(),
  patronDeity: text('patron_deity').notNull(),
  
  // Level and XP
  level: integer('level').notNull().default(1),
  xp: jsonb('xp').notNull().$type<{ current: number; required: number }>(),
  
  // Stats (JSONB for complex nested object)
  stats: jsonb('stats').notNull().$type<{
    health: { current: number; max: number };
    magicka: { current: number; max: number };
    stamina: { current: number; max: number };
    fatigue: { current: number; max: number };
  }>(),
  
  // Attributes
  attributes: jsonb('attributes').notNull().$type<{
    strength: number;
    agility: number;
    intelligence: number;
    endurance: number;
  }>(),
  
  // Skills
  skills: jsonb('skills').notNull().$type<{
    oneHanded: number;
    block: number;
    heavyArmor: number;
    lightArmor: number;
    persuasion: number;
    alchemy: number;
  }>(),
  
  // Points
  points: jsonb('points').notNull().$type<{
    attribute: number;
    skill: number;
  }>(),
  
  // Location and status
  location: text('location').notNull(),
  status: text('status').notNull(),
  
  // Inventory and equipment (JSONB)
  inventory: jsonb('inventory').notNull().$type<any[]>(),
  equippedItems: jsonb('equipped_items').notNull().$type<Record<string, string>>(),
  
  // Factions
  factions: jsonb('factions').notNull().$type<Record<string, { reputation: number }>>(),
  
  // Combat state
  combat: jsonb('combat').$type<any | null>(),
  
  // Time-based states
  sleepUntil: bigint('sleep_until', { mode: 'number' }),
  respawnAt: bigint('respawn_at', { mode: 'number' }),
  deathOccurredAt: bigint('death_occurred_at', { mode: 'number' }),
  
  // Active quests
  activeSovngardeQuest: jsonb('active_sovngarde_quest').$type<any | null>(),
  activeCryptQuest: jsonb('active_crypt_quest').$type<any | null>(),
  currentAction: jsonb('current_action').$type<any | null>(),
  
  // Timestamps
  createdAt: bigint('created_at', { mode: 'number' }).notNull(),
  lastUpdatedAt: bigint('last_updated_at', { mode: 'number' }).notNull(),
  
  // Stats tracking
  deaths: integer('deaths').notNull().default(0),
  
  // Effects and spells
  effects: jsonb('effects').notNull().$type<any[]>(),
  knownSpells: jsonb('known_spells').$type<string[]>(),
  
  // Divine intervention
  interventionPower: jsonb('intervention_power').notNull().$type<{ current: number; max: number }>(),
  divineSuggestion: text('divine_suggestion'),
  divineDestinationId: text('divine_destination_id'),
  divineFavor: integer('divine_favor').notNull().default(0),
  templeProgress: integer('temple_progress').notNull().default(0),
  templeCompletedFor: text('temple_completed_for'),
  
  // NPC relationships - tracks relationship levels with NPCs
  relationships: jsonb('relationships').notNull().default({}).$type<Record<string, { 
    level: number; // -100 (hostile) to +100 (best friends)
    lastInteraction: number; // timestamp
  }>>(),
  
  // Travel
  pendingTravel: jsonb('pending_travel').$type<{ destinationId: string; remainingDuration: number; originalDuration: number } | null>(),
  
  // Quest progress
  completedQuests: jsonb('completed_quests').notNull().$type<string[]>(),
  
  // World state
  season: text('season').notNull(),
  weather: text('weather').notNull(),
  
  // Cooldowns and visited locations
  actionCooldowns: jsonb('action_cooldowns').notNull().$type<Record<string, number>>(),
  visitedLocations: jsonb('visited_locations').notNull().$type<string[]>(),
  
  // Game time and mood
  gameDate: bigint('game_date', { mode: 'number' }).notNull(),
  mood: real('mood').notNull().default(50),
  
  // Perks and preferences
  unlockedPerks: jsonb('unlocked_perks').$type<string[]>(),
  preferences: jsonb('preferences').$type<{
    autoAssignPoints?: boolean;
    autoEquip?: boolean;
  }>(),
  
  // Analytics
  analytics: jsonb('analytics').notNull().$type<{
    killedEnemies: Record<string, number>;
    diceRolls: { d20: number[] };
    encounteredEnemies: string[];
    epicPhrases: string[];
  }>(),
  
  // Action history - for AI decision making (keep last 40 actions - circular buffer)
  actionHistory: jsonb('action_history').notNull().default([]).$type<Array<{ type: string; timestamp: number }>>(),
  
  // For offline mode - when character was last processed
  lastProcessedAt: bigint('last_processed_at', { mode: 'number' }),
  isActive: boolean('is_active').notNull().default(true), // Whether character continues playing offline
});

export const chronicle = pgTable('chronicle', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  characterId: text('character_id').notNull().references(() => characters.id, { onDelete: 'cascade' }),
  timestamp: bigint('timestamp', { mode: 'number' }).notNull(),
  type: text('type').notNull(), // 'level_up' | 'quest_complete' | 'unique_kill' | 'death' | 'discovery_city'
  title: text('title').notNull(),
  description: text('description').notNull(),
  icon: text('icon').notNull(),
  data: jsonb('data').$type<Record<string, any>>(),
});

// Table for storing events that happened while offline
export const offlineEvents = pgTable('offline_events', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  characterId: text('character_id').notNull().references(() => characters.id, { onDelete: 'cascade' }),
  timestamp: bigint('timestamp', { mode: 'number' }).notNull(),
  type: text('type').notNull(), // 'combat' | 'quest' | 'explore' | 'travel' | 'rest' | 'learn' | 'social' | 'misc' | 'system'
  message: text('message').notNull(),
  data: jsonb('data').$type<Record<string, any>>(),
  isRead: boolean('is_read').notNull().default(false),
});

// === GAME DATA TABLES ===

// Locations table
export const gameLocations = pgTable('game_locations', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  type: text('type').notNull(), // 'city' | 'town' | 'ruin' | 'dungeon' | 'camp'
  coordX: real('coord_x').notNull(), // percentage 0-100
  coordY: real('coord_y').notNull(), // percentage 0-100
  isSafe: boolean('is_safe').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Items table
export const gameItems = pgTable('game_items', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  weight: real('weight').notNull(),
  type: text('type').notNull(), // 'weapon' | 'armor' | 'potion' | 'misc' | 'gold' | 'spell_tome' | 'key_item' | 'learning_book' | 'food'
  rarity: text('rarity'), // 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'
  equipmentSlot: text('equipment_slot'), // 'head' | 'torso' | 'legs' | 'hands' | 'feet' | 'ring' | 'amulet' | 'weapon'
  damage: integer('damage'),
  armor: integer('armor'),
  effect: jsonb('effect').$type<{
    id?: string;
    type: 'heal' | 'buff';
    stat: string;
    amount: number;
    duration?: number;
    description?: string;
    icon?: string;
  }>(),
  spellId: text('spell_id'),
  learningEffect: jsonb('learning_effect').$type<{
    id: string;
    name: string;
    description: string;
    duration: number;
    icon: string;
  }>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// NPCs table
export const gameNpcs = pgTable('game_npcs', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  location: text('location').notNull(),
  dialogue: jsonb('dialogue').notNull().$type<string[]>(),
  inventory: jsonb('inventory').$type<Array<{
    itemId: string;
    stock: number;
    priceModifier?: number;
  }>>(),
  isCompanion: boolean('is_companion').default(false),
  hireCost: integer('hire_cost'),
  factionId: text('faction_id'),
  companionDetails: jsonb('companion_details').$type<{
    combatStyle: string;
    primarySkill: string;
  }>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Enemies table
export const gameEnemies = pgTable('game_enemies', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  health: integer('health').notNull(),
  damage: integer('damage').notNull(),
  armor: integer('armor').notNull().default(10),
  xp: integer('xp').notNull(),
  level: integer('level').default(1),
  minLevel: integer('min_level'),
  isUnique: boolean('is_unique').default(false),
  guaranteedDrop: jsonb('guaranteed_drop').$type<Array<{ id: string; quantity: number }>>(),
  appliesEffect: jsonb('applies_effect').$type<{
    id: string;
    name: string;
    description: string;
    icon: string;
    type: 'debuff';
    chance: number;
    duration: number;
    value?: number;
  }>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Combat Analytics - stores last 10 battles per character for analytics
export const combatAnalytics = pgTable('combat_analytics', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  characterId: text('character_id').notNull().references(() => characters.id, { onDelete: 'cascade' }),
  timestamp: bigint('timestamp', { mode: 'number' }).notNull(),
  
  // Battle info
  enemyId: text('enemy_id').notNull(),
  enemyName: text('enemy_name').notNull(),
  enemyLevel: integer('enemy_level').notNull(),
  
  // Battle result
  victory: boolean('victory').notNull(),
  fled: boolean('fled').notNull().default(false),
  
  // Stats
  characterLevel: integer('character_level').notNull(),
  characterHealthStart: integer('character_health_start').notNull(),
  characterHealthEnd: integer('character_health_end').notNull(),
  enemyHealthStart: integer('enemy_health_start').notNull(),
  
  // Battle data
  roundsCount: integer('rounds_count').notNull(),
  damageDealt: integer('damage_dealt').notNull(),
  damageTaken: integer('damage_taken').notNull(),
  xpGained: integer('xp_gained').notNull().default(0),
  
  // Detailed combat log
  combatLog: jsonb('combat_log').notNull().$type<string[]>(),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// === TYPE EXPORTS ===

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;

export type CharacterDB = typeof characters.$inferSelect;
export type NewCharacterDB = typeof characters.$inferInsert;

export type ChronicleDB = typeof chronicle.$inferSelect;
export type NewChronicleDB = typeof chronicle.$inferInsert;

export type OfflineEvent = typeof offlineEvents.$inferSelect;
export type NewOfflineEvent = typeof offlineEvents.$inferInsert;

export type GameLocation = typeof gameLocations.$inferSelect;
export type NewGameLocation = typeof gameLocations.$inferInsert;

export type GameItem = typeof gameItems.$inferSelect;
export type NewGameItem = typeof gameItems.$inferInsert;

export type GameNpc = typeof gameNpcs.$inferSelect;
export type NewGameNpc = typeof gameNpcs.$inferInsert;

export type GameEnemy = typeof gameEnemies.$inferSelect;
export type NewGameEnemy = typeof gameEnemies.$inferInsert;

export type CombatAnalytics = typeof combatAnalytics.$inferSelect;
export type NewCombatAnalytics = typeof combatAnalytics.$inferInsert;
