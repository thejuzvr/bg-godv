import { NextRequest } from 'next/server';
import { getBtSettings, setBtSettings } from '@/ai/config/runtime';

export async function GET() {
  const s = await getBtSettings();
  return new Response(JSON.stringify(s), { headers: { 'content-type': 'application/json' } });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const toUpdate: any = {};
    if (typeof body.enabled === 'boolean') toUpdate.enabled = body.enabled;
    if (typeof body.arrivalWindowMs === 'number') toUpdate.arrivalWindowMs = body.arrivalWindowMs;
    if (typeof body.stallWindowMs === 'number') toUpdate.stallWindowMs = body.stallWindowMs;
    await setBtSettings(toUpdate);
    const s = await getBtSettings();
    return new Response(JSON.stringify({ success: true, settings: s }), { headers: { 'content-type': 'application/json' } });
  } catch (e: any) {
    return new Response(JSON.stringify({ success: false, error: e?.message || 'Invalid payload' }), { status: 400 });
  }
}


