#!/usr/bin/env ts-node
import { db } from "../server/storage";
import * as schema from "../shared/schema";
import { eq } from "drizzle-orm";

async function main() {
  const characters = await db.select().from(schema.characters);
  let inserted = 0;
  for (const c of characters as any[]) {
    const [existing] = await db.select().from(schema.characterAiState).where(eq(schema.characterAiState.characterId, c.id)).limit(1);
    if (!existing) {
      await db.insert(schema.characterAiState).values({
        characterId: c.id,
        profileId: 'prof-warrior',
        fatigue: {},
      } as any);
      inserted += 1;
    }
  }
  console.log(`Backfill complete. Inserted ${inserted} ai state rows.`);
}

main().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1); });


