'use server';

import { getUnreadOfflineEvents, getRecentOfflineEvents, markOfflineEventsAsRead } from '@/services/offlineEventsService';

export interface OfflineEvent {
  id: string;
  characterId: string;
  timestamp: Date;
  type: string;
  message: string;
  data?: Record<string, any>;
  isRead: boolean;
}

export async function getOfflineEvents(characterId: string): Promise<OfflineEvent[]> {
  try {
    const events = await getUnreadOfflineEvents(characterId);
    return events.map((event: any) => ({
      id: event.id,
      characterId: event.characterId,
      timestamp: new Date(event.timestamp),
      type: event.type,
      message: event.message,
      data: event.data,
      isRead: event.isRead,
    }));
  } catch (error) {
    console.error('Error fetching offline events:', error);
    return [];
  }
}

export async function getRecentEvents(characterId: string, limit: number): Promise<OfflineEvent[]> {
  try {
    const events = await getRecentOfflineEvents(characterId, limit);
    return events.map((event: any) => ({
      id: event.id,
      characterId: event.characterId,
      timestamp: new Date(event.timestamp),
      type: event.type,
      message: event.message,
      data: event.data,
      isRead: event.isRead,
    }));
  } catch (error) {
    console.error('Error fetching recent offline events:', error);
    return [];
  }
}

export async function markEventsRead(characterId: string): Promise<void> {
  try {
    await markOfflineEventsAsRead(characterId);
  } catch (error) {
    console.error('Error marking events as read:', error);
  }
}
