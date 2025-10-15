'use server';

import { db } from '../../server/storage';
import { combatAnalytics } from '../../shared/schema';
import type { NewCombatAnalytics } from '../../shared/schema';
import { and, desc, eq, gt } from 'drizzle-orm';

export async function saveCombatAnalytics(data: Omit<NewCombatAnalytics, 'id' | 'createdAt' | 'timestamp'>) {
  const [result] = await db.insert(combatAnalytics).values({
    ...data,
    timestamp: Date.now(),
  }).returning();
  
  await cleanupOldCombatAnalytics(data.characterId);
  
  return result;
}

async function cleanupOldCombatAnalytics(characterId: string) {
  const allRecords = await db
    .select()
    .from(combatAnalytics)
    .where(eq(combatAnalytics.characterId, characterId))
    .orderBy(desc(combatAnalytics.timestamp));
  
  if (allRecords.length > 10) {
    const idsToDelete = allRecords.slice(10).map(r => r.id);
    
    for (const id of idsToDelete) {
      await db.delete(combatAnalytics).where(eq(combatAnalytics.id, id));
    }
  }
}

export async function getRecentCombatAnalytics(characterId: string, limit: number = 10, realmId?: string) {
  const base = await db
    .select()
    .from(combatAnalytics)
    .where(eq(combatAnalytics.characterId, characterId))
    .orderBy(desc(combatAnalytics.timestamp))
    .limit(limit);
  return realmId ? base.filter((r: any) => (r as any).realmId === realmId) : base;
}

export async function getCombatStatsSummary(characterId: string, realmId?: string) {
  const battles = await getRecentCombatAnalytics(characterId, 10, realmId);
  
  if (battles.length === 0) {
    return null;
  }
  
  const totalBattles = battles.length;
  const victories = battles.filter(b => b.victory && !b.fled).length;
  const defeats = battles.filter(b => !b.victory && !b.fled).length;
  const flees = battles.filter(b => b.fled).length;
  
  const totalDamageDealt = battles.reduce((sum, b) => sum + b.damageDealt, 0);
  const totalDamageTaken = battles.reduce((sum, b) => sum + b.damageTaken, 0);
  const totalXpGained = battles.reduce((sum, b) => sum + b.xpGained, 0);
  const totalRounds = battles.reduce((sum, b) => sum + b.roundsCount, 0);
  
  return {
    totalBattles,
    victories,
    defeats,
    flees,
    winRate: totalBattles > 0 ? Math.round((victories / totalBattles) * 100) : 0,
    avgDamageDealt: totalBattles > 0 ? Math.round(totalDamageDealt / totalBattles) : 0,
    avgDamageTaken: totalBattles > 0 ? Math.round(totalDamageTaken / totalBattles) : 0,
    avgRoundsPerBattle: totalBattles > 0 ? Math.round(totalRounds / totalBattles) : 0,
    totalXpGained,
  };
}

// Utility: compute summary from a provided battle list
export async function computeCombatSummary(battles: Array<any>) {
  if (!battles || battles.length === 0) return {
    totalBattles: 0,
    victories: 0,
    defeats: 0,
    flees: 0,
    winRate: 0,
    avgDamageDealt: 0,
    avgDamageTaken: 0,
    avgRoundsPerBattle: 0,
    totalXpGained: 0,
  };

  const totalBattles = battles.length;
  const victories = battles.filter(b => b.victory && !b.fled).length;
  const defeats = battles.filter(b => !b.victory && !b.fled).length;
  const flees = battles.filter(b => b.fled).length;
  const totalDamageDealt = battles.reduce((sum, b) => sum + b.damageDealt, 0);
  const totalDamageTaken = battles.reduce((sum, b) => sum + b.damageTaken, 0);
  const totalXpGained = battles.reduce((sum, b) => sum + b.xpGained, 0);
  const totalRounds = battles.reduce((sum, b) => sum + b.roundsCount, 0);

  return {
    totalBattles,
    victories,
    defeats,
    flees,
    winRate: totalBattles > 0 ? Math.round((victories / totalBattles) * 100) : 0,
    avgDamageDealt: totalBattles > 0 ? Math.round(totalDamageDealt / totalBattles) : 0,
    avgDamageTaken: totalBattles > 0 ? Math.round(totalDamageTaken / totalBattles) : 0,
    avgRoundsPerBattle: totalBattles > 0 ? Math.round(totalRounds / totalBattles) : 0,
    totalXpGained,
  };
}

export type CombatFilterResult = 'all' | 'victory' | 'defeat' | 'fled';

export async function getCombatAnalyticsFiltered(
  characterId: string,
  options: { since?: number; result?: CombatFilterResult; limit?: number } = {}
) {
  const { since, result = 'all', limit = 100 } = options;

  const conds: any[] = [eq(combatAnalytics.characterId, characterId)];
  if (since) conds.push(gt(combatAnalytics.timestamp, since));
  if (result === 'victory') {
    conds.push(eq(combatAnalytics.victory, true));
    conds.push(eq(combatAnalytics.fled, false));
  } else if (result === 'defeat') {
    conds.push(eq(combatAnalytics.victory, false));
    conds.push(eq(combatAnalytics.fled, false));
  } else if (result === 'fled') {
    conds.push(eq(combatAnalytics.fled, true));
  }

  return await db
    .select()
    .from(combatAnalytics)
    .where(and(...conds))
    .orderBy(desc(combatAnalytics.timestamp))
    .limit(limit);
}
