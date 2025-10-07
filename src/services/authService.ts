'use server';

import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import * as storage from '../../server/storage';
import { cookies } from 'next/headers';

const SALT_ROUNDS = 10;
const SESSION_COOKIE_NAME = 'session_token';
const SESSION_EXPIRY = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds

export async function register(email: string, password: string): Promise<{ success: boolean; error?: string; userId?: string }> {
  try {
    // Check if user already exists
    const existingUser = await storage.getUserByEmail(email);
    if (existingUser) {
      return { success: false, error: 'Пользователь с таким email уже существует' };
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    // Create user
    const userId = uuidv4();
    await storage.createUser(userId, email, passwordHash);

    // Create session
    const sessionToken = uuidv4();
    await storage.createSession(sessionToken, userId, Date.now() + SESSION_EXPIRY);

    // Set cookie
    (await cookies()).set(SESSION_COOKIE_NAME, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: SESSION_EXPIRY / 1000,
      path: '/',
    });

    return { success: true, userId };
  } catch (error) {
    console.error('Registration error:', error);
    return { success: false, error: 'Ошибка при регистрации' };
  }
}

export async function login(email: string, password: string): Promise<{ success: boolean; error?: string; userId?: string }> {
  try {
    // Get user by email
    const user = await storage.getUserByEmail(email);
    if (!user) {
      return { success: false, error: 'Неверный email или пароль' };
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return { success: false, error: 'Неверный email или пароль' };
    }

    // Update last login
    await storage.updateUserLastLogin(user.id);

    // Create session
    const sessionToken = uuidv4();
    await storage.createSession(sessionToken, user.id, Date.now() + SESSION_EXPIRY);

    // Set cookie
    (await cookies()).set(SESSION_COOKIE_NAME, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: SESSION_EXPIRY / 1000,
      path: '/',
    });

    return { success: true, userId: user.id };
  } catch (error) {
    console.error('Login error:', error);
    return { success: false, error: 'Ошибка при входе' };
  }
}

export async function logout(): Promise<void> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  
  if (sessionToken) {
    await storage.deleteSession(sessionToken);
    cookieStore.delete(SESSION_COOKIE_NAME);
  }
}

export async function getCurrentUser(): Promise<{ userId: string; email: string; isAdmin: boolean } | null> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  
  if (!sessionToken) {
    return null;
  }

  const session = await storage.getSession(sessionToken);
  if (!session || session.expiresAt < Date.now()) {
    // Session expired
    if (session) {
      await storage.deleteSession(sessionToken);
    }
    cookieStore.delete(SESSION_COOKIE_NAME);
    return null;
  }

  try {
    const user = await storage.getUserById(session.userId);
    if (!user) {
      return null;
    }

    return {
      userId: user.id,
      email: user.email,
      isAdmin: user.isAdmin || false,
    };
  } catch {
    return null;
  }
}

export async function isAuthenticated(): Promise<boolean> {
  const user = await getCurrentUser();
  return user !== null;
}
