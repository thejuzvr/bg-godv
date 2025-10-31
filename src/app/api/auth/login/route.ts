import { NextRequest, NextResponse } from 'next/server';
import * as storage from '../../../../../server/storage';
import bcrypt from 'bcrypt';

/**
 * POST /api/auth/login
 * Login user and create session
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { ok: false, error: 'Missing email or password' },
        { status: 400 }
      );
    }

    // Get user by email
    const user = await storage.getUserByEmail(email);
    if (!user) {
      return NextResponse.json(
        { ok: false, error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Verify password
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return NextResponse.json(
        { ok: false, error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Create session
    const sessionToken = crypto.randomUUID();
    const expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000; // 30 days

    await storage.createSession(sessionToken, user.id, expiresAt);

    // Update last login
    await storage.updateUserLastLogin(user.id);

    // Create response with user data
    const response = NextResponse.json({
      ok: true,
      user: {
        id: user.id,
        email: user.email,
        isAdmin: user.isAdmin,
      },
    });

    // Set session cookie
    response.cookies.set('session_token', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: '/',
    });

    return response;
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json(
      { ok: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
