'use server';

import type { Character, CharacterInventoryItem } from '@/types/character';
import {
  fetchCharacter as fetchCharacterFromDb,
  saveCharacter as saveCharacterToDb,
} from '@/services/characterService';
import { gameDataService } from '../../../server/game-data-service';

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

export async function fetchAllItems(): Promise<CharacterInventoryItem[]> {
  try {
    return await gameDataService.getAllItems();
  } catch (error) {
    console.error('Error fetching items:', error);
    return [];
  }
}
