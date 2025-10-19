'use server';

import { db } from '../../server/storage';
import * as schema from '../../shared/schema';
import { and, desc, eq } from 'drizzle-orm';
import { getRedis } from '../../server/redis';

function sanitize(text: string): string {
  return String(text || '').slice(0, 500);
}

export async function recordProfileView(characterId: string, ip?: string) {
  const redis = getRedis();
  const key = `rl:profile-view:${characterId}:${ip || 'anon'}`;
  const ok = await redis.set(key, '1', 'EX', 30, 'NX'); // 30s per IP per character
  if (ok !== 'OK') return { skipped: true };
  const [row] = await db.insert(schema.characterInteractions).values({ characterId, source: 'profile-view', payload: { ip } as any } as any).returning();
  // Apply a small curiosity nudge (expires in ~2 minutes)
  try {
    await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/ai/modifiers`, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ characterId, code: 'curiosity', label: 'Profile Viewed', multiplier: 0.05, ttlMs: 120000 })
    });
  } catch {}
  return row;
}

export async function sendPlayerMessage(characterId: string, text: string, fromUserId?: string, ip?: string) {
  const payloadText = sanitize(text);
  if (!payloadText) throw new Error('Empty message');
  // Basic moderation: block a few obvious bad words (placeholder)
  const banned = ['http://', 'https://'];
  if (banned.some(w => payloadText.includes(w))) throw new Error('Message contains prohibited content');
  const redis = getRedis();
  const key = `rl:msg:${characterId}:${fromUserId || ip || 'anon'}`;
  const ok = await redis.set(key, '1', 'EX', 20, 'NX'); // 1 msg / 20s per sender
  if (ok !== 'OK') throw new Error('Rate limited');
  const [row] = await db.insert(schema.characterInteractions).values({ characterId, source: 'player-message', payload: { text: payloadText, fromUserId, ip } as any } as any).returning();
  // Apply a mild focus nudge for social/interact actions
  try {
    await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/ai/modifiers`, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ characterId, code: 'social_focus', label: 'Player Message', multiplier: 0.08, ttlMs: 180000 })
    });
  } catch {}
  return row;
}

export async function listInteractions(characterId: string, limit = 50) {
  return await db.select().from(schema.characterInteractions).where(eq(schema.characterInteractions.characterId, characterId)).orderBy(desc(schema.characterInteractions.createdAt)).limit(limit);
}


