'use server';

import type { Character } from "@/types/character";
import type { GameData } from "@/services/gameDataService";
import { allAchievements } from "@/data/achievements";
import { addOfflineEvent } from "@/services/offlineEventsService";
import { addChronicleEntry } from "@/services/chronicleService";
import { saveCharacter } from "@/services/characterService";

const MAJOR_CITIES = new Set([
  'solitude','windhelm','whiterun','markarth','riften'
]);

function sumKilledEnemies(analytics: Character['analytics']): number {
  const counters = analytics?.killedEnemies || {};
  return Object.values(counters).reduce((a, b) => a + (b || 0), 0);
}

function hasVisitedAllMajorCities(character: Character, gameData: GameData): boolean {
  const visited = new Set(character.visitedLocations || []);
  // Prefer actual locations typed as city
  const cities = (gameData.locations || []).filter(l => (l as any).type === 'city').map(l => l.id);
  const target = cities.length > 0 ? new Set(cities) : MAJOR_CITIES;
  for (const id of target) {
    if (!visited.has(id)) return false;
  }
  return true;
}

function getGold(character: Character): number {
  return character.inventory.find(i => i.id === 'gold')?.quantity || 0;
}

export type AchievementUnlock = { id: string; name: string };

export function evaluateAchievements(character: Character, gameData: GameData): AchievementUnlock[] {
  const unlocked = new Set(character.unlockedAchievements || []);
  const newUnlocks: AchievementUnlock[] = [];

  const rules: Record<string, () => boolean> = {
    first_quest: () => (character.completedQuests || []).length > 0,
    level_10: () => character.level >= 10,
    first_death: () => (character.deaths || 0) > 0,
    explorer: () => hasVisitedAllMajorCities(character, gameData),
    rich_man: () => getGold(character) >= 10_000,
    slayer: () => sumKilledEnemies(character.analytics) >= 50,
    // Theft/jail themed
    petty_thief: () => (character.actionHistory||[]).some(a => a.type === 'social') && character.effects.some(e => e.id === 'public_shame'),
    jailbird: () => (character.currentAction?.type === 'jail') || ((character.actionHistory||[]).filter(a => a.type === 'jail').length >= 1),
    temple_akatosh: () => character.templeCompletedFor === 'akatosh',
    temple_arkay: () => character.templeCompletedFor === 'arkay',
    temple_dibella: () => character.templeCompletedFor === 'dibella',
    temple_julianos: () => character.templeCompletedFor === 'julianos',
    temple_kynareth: () => character.templeCompletedFor === 'kynareth',
    temple_mara: () => character.templeCompletedFor === 'mara',
    temple_stendarr: () => character.templeCompletedFor === 'stendarr',
    temple_talos: () => character.templeCompletedFor === 'talos',
    temple_zenithar: () => character.templeCompletedFor === 'zenithar',
  };

  for (const a of allAchievements) {
    if (unlocked.has(a.id)) continue;
    const check = rules[a.id as keyof typeof rules];
    if (check && check()) {
      unlocked.add(a.id);
      newUnlocks.push({ id: a.id, name: a.name });
    }
  }

  if (newUnlocks.length > 0) {
    character.unlockedAchievements = Array.from(unlocked);
  }

  return newUnlocks;
}

export async function persistAchievementUnlocks(userId: string, character: Character, unlocks: AchievementUnlock[]) {
  if (unlocks.length === 0) return;
  // Persist also into preferences to survive DB round-trip without schema changes
  character.preferences = {
    ...(character.preferences || {}),
    unlockedAchievements: character.unlockedAchievements || [],
  };
  await saveCharacter(userId, character);
  for (const u of unlocks) {
    await addOfflineEvent(userId, { type: 'system', message: `Получено достижение: ${u.name}` });
    await addChronicleEntry(userId, {
      type: 'achievement',
      title: `Достижение получено`,
      description: u.name,
      icon: 'Award',
      data: { achievementId: u.id },
    } as any);
  }
}


