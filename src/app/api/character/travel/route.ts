import { NextRequest, NextResponse } from 'next/server';
import * as storage from '../../../../../server/storage';
import type { Character } from '@/types/character';
import { allLocations } from '@/data/locations';

/**
 * POST /api/character/travel
 * Initiate travel to a location
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
    const destination = allLocations.find((l) => l.id === destinationId);

    if (!destination) {
      return NextResponse.json(
        { ok: false, error: 'Destination not found' },
        { status: 404 }
      );
    }

    // Check if already at destination
    if (character.location === destinationId) {
      return NextResponse.json(
        { ok: false, error: 'Already at this location' },
        { status: 400 }
      );
    }

    // Calculate travel duration based on distance
    const baseDuration = destination.travelDistance || 100;
    const travelDuration = baseDuration * 1000; // Convert to milliseconds

    // Set pending travel
    character.pendingTravel = {
      destinationId,
      remainingDuration: travelDuration,
      originalDuration: travelDuration,
    };
    character.status = 'traveling';
    character.lastUpdatedAt = Date.now();

    await storage.saveCharacter(character);

    return NextResponse.json({
      ok: true,
      message: `Traveling to ${destination.name}`,
      character,
      travelDuration,
    });
  } catch (error: any) {
    console.error('Error initiating travel:', error);
    return NextResponse.json(
      { ok: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
