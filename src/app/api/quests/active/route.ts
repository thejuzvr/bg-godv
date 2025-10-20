import { NextRequest } from 'next/server';
import * as storage from '@/../server/storage';
import { db } from '@/../server/storage';
import * as schema from '@/../shared/schema';
import { and, desc, eq } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const characterId = String(searchParams.get('characterId') || '').trim();
    if (!characterId) return new Response(JSON.stringify({ ok: false, error: 'characterId required' }), { status: 400 });
    // Active quest = in-progress for character
    const [quest] = await db.select().from(schema.quests).where(and(eq(schema.quests.characterId, characterId), eq(schema.quests.status, 'in-progress' as any))).orderBy(desc(schema.quests.updatedAt)).limit(1);
    if (!quest) return new Response(JSON.stringify({ ok: true, quest: null }), { status: 200 });
    const tasks = await db.select().from(schema.questTasks).where(eq(schema.questTasks.questId, (quest as any).id)).orderBy(schema.questTasks.idx);
    return new Response(JSON.stringify({ ok: true, quest, tasks }), { status: 200 });
  } catch (e: any) {
    return new Response(JSON.stringify({ ok: false, error: e?.message || 'unknown' }), { status: 500 });
  }
}


