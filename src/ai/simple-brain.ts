/**
 * @fileoverview Simplified AI system in Godville style
 * Uses simple priority buckets with randomness instead of complex weighted decisions
 * 
 * NOTE: This is a utility module without 'use server' directive
 * It exports simple functions for AI decision making
 */

import type { Character, WorldState } from "@/types/character";
import type { GameData } from "@/services/gameDataService";

// Simple priority levels (Godville-style)
export enum Priority {
  URGENT = 100,    // Critical situations (death, severe danger)
  HIGH = 50,       // Important actions (quests, combat, rest when tired)
  MEDIUM = 20,     // Normal actions (exploration, travel, learning)
  LOW = 5,         // Background actions (wandering, reading)
  DISABLED = 0     // Action not available
}

/**
 * Add randomness to priority (Godville-style dice rolls)
 * Priority value becomes: base + random(0 to base)
 * This creates unpredictability while respecting priorities
 */
export function rollPriority(basePriority: Priority): number {
  if (basePriority === Priority.DISABLED) return 0;
  
  const randomBonus = Math.random() * basePriority;
  return basePriority + randomBonus;
}

/**
 * Simplified action priority calculation
 * Much simpler than the old weighted system
 */
export function getActionPriority(
  actionType: string,
  character: Character,
  worldState: WorldState,
  gameData: GameData
): Priority {
  
  // URGENT priorities (life-threatening situations)
  if (character.stats.health.current <= character.stats.health.max * 0.2) {
    // Very low health - healing/fleeing is urgent
    if (actionType === 'rest' || actionType === 'flee' || actionType === 'usePotion') {
      return Priority.URGENT;
    }
  }
  
  if (character.combat) {
    // In combat - fighting is urgent
    if (actionType === 'combat') {
      return Priority.URGENT;
    }
    // Fleeing when losing badly
    const enemy = gameData.enemies.find(e => e.id === character.combat?.enemyId);
    if (enemy && character.stats.health.current < character.stats.health.max * 0.3) {
      if (actionType === 'flee') {
        return Priority.URGENT;
      }
    }
  }
  
  // HIGH priorities (important but not critical)
  if (character.activeCryptQuest) {
    if (actionType === 'exploreCrypt') {
      return Priority.HIGH;
    }
  }
  
  if (character.currentAction?.type === 'quest') {
    if (actionType === 'quest') {
      return Priority.HIGH;
    }
  }
  
  if (character.stats.stamina.current <= character.stats.stamina.max * 0.3) {
    if (actionType === 'rest') {
      return Priority.HIGH;
    }
  }
  
  if (actionType === 'combat' && !character.combat) {
    // Looking for combat when healthy
    if (character.stats.health.current > character.stats.health.max * 0.7) {
      return Priority.HIGH;
    }
  }
  
  // MEDIUM priorities (normal gameplay)
  if (actionType === 'explore' || actionType === 'travel' || actionType === 'learn') {
    return Priority.MEDIUM;
  }
  
  if (actionType === 'quest' && !character.currentAction?.questId) {
    // Taking new quests
    return Priority.MEDIUM;
  }
  
  if (actionType === 'social') {
    // Social interactions
    return Priority.MEDIUM;
  }
  
  // LOW priorities (background activities)
  if (actionType === 'wander' || actionType === 'read' || actionType === 'pray') {
    return Priority.LOW;
  }
  
  return Priority.DISABLED;
}

/**
 * Select action using simple priority + randomness (Godville-style)
 */
export function selectSimpleAction(
  availableActions: Array<{ name: string; type: string; priority: Priority }>,
): { name: string; type: string } {
  
  // Roll for each action
  const rolledActions = availableActions.map(action => ({
    ...action,
    roll: rollPriority(action.priority)
  })).filter(a => a.roll > 0);
  
  if (rolledActions.length === 0) {
    // Fallback to wandering
    return { name: "Слоняться без дела", type: "misc" };
  }
  
  // Sort by roll (highest wins)
  rolledActions.sort((a, b) => b.roll - a.roll);
  
  return {
    name: rolledActions[0].name,
    type: rolledActions[0].type
  };
}
