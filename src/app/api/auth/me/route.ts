import { NextRequest, NextResponse } from 'next/server';
import * as storage from '../../../../../server/storage';

/**
 * GET /api/auth/me
 * Get current authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get('session_token')?.value;

    if (!sessionToken) {
      return NextResponse.json(
        { ok: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Get session
    const session = await storage.getSession(sessionToken);
    if (!session) {
      return NextResponse.json(
        { ok: false, error: 'Invalid session' },
        { status: 401 }
      );
    }

    // Check if session expired
    if (session.expiresAt < Date.now()) {
      await storage.deleteSession(sessionToken);
      return NextResponse.json(
        { ok: false, error: 'Session expired' },
        { status: 401 }
      );
    }

    // Get user
    const user = await storage.getUserById(session.userId);
    if (!user) {
      return NextResponse.json(
        { ok: false, error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ok: true,
      user: {
        id: user.id,
        email: user.email,
        isAdmin: user.isAdmin,
      },
    });
  } catch (error: any) {
    console.error('Get user error:', error);
    return NextResponse.json(
      { ok: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
