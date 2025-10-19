import { NextRequest } from 'next/server';
import { economyService } from '@/services/economy.service';

export async function GET(_req: NextRequest) {
  // Seed a few common items to avoid empty market
  const defaults = ['ore_iron', 'ore_silver', 'ore_gold', 'potion_health_weak', 'misc_gem_amethyst'];
  try { await Promise.all(defaults.map((id) => economyService.ensureRow(id))); } catch {}
  const rows = await economyService.listMarket();
  return new Response(JSON.stringify({ success: true, market: rows }), { headers: { 'content-type': 'application/json' } });
}


