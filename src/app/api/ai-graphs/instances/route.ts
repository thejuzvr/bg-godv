export const dynamic = 'force-dynamic';
import { NextRequest } from 'next/server';
import { db } from '@/../server/storage';
import * as schema from '@/../shared/schema';
import { and, eq } from 'drizzle-orm';
import { GraphModelSchema } from '@/ai/graph/model';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const characterId = searchParams.get('characterId');
  if (!characterId) return new Response(JSON.stringify({ success: false, error: 'characterId required' }), { status: 400 });
  const rows = await db.select().from(schema.aiGraphInstances).where(eq(schema.aiGraphInstances.characterId, characterId));
  return new Response(JSON.stringify({ success: true, instances: rows }), { headers: { 'content-type': 'application/json' } });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const characterId = body.characterId as string;
  const templateId = body.templateId as string | null | undefined;
  const graph = body.graph;
  if (!characterId) return new Response(JSON.stringify({ success: false, error: 'characterId required' }), { status: 400 });
  const parsed = GraphModelSchema.safeParse(graph);
  if (!parsed.success) return new Response(JSON.stringify({ success: false, error: parsed.error.message }), { status: 400 });
  const [row] = await db.insert(schema.aiGraphInstances).values({ characterId, templateId: (templateId as any) ?? null, version: parsed.data.version || 1, graphJson: parsed.data as any, active: true }).returning();
  return new Response(JSON.stringify({ success: true, instance: row }), { status: 201, headers: { 'content-type': 'application/json' } });
}


