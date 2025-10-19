'use server';

import { db } from '../../server/storage';
import * as schema from '../../shared/schema';
import { and, desc, eq } from 'drizzle-orm';

export type Discipline = 'alchemy' | 'smithing' | 'enchanting' | 'cooking' | 'tanning' | 'smelting';

export async function listRecipes(discipline?: Discipline) {
  if (discipline) {
    return await db.select().from(schema.craftingRecipes).where(eq(schema.craftingRecipes.discipline, discipline)).orderBy(desc(schema.craftingRecipes.updatedAt));
  }
  return await db.select().from(schema.craftingRecipes).orderBy(desc(schema.craftingRecipes.updatedAt));
}

export async function listStations(discipline?: Discipline) {
  if (discipline) {
    return await db.select().from(schema.craftingStations).where(eq(schema.craftingStations.discipline, discipline));
  }
  return await db.select().from(schema.craftingStations);
}

function getSkill(character: any, discipline: Discipline): number {
  const skills = character.skills || {};
  if (discipline === 'alchemy') return skills.alchemy || 0;
  return Math.max(0, Math.floor((skills as any)[discipline] || 0));
}

function addItem(updated: any, id: string, delta: number) {
  const it = updated.inventory.find((i: any) => i.id === id);
  if (it) it.quantity += delta; else updated.inventory.push({ id, name: id, weight: 0, type: 'misc', quantity: delta });
}

export async function performCraft(character: any, recipeId: string): Promise<{ character: any; log: string } | { error: string }> {
  const [recipe] = await db.select().from(schema.craftingRecipes).where(eq(schema.craftingRecipes.id, recipeId)).limit(1);
  if (!recipe) return { error: 'Recipe not found' };
  let updated = structuredClone(character);
  // Validate inputs
  for (const inp of (recipe as any).inputs) {
    const it = updated.inventory.find((i: any) => i.id === inp.id);
    if (!it || it.quantity < inp.quantity) return { error: `Недостаточно ингредиента: ${inp.id}` };
  }
  // Consume inputs
  for (const inp of (recipe as any).inputs) {
    const it = updated.inventory.find((i: any) => i.id === inp.id)!;
    it.quantity -= inp.quantity;
  }
  // Success roll based on skill vs requirement
  const skill = getSkill(updated, (recipe as any).discipline);
  const req = (recipe as any).skillReq || 0;
  const base = (recipe as any).successBase || 0.9;
  const bonus = Math.min(0.25, Math.max(-0.25, (skill - req) * 0.01));
  const successChance = Math.max(0.05, Math.min(0.98, base + bonus));
  const ok = Math.random() < successChance;
  if (ok) {
    for (const out of (recipe as any).outputs) addItem(updated, out.id, out.quantity);
    updated.xp.current += Math.max(0, (recipe as any).xp || 5);
    return { character: updated, log: `Успех! Скрафтено по рецепту ${(recipe as any).name}.` };
  } else {
    return { character: updated, log: `Провал. Материалы потрачены.` };
  }
}


