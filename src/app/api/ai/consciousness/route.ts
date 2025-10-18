export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { getCharacterById } from '@/../server/storage';
import { fetchGameData } from '@/services/gameDataService';
import { listPossibleActions, buildWorldState } from '@/ai/diagnostics';
import { initPersonality, getPersonalityModifier } from '@/ai/personality';
import { generateGoals, selectTopGoal } from '@/ai/goal-manager';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const characterId = searchParams.get('characterId');
  if (!characterId) {
    return new Response(JSON.stringify({ error: 'characterId is required' }), { status: 400 });
  }
  const char = await getCharacterById(characterId);
  if (!char) {
    return new Response(JSON.stringify({ error: 'character not found' }), { status: 404 });
  }
  const gameData = await fetchGameData();
  const world = buildWorldState(char as any, gameData);
  const personality = (char as any).personality || initPersonality((char as any).backstory);
  const goals = generateGoals(char as any, world);
  const currentGoal = selectTopGoal(goals);

  // goal boost mapping aligned with brain.ts
  const goalBoost = (actionName: string, actionType: string): number => {
    if (!currentGoal) return 1;
    switch (currentGoal.type) {
      case 'earn_gold':
        if (actionType === 'social' && (/Торговать|Продать|Распрощаться/.test(actionName))) return 2.0;
        if (actionType === 'quest') return 1.5;
        if (actionType === 'social' && /Украсть/.test(actionName)) return 1.3;
        return 1.0;
      case 'divine_favor':
        if (actionName.includes('Помолиться') || actionName.includes('Пожертвовать')) return 2.5;
        return 1.0;
      case 'heal':
        if (actionType === 'rest' || actionName.includes('Перекусить')) return 2.0;
        return 1.0;
      case 'equip_better':
        if (actionName.includes('Оценить снаряжение') || actionName.includes('Торговать')) return 1.8;
        return 1.0;
      case 'faction_rep':
        if (actionName.includes('Пожертвовать фракции') || actionName.includes('Пожертвовать в храме')) return 2.0;
        return 1.0;
      default:
        return 1.0;
    }
  };

  const actions = listPossibleActions(char as any, gameData);
  const weights = actions.map(a => {
    const base = Math.max(0, a.getWeight ? a.getWeight(char as any, world as any, gameData as any) : 0);
    const pMod = getPersonalityModifier(personality, a.type);
    const gMod = goalBoost(a.name, a.type);
    return { id: `${a.type}:${a.name}`, name: a.name, type: a.type, base, personality: pMod, goal: gMod, final: base * pMod * gMod };
  }).sort((x, y) => y.final - x.final).slice(0, 12);

  return new Response(JSON.stringify({
    characterId,
    timestamp: Date.now(),
    personality,
    currentGoal,
    weights,
  }), { headers: { 'content-type': 'application/json' } });
}


