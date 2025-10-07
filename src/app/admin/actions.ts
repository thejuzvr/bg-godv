"use server";

import * as storage from "../../../server/storage";
import type { Character } from "@/types/character";
import { db } from "../../../server/storage";
import { characters } from "../../../shared/schema";
import { desc } from "drizzle-orm";

export interface AdminCharacterView {
  id: string;
  name: string;
  level: number;
  lastUpdatedAt: number;
}

export async function seedDatabase(): Promise<{success: boolean; message: string; error?: string}> {
    // Game data is now loaded from static files in src/data/
    // No database seeding needed
    return { 
        success: true, 
        message: "Данные игры загружаются из статических файлов. База данных не требует наполнения." 
    };
}

export async function seedFromJson(collectionName: string, jsonContent: string): Promise<{success: boolean; message: string; error?: string}> {
    // Game data is now loaded from static files in src/data/
    // No database seeding needed
    return { 
        success: true, 
        message: "Данные игры загружаются из статических файлов. База данных не требует наполнения." 
    };
}

export async function fixCharacterState(userId: string): Promise<{success: boolean; message: string; error?: string}> {
    if (!userId) {
        return { success: false, message: 'User ID is required.', error: "Необходим ID пользователя." };
    }

    try {
        const character = await storage.getCharacterById(userId);

        if (!character) {
            return { success: false, message: "Character not found.", error: `Герой с ID ${userId} не найден.` };
        }

        // Fix character state by updating to safe defaults
        const updates = {
            ...character,
            status: 'idle',
            combat: null,
            currentAction: null,
            sleepUntil: null,
            respawnAt: null,
            deathOccurredAt: null,
            activeSovngardeQuest: null,
            location: 'whiterun',
            effects: [],
            stats: {
                ...character.stats,
                health: {
                    ...character.stats.health,
                    current: character.stats.health.max
                }
            }
        };

        await storage.saveCharacter(updates);

        return { success: true, message: `Успешно исправлено состояние героя. Он был перемещен в Вайтран с полным здоровьем.` };

    } catch (error: any) {
        console.error(`Error fixing character state for ${userId}:`, error);
        let errorMessage = "Не удалось исправить состояние героя.";
        if (error.message) {
            errorMessage = error.message;
        }
        return { success: false, message: "Failed to fix character state.", error: errorMessage };
    }
}

export async function fetchAllCharacters(): Promise<{ success: boolean; characters?: AdminCharacterView[]; error?: string }> {
    try {
        const allCharacters = await db.select({
            id: characters.id,
            name: characters.name,
            level: characters.level,
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

export async function deleteCharacter(characterId: string): Promise<{ success: boolean; message: string; error?: string }> {
    if (!characterId) {
        return { success: false, message: 'Character ID is required.', error: "Необходим ID героя." };
    }

    try {
        // Delete character from PostgreSQL
        // The cascade delete will automatically remove chronicle and offline events
        const { eq } = await import('drizzle-orm');
        await db.delete(characters).where(eq(characters.id, characterId));

        return { success: true, message: `Герой с ID ${characterId} и вся его летопись были успешно удалены.` };

    } catch (error: any) {
        console.error(`Error deleting character ${characterId}:`, error);
        return { success: false, message: "Failed to delete character.", error: error.message };
    }
}
