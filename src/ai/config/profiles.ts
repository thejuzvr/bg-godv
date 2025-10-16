export type ProfileCode = 'warrior' | 'mage' | 'thief';

export interface ProfileConfig {
  tags: Record<string, number>; // tag -> multiplier
}

export const PROFILES: Record<ProfileCode, ProfileConfig> = {
  warrior: { tags: { combat: 1.15, training: 1.05, magic: 0.85 } },
  mage:    { tags: { magic: 1.20, artifacts: 1.10, combat: 0.90 } },
  thief:   { tags: { stealth: 1.20, thievery: 1.15, combat: 0.90 } },
};


