import { NextRequest, NextResponse } from 'next/server';
import * as storage from '../../../../../server/storage';
import type { Character } from '@/types/character';
import { allItems } from '@/data/items';

/**
 * POST /api/character/use-item
 * Use a consumable item (potion, food, etc)
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
    if (!itemData) {
      return NextResponse.json(
        { ok: false, error: 'Item not found' },
        { status: 404 }
      );
    }

    // Check if item is consumable
    if (itemData.type !== 'potion' && itemData.type !== 'food') {
      return NextResponse.json(
        { ok: false, error: 'Item is not consumable' },
        { status: 400 }
      );
    }

    // Apply effect
    if (itemData.effect) {
      const effect = itemData.effect;
      
      if (effect.type === 'heal') {
        if (effect.stat === 'health') {
          character.stats.health.current = Math.min(
            character.stats.health.max,
            character.stats.health.current + effect.amount
          );
        } else if (effect.stat === 'magicka') {
          character.stats.magicka.current = Math.min(
            character.stats.magicka.max,
            character.stats.magicka.current + effect.amount
          );
        } else if (effect.stat === 'stamina') {
          character.stats.stamina.current = Math.min(
            character.stats.stamina.max,
            character.stats.stamina.current + effect.amount
          );
        }
      } else if (effect.type === 'buff' && effect.duration) {
        // Add timed effect
        const newEffect = {
          id: effect.id || `effect_${Date.now()}`,
          name: itemData.name,
          description: effect.description || '',
          icon: effect.icon || 'Sparkles',
          type: 'buff' as const,
          expiresAt: Date.now() + effect.duration,
          value: effect.amount,
        };
        character.effects.push(newEffect);
      }
    }

    // Remove item from inventory
    inventoryItem.quantity -= 1;
    if (inventoryItem.quantity <= 0) {
      character.inventory = character.inventory.filter((i) => i.id !== itemId);
    }

    character.lastUpdatedAt = Date.now();
    await storage.saveCharacter(character);

    return NextResponse.json({
      ok: true,
      message: `Used ${itemData.name}`,
      character,
    });
  } catch (error: any) {
    console.error('Error using item:', error);
    return NextResponse.json(
      { ok: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
