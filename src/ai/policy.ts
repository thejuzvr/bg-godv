import type { Character } from "@/types/character";
import type { GameData } from "@/services/gameDataService";
import { DEFAULT_POLICY_CONFIG } from "./policy.config";
import type { Action } from "./brain";
import { wanderAction } from "./brain";

export interface PolicyContext {
  character: Character;
  gameData: GameData;
}

function getRecentCountsByCategory(character: Character, windowSize: number): Record<string, number> {
  const counts: Record<string, number> = {};
  const history = character.actionHistory || [];
  const recent = history.slice(-windowSize);
  for (const h of recent) {
    counts[h.type] = (counts[h.type] || 0) + 1;
  }
  return counts;
}

export function applyVarietyBoost(actions: Array<{ action: Action; baseWeight: number }>, character: Character, windowSize: number) {
  const counts = getRecentCountsByCategory(character, windowSize);
  return actions.map(({ action, baseWeight }) => {
    const count = counts[action.type] || 0;
    // Simple boost: fewer recent uses => higher multiplier
    const boost = 1 + Math.max(0, (2 - count)) * 0.25; // if not used recently -> up to x1.5
    return { action, weight: baseWeight * boost };
  });
}

export function weightedSample<T extends { weight: number }>(items: T[]): T | null {
  const positive = items.filter(i => i.weight > 0);
  if (positive.length === 0) return null;
  const total = positive.reduce((s, i) => s + i.weight, 0);
  let r = Math.random() * total;
  for (const it of positive) {
    if (r < it.weight) return it;
    r -= it.weight;
  }
  return positive[positive.length - 1];
}

export function selectActionSimple(
  candidateActions: Action[],
  ctx: PolicyContext,
  config = DEFAULT_POLICY_CONFIG
): Action {
  // Guards: ensure not empty
  if (!candidateActions || candidateActions.length === 0) {
    return wanderAction;
  }

  // Base weights by category
  const withBase = candidateActions.map(a => {
    let base = config.categoryBaseWeights[a.type] ?? 1.0;
    // Nudge system actions to run occasionally when allowed
    if (a.type === 'system') base = Math.max(base, config.systemBaseline);
    return { action: a, baseWeight: base };
  });
  const withVariety = applyVarietyBoost(withBase, ctx.character, config.recentWindow);
  const picked = weightedSample(withVariety);
  return picked?.action ?? wanderAction;
}


