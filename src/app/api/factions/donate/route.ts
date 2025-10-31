import { NextRequest, NextResponse } from 'next/server';
import { donateToFaction as donateCmd } from '../../../../../server/commands/temple-donation';

/**
 * POST /api/factions/donate
 * Donate gold to faction or deity temple
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { characterId, factionId, amount } = body;

    if (!characterId || !factionId || !amount) {
      return NextResponse.json(
        { ok: false, error: 'Missing characterId, factionId, or amount' },
        { status: 400 }
      );
    }

    if (typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json(
        { ok: false, error: 'Amount must be a positive number' },
        { status: 400 }
      );
    }

    const result = await donateCmd(characterId, { factionId, amount });

    if (!result.success) {
      return NextResponse.json(
        { ok: false, error: result.error || 'Unknown error' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      ok: true,
      message: result.data!.message,
    });
  } catch (error: any) {
    console.error('Error donating to faction:', error);
    return NextResponse.json(
      { ok: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
