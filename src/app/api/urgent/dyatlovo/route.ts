export const dynamic = 'force-dynamic';
import { NextRequest } from 'next/server';
import { triggerDyatlovo } from '@/services/urgentEventService';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const characterId = String(body.characterId || '');
    if (!characterId) return new Response(JSON.stringify({ success: false, error: 'characterId required' }), { status: 400 });
    const data = await triggerDyatlovo(characterId);
    return new Response(JSON.stringify({ success: true, data }), { headers: { 'content-type': 'application/json' } });
  } catch (e: any) {
    return new Response(JSON.stringify({ success: false, error: e?.message || 'Invalid payload' }), { status: 400 });
  }
}


