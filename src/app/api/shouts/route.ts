export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { db, getAllShouts, grantShout, revokeShout } from '@/../server/storage';
import * as schema from '@/../shared/schema';

export async function GET() {
  const rows = await getAllShouts();
  return new Response(JSON.stringify({ shouts: rows }), { headers: { 'content-type': 'application/json' } });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const characterId = body.characterId as string;
  const shoutId = body.shoutId as string;
  if (!characterId || !shoutId) return new Response(JSON.stringify({ error: 'characterId and shoutId required' }), { status: 400 });
  const row = await grantShout(characterId, shoutId);
  return new Response(JSON.stringify({ ok: true, row }), { headers: { 'content-type': 'application/json' } });
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const characterId = searchParams.get('characterId');
  const shoutId = searchParams.get('shoutId');
  if (!characterId || !shoutId) return new Response(JSON.stringify({ error: 'characterId and shoutId required' }), { status: 400 });
  await revokeShout(characterId, shoutId);
  return new Response(JSON.stringify({ ok: true }), { headers: { 'content-type': 'application/json' } });
}


