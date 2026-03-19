export const dynamic = 'force-dynamic';
import { NextRequest } from 'next/server';
import * as storage from '@/../server/storage';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { characterId, itemId, quantity, pricePerUnit } = body || {};
    if (!characterId || !itemId || !quantity || !pricePerUnit) return new Response(JSON.stringify({ ok: false, error: 'missing_fields' }), { status: 400 });
    const qty = Math.max(1, Number(quantity));
    const price = Math.max(1, Number(pricePerUnit));
    const char: any = await storage.getCharacterById(String(characterId));
    if (!char?.preferences?.playerShop) return new Response(JSON.stringify({ ok: false, error: 'no_shop' }), { status: 400 });
    const invItem = (char.inventory || []).find((i: any) => i.id === String(itemId));
    if (!invItem || invItem.quantity < qty) return new Response(JSON.stringify({ ok: false, error: 'not_enough_items' }), { status: 400 });
    invItem.quantity -= qty;
    if (invItem.quantity <= 0) char.inventory = (char.inventory || []).filter((i: any) => i.id !== invItem.id);
    const shop = char.preferences.playerShop;
    shop.inventory.push({ itemId: String(itemId), quantity: qty, pricePerUnit: price, listedAt: Date.now() });
    await storage.saveCharacter(char);
    return new Response(JSON.stringify({ ok: true, character: char }), { status: 200 });
  } catch (e: any) {
    return new Response(JSON.stringify({ ok: false, error: e?.message || 'unknown' }), { status: 500 });
  }
}


