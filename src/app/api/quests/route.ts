export const dynamic = 'force-dynamic';
import { NextRequest } from 'next/server';
import { listQuests } from '@/services/questService';

/**
 * GET /api/quests?characterId=xxx
 * Get all quests for a character
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const characterId = searchParams.get('characterId');

    if (!characterId) {
      return new Response(
        JSON.stringify({ ok: false, error: 'Missing characterId parameter' }),
        { status: 400, headers: { 'content-type': 'application/json' } }
      );
    }

    const quests = await listQuests(characterId);

    return new Response(
      JSON.stringify({ ok: true, quests }),
      { status: 200, headers: { 'content-type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error listing quests:', error);
    return new Response(
      JSON.stringify({ ok: false, error: 'Internal server error' }),
      { status: 500, headers: { 'content-type': 'application/json' } }
    );
  }
}

