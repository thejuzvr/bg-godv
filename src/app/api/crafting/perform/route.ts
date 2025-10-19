import { NextRequest } from 'next/server';
import { performCraft } from '@/services/craftingService';
import * as storage from '../../../../../server/storage';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { characterId, recipeId } = body || {};
    if (!characterId || !recipeId) return new Response(JSON.stringify({ success: false, error: 'characterId and recipeId required' }), { status: 400 });
    const character = await storage.getCharacterById(String(characterId));
    if (!character) return new Response(JSON.stringify({ success: false, error: 'Character not found' }), { status: 404 });
    const result = await performCraft(character as any, String(recipeId));
    if ('error' in result) return new Response(JSON.stringify({ success: false, error: result.error }), { status: 400 });
    await storage.saveCharacter(result.character as any);
    return new Response(JSON.stringify({ success: true, character: result.character, log: result.log }), { headers: { 'content-type': 'application/json' } });
  } catch (e: any) {
    return new Response(JSON.stringify({ success: false, error: e?.message || 'Invalid payload' }), { status: 400 });
  }
}


