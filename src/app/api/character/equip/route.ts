import { NextRequest, NextResponse } from 'next/server';
import * as storage from '../../../../../server/storage';
import type { Character } from '@/types/character';
import { allItems } from '@/data/items';

/**
 * POST /api/character/equip
 * Equip an item
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { characterId, itemId } = body;

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

    const itemData = allItems.find((i) => i.id === itemId);
    if (!itemData?.equipmentSlot) {
      return NextResponse.json(
        { ok: false, error: 'Item cannot be equipped' },
        { status: 400 }
      );
    }

    // Unequip current item in slot if exists
    if (character.equippedItems[itemData.equipmentSlot]) {
      delete character.equippedItems[itemData.equipmentSlot];
    }

    // Equip new item
    character.equippedItems[itemData.equipmentSlot] = itemId;
    character.lastUpdatedAt = Date.now();

    await storage.saveCharacter(character);

    return NextResponse.json({
      ok: true,
      message: `Equipped ${itemData.name}`,
      character,
    });
  } catch (error: any) {
    console.error('Error equipping item:', error);
    return NextResponse.json(
      { ok: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
