import type { Character } from "@/types/character";
import { getRedis } from "../../server/redis";

// Character repository interface - describes WHAT we do, not HOW
export interface CharacterRepository {
  saveCharacter(userId: string, characterData: Character): Promise<void>;
  fetchCharacter(userId: string): Promise<Character | null>;
}

// Use PostgreSQL repository for all character operations
import { PostgresCharacterRepository } from "./characterRepository.postgres";
const characterRepository: CharacterRepository = new PostgresCharacterRepository();

// Export functions that use the repository
// Client code doesn't need to know which database is being used
export function saveCharacter(userId: string, characterData: Character): Promise<void> {
  return characterRepository.saveCharacter(userId, characterData).then(async () => {
    try {
      const redis = getRedis();
      const key = `char:hot:${userId}`;
      if (characterData) {
        await redis.set(key, JSON.stringify(characterData), 'EX', 60);
      }
    } catch {}
  });
}

export function fetchCharacter(userId: string): Promise<Character | null> {
  return (async () => {
    try {
      const redis = getRedis();
      const key = `char:hot:${userId}`;
      const cached = await redis.get(key);
      if (cached) {
        try {
          return JSON.parse(cached) as Character;
        } catch (e) {
          // Corrupt/partial cache value: delete and ignore
          await redis.del(key);
        }
      }
    } catch {}
    const fromDb = await characterRepository.fetchCharacter(userId);
    if (fromDb) {
      try {
        const redis = getRedis();
        const key = `char:hot:${userId}`;
        await redis.set(key, JSON.stringify(fromDb), 'EX', 60);
      } catch {}
    }
    return fromDb;
  })();
}
