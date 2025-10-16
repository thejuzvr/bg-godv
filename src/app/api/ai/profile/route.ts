export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { db } from '../../../../server/storage';
import * as schema from '../../../../shared/schema';
import { eq } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const characterId = searchParams.get('characterId');
  if (!characterId) return new Response(JSON.stringify({ error: 'characterId is required' }), { status: 400 });
  const [row] = await db.select().from(schema.characterAiState).where(eq(schema.characterAiState.characterId, characterId)).limit(1);
  if (!row) return new Response(JSON.stringify({ profileId: null, code: null }), { headers: { 'content-type': 'application/json' } });
  let code: string | null = null;
  if ((row as any).profileId) {
    const [p] = await db.select().from(schema.aiProfiles).where(eq(schema.aiProfiles.id, (row as any).profileId)).limit(1);
    code = (p as any)?.code || null;
  }
  return new Response(JSON.stringify({ profileId: (row as any).profileId || null, code }), { headers: { 'content-type': 'application/json' } });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const characterId = body.characterId as string;
  const profileId = body.profileId as string;
  if (!characterId || !profileId) return new Response(JSON.stringify({ error: 'characterId and profileId required' }), { status: 400 });
  const [existing] = await db.select().from(schema.characterAiState).where(eq(schema.characterAiState.characterId, characterId)).limit(1);
  if (existing) {
    await db.update(schema.characterAiState).set({ profileId, updatedAt: new Date() }).where(eq(schema.characterAiState.characterId, characterId));
  } else {
    await db.insert(schema.characterAiState).values({ characterId, profileId, fatigue: {} as any });
  }
  return new Response(JSON.stringify({ ok: true }), { headers: { 'content-type': 'application/json' } });
}
