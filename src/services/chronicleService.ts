'use server';

import type { ChronicleEntry } from "@/types/chronicle";
import * as storage from "../../server/storage";

/**
 * Adds a new entry to the character's chronicle.
 */
export async function addChronicleEntry(userId: string, entryData: Omit<ChronicleEntry, 'id' | 'timestamp'>): Promise<void> {
    if (!userId) {
        // Silently fail if no user, might happen during setup
        console.warn("User not authenticated. Cannot add to chronicle.");
        return;
    }
    
    try {
        await storage.addChronicleEntry(userId, {
            ...entryData,
            timestamp: Date.now(),
        });
    } catch (error) {
        console.error("Failed to add chronicle entry:", error);
        // Don't throw to avoid crashing the game loop
    }
}

/**
 * Fetches all chronicle entries for a character, ordered by most recent first.
 */
export async function fetchChronicleEntries(userId: string, realmId?: string): Promise<ChronicleEntry[]> {
    if (!userId) {
        console.warn("User not authenticated. Cannot fetch chronicle.");
        return [];
    }

    const entries = await storage.getChronicleEntries(userId);
    return entries
      .filter((e: any) => !realmId || (e as any).realmId === (realmId || 'global'))
      .map(entry => ({
        id: entry.id,
        timestamp: entry.timestamp,
        type: entry.type as any,
        title: entry.title,
        description: entry.description,
        icon: entry.icon,
        data: (entry.data == null ? undefined : entry.data) as Record<string, any> | undefined,
      }));
}
