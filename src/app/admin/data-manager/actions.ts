"use server";

import { db } from "../../../../server/storage";
import { characters, users } from "../../../../shared/schema";
import { desc, eq } from "drizzle-orm";

export interface AdminUserView {
  id: string;
  email: string;
  isAdmin: boolean;
  lastLogin?: number;
  createdAt: number;
}

export interface AdminCharacterView {
  id: string;
  name: string;
  level: number;
  race: string;
  class: string;
  lastUpdatedAt: number;
}

export async function fetchAllUsers(): Promise<{ success: boolean; users?: AdminUserView[]; error?: string }> {
  try {
    const allUsers = await db.select({
      id: users.id,
      email: users.email,
      isAdmin: users.isAdmin,
      lastLogin: users.lastLogin,
      createdAt: users.createdAt,
    }).from(users).orderBy(desc(users.createdAt));

    return { 
      success: true, 
      users: allUsers as AdminUserView[]
    };
  } catch (error: any) {
    console.error("Error fetching all users:", error);
    return { success: false, error: error.message };
  }
}

export async function fetchAllCharacters(): Promise<{ success: boolean; characters?: AdminCharacterView[]; error?: string }> {
  try {
    const allCharacters = await db.select({
      id: characters.id,
      name: characters.name,
      level: characters.level,
      race: characters.race,
      class: characters.class,
      lastUpdatedAt: characters.lastUpdatedAt,
    }).from(characters).orderBy(desc(characters.lastUpdatedAt));

    return { 
      success: true, 
      characters: allCharacters as AdminCharacterView[]
    };
  } catch (error: any) {
    console.error("Error fetching all characters:", error);
    return { success: false, error: error.message };
  }
}

export async function deleteUser(userId: string): Promise<{ success: boolean; message: string; error?: string }> {
  if (!userId) {
    return { success: false, message: 'User ID is required.', error: "Необходим ID пользователя." };
  }

  try {
    // Delete user from database (cascade will delete characters and other related data)
    await db.delete(users).where(eq(users.id, userId));

    return { success: true, message: `Пользователь с ID ${userId} был успешно удалён.` };
  } catch (error: any) {
    console.error(`Error deleting user ${userId}:`, error);
    return { success: false, message: "Failed to delete user.", error: error.message };
  }
}

export async function deleteCharacter(characterId: string): Promise<{ success: boolean; message: string; error?: string }> {
  if (!characterId) {
    return { success: false, message: 'Character ID is required.', error: "Необходим ID героя." };
  }

  try {
    // Delete character from database (cascade will delete chronicle and offline events)
    await db.delete(characters).where(eq(characters.id, characterId));

    return { success: true, message: `Герой с ID ${characterId} и вся его летопись были успешно удалены.` };
  } catch (error: any) {
    console.error(`Error deleting character ${characterId}:`, error);
    return { success: false, message: "Failed to delete character.", error: error.message };
  }
}
