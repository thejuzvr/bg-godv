import { NextRequest, NextResponse } from 'next/server';
import * as storage from '../../../../../server/storage';
import type { Character } from '@/types/character';

/**
 * POST /api/character/drop-item
 * Drop/delete an item from inventory
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { characterId, itemId, quantity } = body;

    if (!characterId || !itemId) {
      return NextResponse.json(
        { ok: false, error: 'Missing characterId or itemId' },
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
    const inventoryItem = character.inventory.find((i) => i.id === itemId);

    if (!inventoryItem) {
      return NextResponse.json(
        { ok: false, error: 'Item not in inventory' },
        { status: 400 }
      );
    }

    const dropQuantity = quantity || inventoryItem.quantity;

    if (dropQuantity >= inventoryItem.quantity) {
      // Remove completely
      character.inventory = character.inventory.filter((i) => i.id !== itemId);
    } else {
      // Reduce quantity
      inventoryItem.quantity -= dropQuantity;
    }

    character.lastUpdatedAt = Date.now();
    await storage.saveCharacter(character);

    return NextResponse.json({
      ok: true,
      message: `Dropped ${dropQuantity}x ${inventoryItem.name}`,
      character,
    });
  } catch (error: any) {
    console.error('Error dropping item:', error);
    return NextResponse.json(
      { ok: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
