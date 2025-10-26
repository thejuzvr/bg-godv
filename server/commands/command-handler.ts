// Command Handler - processes player commands with validation and event publishing
import type { Character } from '@/types/character';
import { eventBus } from '../events/event-bus';

export interface CommandContext {
  userId: string;
  characterId: string;
  realmId: string;
  timestamp: number;
}

export interface CommandResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  events?: Array<{
    type: string;
    payload: any;
  }>;
}

export type CommandHandler<TInput, TOutput> = (
  input: TInput,
  context: CommandContext
) => Promise<CommandResult<TOutput>>;

/**
 * Base command executor with automatic event publishing
 * Ensures atomicity: if command fails, no events are published
 */
export async function executeCommand<TInput, TOutput>(
  handler: CommandHandler<TInput, TOutput>,
  input: TInput,
  context: CommandContext
): Promise<CommandResult<TOutput>> {
  try {
    console.log(`[CommandHandler] Executing command for user ${context.userId}`);
    
    // Execute the command handler
    const result = await handler(input, context);

    // If successful and has events, publish them
    if (result.success && result.events && result.events.length > 0) {
      try {
        await eventBus.publishBatch(
          result.events.map(event => ({
            type: event.type as any,
            payload: event.payload,
            realmId: context.realmId,
            characterId: context.characterId,
          }))
        );
        console.log(`[CommandHandler] Published ${result.events.length} events`);
      } catch (eventError) {
        console.error('[CommandHandler] Error publishing events:', eventError);
        // Events failed but command succeeded - log but don't fail the command
        // Real-time updates will be missed but data is consistent
      }
    }

    return result;
  } catch (error) {
    console.error('[CommandHandler] Command execution failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Validates that a character exists and belongs to the user
 */
export function validateCharacterOwnership(
  character: Character | null,
  userId: string
): CommandResult<never> | null {
  if (!character) {
    return {
      success: false,
      error: 'Character not found',
    };
  }

  if (character.userId !== userId) {
    return {
      success: false,
      error: 'Character does not belong to this user',
    };
  }

  return null; // Valid
}

/**
 * Rate limiting helper for commands
 * Uses Redis for distributed rate limiting
 */
export async function checkRateLimit(
  redis: any,
  key: string,
  maxRequests: number,
  windowSeconds: number
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  const now = Math.floor(Date.now() / 1000);
  const windowKey = `ratelimit:${key}:${Math.floor(now / windowSeconds)}`;
  
  try {
    const count = await redis.incr(windowKey);
    
    if (count === 1) {
      // First request in this window, set expiry
      await redis.expire(windowKey, windowSeconds);
    }
    
    const allowed = count <= maxRequests;
    const remaining = Math.max(0, maxRequests - count);
    const resetAt = (Math.floor(now / windowSeconds) + 1) * windowSeconds;
    
    return { allowed, remaining, resetAt };
  } catch (error) {
    console.error('[CommandHandler] Rate limit check failed:', error);
    // On error, allow the request
    return { allowed: true, remaining: maxRequests, resetAt: now + windowSeconds };
  }
}

/**
 * Validates required fields in input
 */
export function validateRequired<T extends Record<string, any>>(
  input: T,
  requiredFields: (keyof T)[]
): CommandResult<never> | null {
  const missing = requiredFields.filter(field => {
    const value = input[field];
    return value === undefined || value === null || value === '';
  });

  if (missing.length > 0) {
    return {
      success: false,
      error: `Missing required fields: ${missing.join(', ')}`,
    };
  }

  return null; // Valid
}

/**
 * Helper to create command context from request
 */
export function createCommandContext(
  userId: string,
  characterId: string,
  realmId: string = 'global'
): CommandContext {
  return {
    userId,
    characterId,
    realmId,
    timestamp: Date.now(),
  };
}

