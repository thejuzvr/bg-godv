import { db } from "../../server/storage";
import * as schema from "../../shared/schema";
import { and, isNull, gt, or, eq } from "drizzle-orm";

export interface ActiveModifier {
  code: string;
  label?: string | null;
  multiplier: number; // e.g., 0.2 for +20%
  expiresAt?: Date | null;
}

export async function getActiveModifiers(characterId: string, now: Date = new Date()): Promise<ActiveModifier[]> {
  const rows = await db.select().from(schema.aiModifiers)
    .where(and(
      eq(schema.aiModifiers.characterId, characterId),
      or(isNull(schema.aiModifiers.expiresAt), gt(schema.aiModifiers.expiresAt, now))
    ));
  return rows.map(r => ({ code: (r as any).code, label: (r as any).label, multiplier: (r as any).multiplier, expiresAt: (r as any).expiresAt as any }));
}

export function composeModifierMultiplier(mods: ActiveModifier[]): number {
  // Sum simple percentage boosts, clamp to reasonable range
  const total = mods.reduce((acc, m) => acc + (m.multiplier || 0), 0);
  return Math.max(0.0, 1 + total);
}


