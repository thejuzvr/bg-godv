export interface PolicyConfig {
  categoryBaseWeights: Record<string, number>;
  recentWindow: number; // actions to look back for diversity
  minChoices: number;   // ensure at least N candidates via fallbacks
  maxCooldownMs: number; // default max cooldown recognition
  systemBaseline: number; // baseline to allow occasional system actions
}

export const DEFAULT_POLICY_CONFIG: PolicyConfig = {
  categoryBaseWeights: {
    combat: 1.0,
    quest: 1.0,
    explore: 1.0,
    travel: 1.0,
    rest: 0.7,
    learn: 0.8,
    social: 0.9,
    trading: 0.95,
    misc: 0.6,
    system: 0.0,
  },
  recentWindow: 10,
  minChoices: 3,
  maxCooldownMs: 5 * 60 * 1000,
  systemBaseline: 0.1,
};


