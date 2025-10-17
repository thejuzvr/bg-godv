export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { getCharacterById } from '@/../server/storage';
import { listPossibleActions } from '@/ai/diagnostics';
import { ACTION_CATALOG } from '@/ai/action-catalog';
import { computeActionScores } from '@/ai/priority-engine';
import { recordDecisionTrace, getLastDecisionTrace } from '@/ai/diagnostics';
import { fetchGameData } from '@/services/gameDataService';
import { AI_BT_ENABLED } from '@/ai/config/constants';
import { buildBehaviorTree } from '@/ai/bt/tree';
import type { ActionLike } from '@/ai/bt/types';
import { getBtSettings } from '@/ai/config/runtime';
import { combatActions, deadActions, idleActions } from '@/ai/brain';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const characterId = searchParams.get('characterId');
  const top = Number(searchParams.get('top') || '10');
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
  let btTrace: string[] = [];
  try {
    if (AI_BT_ENABLED) {
      const toAL = (a: any) => a as ActionLike;
      const settings = await getBtSettings();
      const arrival = [
        idleActions.find(a => a.name === 'Взять задание'),
        idleActions.find(a => a.name === 'Отдохнуть в таверне'),
        idleActions.find(a => a.name === 'Торговать с торговцем'),
        idleActions.find(a => a.name === 'Пообщаться с NPC'),
      ].filter(Boolean).map(toAL);
      const night = [
        idleActions.find(a => a.name === 'Взять задание'),
        idleActions.find(a => a.name === 'Отдохнуть в таверне'),
        idleActions.find(a => a.name === 'Путешествовать'),
      ].filter(Boolean).map(toAL);
      const travel = idleActions.find(a => a.name === 'Путешествовать') as any;
      const tree = buildBehaviorTree({
        combatActions: combatActions.map(toAL),
        deadActions: deadActions.map(toAL),
        arrivalActions: arrival,
        nightActions: night,
        idleActions: idleActions.map(toAL),
        travelAction: toAL(travel),
        arrivalWindowMs: settings.arrivalWindowMs,
        stallWindowMs: settings.stallWindowMs,
      });
      // Minimal world state for inspection: reuse char.status and timeOfDayEffect from brain helper
      const world = { isIdle: char.status === 'idle', timeOfDayEffect: { npcAvailability: char.timeOfDay !== 'night' } } as any;
      const bb = { character: char as any, worldState: world, gameData, trace: [] as string[] };
      await tree.evaluate(bb);
      btTrace = bb.trace || [];
    }
  } catch {}
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
