import { NextRequest } from 'next/server';
import * as storage from '@/../server/storage';
import { db } from '@/../server/storage';
import * as schema from '@/../shared/schema';
import { eq } from 'drizzle-orm';

// Basic anti-exploit guards (in-memory, per-instance)
const MAX_QTY_PER_REQUEST = 100;
const MIN_INTERVAL_MS = 1000; // 1 trade/sec per character
const lastTradeAt = new Map<string, number>();

export async function POST(req: NextRequest) {
  try {
    const { characterId, itemId, qty, side } = await req.json();
    if (!characterId || !itemId || !qty || (side !== 'buy' && side !== 'sell')) {
      return new Response(JSON.stringify({ success: false, error: 'characterId, itemId, qty, side required' }), { status: 400 });
    }
    if (qty > MAX_QTY_PER_REQUEST) {
      return new Response(JSON.stringify({ success: false, error: `Макс. кол-во за одну сделку: ${MAX_QTY_PER_REQUEST}` }), { status: 400 });
    }
    const now = Date.now();
    const last = lastTradeAt.get(String(characterId)) || 0;
    if (now - last < MIN_INTERVAL_MS) {
      return new Response(JSON.stringify({ success: false, error: 'Слишком часто. Подождите немного.' }), { status: 429 });
    }
    const character: any = await storage.getCharacterById(String(characterId));
    if (!character) return new Response(JSON.stringify({ success: false, error: 'Character not found' }), { status: 404 });
    if (qty <= 0) return new Response(JSON.stringify({ success: false, error: 'qty must be positive' }), { status: 400 });

    const result = await db.transaction(async (tx) => {
      // price row
      const [row0] = await tx.select().from(schema.globalMarket).where(eq(schema.globalMarket.itemId, String(itemId))).limit(1);
      const basePrice = row0 ? Number((row0 as any).price) : 10;
      let supply = row0 ? Number((row0 as any).supply) : 100;
      let demand = row0 ? Number((row0 as any).demand) : 100;
      const total = Math.ceil(basePrice * qty);

      // character
      const [dbChar] = await tx.select().from(schema.characters).where(eq(schema.characters.id, String(characterId))).limit(1);
      if (!dbChar) throw new Error('Character not found');
      const updated: any = { ...dbChar };
      const inv: any[] = Array.isArray(updated.inventory) ? [...updated.inventory] : [];
      const gold = inv.find((i: any) => i.id === 'gold');
      const item = inv.find((i: any) => i.id === itemId);
      if (side === 'buy') {
        const goldQty = gold?.quantity || 0;
        if (goldQty < total) throw new Error('Недостаточно золота');
        if (gold) gold.quantity -= total; else inv.push({ id: 'gold', name: 'Золото', weight: 0, type: 'gold', quantity: 0 });
        if (item) item.quantity += qty; else inv.push({ id: itemId, name: String(itemId), weight: 1, type: 'misc', quantity: qty });
        demand += qty;
      } else {
        if (!item || item.quantity < qty) throw new Error('Недостаточно товара');
        item.quantity -= qty;
        if (item.quantity <= 0) {
          const idx = inv.findIndex((i: any) => i.id === itemId);
          if (idx >= 0) inv.splice(idx, 1);
        }
        if (gold) gold.quantity += total; else inv.push({ id: 'gold', name: 'Золото', weight: 0, type: 'gold', quantity: total });
        supply += qty;
      }
      updated.inventory = inv;
      updated.lastUpdatedAt = Date.now();

      // update character
      await tx.update(schema.characters).set(updated).where(eq(schema.characters.id, String(characterId)));

      // update market row
      const imbalance = (demand - supply) / Math.max(1, (supply + demand));
      const price = Math.max(1, Math.min(10000, Number((row0?.price || basePrice)) * (1 + imbalance * 0.1)));
      if (row0) {
        await tx.update(schema.globalMarket)
          .set({ supply, demand, price, updatedAt: new Date() })
          .where(eq(schema.globalMarket.itemId, String(itemId)));
      } else {
        await tx.insert(schema.globalMarket).values({ itemId: String(itemId), supply, demand, price, updatedAt: new Date() });
      }

      return updated;
    });

    lastTradeAt.set(String(characterId), Date.now());
    return new Response(JSON.stringify({ success: true, character: result }), { headers: { 'content-type': 'application/json' } });
  } catch (e: any) {
    return new Response(JSON.stringify({ success: false, error: e?.message || 'Invalid payload' }), { status: 400 });
  }
}


