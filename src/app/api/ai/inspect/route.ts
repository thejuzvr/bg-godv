export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { getCharacterById } from '@/../server/storage';
import { listPossibleActions } from '@/ai/diagnostics';
import { ACTION_CATALOG } from '@/ai/action-catalog';
import { computeActionScores } from '@/ai/priority-engine';
import { recordDecisionTrace, getLastDecisionTrace } from '@/ai/diagnostics';
import { fetchGameData } from '@/services/gameDataService';
import { combatActions, deadActions, idleActions } from '@/ai/brain';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const characterId = searchParams.get('characterId');
  const top = Number(searchParams.get('top') || '10');
  const coverage = searchParams.get('coverage') === '1';
  if (!characterId) {
    return new Response(JSON.stringify({ error: 'characterId is required' }), { status: 400 });
  }
  const char = await getCharacterById(characterId);
  if (!char) {
    return new Response(JSON.stringify({ error: 'character not found' }), { status: 404 });
  }
  const gameData = await fetchGameData();

  // Prefer last decision trace when available
  const cached = getLastDecisionTrace(characterId);
  if (cached && cached.entries?.length) {
    const entries = cached.entries.slice(0, top);
    return new Response(JSON.stringify({ characterId, timestamp: cached.timestamp, entries }), { headers: { 'content-type': 'application/json' } });
  }

  // Otherwise recompute quickly from possible actions
  const possible = listPossibleActions(char as any, gameData);
  const catalog = possible.map((a, idx) => ({ id: `${a.type}:${a.name}`, category: a.type as any, action: a as any }));
  const scored = await computeActionScores({ character: char as any, actions: catalog, profileCode: 'warrior' });
  recordDecisionTrace(characterId, scored.map(s => ({
    actionId: s.actionId,
    name: s.name,
    base: s.breakdown.base,
    ruleBoost: s.breakdown.ruleBoost,
    profile: s.breakdown.profile,
    fatigue: s.breakdown.fatigue,
    modifiers: s.breakdown.modifiers,
    total: s.breakdown.total,
  })));
  const btTrace: string[] = [];
  if (coverage) {
    const coverageReport = {
      shoutsKnown: Array.isArray((gameData as any).shouts) ? (gameData as any).shouts.length : 0,
      perksKnown: Array.isArray((gameData as any).perks) ? (gameData as any).perks.length : 0,
      spellsKnown: Array.isArray((gameData as any).spells) ? (gameData as any).spells.length : 0,
      actionsTotal: possible.length,
    };
    return new Response(JSON.stringify({ characterId, timestamp: Date.now(), btTrace, coverage: coverageReport, entries: scored.slice(0, top) }), { headers: { 'content-type': 'application/json' } });
  }

  return new Response(JSON.stringify({ characterId, timestamp: Date.now(), btTrace, entries: scored.slice(0, top).map(s => s.breakdown ? ({
    actionId: s.actionId,
    name: s.name,
    base: s.breakdown.base,
    ruleBoost: s.breakdown.ruleBoost,
    profile: s.breakdown.profile,
    fatigue: s.breakdown.fatigue,
    modifiers: s.breakdown.modifiers,
    total: s.breakdown.total,
  }) : ({ actionId: s.actionId, name: s.name, base: 0, ruleBoost: 0, profile: 1, fatigue: 1, modifiers: 1, total: s.score })) }), { headers: { 'content-type': 'application/json' } });
}
