'use server';

import { NextResponse } from 'next/server';
import { computeCombatSummary, getCombatAnalyticsFiltered, getCombatStatsSummary, getRecentCombatAnalytics } from '@/services/combatAnalyticsService';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const characterId = searchParams.get('characterId');
        const period = searchParams.get('period'); // '24h' | '7d' | '30d'
        const result = (searchParams.get('result') as any) || 'all'; // 'all' | 'victory' | 'defeat' | 'fled'
        if (!characterId) {
            return NextResponse.json({ error: 'characterId required' }, { status: 400 });
        }

        if (!period && (!result || result === 'all')) {
            const [summary, recent] = await Promise.all([
                getCombatStatsSummary(characterId),
                getRecentCombatAnalytics(characterId, 10),
            ]);
            return NextResponse.json({ summary, recent });
        }

        let since: number | undefined;
        if (period === '24h') since = Date.now() - 24 * 60 * 60 * 1000;
        if (period === '7d') since = Date.now() - 7 * 24 * 60 * 60 * 1000;
        if (period === '30d') since = Date.now() - 30 * 24 * 60 * 60 * 1000;

        const filtered = await getCombatAnalyticsFiltered(characterId, { since, result, limit: 200 });

        const perEnemy: Record<string, { enemyName: string; battles: number; wins: number; flees: number; defeats: number; avgDealt: number; avgTaken: number; avgRounds: number; winRate: number }> = {};
        for (const b of filtered) {
            const key = b.enemyId;
            if (!perEnemy[key]) {
                perEnemy[key] = { enemyName: b.enemyName, battles: 0, wins: 0, flees: 0, defeats: 0, avgDealt: 0, avgTaken: 0, avgRounds: 0, winRate: 0 };
            }
            const agg = perEnemy[key];
            agg.battles += 1;
            if (b.fled) agg.flees += 1; else if (b.victory) agg.wins += 1; else agg.defeats += 1;
            agg.avgDealt += b.damageDealt;
            agg.avgTaken += b.damageTaken;
            agg.avgRounds += b.roundsCount;
        }
        const perEnemyArray = Object.entries(perEnemy).map(([enemyId, agg]) => ({
            enemyId,
            enemyName: agg.enemyName,
            battles: agg.battles,
            wins: agg.wins,
            defeats: agg.defeats,
            flees: agg.flees,
            winRate: agg.battles > 0 ? Math.round((agg.wins / agg.battles) * 100) : 0,
            avgDealt: agg.battles > 0 ? Math.round(agg.avgDealt / agg.battles) : 0,
            avgTaken: agg.battles > 0 ? Math.round(agg.avgTaken / agg.battles) : 0,
            avgRounds: agg.battles > 0 ? Math.round(agg.avgRounds / agg.battles) : 0,
        })).sort((a, b) => b.battles - a.battles);

        const summary = await computeCombatSummary(filtered);

        return NextResponse.json({ summary, recent: filtered.slice(0, 10), perEnemy: perEnemyArray });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch combat analytics' }, { status: 500 });
    }
}


