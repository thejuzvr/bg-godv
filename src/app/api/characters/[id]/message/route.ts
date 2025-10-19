import { NextRequest } from 'next/server';
import { sendPlayerMessage } from '@/services/reactionService';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const ip = req.headers.get('x-forwarded-for') || (req as any).ip || undefined;
    const body = await req.json();
    const text = String(body.text || '');
    const fromUserId = body.fromUserId ? String(body.fromUserId) : undefined;
    const row = await sendPlayerMessage(params.id, text, fromUserId, ip || undefined);
    return new Response(JSON.stringify({ success: true, result: row }), { headers: { 'content-type': 'application/json' } });
  } catch (e: any) {
    return new Response(JSON.stringify({ success: false, error: e?.message || 'Failed' }), { status: 400 });
  }
}


