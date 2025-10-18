import type { Character, WorldState } from "@/types/character";
import type { CatalogEntry } from "./action-catalog";
import { PRIORITY_RULES, priorityToBaseWeight } from "./config/priorities";
import { PROFILES } from "./config/profiles";
import { db } from "../../server/storage";
import * as schema from "../../shared/schema";
import { eq } from "drizzle-orm";
import { fatigueDampeningFactor, loadFatigue } from "./fatigue";
import { composeModifierMultiplier, getActiveModifiers } from "./modifiers";
import { CATEGORY_BASE_MULTIPLIERS } from "./config/constants";

export interface ScoreBreakdown {
  base: number; // from rule priority
  ruleBoost: number; // numeric boost
  profile: number; // multiplier
  fatigue: number; // multiplier
  modifiers: number; // multiplier
  total: number;
}

export interface ScoredAction {
  actionId: string;
  name: string;
  tags: string[];
  score: number;
  breakdown: ScoreBreakdown;
}

function inferTags(entry: CatalogEntry): string[] {
  if (entry.tags && entry.tags.length > 0) return entry.tags;
  // Basic mapping: category as tag plus some heuristics from name
  const tags = new Set<string>([entry.category]);
  const name = entry.action.name.toLowerCase();
  if (name.includes('спать') || name.includes('отдых')) tags.add('rest');
  if (name.includes('маг') || name.includes('заклин') || name.includes('книга')) tags.add('magic');
  if (name.includes('вор') || name.includes('украсть') || name.includes('красть')) tags.add('thievery');
  if (entry.category === 'combat') tags.add('combat');
  if (entry.category === 'explore') tags.add('explore');
  if (entry.category === 'learn') tags.add('training');
  return Array.from(tags);
}

const SCORE_CACHE_TTL_MS = 1000;
let scoreCache: Map<string, { at: number; data: ScoredAction[] }> = new Map();

export async function computeActionScores(params: {
  character: Character;
  actions: CatalogEntry[];
  profileCode?: keyof typeof PROFILES;
  world?: WorldState;
}): Promise<ScoredAction[]> {
  const { character, actions } = params;

  const cacheKey = `${character.id}:${actions.length}:${character.status}`;
  const cached = scoreCache.get(cacheKey);
  const nowTs = Date.now();
  if (cached && (nowTs - cached.at) < SCORE_CACHE_TTL_MS) {
    return cached.data;
  }

  // Build simple state for rules
  const healthRatio = character.stats.health.current / Math.max(1, character.stats.health.max);
  const staminaRatio = character.stats.stamina.current / Math.max(1, character.stats.stamina.max);
  const isInCombat = character.status === 'in-combat';
  const isLocationSafe = params.world?.isLocationSafe ?? true;
  const hasHealingPotion = character.inventory.some(i => i.type === 'potion' && i.effect?.type === 'heal' && i.effect.stat === 'health');
  const isOverencumbered = params.world?.isOverencumbered ?? false;
  const canTakeQuest = params.world?.canTakeQuest ?? false;
  const isTired = params.world?.isTired ?? false;
  const travelReady = !isOverencumbered && !isInCombat && (character.stats.stamina.current / Math.max(1, character.stats.stamina.max)) > 0.5;

  const state = { health: healthRatio, stamina: staminaRatio, isInCombat, isLocationSafe, hasHealingPotion, isOverencumbered, canTakeQuest, isTired, travelReady };

  // Active rule selection: choose the first matching rule (can be extended to many)
  const matching = Object.values(PRIORITY_RULES).filter(r => r.if(state));
  const primary = matching[0];
  const baseFromRule = primary ? priorityToBaseWeight(primary.priority) : 10;
  const ruleBoost = primary?.boost ?? 0;

  // Load fatigue and modifiers
  const [fatigue, modifiers] = await Promise.all([
    loadFatigue(character.id),
    getActiveModifiers(character.id),
  ]);
  const modifierMultiplier = composeModifierMultiplier(modifiers);

  // Learning multiplier per actionKey
  let learning: Record<string, { attempts: number; successes: number; recent: number[] }> = {};
  try {
    const [row] = await db.select().from(schema.characterAiState).where(eq(schema.characterAiState.characterId, character.id)).limit(1);
    learning = ((row as any)?.learning || {}) as any;
  } catch {}

  // Select profile: try DB state, fallback to param, then 'warrior'
  let profileKey: keyof typeof PROFILES | undefined = params.profileCode;
  try {
    const [row] = await db.select().from(schema.characterAiState).where(eq(schema.characterAiState.characterId, character.id)).limit(1);
    if (row && (row as any).profileId) {
      const [prof] = await db.select().from(schema.aiProfiles).where(eq(schema.aiProfiles.id, (row as any).profileId)).limit(1);
      const code = (prof as any)?.code as keyof typeof PROFILES | undefined;
      if (code && PROFILES[code]) profileKey = code;
    }
  } catch {}
  const profile = profileKey ? PROFILES[profileKey] : PROFILES['warrior'];

  const scored: ScoredAction[] = actions.map((entry) => {
    const tags = inferTags(entry);
    const profileMult = tags.reduce((acc, t) => acc * (profile.tags[t] ?? 1.0), 1.0);
    const actionKey = `${entry.category}:${entry.action.name}`;
    const fatigueMult = fatigueDampeningFactor(fatigue, actionKey);
    const base = baseFromRule;
    const learn = learning[actionKey];
    const failureRate = !learn || learn.attempts === 0 ? 0 : Math.max(0, (learn.attempts - (learn.successes || 0)) / Math.max(1, learn.attempts));
    const learningMult = Math.min(1.2, Math.max(0.8, 1 - failureRate * 0.2));
    // Incorporate per-action weight if provided (Godville-style getWeight)
    let actionWeightRaw = 50; // neutral baseline
    try {
      if (typeof (entry.action as any).getWeight === 'function') {
        actionWeightRaw = (entry.action as any).getWeight(params.character, params.world as any, undefined);
      }
    } catch {}
    const actionWeightMult = Math.min(2.0, Math.max(0.5, actionWeightRaw / 50));
    const categoryMult = CATEGORY_BASE_MULTIPLIERS[entry.category] ?? 1.0;
    // Stronger recent-category bias to avoid loops (esp. travel/combat)
    let recentBias = 1.0;
    try {
      const hist = Array.isArray(character.actionHistory) ? character.actionHistory.slice(-8) : [];
      const recentSame = hist.filter(h => h.type === entry.category).length;
      if (recentSame >= 5) recentBias = 0.6; else if (recentSame >= 3) recentBias = 0.8;
    } catch {}
    const total = Math.max(0, (base + ruleBoost) * profileMult * fatigueMult * modifierMultiplier * learningMult * actionWeightMult * categoryMult * recentBias);
    return {
      actionId: entry.id,
      name: entry.action.name,
      tags,
      score: total,
      breakdown: { base, ruleBoost, profile: profileMult, fatigue: fatigueMult, modifiers: modifierMultiplier, total },
    };
  });

  // Sort descending score and cache
  scored.sort((a, b) => b.score - a.score);
  scoreCache.set(cacheKey, { at: nowTs, data: scored });
  return scored;
}


