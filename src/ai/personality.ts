// Lightweight personality system: archetype, traits, evolution, and weight modifiers

export enum Archetype {
  WARRIOR = 'warrior',
  MERCHANT = 'merchant',
  EXPLORER = 'explorer',
  SCHOLAR = 'scholar',
  SOCIAL = 'social',
  DEVOUT = 'devout',
}

export type PersonalityProfile = {
  archetype: Archetype;
  traits: {
    aggression: number;     // combat
    greed: number;          // trade/steal
    curiosity: number;      // explore/quests
    piety: number;          // pray/donate
    sociability: number;    // social interactions
  };
  evolution: {
    actionCounts: Record<string, number>;
    lastUpdate: number;
  };
};

export function initPersonality(backstory: string): PersonalityProfile {
  const base: PersonalityProfile = {
    archetype: mapBackstoryToArchetype(backstory),
    traits: {
      aggression: 50,
      greed: 50,
      curiosity: 50,
      piety: 50,
      sociability: 50,
    },
    evolution: { actionCounts: {}, lastUpdate: Date.now() },
  };
  // Small archetype bias
  switch (base.archetype) {
    case Archetype.WARRIOR: base.traits.aggression += 15; break;
    case Archetype.MERCHANT: base.traits.greed += 15; break;
    case Archetype.EXPLORER: base.traits.curiosity += 15; break;
    case Archetype.SCHOLAR: base.traits.curiosity += 10; break;
    case Archetype.SOCIAL: base.traits.sociability += 15; break;
    case Archetype.DEVOUT: base.traits.piety += 20; break;
  }
  normalizeTraits(base.traits);
  return base;
}

export function evolvePersonality(profile: PersonalityProfile, actionType: string): PersonalityProfile {
  const updated = { ...profile, traits: { ...profile.traits }, evolution: { ...profile.evolution, actionCounts: { ...profile.evolution.actionCounts } } };
  const count = (updated.evolution.actionCounts[actionType] || 0) + 1;
  updated.evolution.actionCounts[actionType] = count;
  if (count % 10 === 0) {
    // Slow evolution every 10 similar actions
    const key = mapActionTypeToTrait(actionType);
    if (key) {
      updated.traits[key] = Math.min(80, updated.traits[key] + 2);
      // light balancing
      for (const k of Object.keys(updated.traits) as Array<keyof PersonalityProfile['traits']>) {
        if (k !== key) updated.traits[k] = Math.max(20, updated.traits[k] - 1);
      }
    }
  }
  updated.evolution.lastUpdate = Date.now();
  return updated;
}

export function getPersonalityModifier(profile: PersonalityProfile, actionType: string): number {
  const traitKey = mapActionTypeToTrait(actionType);
  if (!traitKey) return 1.0;
  const v = clamp(profile.traits[traitKey], 0, 100);
  // Map 0..100 to 0.8..1.4 (stable, less spiky)
  return 0.8 + (v / 100) * 0.6;
}

function mapBackstoryToArchetype(backstory: string): Archetype {
  switch (backstory) {
    case 'scholar': return Archetype.SCHOLAR;
    case 'thief': return Archetype.MERCHANT;
    case 'noble': return Archetype.SOCIAL;
    case 'warrior':
    case 'companion':
    case 'left_for_dead':
    case 'shipwrecked':
    default: return Archetype.WARRIOR;
  }
}

function mapActionTypeToTrait(actionType: string): keyof PersonalityProfile['traits'] | null {
  switch (actionType) {
    case 'combat': return 'aggression';
    case 'social': return 'sociability';
    case 'learn': return 'curiosity';
    case 'explore': return 'curiosity';
    case 'quest': return 'curiosity';
    case 'travel': return 'curiosity';
    case 'rest': return null;
    case 'misc': return null;
    default: return null;
  }
}

function normalizeTraits(traits: PersonalityProfile['traits']) {
  for (const k of Object.keys(traits) as Array<keyof PersonalityProfile['traits']>) {
    traits[k] = clamp(traits[k], 0, 100);
  }
}

function clamp(n: number, min: number, max: number) { return Math.max(min, Math.min(max, n)); }


