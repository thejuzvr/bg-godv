// Centralized AI constants and feature flags

export const USE_CONFIG_PRIORITY = true;
// BT gate timings (legacy; safe to keep for now)
export const ARRIVAL_WINDOW_MS = 5 * 60 * 1000; // 5 minutes
export const STALL_WINDOW_MS = 2 * 60 * 1000; // 2 minutes before nudge

// Thresholds
export const HEALTH_CRITICAL_THRESHOLD = 0.25;
export const STAMINA_LOW_THRESHOLD = 0.35;
// Minimum total consumables (potions of any type) before we trigger supply guard
export const CONSUMABLES_MIN_TOTAL = Number(process.env.AI_CONSUMABLES_MIN_TOTAL || 3);
// Shout cooldown in combat rounds
export const SHOUT_COOLDOWN_ROUNDS = Number(process.env.AI_SHOUT_COOLDOWN_ROUNDS || 3);
// Toggle for BT low-consumables guard
export const BT_LOW_CONSUMABLES_ENABLED = String(process.env.AI_BT_LOW_CONSUMABLES || 'true').toLowerCase() === 'true';

// Fatigue system (AI repetition dampening)
export const FATIGUE_DECAY_PER_TICK = 0.15; // portion of accumulated count to decay per tick
export const FATIGUE_STRENGTH = 0.35; // multiplier of dampening impact (0..1)
export const FATIGUE_HISTORY_WINDOW = 15; // consider last N entries per action
export const FATIGUE_DISABLED_ACTIONS: string[] = [
  // Critical safety actions are not penalized
  'combat:Сбежать из боя',
  'misc:Использовать зелье здоровья',
];

// Debug/diagnostics
export const AI_DEBUG_LOG = false;

// Anti-oscillation and category balancing
export const AI_ANTIOSC_ENABLED = String(process.env.AI_ANTIOSC_ENABLED || 'true').toLowerCase() === 'true';
export const RECENT_DEST_LRU = Number(process.env.AI_RECENT_DEST_LRU || 5);
export const TRAVEL_REPEAT_PENALTY = Number(process.env.AI_TRAVEL_REPEAT_PENALTY || 0.5);
export const CATEGORY_BASE_MULTIPLIERS: Record<string, number> = {
  travel: Number(process.env.AI_CAT_TRAVEL_MULT || 0.75),
  quest: Number(process.env.AI_CAT_QUEST_MULT || 1.2),
  social: Number(process.env.AI_CAT_SOCIAL_MULT || 1.0),
  trade: Number(process.env.AI_CAT_TRADE_MULT || 1.05),
  rest: Number(process.env.AI_CAT_REST_MULT || 1.0),
  explore: Number(process.env.AI_CAT_EXPLORE_MULT || 1.0),
  learn: Number(process.env.AI_CAT_LEARN_MULT || 1.0),
  combat: 1.0,
};


