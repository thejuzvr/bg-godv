'use server';

import type { Character } from '@/types/character';
import {
  fetchCharacter as fetchCharacterFromDb,
  saveCharacter as saveCharacterToDb,
} from '@/services/characterService';

export async function fetchCharacter(userId: string): Promise<Character | null> {
  try {
    return await fetchCharacterFromDb(userId);
  } catch (error) {
    console.error('Error fetching character:', error);
    return null;
  }
}

export async function saveCharacter(userId: string, character: Character): Promise<{ success: boolean; error?: string }> {
  try {
    await saveCharacterToDb(userId, character);
    return { success: true };
  } catch (error) {
    console.error('Error saving character:', error);
    return { success: false, error: 'Failed to save character' };
  }
}
