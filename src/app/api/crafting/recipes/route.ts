import { NextRequest } from 'next/server';
import { listRecipes } from '@/services/craftingService';
import * as storage from '../../../../../server/storage';
import { gameDataService } from '../../../../../server/game-data-service';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const d = searchParams.get('discipline') as any;
  const characterId = searchParams.get('characterId');
  let unlocked: Set<string> | null = null;
  if (characterId) {
    try {
      const c: any = await storage.getCharacterById(String(characterId));
      if (c && Array.isArray(c.unlockedRecipes)) unlocked = new Set(c.unlockedRecipes);
    } catch {}
  }
  const rows = await listRecipes(d || undefined);
  // Attach Russian names to inputs/outputs using items table
  let items: any[] = [];
  try {
    items = await gameDataService.getAllItems();
  } catch {}
  const map = new Map<string, any>();
  for (const it of (items || [])) map.set((it as any).id, it);
  const ALIASES: Record<string, { id?: string; name: string }> = {
    // Alchemy
    herb_red: { id: 'ingredient_red_mountain_flower', name: 'Красный горный цветок' },
    herb_green: { id: 'ingredient_blue_mountain_flower', name: 'Голубой горный цветок' },
    // Smelting/Smithing
    ingot_iron: { name: 'Железный слиток' },
    // Tanning
    animal_pelt: { name: 'Шкура животного' },
    // Cooking
    meat_raw: { id: 'food_raw_meat', name: 'Сырое мясо' },
    salt: { name: 'Соль' },
    food_stew: { name: 'Тушёное мясо' },
    // Enchanting
    soul_gem_petty: { name: 'Камень душ (малый)' },
    weapon_sword_iron_enchanted: { name: 'Железный меч (зачар.)' },
  };
  const recipes = (rows as any[]).map((r) => ({
    ...r,
    locked: unlocked ? !unlocked.has(String((r as any).id)) : false,
    inputs: (r.inputs || []).map((i: any) => {
      const alias = ALIASES[i.id];
      const item = map.get(i.id) || (alias?.id ? map.get(alias.id) : null);
      return { ...i, name: item?.name || alias?.name || i.id };
    }),
    outputs: (r.outputs || []).map((o: any) => {
      const alias = ALIASES[o.id];
      const item = map.get(o.id) || (alias?.id ? map.get(alias.id) : null);
      return { ...o, name: item?.name || alias?.name || o.id };
    }),
  }));
  return new Response(JSON.stringify({ success: true, recipes }), { headers: { 'content-type': 'application/json' } });
}


