'use server';

import { gameDataService } from '../../server/game-data-service';
import type { Location } from '@/types/location';
import type { NPC } from '@/types/npc';
import type { CharacterInventoryItem } from '@/types/character';

export async function fetchNPCs(): Promise<NPC[]> {
  return await gameDataService.getAllNpcs();
}

export async function fetchLocations(): Promise<Location[]> {
  return await gameDataService.getAllLocations();
}

export async function fetchItems(): Promise<CharacterInventoryItem[]> {
  return await gameDataService.getAllItems();
}
