import { NextRequest } from 'next/server';
import { listQuests, createQuest } from '@/services/questService';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  const rows = await listQuests(id);
  return new Response(JSON.stringify({ success: true, quests: rows }), { headers: { 'content-type': 'application/json' } });
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const body = await req.json();
    const payload = {
      characterId: id,
      templateId: body.templateId || null,
      title: String(body.title || 'Задание'),
      description: String(body.description || ''),
      location: String(body.location || 'whiterun'),
      type: (body.type || 'side') as any,
      rewards: body.rewards || { gold: 0, xp: 0 },
      expiresAt: body.expiresAt ?? null,
      tasks: Array.isArray(body.tasks) ? body.tasks.map((t: any) => ({ title: String(t.title), type: String(t.type), data: t.data || null })) : [],
    } as any;
    const created = await createQuest(payload);
    return new Response(JSON.stringify({ success: true, quest: created }), { headers: { 'content-type': 'application/json' } });
  } catch (e: any) {
    return new Response(JSON.stringify({ success: false, error: e?.message || 'Invalid payload' }), { status: 400 });
  }
}


