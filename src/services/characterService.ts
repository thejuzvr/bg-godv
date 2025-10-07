import type { Character } from "@/types/character";

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
  return characterRepository.saveCharacter(userId, characterData);
}

export function fetchCharacter(userId: string): Promise<Character | null> {
  return characterRepository.fetchCharacter(userId);
}
