'use server';

import { db } from '../../server/storage';
import { combatAnalytics } from '../../shared/schema';
import type { NewCombatAnalytics } from '../../shared/schema';
import { desc, eq } from 'drizzle-orm';

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

export async function getRecentCombatAnalytics(characterId: string, limit: number = 10) {
  return await db
    .select()
    .from(combatAnalytics)
    .where(eq(combatAnalytics.characterId, characterId))
    .orderBy(desc(combatAnalytics.timestamp))
    .limit(limit);
}

export async function getCombatStatsSummary(characterId: string) {
  const battles = await getRecentCombatAnalytics(characterId, 10);
  
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
