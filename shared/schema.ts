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

// Realms (multi-tenant isolation)
export const realms = pgTable('realms', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  status: text('status').notNull().default('active'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const characters = pgTable('characters', {
  id: text('id').primaryKey(), // Will be the user's auth ID
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  realmId: text('realm_id').notNull().default('global'),
  
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
  timeOfDay: text('time_of_day').notNull(),
  
  // Cooldowns and visited locations
  actionCooldowns: jsonb('action_cooldowns').notNull().$type<Record<string, number>>(),
  visitedLocations: jsonb('visited_locations').notNull().$type<string[]>(),
  
  // Game time and mood
  gameDate: bigint('game_date', { mode: 'number' }).notNull(),
  mood: real('mood').notNull().default(50),

  // Crafting progression and unlocks (lightweight v1)
  craftingLevel: integer('crafting_level').notNull().default(1),
  craftingXp: integer('crafting_xp').notNull().default(0),
  craftingPoints: integer('crafting_points').notNull().default(0),
  unlockedRecipes: jsonb('unlocked_recipes').$type<string[]>(),
  
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
  
  // Welcome message tracking
  hasSeenWelcomeMessage: boolean('has_seen_welcome_message').notNull().default(false),
  
  // Location arrival tracking for strict sequencing
  lastLocationArrival: bigint('last_location_arrival', { mode: 'number' }),
  hasCompletedLocationActivity: boolean('has_completed_location_activity').notNull().default(false),
  
  // Companions
  companions: jsonb('companions').notNull().default([]).$type<string[]>(), // IDs of recruited companions
  activeCompanion: text('active_companion'), // ID of currently active companion
});

// === Divine messages (user-driven) ===
export const divineMessages = pgTable('divine_messages', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  characterId: text('character_id').notNull().references(() => characters.id, { onDelete: 'cascade' }),
  text: text('text').notNull(),
  createdAt: bigint('created_at', { mode: 'number' }).notNull().default(Date.now()),
  processedAt: bigint('processed_at', { mode: 'number' }),
});

export const chronicle = pgTable('chronicle', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  characterId: text('character_id').notNull().references(() => characters.id, { onDelete: 'cascade' }),
  realmId: text('realm_id').notNull().default('global'),
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
  realmId: text('realm_id').notNull().default('global'),
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
  type: text('type').notNull(), // 'city' | 'town' | 'ruin' | 'dungeon' | 'camp' | 'outskirts'
  coordX: real('coord_x').notNull(), // percentage 0-100
  coordY: real('coord_y').notNull(), // percentage 0-100
  isSafe: boolean('is_safe').notNull().default(true),
  dangerLevel: integer('danger_level').default(0), // 0-100, уровень опасности (для окраин и опасных зон)
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
  lootTable: jsonb('loot_table').$type<{
    common: Array<{ id: string; quantity: number; chance: number }>;
    uncommon: Array<{ id: string; quantity: number; chance: number }>;
    rare: Array<{ id: string; quantity: number; chance: number }>;
    legendary: Array<{ id: string; quantity: number; chance: number }>;
    goldChance: number;
    goldMin: number;
    goldMax: number;
  }>(),
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

// Game Thoughts table (hero thoughts, context-driven content)
export const gameThoughts = pgTable('game_thoughts', {
  id: text('id').primaryKey(),
  text: text('text').notNull(),
  tags: jsonb('tags').$type<string[] | null>(),
  conditions: jsonb('conditions').$type<Record<string, any> | null>(),
  weight: integer('weight').notNull().default(1),
  cooldownKey: text('cooldown_key'),
  locale: text('locale').notNull().default('ru'),
  isEnabled: boolean('is_enabled').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// NPC Dialogue Lines table (fine-grained dialogue with conditions/weights)
export const npcDialogueLines = pgTable('npc_dialogue_lines', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  npcId: text('npc_id').notNull().references(() => gameNpcs.id, { onDelete: 'cascade' }),
  text: text('text').notNull(),
  tags: jsonb('tags').$type<string[] | null>(),
  conditions: jsonb('conditions').$type<Record<string, any> | null>(),
  weight: integer('weight').notNull().default(1),
  cooldownKey: text('cooldown_key'),
  locale: text('locale').notNull().default('ru'),
  isEnabled: boolean('is_enabled').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Combat Analytics - stores last 10 battles per character for analytics
export const combatAnalytics = pgTable('combat_analytics', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  characterId: text('character_id').notNull().references(() => characters.id, { onDelete: 'cascade' }),
  realmId: text('realm_id').notNull().default('global'),
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

// Character state snapshots for analytics and restore operations
export const characterStateSnapshots = pgTable('character_state_snapshots', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  realmId: text('realm_id').notNull().default('global'),
  characterId: text('character_id').notNull().references(() => characters.id, { onDelete: 'cascade' }),
  asOfTick: bigint('as_of_tick', { mode: 'number' }).notNull(),
  summary: jsonb('summary').notNull().$type<{
    level: number;
    location: string;
    status: string;
    hp: number; mp: number; sp: number;
    gold: number;
  }>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// === TELEGRAM INTEGRATION ===
export const telegramLinkTokens = pgTable('telegram_link_tokens', {
  token: text('token').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  expiresAt: bigint('expires_at', { mode: 'number' }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const telegramSubscriptions = pgTable('telegram_subscriptions', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  chatId: text('chat_id').notNull(),
  mode: text('mode').notNull().default('daily'),
  locale: text('locale').notNull().default('ru'),
  lastSentAt: bigint('last_sent_at', { mode: 'number' }),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// === SHOUTS ===
export const shouts = pgTable('shouts', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  icon: text('icon').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const characterShouts = pgTable('character_shouts', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  characterId: text('character_id').notNull().references(() => characters.id, { onDelete: 'cascade' }),
  shoutId: text('shout_id').notNull().references(() => shouts.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// === AI CONFIG TABLES ===
export const aiProfiles = pgTable('ai_profiles', {
  id: text('id').primaryKey(),
  code: text('code').notNull(),
  name: text('name').notNull(),
  baseMultipliers: jsonb('base_multipliers').notNull().$type<Record<string, number>>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const characterAiState = pgTable('character_ai_state', {
  characterId: text('character_id').primaryKey().references(() => characters.id, { onDelete: 'cascade' }),
  profileId: text('profile_id').references(() => aiProfiles.id, { onDelete: 'set null' }),
  fatigue: jsonb('fatigue').notNull().$type<Record<string, { count: number; lastUsedAt: number }>>(),
  learning: jsonb('learning').notNull().$type<Record<string, { attempts: number; successes: number; recent: number[] }>>().default({} as any),
  experimentGroup: text('experiment_group'),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const aiModifiers = pgTable('ai_modifiers', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  characterId: text('character_id').notNull().references(() => characters.id, { onDelete: 'cascade' }),
  code: text('code').notNull(),
  label: text('label'),
  multiplier: real('multiplier').notNull().default(0),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  source: jsonb('source').$type<Record<string, any>>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// === CRAFTING ===
export const craftingStations = pgTable('crafting_stations', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  discipline: text('discipline').notNull(), // 'alchemy' | 'smithing' | 'enchanting' | 'cooking' | 'tanning' | 'smelting'
  location: text('location'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const craftingRecipes = pgTable('crafting_recipes', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  discipline: text('discipline').notNull(),
  station: text('station').notNull(),
  inputs: jsonb('inputs').notNull().$type<Array<{ id: string; quantity: number }>>(),
  outputs: jsonb('outputs').notNull().$type<Array<{ id: string; quantity: number }>>(),
  skillReq: integer('skill_req').notNull().default(0),
  xp: integer('xp').notNull().default(5),
  successBase: real('success_base').notNull().default(0.9), // 0..1
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const characterCraftingSkills = pgTable('character_crafting_skills', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  characterId: text('character_id').notNull().references(() => characters.id, { onDelete: 'cascade' }),
  discipline: text('discipline').notNull(),
  level: integer('level').notNull().default(1),
  xp: integer('xp').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// === ECONOMY (GLOBAL MARKET v1) ===
export const globalMarket = pgTable('global_market', {
  itemId: text('item_id').primaryKey(),
  price: real('price').notNull(),
  supply: bigint('supply', { mode: 'number' }).notNull().default(0),
  demand: bigint('demand', { mode: 'number' }).notNull().default(0),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// === REACTIONS ===
export const characterInteractions = pgTable('character_interactions', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  characterId: text('character_id').notNull().references(() => characters.id, { onDelete: 'cascade' }),
  source: text('source').notNull(), // 'profile-view' | 'player-message'
  payload: jsonb('payload').$type<{ text?: string; fromUserId?: string; ip?: string }>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// === URGENT EVENTS ===
export const urgentEvents = pgTable('urgent_events', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  characterId: text('character_id').notNull().references(() => characters.id, { onDelete: 'cascade' }),
  key: text('key').notNull(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  status: text('status').notNull().default('active'), // 'active' | 'completed' | 'failed'
  currentStep: integer('current_step').notNull().default(0),
  expiresAt: bigint('expires_at', { mode: 'number' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  completedAt: timestamp('completed_at'),
});

export const urgentEventSteps = pgTable('urgent_event_steps', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  urgentEventId: text('urgent_event_id').notNull().references(() => urgentEvents.id, { onDelete: 'cascade' }),
  idx: integer('idx').notNull().default(0),
  type: text('type').notNull(), // 'dialogue' | 'follow' | 'report_d20'
  data: jsonb('data').$type<Record<string, any>>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// === AI GRAPH (MODULAR) ===
export const aiGraphTemplates = pgTable('ai_graph_templates', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull(),
  description: text('description'),
  version: integer('version').notNull().default(1),
  graphJson: jsonb('graph_json').notNull().$type<Record<string, any>>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const aiGraphInstances = pgTable('ai_graph_instances', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  characterId: text('character_id').notNull().references(() => characters.id, { onDelete: 'cascade' }),
  templateId: text('template_id').references(() => aiGraphTemplates.id, { onDelete: 'set null' }),
  version: integer('version').notNull().default(1),
  graphJson: jsonb('graph_json').notNull().$type<Record<string, any>>(),
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// === COMPANIONS ===
export const characterCompanions = pgTable('character_companions', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  characterId: text('character_id').notNull().references(() => characters.id, { onDelete: 'cascade' }),
  npcId: text('npc_id').notNull(), // Reference to NPC companion template
  name: text('name').notNull(),
  class: text('class').notNull(), // 'warrior' | 'mage' | 'rogue' | 'healer' | 'ranger'
  rarity: text('rarity').notNull(), // 'common' | 'uncommon' | 'rare' | 'legendary'
  level: integer('level').notNull().default(1),
  stats: jsonb('stats').notNull().$type<{
    health: { current: number; max: number };
    damage: number;
    armor: number;
  }>(),
  skills: jsonb('skills').notNull().$type<{
    combat: number;
    magic: number;
    stealth: number;
  }>(),
  abilities: jsonb('abilities').notNull().$type<Array<{
    id: string;
    name: string;
    type: string;
    description: string;
    cooldown: number;
    manaCost?: number;
  }>>(),
  personality: jsonb('personality').notNull().$type<{
    loyalty: number;
    courage: number;
    humor: number;
  }>(),
  experience: integer('experience').notNull().default(0),
  mood: integer('mood').notNull().default(50), // 0-100
  isActive: boolean('is_active').notNull().default(false),
  acquiredAt: bigint('acquired_at', { mode: 'number' }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// === QUESTS ===
export const quests = pgTable('quests', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  characterId: text('character_id').notNull().references(() => characters.id, { onDelete: 'cascade' }),
  templateId: text('template_id'), // optional link to static template in src/data/quests.ts
  title: text('title').notNull(),
  description: text('description').notNull(),
  location: text('location').notNull(),
  type: text('type').notNull(), // 'main' | 'side' | 'bounty' | 'urgent'
  status: text('status').notNull().default('in-progress'), // 'available' | 'in-progress' | 'completed' | 'failed'
  rewards: jsonb('rewards').notNull().$type<{
    gold?: number;
    xp?: number;
    items?: Array<{ id: string; quantity: number }>;
    randomItemRewards?: Array<{ rarity: string; type: string; quantity: number }>;
  }>(),
  progress: integer('progress').notNull().default(0), // 0-100
  priority: integer('priority').notNull().default(50), // 0-100, higher = more important
  isActive: boolean('is_active').notNull().default(false), // Only one quest can be active per character
  canAutoComplete: boolean('can_auto_complete').notNull().default(true), // AI can auto-complete this quest
  metadata: jsonb('metadata').$type<Record<string, any>>(),
  expiresAt: bigint('expires_at', { mode: 'number' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  completedAt: timestamp('completed_at'),
});

export const questTasks = pgTable('quest_tasks', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  questId: text('quest_id').notNull().references(() => quests.id, { onDelete: 'cascade' }),
  idx: integer('idx').notNull().default(0),
  title: text('title').notNull(),
  type: text('type').notNull(), // 'talk' | 'follow' | 'combat' | 'collect' | 'report' | ...
  status: text('status').notNull().default('pending'), // 'pending' | 'in-progress' | 'completed' | 'failed'
  progress: integer('progress').notNull().default(0),
  data: jsonb('data').$type<Record<string, any>>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  completedAt: timestamp('completed_at'),
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

export type Realm = typeof realms.$inferSelect;
export type NewRealm = typeof realms.$inferInsert;

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

export type GameThought = typeof gameThoughts.$inferSelect;
export type NewGameThought = typeof gameThoughts.$inferInsert;

export type NpcDialogueLine = typeof npcDialogueLines.$inferSelect;
export type NewNpcDialogueLine = typeof npcDialogueLines.$inferInsert;

export type CharacterStateSnapshot = typeof characterStateSnapshots.$inferSelect;
export type NewCharacterStateSnapshot = typeof characterStateSnapshots.$inferInsert;

export type QuestDB = typeof quests.$inferSelect;
export type NewQuestDB = typeof quests.$inferInsert;
export type QuestTaskDB = typeof questTasks.$inferSelect;
export type NewQuestTaskDB = typeof questTasks.$inferInsert;

export type UrgentEventDB = typeof urgentEvents.$inferSelect;
export type NewUrgentEventDB = typeof urgentEvents.$inferInsert;
export type UrgentEventStepDB = typeof urgentEventSteps.$inferSelect;
export type NewUrgentEventStepDB = typeof urgentEventSteps.$inferInsert;

export type AiGraphTemplateDB = typeof aiGraphTemplates.$inferSelect;
export type NewAiGraphTemplateDB = typeof aiGraphTemplates.$inferInsert;
export type AiGraphInstanceDB = typeof aiGraphInstances.$inferSelect;
export type NewAiGraphInstanceDB = typeof aiGraphInstances.$inferInsert;

export type CharacterCompanionDB = typeof characterCompanions.$inferSelect;
export type NewCharacterCompanionDB = typeof characterCompanions.$inferInsert;
