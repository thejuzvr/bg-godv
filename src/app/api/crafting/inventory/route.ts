import { NextRequest } from 'next/server';
import { getCharacterById } from '@/../server/storage';
import { gameDataService } from '@/../server/game-data-service';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const characterId = searchParams.get('characterId');
  if (!characterId) return new Response(JSON.stringify({ success: false, error: 'characterId required' }), { status: 400 });
  const character = await getCharacterById(characterId);
  if (!character) return new Response(JSON.stringify({ success: false, error: 'character not found' }), { status: 404 });
  let items: any[] = [];
  try { items = await gameDataService.getAllItems(); } catch {}
  const map = new Map<string, any>();
  for (const it of (items || [])) map.set((it as any).id, it);
  const inventory = (character as any).inventory || [];
  const list = inventory.map((i: any) => ({ id: i.id, name: map.get(i.id)?.name || i.name || i.id, quantity: i.quantity || 0 }));
  const byId: Record<string, { id: string; name: string; quantity: number }> = {};
  for (const it of list) byId[it.id] = it;
  return new Response(JSON.stringify({ success: true, list, byId }), { headers: { 'content-type': 'application/json' } });
}


