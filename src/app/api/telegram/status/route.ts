import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/services/authService';
import { getUserActiveTelegramSubscription } from '../../../../../server/storage';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ linked: false });
  const sub = await getUserActiveTelegramSubscription(user.userId);
  return NextResponse.json({ linked: !!sub, sub });
}


