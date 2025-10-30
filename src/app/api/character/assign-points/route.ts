import { NextRequest, NextResponse } from 'next/server';
import * as storage from '../../../../../server/storage';
import type { Character } from '@/types/character';

/**
 * POST /api/character/assign-points
 * Assign attribute or skill points
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { characterId, pointType, targetStat, amount } = body;

    if (!characterId || !pointType || !targetStat || !amount) {
      return NextResponse.json(
        { ok: false, error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    if (pointType !== 'attribute' && pointType !== 'skill') {
      return NextResponse.json(
        { ok: false, error: 'Invalid pointType. Must be "attribute" or "skill"' },
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

    if (pointType === 'attribute') {
      if (!character.attributes.hasOwnProperty(targetStat)) {
        return NextResponse.json(
          { ok: false, error: 'Invalid attribute' },
          { status: 400 }
        );
      }

      if (character.points.attribute < amount) {
        return NextResponse.json(
          { ok: false, error: 'Not enough attribute points' },
          { status: 400 }
        );
      }

      (character.attributes as any)[targetStat] += amount;
      character.points.attribute -= amount;
    } else {
      if (!character.skills.hasOwnProperty(targetStat)) {
        return NextResponse.json(
          { ok: false, error: 'Invalid skill' },
          { status: 400 }
        );
      }

      if (character.points.skill < amount) {
        return NextResponse.json(
          { ok: false, error: 'Not enough skill points' },
          { status: 400 }
        );
      }

      (character.skills as any)[targetStat] += amount;
      character.points.skill -= amount;
    }

    character.lastUpdatedAt = Date.now();
    await storage.saveCharacter(character);

    return NextResponse.json({
      ok: true,
      message: `Assigned ${amount} points to ${targetStat}`,
      character,
    });
  } catch (error: any) {
    console.error('Error assigning points:', error);
    return NextResponse.json(
      { ok: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
