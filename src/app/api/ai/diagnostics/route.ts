'use server';

import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/services/authService';
import { fetchCharacter } from '@/app/dashboard/shared-actions';
import { fetchGameData, type GameData } from '@/services/gameDataService';
import type { Character } from '@/types/character';
import { listPossibleActions } from '@/ai/diagnostics';
import { DEFAULT_POLICY_CONFIG } from '@/ai/policy.config';
import { applyVarietyBoost } from '@/ai/policy';
import { processGameTick } from '@/ai/game-engine';

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || !user.isAdmin) {
    return null;
  }
  return user;
}

export async function GET(req: Request) {
  try {
    const user = await requireAdmin();
    if (!user) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

    const url = new URL(req.url);
    const ticksParam = url.searchParams.get('ticks');
    const ticks = Math.max(0, Math.min(1000, parseInt(ticksParam || '0', 10) || 0));

    const [character, gameData] = await Promise.all([
      fetchCharacter(user.userId) as Promise<Character | null>,
      fetchGameData() as Promise<GameData>,
    ]);
    if (!character) return NextResponse.json({ error: 'no_character' }, { status: 404 });

    // Snapshot of candidate actions and weights (base + variety)
    const possible = listPossibleActions(character, gameData);
    const baseItems = possible.map(a => ({ action: a, baseWeight: DEFAULT_POLICY_CONFIG.categoryBaseWeights[a.type] ?? 1.0 }));
    const withVariety = applyVarietyBoost(baseItems as any, character, DEFAULT_POLICY_CONFIG.recentWindow) as Array<{ action: any; weight: number }>;
    const actions = withVariety.map(({ action, weight }) => ({ name: action.name, type: action.type, weight }));

    // Optional simulation of N ticks
    let simulation: any = null;
    if (ticks > 0) {
      let tempChar: Character = structuredClone(character);
      const freq: Record<string, number> = {};
      let prevLen = tempChar.actionHistory?.length || 0;
      for (let i = 0; i < ticks; i++) {
        const res = await processGameTick(tempChar, gameData);
        tempChar = res.updatedCharacter;
        const hist = tempChar.actionHistory || [];
        const newLen = hist.length;
        if (newLen >= prevLen) {
          for (let j = prevLen; j < newLen; j++) {
            const entry = hist[j];
            if (entry) freq[entry.type] = (freq[entry.type] || 0) + 1;
          }
          prevLen = newLen;
        } else {
          // circular buffer trimmed; reset baseline
          prevLen = newLen;
        }
      }
      simulation = { ticks, frequencies: freq };
    }

    const snapshot = {
      id: character.id,
      name: character.name,
      status: character.status,
      location: character.location,
      hp: `${character.stats.health.current}/${character.stats.health.max}`,
      mp: `${character.stats.magicka.current}/${character.stats.magicka.max}`,
      sp: `${character.stats.stamina.current}/${character.stats.stamina.max}`,
      mood: character.mood,
      timeOfDay: character.timeOfDay,
      weather: character.weather,
      disease: character.effects.find(e => e.id === 'disease_vampirism' || e.id === 'disease_lycanthropy') || null,
    };

    return NextResponse.json({ snapshot, actions, simulation });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'internal_error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireAdmin();
    if (!user) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    const body = await req.json().catch(() => ({}));
    const ticks = Math.max(1, Math.min(1000, Number(body?.ticks) || 100));

    const [character, gameData] = await Promise.all([
      fetchCharacter(user.userId) as Promise<Character | null>,
      fetchGameData() as Promise<GameData>,
    ]);
    if (!character) return NextResponse.json({ error: 'no_character' }, { status: 404 });

    let tempChar: Character = structuredClone(character);
    const freq: Record<string, number> = {};
    for (let i = 0; i < ticks; i++) {
      const res = await processGameTick(tempChar, gameData);
      tempChar = res.updatedCharacter;
      const last = tempChar.actionHistory?.slice(-1)[0];
      if (last) freq[last.type] = (freq[last.type] || 0) + 1;
    }

    return NextResponse.json({ ticks, frequencies: freq });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'internal_error' }, { status: 500 });
  }
}


