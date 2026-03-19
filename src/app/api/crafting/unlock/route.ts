export const dynamic = 'force-dynamic';
import { NextRequest } from 'next/server';
import * as storage from '@/../server/storage';
import { db } from '@/../server/storage';
import * as schema from '@/../shared/schema';
import { eq } from 'drizzle-orm';

export async function POST(req: NextRequest) {
  try {
    const { characterId, recipeId } = await req.json();
    if (!characterId || !recipeId) return new Response(JSON.stringify({ success: false, error: 'characterId and recipeId required' }), { status: 400 });
    const character: any = await storage.getCharacterById(String(characterId));
    if (!character) return new Response(JSON.stringify({ success: false, error: 'Character not found' }), { status: 404 });
    const [recipe] = await db.select().from(schema.craftingRecipes).where(eq(schema.craftingRecipes.id, String(recipeId))).limit(1);
    if (!recipe) return new Response(JSON.stringify({ success: false, error: 'Recipe not found' }), { status: 404 });
    if ((character.craftingPoints || 0) <= 0) return new Response(JSON.stringify({ success: false, error: 'Недостаточно очков крафта' }), { status: 400 });
    const unlocked: string[] = Array.isArray(character.unlockedRecipes) ? [...character.unlockedRecipes] : [];
    if (unlocked.includes(String(recipeId))) return new Response(JSON.stringify({ success: true, character }), { headers: { 'content-type': 'application/json' } });
    unlocked.push(String(recipeId));
    const updated = { ...character, unlockedRecipes: unlocked, craftingPoints: Math.max(0, (character.craftingPoints || 0) - 1) };
    await storage.saveCharacter(updated);
    return new Response(JSON.stringify({ success: true, character: updated }), { headers: { 'content-type': 'application/json' } });
  } catch (e: any) {
    return new Response(JSON.stringify({ success: false, error: e?.message || 'Invalid payload' }), { status: 400 });
  }
}


