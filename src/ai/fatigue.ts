import { db } from "../../server/storage";
import * as schema from "../../shared/schema";
import { eq } from "drizzle-orm";
import { FATIGUE_DECAY_PER_TICK, FATIGUE_DISABLED_ACTIONS, FATIGUE_HISTORY_WINDOW, FATIGUE_STRENGTH } from "./config/constants";

export type FatigueMap = Record<string, { count: number; lastUsedAt: number }>;

export async function loadFatigue(characterId: string): Promise<FatigueMap> {
  const [row] = await db.select().from(schema.characterAiState).where(eq(schema.characterAiState.characterId, characterId)).limit(1);
  return (row as any)?.fatigue || {};
}

export async function saveFatigue(characterId: string, fatigue: FatigueMap): Promise<void> {
  const [existing] = await db.select().from(schema.characterAiState).where(eq(schema.characterAiState.characterId, characterId)).limit(1);
  if (existing) {
    await db.update(schema.characterAiState).set({ fatigue, updatedAt: new Date() }).where(eq(schema.characterAiState.characterId, characterId));
  } else {
    await db.insert(schema.characterAiState).values({ characterId, fatigue });
  }
}

export async function updateOnAction(characterId: string, actionKey: string): Promise<void> {
  if (FATIGUE_DISABLED_ACTIONS.includes(actionKey)) return;
  const fatigue = await loadFatigue(characterId);
  const entry = fatigue[actionKey] || { count: 0, lastUsedAt: 0 };
  entry.count = Math.min(FATIGUE_HISTORY_WINDOW, (entry.count || 0) + 1);
  entry.lastUsedAt = Date.now();
  fatigue[actionKey] = entry;
  await saveFatigue(characterId, fatigue);
}

export async function decayTick(characterId: string): Promise<boolean> {
  const fatigue = await loadFatigue(characterId);
  const keys = Object.keys(fatigue);
  if (keys.length === 0) return false;
  let changed = false;
  for (const key of keys) {
    const prev = fatigue[key].count || 0;
    const next = prev - Math.max(1, Math.floor(prev * FATIGUE_DECAY_PER_TICK));
    if (next <= 0) {
      delete fatigue[key];
      changed = true;
    } else if (next !== prev) {
      fatigue[key].count = next;
      changed = true;
    }
  }
  if (changed) await saveFatigue(characterId, fatigue);
  return changed;
}

export function fatigueDampeningFactor(fatigue: FatigueMap, actionKey: string): number {
  if (FATIGUE_DISABLED_ACTIONS.includes(actionKey)) return 1;
  const count = fatigue[actionKey]?.count || 0;
  if (count <= 0) return 1;
  const penalty = Math.min(0.9, count / FATIGUE_HISTORY_WINDOW * FATIGUE_STRENGTH);
  return 1 - penalty;
}


