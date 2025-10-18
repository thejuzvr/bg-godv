'use server';

import { NextRequest } from 'next/server';
import { db } from '@/server/storage';
import * as schema from '@/shared/schema';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const characterId = String(body.characterId || '').trim();
    const text = String(body.text || '').trim();
    if (!characterId || !text) {
      return new Response(JSON.stringify({ ok: false, error: 'characterId and text are required' }), { status: 400 });
    }
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


