export const dynamic = 'force-dynamic';
import { NextRequest } from 'next/server';
import * as storage from '@/../server/storage';
import { getNodesAtLocation } from '@/data/resourceNodes';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { characterId } = body || {};
    if (!characterId) return new Response(JSON.stringify({ success: false, error: 'characterId required' }), { status: 400 });

    const character: any = await storage.getCharacterById(String(characterId));
    if (!character) return new Response(JSON.stringify({ success: false, error: 'Character not found' }), { status: 404 });
    if (character.status === 'in-combat') return new Response(JSON.stringify({ success: false, error: 'В бою нельзя добывать' }), { status: 400 });

    const nodes = getNodesAtLocation(character.location);
    if (nodes.length === 0) return new Response(JSON.stringify({ success: false, error: 'Нет доступных жил в этой локации' }), { status: 400 });

    const node = nodes[0];
    const staminaCost = 10;
    if ((character.stats?.stamina?.current || 0) < staminaCost) return new Response(JSON.stringify({ success: false, error: 'Недостаточно сил' }), { status: 400 });

    const qty = Math.max(1, Math.round(node.yieldPerTick + Math.random()));

    // mutate shallow clone
    const updated = { ...character };
    const inv = Array.isArray(updated.inventory) ? [...updated.inventory] : [];
    const existing = inv.find((i: any) => i.id === node.resource);
    if (existing) existing.quantity += qty; else inv.push({ id: node.resource, name: node.resource, weight: 1, type: 'misc', quantity: qty });
    updated.inventory = inv;
    updated.stats = { ...updated.stats, stamina: { ...updated.stats.stamina, current: Math.max(0, updated.stats.stamina.current - staminaCost) } };

    await storage.saveCharacter(updated);
    return new Response(JSON.stringify({ success: true, character: updated, log: `Добыто: ${node.name} x${qty}` }), { headers: { 'content-type': 'application/json' } });
  } catch (e: any) {
    return new Response(JSON.stringify({ success: false, error: e?.message || 'Invalid payload' }), { status: 400 });
  }
}


