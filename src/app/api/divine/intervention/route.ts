import { NextRequest, NextResponse } from 'next/server';
import { performDivineIntervention } from '../../../../../server/commands/divine-intervention';
import { addOfflineEvent } from '@/services/offlineEventsService';

/**
 * POST /api/divine/intervention
 * Perform divine intervention (bless or punish)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { characterId, type } = body;

    if (!characterId || !type) {
      return NextResponse.json(
        { ok: false, error: 'Missing characterId or type' },
        { status: 400 }
      );
    }

    if (type !== 'bless' && type !== 'punish') {
      return NextResponse.json(
        { ok: false, error: 'Invalid type. Must be "bless" or "punish"' },
        { status: 400 }
      );
    }

    const result = await performDivineIntervention(characterId, { type });

    if (!result.success) {
      return NextResponse.json(
        { ok: false, error: result.error || 'Unknown error' },
        { status: 400 }
      );
    }

    // Log offline event for visibility
    await addOfflineEvent(characterId, {
      type: 'divine',
      message: result.data!.actionDescription,
    } as any);

    return NextResponse.json({
      ok: true,
      message: result.data!.message,
      character: result.data!.character,
    });
  } catch (error: any) {
    console.error('Error performing intervention:', error);
    return NextResponse.json(
      { ok: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
