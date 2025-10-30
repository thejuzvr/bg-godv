import { NextRequest, NextResponse } from 'next/server';
import * as storage from '../../../../../server/storage';
import type { Character } from '@/types/character';

/**
 * POST /api/divine/suggest-travel
 * Suggest travel destination to character
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { characterId, destinationId } = body;

    if (!characterId || !destinationId) {
      return NextResponse.json(
        { ok: false, error: 'Missing characterId or destinationId' },
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
    character.divineSuggestion = 'Путешествовать';
    character.divineDestinationId = destinationId;

    await storage.saveCharacter(character);

    return NextResponse.json({
      ok: true,
      message: 'Travel suggestion sent',
    });
  } catch (error: any) {
    console.error('Error suggesting travel:', error);
    return NextResponse.json(
      { ok: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
