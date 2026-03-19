export const dynamic = 'force-dynamic';
import { NextRequest } from 'next/server';
import { getActionCatalog } from '@/ai/action-catalog';

export async function GET(_req: NextRequest) {
  const catalog = await getActionCatalog();
  const actions = catalog.map(a => ({ name: a.action.name, category: a.category, id: a.id, tags: a.tags || [] }));
  return new Response(JSON.stringify(actions), { status: 200 });
}


