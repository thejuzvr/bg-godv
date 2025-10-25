import { NextRequest, NextResponse } from 'next/server';
import { listQuests } from '@/services/questService';
import { validateSession } from '@/lib/auth';

/**
 * GET /api/quests?characterId=xxx
 * Get all quests for a character
 */
export async function GET(request: NextRequest) {
  try {
    const session = await validateSession();
    if (!session) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const characterId = searchParams.get('characterId');

    if (!characterId) {
      return NextResponse.json(
        { ok: false, error: 'Missing characterId parameter' },
        { status: 400 }
      );
    }

    const quests = await listQuests(characterId);

    return NextResponse.json({
      ok: true,
      quests
    });

  } catch (error) {
    console.error('Error listing quests:', error);
    return NextResponse.json(
      { ok: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
