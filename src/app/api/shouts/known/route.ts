export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { getKnownShouts } from '@/../server/storage';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const characterId = searchParams.get('characterId');
  if (!characterId) return new Response(JSON.stringify({ error: 'characterId is required' }), { status: 400 });
  const rows = await getKnownShouts(characterId);
  return new Response(JSON.stringify({ shouts: rows }), { headers: { 'content-type': 'application/json' } });
}


