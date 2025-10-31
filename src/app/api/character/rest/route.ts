import { NextRequest, NextResponse } from 'next/server';
import * as storage from '../../../../../server/storage';
import type { Character } from '@/types/character';

/**
 * POST /api/character/rest
 * Rest to restore health, magicka, and stamina
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { characterId, duration } = body;

    if (!characterId) {
      return NextResponse.json(
        { ok: false, error: 'Missing characterId' },
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

    // Set sleep duration (default 1 hour = 3600000ms)
    const restDuration = duration || 3600000;
    character.sleepUntil = Date.now() + restDuration;
    character.status = 'resting';

    // Restore some stats immediately (or could be done by worker later)
    const restoreAmount = 0.5; // 50% restoration
    character.stats.health.current = Math.min(
      character.stats.health.max,
      character.stats.health.current + character.stats.health.max * restoreAmount
    );
    character.stats.magicka.current = Math.min(
      character.stats.magicka.max,
      character.stats.magicka.current + character.stats.magicka.max * restoreAmount
    );
    character.stats.stamina.current = Math.min(
      character.stats.stamina.max,
      character.stats.stamina.current + character.stats.stamina.max * restoreAmount
    );

    character.lastUpdatedAt = Date.now();
    await storage.saveCharacter(character);

    return NextResponse.json({
      ok: true,
      message: 'Character is resting',
      character,
    });
  } catch (error: any) {
    console.error('Error resting:', error);
    return NextResponse.json(
      { ok: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
