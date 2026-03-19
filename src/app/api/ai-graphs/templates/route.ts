export const dynamic = 'force-dynamic';
import { NextRequest } from 'next/server';
import { db } from '@/../server/storage';
import * as schema from '@/../shared/schema';
import { eq } from 'drizzle-orm';
import { GraphModelSchema } from '@/ai/graph/model';

export async function GET() {
  const rows = await db.select().from(schema.aiGraphTemplates).orderBy(schema.aiGraphTemplates.updatedAt);
  return new Response(JSON.stringify({ success: true, templates: rows }), { headers: { 'content-type': 'application/json' } });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const name = body.name as string;
  const description = (body.description as string) || '';
  const graph = body.graph;
  const parsed = GraphModelSchema.safeParse(graph);
  if (!name) return new Response(JSON.stringify({ success: false, error: 'name required' }), { status: 400 });
  if (!parsed.success) return new Response(JSON.stringify({ success: false, error: parsed.error.message }), { status: 400 });
  const [row] = await db.insert(schema.aiGraphTemplates).values({ name, description, version: parsed.data.version || 1, graphJson: parsed.data as any }).returning();
  return new Response(JSON.stringify({ success: true, template: row }), { status: 201, headers: { 'content-type': 'application/json' } });
}


