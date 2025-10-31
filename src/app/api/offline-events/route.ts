import { NextRequest, NextResponse } from 'next/server';
import * as storage from '../../../../server/storage';

/**
 * GET /api/offline-events?characterId=xxx&limit=20
 * Get offline events for character
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const characterId = searchParams.get('characterId');
    const limit = parseInt(searchParams.get('limit') || '20');

    if (!characterId) {
      return NextResponse.json(
        { ok: false, error: 'Missing characterId parameter' },
        { status: 400 }
      );
    }

    const events = await storage.getOfflineEvents(characterId, limit);

    return NextResponse.json({
      ok: true,
      events: events || [],
    });
  } catch (error: any) {
    console.error('Error fetching offline events:', error);
    return NextResponse.json(
      { ok: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
