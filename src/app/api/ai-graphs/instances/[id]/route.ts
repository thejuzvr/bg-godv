export const dynamic = 'force-dynamic';
import { NextRequest } from 'next/server';
import { db } from '@/../server/storage';
import * as schema from '@/../shared/schema';
import { eq } from 'drizzle-orm';
import { GraphModelSchema } from '@/ai/graph/model';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  const [row] = await db.select().from(schema.aiGraphInstances).where(eq(schema.aiGraphInstances.id, id)).limit(1);
  if (!row) return new Response(JSON.stringify({ success: false, error: 'not found' }), { status: 404 });
  return new Response(JSON.stringify({ success: true, instance: row }), { headers: { 'content-type': 'application/json' } });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  const body = await req.json().catch(() => ({}));
  const activate = body.active as boolean | undefined;
  const graph = body.graph;
  const patch: any = { updatedAt: new Date() };
  if (typeof activate === 'boolean') patch.active = activate;
  if (graph != null) {
    const parsed = GraphModelSchema.safeParse(graph);
    if (!parsed.success) return new Response(JSON.stringify({ success: false, error: parsed.error.message }), { status: 400 });
    patch.graphJson = parsed.data as any;
    patch.version = (parsed.data.version || 1);
  }
  const [row] = await db.update(schema.aiGraphInstances).set(patch).where(eq(schema.aiGraphInstances.id, id)).returning();
  if (!row) return new Response(JSON.stringify({ success: false, error: 'not found' }), { status: 404 });
  return new Response(JSON.stringify({ success: true, instance: row }), { headers: { 'content-type': 'application/json' } });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  await db.delete(schema.aiGraphInstances).where(eq(schema.aiGraphInstances.id, id));
  return new Response(JSON.stringify({ success: true }));
}


