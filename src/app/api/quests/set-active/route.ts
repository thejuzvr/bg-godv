import { NextRequest, NextResponse } from 'next/server';
import { setActiveQuest } from '@/services/questService';
import { validateSession } from '@/lib/auth';

/**
 * POST /api/quests/set-active
 * Set a quest as the active quest for a character (Divine Intervention)
 * 
 * Body: { characterId: string, questId: string }
 */
export async function POST(request: NextRequest) {
  try {
    const session = await validateSession();
    if (!session) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { characterId, questId } = body;

    if (!characterId || !questId) {
      return NextResponse.json(
        { ok: false, error: 'Missing characterId or questId' },
        { status: 400 }
      );
    }

    // Set the quest as active
    const result = await setActiveQuest(characterId, questId);

    if (!result.ok) {
      return NextResponse.json(
        { ok: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      ok: true,
      quest: result.quest,
      message: 'Quest set as active successfully'
    });

  } catch (error) {
    console.error('Error setting active quest:', error);
    return NextResponse.json(
      { ok: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
