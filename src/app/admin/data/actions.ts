"use server";

import { gameDataService } from "../../../../server/game-data-service";
import { getCurrentUser } from "@/services/authService";

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || !user.isAdmin) {
    throw new Error("Недостаточно прав");
  }
}

// ===== LOCATIONS =====
export async function listLocations() {
  await requireAdmin();
  return await gameDataService.getAllLocations();
}

export async function getLocation(id: string) {
  await requireAdmin();
  return await gameDataService.getLocationById(id);
}

export async function createLocation(data: { id: string; name: string; type: 'city' | 'town' | 'ruin' | 'dungeon' | 'camp'; coords: { x: number; y: number }; isSafe: boolean }) {
  await requireAdmin();
  return await gameDataService.createLocation(data);
}

export async function updateLocation(id: string, data: Partial<{ name: string; type: 'city' | 'town' | 'ruin' | 'dungeon' | 'camp'; coords: { x: number; y: number }; isSafe: boolean }>) {
  await requireAdmin();
  return await gameDataService.updateLocation(id, data);
}

export async function deleteLocation(id: string) {
  await requireAdmin();
  await gameDataService.deleteLocation(id);
  return { success: true };
}

// ===== ITEMS =====
export async function listItems() {
  await requireAdmin();
  return await gameDataService.getAllItems();
}

export async function getItem(id: string) {
  await requireAdmin();
  return await gameDataService.getItemById(id);
}

export async function createItem(data: { id: string; name: string; weight: number; type: string; rarity?: string | null; equipmentSlot?: string | null; damage?: number | null; armor?: number | null; effect?: any | null; spellId?: string | null; learningEffect?: any | null }) {
  await requireAdmin();
  return await gameDataService.createItem(data);
}

export async function updateItem(id: string, data: Partial<{ name: string; weight: number; type: string; rarity?: string | null; equipmentSlot?: string | null; damage?: number | null; armor?: number | null; effect?: any | null; spellId?: string | null; learningEffect?: any | null }>) {
  await requireAdmin();
  return await gameDataService.updateItem(id, data);
}

export async function deleteItem(id: string) {
  await requireAdmin();
  await gameDataService.deleteItem(id);
  return { success: true };
}

// ===== NPCs =====
export async function listNpcs() {
  await requireAdmin();
  return await gameDataService.getAllNpcs();
}

export async function getNpc(id: string) {
  await requireAdmin();
  return await gameDataService.getNpcById(id);
}

export async function createNpc(data: { id: string; name: string; description: string; location: string; dialogue: string[]; inventory?: Array<{ itemId: string; stock: number; priceModifier?: number }>; isCompanion?: boolean; hireCost?: number | null; factionId?: string | null; companionDetails?: { combatStyle: string; primarySkill: string } | null }) {
  await requireAdmin();
  return await gameDataService.createNpc(data);
}

export async function updateNpc(id: string, data: Partial<{ name: string; description: string; location: string; dialogue: string[]; inventory?: Array<{ itemId: string; stock: number; priceModifier?: number }>; isCompanion?: boolean; hireCost?: number | null; factionId?: string | null; companionDetails?: { combatStyle: string; primarySkill: string } | null }>) {
  await requireAdmin();
  return await gameDataService.updateNpc(id, data);
}

export async function deleteNpc(id: string) {
  await requireAdmin();
  await gameDataService.deleteNpc(id);
  return { success: true };
}

// ===== ENEMIES =====
export async function listEnemies() {
  await requireAdmin();
  return await gameDataService.getAllEnemies();
}

export async function getEnemy(id: string) {
  await requireAdmin();
  return await gameDataService.getEnemyById(id);
}

export async function createEnemy(data: { id: string; name: string; health: number; damage: number; xp: number; level?: number; minLevel?: number | null; isUnique?: boolean; guaranteedDrop?: Array<{ id: string; quantity: number }> | null; appliesEffect?: { id: string; name: string; description: string; icon: string; type: 'debuff'; chance: number; duration: number; value?: number } | null; armor?: number | null }) {
  await requireAdmin();
  return await gameDataService.createEnemy(data);
}

export async function updateEnemy(id: string, data: Partial<{ name: string; health: number; damage: number; xp: number; level?: number; minLevel?: number | null; isUnique?: boolean; guaranteedDrop?: Array<{ id: string; quantity: number }> | null; appliesEffect?: { id: string; name: string; description: string; icon: string; type: 'debuff'; chance: number; duration: number; value?: number } | null; armor?: number | null }>) {
  await requireAdmin();
  return await gameDataService.updateEnemy(id, data);
}

export async function deleteEnemy(id: string) {
  await requireAdmin();
  await gameDataService.deleteEnemy(id);
  return { success: true };
}


