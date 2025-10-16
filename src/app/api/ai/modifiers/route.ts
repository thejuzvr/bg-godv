export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { db } from '../../../../server/storage';
import * as schema from '../../../../shared/schema';
import { and, eq } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const characterId = searchParams.get('characterId');
  if (!characterId) return new Response(JSON.stringify({ error: 'characterId is required' }), { status: 400 });
  const rows = await db.select().from(schema.aiModifiers).where(eq(schema.aiModifiers.characterId, characterId));
  return new Response(JSON.stringify({ modifiers: rows }), { headers: { 'content-type': 'application/json' } });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const characterId = body.characterId as string;
  const code = body.code as string;
  const label = (body.label as string) || null;
  const multiplier = Number(body.multiplier || 0);
  const ttlMs = Number(body.ttlMs || 0);
  if (!characterId || !code) return new Response(JSON.stringify({ error: 'characterId and code required' }), { status: 400 });
  const expiresAt = ttlMs > 0 ? new Date(Date.now() + ttlMs) : null;
  // Upsert by (characterId, code) → emulate with delete+insert
  await db.delete(schema.aiModifiers).where(and(eq(schema.aiModifiers.characterId, characterId), eq(schema.aiModifiers.code, code)));
  await db.insert(schema.aiModifiers).values({ characterId, code, label, multiplier, expiresAt: expiresAt as any } as any);
  return new Response(JSON.stringify({ ok: true }), { headers: { 'content-type': 'application/json' } });
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const characterId = searchParams.get('characterId');
  const code = searchParams.get('code');
  if (!characterId || !code) return new Response(JSON.stringify({ error: 'characterId and code required' }), { status: 400 });
  await db.delete(schema.aiModifiers).where(and(eq(schema.aiModifiers.characterId, characterId), eq(schema.aiModifiers.code, code)));
  return new Response(JSON.stringify({ ok: true }), { headers: { 'content-type': 'application/json' } });
}
