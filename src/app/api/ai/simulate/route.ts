import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/services/authService';
import { fetchGameData, type GameData } from '@/services/gameDataService';
import type { Character } from '@/types/character';
import { buildGameDataForSimulation, createTestCharacter, simulateSingleTick, runSimulation } from '@/ai/simulator';

type Body = {
  mode: 'single' | 'batch';
  ticks?: number;
  profileCode?: string;
  character?: {
    id?: string;
    name?: string;
    archetype?: string;
    profileCode?: string;
    location?: string;
    hp?: { current: number; max: number };
    stamina?: { current: number; max: number };
    flags?: { tired?: boolean; overencumbered?: boolean };
  };
};

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || !user.isAdmin) return null;
  return user;
}

export async function POST(req: Request) {
  try {
    const user = await requireAdmin();
    if (!user) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

    const body = (await req.json().catch(() => ({}))) as Body;
    const mode = body.mode || 'single';
    const ticks = Math.max(1, Math.min(2000, Number(body.ticks || (mode === 'batch' ? 100 : 1))));

    const baseData = await fetchGameData();
    // Create synthetic character from request params
    const synth: Character = createTestCharacter({
      id: body.character?.id,
      name: body.character?.name,
      backstory: (body.character as any)?.archetype || 'warrior',
      location: body.character?.location,
      hp: body.character?.hp,
      stamina: body.character?.stamina,
      flags: body.character?.flags,
    }, baseData);

    if (mode === 'single') {
      const res = await simulateSingleTick(synth, body.profileCode);
      return NextResponse.json({
        ok: true,
        character: res.updatedCharacter,
        logs: { adventure: res.adventureLog, combat: res.combatLog },
        scores: res.scores.map(s => ({
          actionId: s.actionId,
          name: s.name,
          base: s.breakdown.base,
          ruleBoost: s.breakdown.ruleBoost,
          profile: s.breakdown.profile,
          fatigue: s.breakdown.fatigue,
          modifiers: s.breakdown.modifiers,
          total: s.breakdown.total,
        })),
      });
    }

    // Batch
    const result = await runSimulation(synth, ticks);
    return NextResponse.json({ ok: true, ...result });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'internal_error' }, { status: 500 });
  }
}


