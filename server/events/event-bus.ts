// Event Bus - centralized event publishing system with Redis pub/sub
import { getRedis } from '../redis';
import type { EventType, GameEvent, EventPayloadMap } from './event-types';

const CHANNEL_PREFIX = 'game:events:';

export class EventBus {
  private redis = getRedis();
  private rateLimitMap = new Map<string, { count: number; resetAt: number }>();
  
  /**
   * Publish a game event to Redis pub/sub
   * Events are published to multiple channels for efficient routing:
   * - Global channel: game:events:all
   * - Realm channel: game:events:realm:{realmId}
   * - Character channel: game:events:char:{characterId}
   * - Category channel: game:events:category:{category} (e.g., market, divine)
   */
  async publish<T extends EventType>(
    type: T,
    payload: EventPayloadMap[T],
    realmId: string,
    characterId?: string
  ): Promise<void> {
    const event: GameEvent<EventPayloadMap[T]> = {
      type,
      realmId,
      characterId,
      timestamp: Date.now(),
      data: payload,
    };

    const serialized = JSON.stringify(event);
    const category = type.split(':')[0]; // e.g., 'character', 'market', 'divine'

    try {
      // Rate limiting: max 100 events per second per category
      const rateLimitKey = `${category}:${realmId}`;
      if (!this.checkRateLimit(rateLimitKey, 100, 1000)) {
        console.warn(`[EventBus] Rate limit exceeded for ${rateLimitKey}`);
        return;
      }

      // Publish to multiple channels for flexible subscriptions
      const channels = [
        `${CHANNEL_PREFIX}all`, // Global events
        `${CHANNEL_PREFIX}realm:${realmId}`, // Realm-specific
        `${CHANNEL_PREFIX}category:${category}`, // Category-specific (market, divine, etc)
      ];

      if (characterId) {
        channels.push(`${CHANNEL_PREFIX}char:${characterId}`); // Character-specific
      }

      // Batch publish to all channels
      const pipeline = this.redis.pipeline();
      for (const channel of channels) {
        pipeline.publish(channel, serialized);
      }
      await pipeline.exec();

      console.log(`[EventBus] Published ${type} to ${channels.length} channels`);
    } catch (error) {
      console.error(`[EventBus] Error publishing event ${type}:`, error);
      throw error;
    }
  }

  /**
   * Subscribe to events from specific channels
   * Returns a subscriber instance that needs to be managed by caller
   */
  createSubscriber(channels: string[]): ReturnType<typeof getRedis> {
    const subscriber = this.redis.duplicate();
    
    subscriber.on('error', (err) => {
      console.error('[EventBus] Subscriber error:', err);
    });

    subscriber.on('ready', () => {
      console.log(`[EventBus] Subscriber ready, subscribing to ${channels.length} channels`);
    });

    return subscriber;
  }

  /**
   * Rate limiting helper
   * Returns true if within limit, false if exceeded
   */
  private checkRateLimit(key: string, maxCount: number, windowMs: number): boolean {
    const now = Date.now();
    const limit = this.rateLimitMap.get(key);

    if (!limit || now > limit.resetAt) {
      // New window
      this.rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
      return true;
    }

    if (limit.count >= maxCount) {
      return false;
    }

    limit.count++;
    return true;
  }

  /**
   * Batch publish multiple events at once
   * More efficient for bulk operations
   */
  async publishBatch(events: Array<{
    type: EventType;
    payload: any;
    realmId: string;
    characterId?: string;
  }>): Promise<void> {
    if (events.length === 0) return;

    try {
      const pipeline = this.redis.pipeline();
      const now = Date.now();

      for (const { type, payload, realmId, characterId } of events) {
        const event: GameEvent = {
          type,
          realmId,
          characterId,
          timestamp: now,
          data: payload,
        };

        const serialized = JSON.stringify(event);
        const category = type.split(':')[0];

        const channels = [
          `${CHANNEL_PREFIX}all`,
          `${CHANNEL_PREFIX}realm:${realmId}`,
          `${CHANNEL_PREFIX}category:${category}`,
        ];

        if (characterId) {
          channels.push(`${CHANNEL_PREFIX}char:${characterId}`);
        }

        for (const channel of channels) {
          pipeline.publish(channel, serialized);
        }
      }

      await pipeline.exec();
      console.log(`[EventBus] Published batch of ${events.length} events`);
    } catch (error) {
      console.error('[EventBus] Error publishing batch:', error);
      throw error;
    }
  }
}

// Singleton instance
export const eventBus = new EventBus();

// Helper functions for common event publications
export async function publishCharacterStatsUpdate(
  characterId: string,
  realmId: string,
  stats: EventPayloadMap['character:stats:updated']['stats']
): Promise<void> {
  await eventBus.publish('character:stats:updated', { characterId, stats }, realmId, characterId);
}

export async function publishCharacterLocationChange(
  characterId: string,
  realmId: string,
  oldLocation: string,
  newLocation: string,
  locationName: string
): Promise<void> {
  await eventBus.publish(
    'character:location:changed',
    { characterId, oldLocation, newLocation, locationName },
    realmId,
    characterId
  );
}

export async function publishCharacterStatusChange(
  characterId: string,
  realmId: string,
  oldStatus: string,
  newStatus: string
): Promise<void> {
  await eventBus.publish(
    'character:status:changed',
    { characterId, oldStatus, newStatus },
    realmId,
    characterId
  );
}

export async function publishCharacterPowerUpdate(
  characterId: string,
  realmId: string,
  interventionPower: { current: number; max: number }
): Promise<void> {
  await eventBus.publish(
    'character:power:updated',
    { characterId, interventionPower },
    realmId,
    characterId
  );
}

export async function publishMarketPriceUpdate(
  realmId: string,
  itemId: string,
  itemName: string,
  oldPrice: number,
  newPrice: number,
  supply: number,
  demand: number
): Promise<void> {
  await eventBus.publish(
    'market:price:updated',
    { itemId, itemName, oldPrice, newPrice, supply, demand },
    realmId
  );
}

