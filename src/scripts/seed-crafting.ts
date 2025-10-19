import { db } from '../../server/storage';
import * as schema from '../../shared/schema';

async function run() {
  const stations = [
    { id: 'alchemy_lab', name: 'Алхимическая лаборатория', discipline: 'alchemy', location: 'whiterun' },
    { id: 'forge_smithing', name: 'Кузница', discipline: 'smithing', location: 'whiterun' },
    { id: 'enchant_table', name: 'Стол зачарования', discipline: 'enchanting', location: 'whiterun' },
    { id: 'cooking_fire', name: 'Костёр для готовки', discipline: 'cooking', location: 'whiterun' },
    { id: 'tanning_rack', name: 'Выделочная рама', discipline: 'tanning', location: 'whiterun' },
    { id: 'smelter', name: 'Плавильня', discipline: 'smelting', location: 'whiterun' },
  ];
  for (const s of stations) {
    await db.insert(schema.craftingStations)
      .values({ id: s.id, name: s.name, discipline: s.discipline, location: s.location })
      .onConflictDoNothing?.();
  }

  const recipes = [
    { id: 'potion_health_minor', name: 'Зелье малого лечения', discipline: 'alchemy', station: 'alchemy_lab', inputs: [{ id: 'herb_red', quantity: 1 }, { id: 'herb_green', quantity: 1 }], outputs: [{ id: 'potion_health_weak', quantity: 1 }], skillReq: 0, xp: 6, successBase: 0.95 },
    { id: 'ingot_iron', name: 'Железный слиток', discipline: 'smelting', station: 'smelter', inputs: [{ id: 'ore_iron', quantity: 1 }], outputs: [{ id: 'ingot_iron', quantity: 1 }], skillReq: 0, xp: 4, successBase: 0.99 },
    { id: 'leather', name: 'Кожа', discipline: 'tanning', station: 'tanning_rack', inputs: [{ id: 'animal_pelt', quantity: 1 }], outputs: [{ id: 'leather', quantity: 1 }], skillReq: 0, xp: 5, successBase: 0.98 },
    { id: 'sword_iron', name: 'Железный меч', discipline: 'smithing', station: 'forge_smithing', inputs: [{ id: 'ingot_iron', quantity: 2 }], outputs: [{ id: 'weapon_sword_iron', quantity: 1 }], skillReq: 10, xp: 10, successBase: 0.9 },
    { id: 'meal_stew', name: 'Тушёное мясо', discipline: 'cooking', station: 'cooking_fire', inputs: [{ id: 'meat_raw', quantity: 1 }, { id: 'salt', quantity: 1 }], outputs: [{ id: 'food_stew', quantity: 1 }], skillReq: 0, xp: 3, successBase: 0.97 },
    { id: 'enchant_minor', name: 'Простое зачарование', discipline: 'enchanting', station: 'enchant_table', inputs: [{ id: 'weapon_sword_iron', quantity: 1 }, { id: 'soul_gem_petty', quantity: 1 }], outputs: [{ id: 'weapon_sword_iron_enchanted', quantity: 1 }], skillReq: 15, xp: 12, successBase: 0.85 },
  ];
  for (const r of recipes) {
    await db.insert(schema.craftingRecipes)
      .values(r as any)
      .onConflictDoNothing?.();
  }

  console.log('Crafting stations and recipes seeded.');
  process.exit(0);
}

run().catch((e) => { console.error(e); process.exit(1); });
