import { NextRequest, NextResponse } from 'next/server';
import * as storage from '../../../../../server/storage';

/**
 * POST /api/auth/logout
 * Logout user and delete session
 */
export async function POST(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get('session_token')?.value;

    if (sessionToken) {
      // Delete session from database
      await storage.deleteSession(sessionToken);
    }

    // Create response
    const response = NextResponse.json({
      ok: true,
      message: 'Logged out successfully',
    });

    // Clear session cookie
    response.cookies.delete('session_token');

    return response;
  } catch (error: any) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { ok: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
