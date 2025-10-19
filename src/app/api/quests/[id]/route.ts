import { NextRequest } from 'next/server';
import { completeQuest, getQuest, updateQuestProgress, setTaskStatus } from '@/services/questService';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const data = await getQuest(params.id);
  if (!data) return new Response(JSON.stringify({ success: false, error: 'Not found' }), { status: 404 });
  return new Response(JSON.stringify({ success: true, ...data }), { headers: { 'content-type': 'application/json' } });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    if (typeof body.progress === 'number') {
      const row = await updateQuestProgress(params.id, body.progress);
      return new Response(JSON.stringify({ success: true, quest: row }), { headers: { 'content-type': 'application/json' } });
    }
    if (body.complete === true) {
      const row = await completeQuest(params.id);
      return new Response(JSON.stringify({ success: true, quest: row }), { headers: { 'content-type': 'application/json' } });
    }
    if (body.taskId && body.status) {
      const task = await setTaskStatus(String(body.taskId), String(body.status) as any, typeof body.taskProgress === 'number' ? body.taskProgress : undefined);
      return new Response(JSON.stringify({ success: true, task }), { headers: { 'content-type': 'application/json' } });
    }
    return new Response(JSON.stringify({ success: false, error: 'No valid operation' }), { status: 400 });
  } catch (e: any) {
    return new Response(JSON.stringify({ success: false, error: e?.message || 'Invalid payload' }), { status: 400 });
  }
}


