import { NextRequest, NextResponse } from 'next/server';
import * as storage from '../../../../../server/storage';
import type { Character } from '@/types/character';
import { allPerks } from '@/data/perks';

/**
 * POST /api/character/unlock-perk
 * Unlock a perk
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { characterId, perkId } = body;

    if (!characterId || !perkId) {
      return NextResponse.json(
        { ok: false, error: 'Missing characterId or perkId' },
        { status: 400 }
      );
    }

    const charData = await storage.getCharacterById(characterId);
    if (!charData) {
      return NextResponse.json(
        { ok: false, error: 'Character not found' },
        { status: 404 }
      );
    }

    const character: Character = charData as any;
    
    if (!character.unlockedPerks) {
      character.unlockedPerks = [];
    }

    if (character.unlockedPerks.includes(perkId)) {
      return NextResponse.json(
        { ok: false, error: 'Perk already unlocked' },
        { status: 400 }
      );
    }

    const perk = allPerks.find((p) => p.id === perkId);
    if (!perk) {
      return NextResponse.json(
        { ok: false, error: 'Perk not found' },
        { status: 404 }
      );
    }

    // Check requirements (simplified - можно добавить более сложную логику)
    if (perk.skillReq) {
      const skillValue = (character.skills as any)[perk.skillReq.skill];
      if (skillValue < perk.skillReq.level) {
        return NextResponse.json(
          { ok: false, error: `Requires ${perk.skillReq.skill} level ${perk.skillReq.level}` },
          { status: 400 }
        );
      }
    }

    character.unlockedPerks.push(perkId);
    character.lastUpdatedAt = Date.now();
    await storage.saveCharacter(character);

    return NextResponse.json({
      ok: true,
      message: `Unlocked perk: ${perk.name}`,
      character,
    });
  } catch (error: any) {
    console.error('Error unlocking perk:', error);
    return NextResponse.json(
      { ok: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
