export const dynamic = 'force-dynamic';
import { NextRequest } from 'next/server';
import { recordProfileView } from '@/services/reactionService';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const ip = req.headers.get('x-forwarded-for') || (req as any).ip || undefined;
    const row = await recordProfileView(params.id, ip || undefined);
    return new Response(JSON.stringify({ success: true, result: row }), { headers: { 'content-type': 'application/json' } });
  } catch (e: any) {
    return new Response(JSON.stringify({ success: false, error: e?.message || 'Failed' }), { status: 400 });
  }
}


