import { NextRequest, NextResponse } from 'next/server';
import * as storage from '../../../../../server/storage';
import type { Character } from '@/types/character';

/**
 * POST /api/character/unequip
 * Unequip an item
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { characterId, slot } = body;

    if (!characterId || !slot) {
      return NextResponse.json(
        { ok: false, error: 'Missing characterId or slot' },
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

    if (!character.equippedItems[slot]) {
      return NextResponse.json(
        { ok: false, error: 'No item equipped in that slot' },
        { status: 400 }
      );
    }

    delete character.equippedItems[slot];
    character.lastUpdatedAt = Date.now();

    await storage.saveCharacter(character);

    return NextResponse.json({
      ok: true,
      message: `Unequipped item from ${slot}`,
      character,
    });
  } catch (error: any) {
    console.error('Error unequipping item:', error);
    return NextResponse.json(
      { ok: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
