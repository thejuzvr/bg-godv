import { getRedis } from '../../../server/redis';
import { db } from '../../../server/storage';
import * as schema from '../../../shared/schema';
import { eq, and } from 'drizzle-orm';
import type { GraphModel } from './model';
import { executeGraph } from './executor';
import type { Character } from '@/types/character';
import type { GameData } from '@/services/gameDataService';

const CACHE_KEY = (characterId: string) => `ai-graph:${characterId}`;
export const AI_GRAPH_UPDATE_CHANNEL = 'ai-graph-updates';

export async function getActiveGraphForCharacter(characterId: string): Promise<GraphModel | null> {
  const redis = getRedis();
  try {
    const cached = await redis.get(CACHE_KEY(characterId));
    if (cached) return JSON.parse(cached) as GraphModel;
  } catch {}
  const rows = await db.select()
    .from(schema.aiGraphInstances)
    .where(and(eq(schema.aiGraphInstances.characterId, characterId), eq(schema.aiGraphInstances.active, true)))
    .limit(1);
  const row: any = rows[0];
  if (!row) return null;
  const graph = (row.graphJson || null) as GraphModel | null;
  if (graph) {
    try { await redis.set(CACHE_KEY(characterId), JSON.stringify(graph), 'EX', 5); } catch {}
  }
  return graph;
}

export async function publishGraphUpdate(characterId: string): Promise<void> {
  const redis = getRedis();
  try {
    await redis.publish(AI_GRAPH_UPDATE_CHANNEL, characterId);
    await redis.del(CACHE_KEY(characterId));
  } catch {}
}

export async function maybeComputeActionFromGraph(
  character: Character,
  gameData: GameData
): Promise<string | null> {
  const graph = await getActiveGraphForCharacter(character.id);
  if (!graph) return null;
  try {
    const decision = await executeGraph(character, gameData, graph);
    return decision.selectedActionName || null;
  } catch (e) {
    // swallow errors and let default brain proceed
    return null;
  }
}


