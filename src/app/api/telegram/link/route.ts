'use server';

import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import * as storage from '../../../../../server/storage';
import { getCurrentUser } from '@/services/authService';

export async function POST() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const token = uuidv4();
  const ttlMs = 30 * 60 * 1000;
  const expiresAt = Date.now() + ttlMs;
  await storage.createTelegramLinkToken(user.userId, token, expiresAt);

  const rawName = process.env.TELEGRAM_BOT_NAME || 'your_bot';
  const botName = rawName.replace(/^@+/, '').trim();
  const deepLink = `https://t.me/${botName}?start=${token}`;
  return NextResponse.json({ deepLink, expiresAt });
}


