import type { Character, WorldState } from "@/types/character";
import { Priority } from "@/ai/simple-brain";

export type GoalType = 'earn_gold' | 'level_up' | 'faction_rep' | 'divine_favor' | 'heal' | 'equip_better';

export interface Goal {
  id: string;
  type: GoalType;
  description: string;
  priority: Priority;
  target?: number | string;
  createdAt: number;
  expiresAt?: number;
}

export function generateGoals(character: Character, world: WorldState): Goal[] {
  const goals: Goal[] = [];
  const gold = character.inventory.find(i => i.id === 'gold')?.quantity || 0;
  if (gold < 200) {
    goals.push({ id: 'earn_gold', type: 'earn_gold', description: 'Заработать 500 золота', priority: Priority.HIGH, target: 500, createdAt: Date.now() });
  }
  const hpRatio = character.stats.health.current / Math.max(1, character.stats.health.max);
  if (hpRatio < 0.5) {
    goals.push({ id: 'heal', type: 'heal', description: 'Восстановить здоровье', priority: Priority.URGENT, createdAt: Date.now() });
  }
  if ((character.divineFavor || 0) < 30) {
    goals.push({ id: 'divine', type: 'divine_favor', description: 'Увеличить благосклонность божества', priority: Priority.MEDIUM, createdAt: Date.now() });
  }
  const hasWeakGear = !character.equippedItems.weapon;
  if (hasWeakGear) {
    goals.push({ id: 'equip', type: 'equip_better', description: 'Улучшить снаряжение', priority: Priority.MEDIUM, createdAt: Date.now() });
  }
  // Track active generated quest as a high-priority goal to ensure progression
  if (character.activeGeneratedQuest) {
    goals.push({ id: character.activeGeneratedQuest.id, type: 'earn_gold', description: 'Завершить сгенерированное задание', priority: Priority.HIGH, createdAt: Date.now() });
  }
  return goals.sort((a, b) => b.priority - a.priority);
}

export function selectTopGoal(goals: Goal[]): Goal | null { return goals[0] || null; }


