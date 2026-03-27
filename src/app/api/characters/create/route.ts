import { NextRequest, NextResponse } from 'next/server';
import * as storage from '../../../../../server/storage';
import type { Character } from '@/types/character';

/**
 * POST /api/characters/create
 * Create new character for authenticated user
 */
export async function POST(request: NextRequest) {
  try {
    // Get session
    const sessionToken = request.cookies.get('session_token')?.value;
    if (!sessionToken) {
      return NextResponse.json(
        { ok: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const session = await storage.getSession(sessionToken);
    if (!session || session.expiresAt < Date.now()) {
      return NextResponse.json(
        { ok: false, error: 'Invalid or expired session' },
        { status: 401 }
      );
    }

    // Check if user already has a character
    const existingChar = await storage.getCharacterById(session.userId);
    if (existingChar) {
      return NextResponse.json(
        { ok: false, error: 'Character already exists' },
        { status: 409 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { name, gender, race, backstory, patronDeity, attributes } = body;

    // Validation
    if (!name || !gender || !race || !backstory || !patronDeity || !attributes) {
      return NextResponse.json(
        { ok: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (name.length < 3 || name.length > 20) {
      return NextResponse.json(
        { ok: false, error: 'Name must be 3-20 characters' },
        { status: 400 }
      );
    }

    if (backstory.length < 20) {
      return NextResponse.json(
        { ok: false, error: 'Backstory must be at least 20 characters' },
        { status: 400 }
      );
    }

    // Validate attributes total
    const totalPoints =
      attributes.strength + attributes.agility + attributes.intelligence + attributes.endurance;
    if (totalPoints !== 100) {
      return NextResponse.json(
        { ok: false, error: 'Attributes must total 100 points' },
        { status: 400 }
      );
    }

    // Create character with initial stats based on attributes
    const now = Date.now();
    const character: Partial<Character> = {
      id: session.userId,
      userId: session.userId,
      realmId: 'global',
      name: name.trim(),
      gender,
      race,
      backstory: backstory.trim(),
      patronDeity,
      level: 1,
      xp: { current: 0, required: 100 },
      stats: {
        health: { current: 100 + attributes.endurance * 2, max: 100 + attributes.endurance * 2 },
        magicka: {
          current: 50 + attributes.intelligence * 2,
          max: 50 + attributes.intelligence * 2
        },
        stamina: { current: 100 + attributes.agility, max: 100 + attributes.agility },
        fatigue: { current: 0, max: 100 }
      },
      attributes,
      skills: {
        oneHanded: 15,
        block: 15,
        heavyArmor: 15,
        lightArmor: 15,
        persuasion: 15,
        alchemy: 15
      },
      points: {
        attribute: 0,
        skill: 0
      },
      location: 'whiterun',
      status: 'idle',
      inventory: [{ id: 'gold', name: 'Золото', type: 'gold', quantity: 100, weight: 0 }],
      equippedItems: {},
      factions: {},
      combat: null,
      sleepUntil: null,
      respawnAt: null,
      deathOccurredAt: null,
      activeSovngardeQuest: null,
      activeCryptQuest: null,
      currentAction: null,
      createdAt: now,
      lastUpdatedAt: now,
      deaths: 0,
      effects: [],
      knownSpells: [],
      interventionPower: { current: 100, max: 100 },
      divineSuggestion: null,
      divineDestinationId: null,
      divineFavor: 0,
      templeProgress: 0,
      templeCompletedFor: null,
      relationships: {},
      pendingTravel: null,
      completedQuests: [],
      season: 'Summer',
      weather: 'Clear',
      timeOfDay: 'day',
      actionCooldowns: {},
      visitedLocations: ['whiterun'],
      gameDate: now,
      mood: 50,
      craftingLevel: 1,
      craftingXp: 0,
      craftingPoints: 0,
      unlockedRecipes: [],
      unlockedPerks: [],
      preferences: {},
      analytics: {
        killedEnemies: {},
        diceRolls: { d20: Array(21).fill(0) },
        encounteredEnemies: [],
        epicPhrases: []
      },
      actionHistory: [],
      lastProcessedAt: null,
      isActive: true,
      hasSeenWelcomeMessage: false,
      lastLocationArrival: now,
      hasCompletedLocationActivity: false,
      companions: [],
      activeCompanion: null
    };

    // Save character
    await storage.saveCharacter(character as Character);

    return NextResponse.json({
      ok: true,
      character
    });
  } catch (error: any) {
    console.error('Character creation error:', error);
    return NextResponse.json(
      { ok: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
