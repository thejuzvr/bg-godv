// Centralized AI constants and feature flags

export const USE_CONFIG_PRIORITY = true;

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


