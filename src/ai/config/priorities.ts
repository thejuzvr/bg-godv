import type { WorldState } from "@/types/character";
import { HEALTH_CRITICAL_THRESHOLD, STAMINA_LOW_THRESHOLD } from "./constants";

export type Priority = 'DISABLED' | 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface PriorityRule {
  if: (s: {
    health: number;
    stamina: number;
    isInCombat: boolean;
    isLocationSafe: boolean;
    hasHealingPotion: boolean;
    isOverencumbered?: boolean;
    canTakeQuest?: boolean;
    isTired?: boolean;
    travelReady?: boolean;
  }) => boolean;
  priority: Priority;
  boost?: number; // additional numeric boost
  actions: string[]; // preferred action names
}

export const PRIORITY_RULES: Record<string, PriorityRule> = {
  healthCritical: {
    if: (s) => s.health <= HEALTH_CRITICAL_THRESHOLD,
    priority: 'URGENT',
    boost: 1.0,
    actions: ['Использовать зелье здоровья', 'Сбежать из боя', 'Отдохнуть в таверне'],
  },
  staminaLow: {
    if: (s) => s.stamina <= STAMINA_LOW_THRESHOLD && s.isLocationSafe,
    priority: 'HIGH',
    boost: 0.6,
    actions: ['Сделать привал', 'Переночевать в таверне'],
  },
  overencumbered: {
    if: (s) => !!s.isOverencumbered && s.isLocationSafe,
    priority: 'HIGH',
    boost: 0.5,
    actions: ['Продать хлам', 'Торговать с торговцем'],
  },
  takeQuest: {
    if: (s) => !!s.canTakeQuest && s.isLocationSafe,
    priority: 'HIGH',
    boost: 0.4,
    actions: ['Взять задание'],
  },
  restInCityLowHp: {
    if: (s) => s.isLocationSafe && s.health < 0.6 && !s.isInCombat,
    priority: 'HIGH',
    boost: 0.3,
    actions: ['Отдохнуть в таверне'],
  },
  travelReady: {
    if: (s) => !!s.travelReady && !s.isInCombat,
    priority: 'MEDIUM',
    boost: 0.2,
    actions: ['Путешествовать'],
  },
  combatOnly: {
    if: (s) => s.isInCombat,
    priority: 'HIGH',
    boost: 0.5,
    actions: ['Атаковать', 'Сбежать из боя'],
  },
};

export function priorityToBaseWeight(priority: Priority): number {
  switch (priority) {
    case 'DISABLED': return 0;
    case 'LOW': return 10;
    case 'MEDIUM': return 25;
    case 'HIGH': return 55;
    case 'URGENT': return 100;
  }
}


