export const dynamic = 'force-dynamic';
import { NextRequest } from 'next/server';
import { getQuest } from '@/services/questService';
import { 
  completeQuest as completeQuestCmd,
  updateQuestProgress as updateQuestProgressCmd,
  setTaskStatus as setTaskStatusCmd,
} from '@/../server/commands/quest';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getQuest(id);
  if (!data) return new Response(JSON.stringify({ ok: false, error: 'Not found' }), { status: 404 });
  return new Response(JSON.stringify({ ok: true, ...data }), { headers: { 'content-type': 'application/json' } });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { characterId } = body;
    
    if (!characterId) {
      return new Response(JSON.stringify({ ok: false, error: 'characterId required' }), { status: 400 });
    }

    // Update progress
    if (typeof body.progress === 'number') {
      const result = await updateQuestProgressCmd(characterId, { questId: id, progress: body.progress });
      if (!result.success) {
        return new Response(JSON.stringify({ ok: false, error: result.error }), { status: 400 });
      }
      return new Response(JSON.stringify({ ok: true, quest: result.data?.quest }), { headers: { 'content-type': 'application/json' } });
    }
    
    // Complete quest
    if (body.complete === true) {
      const result = await completeQuestCmd(characterId, { questId: id });
      if (!result.success) {
        return new Response(JSON.stringify({ ok: false, error: result.error }), { status: 400 });
      }
      return new Response(JSON.stringify({ ok: true, quest: result.data?.quest }), { headers: { 'content-type': 'application/json' } });
    }
    
    // Set task status
    if (body.taskId && body.status) {
      const result = await setTaskStatusCmd(characterId, { 
        questId: id, 
        taskId: String(body.taskId), 
        status: String(body.status) as any,
        progress: typeof body.taskProgress === 'number' ? body.taskProgress : undefined,
      });
      if (!result.success) {
        return new Response(JSON.stringify({ ok: false, error: result.error }), { status: 400 });
      }
      return new Response(JSON.stringify({ ok: true, task: result.data?.task }), { headers: { 'content-type': 'application/json' } });
    }
    
    return new Response(JSON.stringify({ ok: false, error: 'No valid operation' }), { status: 400 });
  } catch (e: any) {
    return new Response(JSON.stringify({ ok: false, error: e?.message || 'Invalid payload' }), { status: 400 });
  }
}


