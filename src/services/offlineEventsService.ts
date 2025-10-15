'use server';

import * as storage from "../../server/storage";

export interface OfflineEventData {
  type: 'combat' | 'quest' | 'explore' | 'travel' | 'rest' | 'learn' | 'social' | 'misc' | 'system';
  message: string;
  data?: Record<string, any>;
}

/**
 * Adds a new offline event for a character
 */
export async function addOfflineEvent(userId: string, event: OfflineEventData): Promise<void> {
  if (!userId) {
    console.warn("User not authenticated. Cannot add offline event.");
    return;
  }
  
  try {
    await storage.addOfflineEvent(userId, {
      timestamp: Date.now(),
      type: event.type,
      message: event.message,
      data: event.data,
    });
  } catch (error) {
    console.error("Failed to add offline event:", error);
  }
}

/**
 * Gets all unread offline events for a character
 */
export async function getUnreadOfflineEvents(userId: string, realmId?: string) {
  if (!userId) {
    console.warn("User not authenticated. Cannot fetch offline events.");
    return [];
  }

  const rows = await storage.getUnreadOfflineEvents(userId);
  return realmId ? rows.filter((r: any) => (r as any).realmId === realmId) : rows;
}

export async function getRecentOfflineEvents(userId: string, limit = 40, realmId?: string) {
  if (!userId) {
    console.warn("User not authenticated. Cannot fetch recent offline events.");
    return [];
  }
  const rows = await storage.getRecentOfflineEvents(userId, limit);
  return realmId ? rows.filter((r: any) => (r as any).realmId === realmId) : rows;
}

/**
 * Marks all offline events as read for a character
 */
export async function markOfflineEventsAsRead(userId: string): Promise<void> {
  if (!userId) {
    console.warn("User not authenticated. Cannot mark offline events as read.");
    return;
  }

  await storage.markOfflineEventsAsRead(userId);
}

/**
 * Cleans up old read events (older than 24 hours)
 */
export async function cleanupOldEvents(userId: string): Promise<void> {
  if (!userId) return;
  
  // Delete read events older than 24 hours
  const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
  await storage.deleteOldOfflineEvents(userId, oneDayAgo);
}
