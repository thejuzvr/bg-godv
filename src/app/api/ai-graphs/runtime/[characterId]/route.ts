import { NextRequest } from 'next/server';
import { db } from '@/../server/storage';
import * as schema from '@/../shared/schema';
import { eq, and } from 'drizzle-orm';
import { GraphModelSchema, type GraphModel } from '@/ai/graph/model';
import { publishGraphUpdate } from '@/ai/graph/runtime';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ characterId: string }> }) {
  const { characterId } = await params;
  const rows = await db.select()
    .from(schema.aiGraphInstances)
    .where(and(eq(schema.aiGraphInstances.characterId, characterId), eq(schema.aiGraphInstances.active, true)))
    .limit(1);
  const row: any = rows[0];
  if (!row) {
    return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });
  }
  return new Response(JSON.stringify({ version: row.version, graph: row.graphJson }), { status: 200 });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ characterId: string }> }) {
  const { characterId } = await params;
  const body = await req.json();
  const parsed = GraphModelSchema.safeParse(body?.graph || body);
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: parsed.error.message }), { status: 400 });
  }
  const graph: GraphModel = parsed.data;
  const existing = await db.select()
    .from(schema.aiGraphInstances)
    .where(and(eq(schema.aiGraphInstances.characterId, characterId), eq(schema.aiGraphInstances.active, true)))
    .limit(1);
  if (existing.length > 0) {
    const curr: any = existing[0];
    const [updated] = await db.update(schema.aiGraphInstances)
      .set({ graphJson: graph as any, version: (curr.version || 1) + 1, updatedAt: new Date(), active: true })
      .where(eq(schema.aiGraphInstances.id, curr.id))
      .returning();
    await publishGraphUpdate(characterId);
    return new Response(JSON.stringify({ ok: true, version: (updated as any).version }), { status: 200 });
  } else {
    const [created] = await db.insert(schema.aiGraphInstances)
      .values({ characterId, templateId: null as any, version: graph.version || 1, graphJson: graph as any, active: true })
      .returning();
    await publishGraphUpdate(characterId);
    return new Response(JSON.stringify({ ok: true, version: (created as any).version }), { status: 201 });
  }
}


