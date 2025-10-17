// Centralized AI constants and feature flags

export const USE_CONFIG_PRIORITY = true;
// Feature flag to enable Behavior Tree arbitration
export const AI_BT_ENABLED: boolean = String(process.env.NEXT_PUBLIC_AI_BT || process.env.AI_BT || '').toLowerCase() === 'true';

// BT gate timings
export const ARRIVAL_WINDOW_MS = 5 * 60 * 1000; // 5 minutes
export const STALL_WINDOW_MS = 2 * 60 * 1000; // 2 minutes before nudge

// Thresholds
export const HEALTH_CRITICAL_THRESHOLD = 0.25;
export const STAMINA_LOW_THRESHOLD = 0.35;

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


