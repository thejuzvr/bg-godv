'use server';

import { NextRequest } from 'next/server';
import { sendDivineMessage } from '@/../server/commands/divine-intervention';
import { getRedis } from '@/../server/redis';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const characterId = String(body.characterId || '').trim();
    const text = String(body.text || '').trim();
    
    if (!characterId || !text) {
      return new Response(JSON.stringify({ ok: false, error: 'characterId and text are required' }), { status: 400 });
    }

    // Rate limit by last message (5 minutes per character)
    try {
      const redis = getRedis();
      const key = `rl:divine_msg:${characterId}`;
      const ok = await redis.set(key, '1', 'EX', 5 * 60, 'NX');
      if (ok !== 'OK') {
        return new Response(JSON.stringify({ ok: false, error: 'rate_limited' }), { status: 429 });
      }
    } catch {}

    // Execute command through new command handler
    const result = await sendDivineMessage(characterId, { text });

    if (!result.success) {
      return new Response(JSON.stringify({ ok: false, error: result.error }), { 
        status: result.error === 'not_enough_power' ? 400 : 500 
      });
    }

    return new Response(JSON.stringify({ 
      ok: true, 
      id: result.data?.messageId 
    }), { status: 200 });
  } catch (e: any) {
    return new Response(JSON.stringify({ ok: false, error: e?.message || 'unknown' }), { status: 500 });
  }
}


