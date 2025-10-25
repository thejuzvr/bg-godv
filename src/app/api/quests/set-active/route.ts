import { NextRequest } from 'next/server';
import { setActiveQuest } from '@/services/questService';

/**
 * POST /api/quests/set-active
 * Set a quest as the active quest for a character (Divine Intervention)
 * 
 * Body: { characterId: string, questId: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { characterId, questId } = body;

    if (!characterId || !questId) {
      return new Response(
        JSON.stringify({ ok: false, error: 'Missing characterId or questId' }),
        { status: 400, headers: { 'content-type': 'application/json' } }
      );
    }

    // Set the quest as active
    const result = await setActiveQuest(characterId, questId);

    if (!result.ok) {
      return new Response(
        JSON.stringify({ ok: false, error: result.error }),
        { status: 400, headers: { 'content-type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        ok: true,
        quest: result.quest,
        message: 'Quest set as active successfully'
      }),
      { status: 200, headers: { 'content-type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error setting active quest:', error);
    return new Response(
      JSON.stringify({ ok: false, error: 'Internal server error' }),
      { status: 500, headers: { 'content-type': 'application/json' } }
    );
  }
}

