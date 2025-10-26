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

export type AdminTelegramSubscription = {
  id: string;
  userId: string;
  email?: string;
  chatId: string;
  mode: string;
  locale: string;
  isActive: boolean;
  lastSentAt?: number | null;
  createdAt: string;
};

export async function fetchTelegramSubscriptions(): Promise<{ success: boolean; subs?: AdminTelegramSubscription[]; error?: string }> {
  try {
    const rows = await storage.getAllTelegramSubscriptions();
    const subs = rows.map((r: any) => ({
      id: r.id,
      userId: r.userId,
      email: r.email,
      chatId: String(r.chatId),
      mode: r.mode,
      locale: r.locale,
      isActive: !!r.isActive,
      lastSentAt: r.lastSentAt ?? null,
      createdAt: String(r.createdAt),
    }));
    return { success: true, subs };
  } catch (e: any) {
    return { success: false, error: e?.message || 'Failed to load subscriptions' };
  }
}

export async function setTelegramSubscriptionActive(id: string, active: boolean): Promise<{ success: boolean; error?: string }> {
  try {
    if (active) await storage.activateTelegramSubscription(id);
    else await storage.deactivateTelegramSubscription(id);
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e?.message || 'Failed to update subscription' };
  }
}

// Admin Stats
export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  totalCharacters: number;
  avgLevel: number;
  maxLevel: number;
  maxLevelCharacter: string;
  telegramSubs: number;
  activeTelegramSubs: number;
  totalEvents: number;
  totalDeaths: number;
  totalCombats: number;
  recentCharacters: Array<{
    name: string;
    level: number;
    race: string;
    class: string;
    createdAt: number;
  }>;
}

export async function fetchAdminStats(): Promise<{ success: boolean; stats?: AdminStats; error?: string }> {
  try {
    const { eq, gte, sql, and, desc } = await import('drizzle-orm');
    const { users, characters: charactersTable, offlineEvents, telegramSubscriptions } = await import('../../../shared/schema');

    // Total users
    const totalUsersResult = await db.select({ count: sql<number>`count(*)::int` }).from(users);
    const totalUsers = totalUsersResult[0]?.count || 0;

    // Active users (logged in last 7 days)
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const activeUsersResult = await db.select({ count: sql<number>`count(*)::int` }).from(users)
      .where(gte(users.lastLogin, sevenDaysAgo));
    const activeUsers = activeUsersResult[0]?.count || 0;

    // Total characters
    const totalCharsResult = await db.select({ count: sql<number>`count(*)::int` }).from(charactersTable);
    const totalCharacters = totalCharsResult[0]?.count || 0;

    // Average level
    const avgLevelResult = await db.select({ avg: sql<number>`avg(level)::int` }).from(charactersTable);
    const avgLevel = avgLevelResult[0]?.avg || 0;

    // Max level character
    const maxLevelChar = await db.select({
      level: charactersTable.level,
      name: charactersTable.name,
    }).from(charactersTable).orderBy(desc(charactersTable.level)).limit(1);
    const maxLevel = maxLevelChar[0]?.level || 0;
    const maxLevelCharacter = maxLevelChar[0]?.name || 'N/A';

    // Telegram subscriptions
    const telegramSubsResult = await db.select({ count: sql<number>`count(*)::int` }).from(telegramSubscriptions);
    const telegramSubs = telegramSubsResult[0]?.count || 0;

    const activeTelegramSubsResult = await db.select({ count: sql<number>`count(*)::int` })
      .from(telegramSubscriptions)
      .where(eq(telegramSubscriptions.isActive, true));
    const activeTelegramSubs = activeTelegramSubsResult[0]?.count || 0;

    // Total events (last 24h)
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    const totalEventsResult = await db.select({ count: sql<number>`count(*)::int` })
      .from(offlineEvents)
      .where(gte(offlineEvents.timestamp, oneDayAgo));
    const totalEvents = totalEventsResult[0]?.count || 0;

    // Total deaths and combats
    const deathsResult = await db.select({ count: sql<number>`count(*)::int` })
      .from(offlineEvents)
      .where(eq(offlineEvents.type, 'death'));
    const totalDeaths = deathsResult[0]?.count || 0;

    const combatsResult = await db.select({ count: sql<number>`count(*)::int` })
      .from(offlineEvents)
      .where(and(
        eq(offlineEvents.type, 'combat'),
        gte(offlineEvents.timestamp, Date.now() - 7 * 24 * 60 * 60 * 1000)
      ));
    const totalCombats = combatsResult[0]?.count || 0;

    // Recent characters
    const recentChars = await db.select({
      name: charactersTable.name,
      level: charactersTable.level,
      race: charactersTable.race,
      class: charactersTable.class,
      createdAt: charactersTable.createdAt,
    }).from(charactersTable).orderBy(desc(charactersTable.createdAt)).limit(10);

    const stats: AdminStats = {
      totalUsers,
      activeUsers,
      totalCharacters,
      avgLevel,
      maxLevel,
      maxLevelCharacter,
      telegramSubs,
      activeTelegramSubs,
      totalEvents,
      totalDeaths,
      totalCombats,
      recentCharacters: recentChars,
    };

    return { success: true, stats };
  } catch (error: any) {
    console.error("Error fetching admin stats:", error);
    return { success: false, error: error.message };
  }
}
