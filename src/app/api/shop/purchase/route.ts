import { NextRequest } from 'next/server';
import * as storage from '@/../server/storage';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const characterId = String(body.characterId || '').trim();
    const name = String(body.name || '').trim();
    if (!characterId || !name) return new Response(JSON.stringify({ ok: false, error: 'characterId and name required' }), { status: 400 });
    const char: any = await storage.getCharacterById(characterId);
    if (!char) return new Response(JSON.stringify({ ok: false, error: 'not_found' }), { status: 404 });
    if (char.preferences?.playerShop) return new Response(JSON.stringify({ ok: false, error: 'already_has_shop' }), { status: 400 });
    const cost = 500;
    const gold = (char.inventory || []).find((i: any) => i.id === 'gold');
    if (!gold || gold.quantity < cost) return new Response(JSON.stringify({ ok: false, error: 'not_enough_gold' }), { status: 400 });
    gold.quantity -= cost;
    char.preferences = char.preferences || {};
    char.preferences.playerShop = { name, founded: Date.now(), revenue: 0, inventory: [] };
    await storage.saveCharacter(char);
    return new Response(JSON.stringify({ ok: true, character: char }), { status: 200 });
  } catch (e: any) {
    return new Response(JSON.stringify({ ok: false, error: e?.message || 'unknown' }), { status: 500 });
  }
}


