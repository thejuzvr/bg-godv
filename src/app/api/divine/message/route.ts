'use server';

import { NextRequest } from 'next/server';
import { db } from '@/../server/storage';
import * as schema from '@/../shared/schema';
import * as storage from '@/../server/storage';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const characterId = String(body.characterId || '').trim();
    const text = String(body.text || '').trim();
    if (!characterId || !text) {
      return new Response(JSON.stringify({ ok: false, error: 'characterId and text are required' }), { status: 400 });
    }
    if (text.length > 200) {
      return new Response(JSON.stringify({ ok: false, error: 'message too long' }), { status: 400 });
    }
    // Rate limit by last message (5 minutes per character)
    try {
      const redis = (await import('@/../server/redis')).default as any;
      const key = `rl:divine_msg:${characterId}`;
      const ok = await redis.set(key, '1', 'EX', 5 * 60, 'NX');
      if (ok !== 'OK') return new Response(JSON.stringify({ ok: false, error: 'rate_limited' }), { status: 429 });
    } catch {}
    // Spend 10 intervention power if available
    try {
      const char: any = await storage.getCharacterById(characterId);
      if (!char) return new Response(JSON.stringify({ ok: false, error: 'character not found' }), { status: 404 });
      const cost = 10;
      if (!char.interventionPower || char.interventionPower.current < cost) {
        return new Response(JSON.stringify({ ok: false, error: 'not_enough_power' }), { status: 400 });
      }
      char.interventionPower.current = Math.max(0, char.interventionPower.current - cost);
      await storage.saveCharacter(char);
    } catch {}
    const [row] = await db.insert(schema.divineMessages).values({
      characterId,
      text,
      createdAt: Date.now(),
      processedAt: null,
    }).returning();
    return new Response(JSON.stringify({ ok: true, id: (row as any).id }), { status: 200 });
  } catch (e: any) {
    return new Response(JSON.stringify({ ok: false, error: e?.message || 'unknown' }), { status: 500 });
  }
}


