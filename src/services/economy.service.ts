import { db } from '@/server/storage';
import * as schema from '@/shared/schema';
import { eq } from 'drizzle-orm';

export interface Trade { itemId: string; qty: number; side: 'buy'|'sell'; actorId: string; }
export interface MarketRow { itemId: string; price: number; supply: number; demand: number; }

const MIN_PRICE = 1;
const MAX_PRICE = 10000;

function nextPrice(current: number, supply: number, demand: number): number {
  // Simple price adjustment: price *= (1 + (demand - supply) / (supply + demand + 1)) with dampening
  const imbalance = (demand - supply) / Math.max(1, (supply + demand));
  const factor = 1 + imbalance * 0.1; // 10% sensitivity
  const p = Math.max(MIN_PRICE, Math.min(MAX_PRICE, current * factor));
  return Number(p.toFixed(2));
}

export class EconomyService {
  async ensureRow(itemId: string): Promise<MarketRow> {
    const [row] = await db.select().from(schema.globalMarket).where(eq(schema.globalMarket.itemId, itemId));
    if (row) return row as any;
    const base = 10; // default baseline
    const [created] = await db.insert(schema.globalMarket).values({ itemId, price: base, supply: 100, demand: 100 }).returning();
    return created as any;
  }

  async getPrice(itemId: string): Promise<number> {
    const row = await this.ensureRow(itemId);
    return row.price as any;
  }

  async applyTrade(trade: Trade): Promise<MarketRow> {
    const row = await this.ensureRow(trade.itemId);
    const supply = Number(row.supply) + (trade.side === 'sell' ? trade.qty : 0);
    const demand = Number(row.demand) + (trade.side === 'buy' ? trade.qty : 0);
    const price = nextPrice(Number(row.price), supply, demand);
    const [updated] = await db.update(schema.globalMarket)
      .set({ supply, demand, price, updatedAt: new Date() })
      .where(eq(schema.globalMarket.itemId, trade.itemId))
      .returning();
    return updated as any;
  }

  async listMarket(): Promise<MarketRow[]> {
    const rows = await db.select().from(schema.globalMarket);
    return rows as any;
  }
}

export const economyService = new EconomyService();


