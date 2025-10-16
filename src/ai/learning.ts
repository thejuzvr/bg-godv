import { db } from "../../server/storage";
import * as schema from "../../shared/schema";
import { eq } from "drizzle-orm";

export async function recordAttempt(characterId: string, actionKey: string): Promise<void> {
  await db.transaction(async (tx) => {
    const [row] = await tx.select().from(schema.characterAiState).where(eq(schema.characterAiState.characterId, characterId)).limit(1);
    if (row) {
      const learning = { ...(row as any).learning } as Record<string, { attempts: number; successes: number; recent: number[] }>;
      const cur = learning[actionKey] || { attempts: 0, successes: 0, recent: [] };
      cur.attempts += 1;
      cur.recent = (cur.recent || []).concat([Date.now()]).slice(-10);
      learning[actionKey] = cur;
      await tx.update(schema.characterAiState).set({ learning, updatedAt: new Date() }).where(eq(schema.characterAiState.characterId, characterId));
    } else {
      const learning: any = { [actionKey]: { attempts: 1, successes: 0, recent: [Date.now()] } };
      await tx.insert(schema.characterAiState).values({ characterId, fatigue: {} as any, learning });
    }
  });
}

export async function recordOutcome(characterId: string, actionKey: string, succeeded: boolean): Promise<void> {
  await db.transaction(async (tx) => {
    const [row] = await tx.select().from(schema.characterAiState).where(eq(schema.characterAiState.characterId, characterId)).limit(1);
    if (!row) return;
    const learning = { ...(row as any).learning } as Record<string, { attempts: number; successes: number; recent: number[] }>;
    const cur = learning[actionKey] || { attempts: 0, successes: 0, recent: [] };
    cur.attempts = Math.max(cur.attempts, 1);
    if (succeeded) cur.successes = (cur.successes || 0) + 1;
    learning[actionKey] = cur;
    await tx.update(schema.characterAiState).set({ learning, updatedAt: new Date() }).where(eq(schema.characterAiState.characterId, characterId));
  });
}


