import { NextRequest } from 'next/server';
import * as storage from '@/../server/storage';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { characterId, itemId } = body || {};
    if (!characterId || !itemId) return new Response(JSON.stringify({ ok: false, error: 'missing_fields' }), { status: 400 });
    const char: any = await storage.getCharacterById(String(characterId));
    if (!char?.preferences?.playerShop) return new Response(JSON.stringify({ ok: false, error: 'no_shop' }), { status: 400 });
    const shop = char.preferences.playerShop;
    const idx = shop.inventory.findIndex((e: any) => e.itemId === String(itemId));
    if (idx < 0) return new Response(JSON.stringify({ ok: false, error: 'not_listed' }), { status: 404 });
    const entry = shop.inventory[idx];
    // Return items back to character inventory
    const existing = (char.inventory || []).find((i: any) => i.id === entry.itemId);
    if (existing) existing.quantity += entry.quantity; else (char.inventory || []).push({ id: entry.itemId, name: entry.itemId, weight: 1, type: 'misc', quantity: entry.quantity });
    shop.inventory.splice(idx, 1);
    await storage.saveCharacter(char);
    return new Response(JSON.stringify({ ok: true, character: char }), { status: 200 });
  } catch (e: any) {
    return new Response(JSON.stringify({ ok: false, error: e?.message || 'unknown' }), { status: 500 });
  }
}


