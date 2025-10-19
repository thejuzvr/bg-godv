import { NextRequest } from 'next/server';
import { db } from '@/../server/storage';
import * as schema from '@/../shared/schema';
import { eq } from 'drizzle-orm';
import { GraphModelSchema } from '@/ai/graph/model';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  const [row] = await db.select().from(schema.aiGraphTemplates).where(eq(schema.aiGraphTemplates.id, id)).limit(1);
  if (!row) return new Response(JSON.stringify({ success: false, error: 'not found' }), { status: 404 });
  return new Response(JSON.stringify({ success: true, template: row }), { headers: { 'content-type': 'application/json' } });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  const body = await req.json().catch(() => ({}));
  const graph = body.graph;
  const name = body.name as string | undefined;
  const description = body.description as string | undefined;
  const patch: any = { updatedAt: new Date() };
  if (name != null) patch.name = name;
  if (description != null) patch.description = description;
  if (graph != null) {
    const parsed = GraphModelSchema.safeParse(graph);
    if (!parsed.success) return new Response(JSON.stringify({ success: false, error: parsed.error.message }), { status: 400 });
    patch.graphJson = parsed.data as any;
    patch.version = (parsed.data.version || 1);
  }
  const [row] = await db.update(schema.aiGraphTemplates).set(patch).where(eq(schema.aiGraphTemplates.id, id)).returning();
  if (!row) return new Response(JSON.stringify({ success: false, error: 'not found' }), { status: 404 });
  return new Response(JSON.stringify({ success: true, template: row }), { headers: { 'content-type': 'application/json' } });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  await db.delete(schema.aiGraphTemplates).where(eq(schema.aiGraphTemplates.id, id));
  return new Response(JSON.stringify({ success: true }));
}


