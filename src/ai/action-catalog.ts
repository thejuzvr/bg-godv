import type { Action } from "./brain";

// Central catalog of actions exposed from brain.ts
// We re-export a subset via explicit imports to avoid circular imports where possible.

// Note: To keep first step minimal, we will import actions directly from brain.ts where they are already defined.
// Later we can progressively move action definitions into dedicated modules.

export type ActionCategory = Action['type'];

export interface CatalogEntry {
  id: string;
  category: ActionCategory;
  tags?: string[];
  cooldownMs?: number;
  // Adapter to brain action
  action: Action;
}

// Dynamic import to avoid heavy initial load — but here we can import statically.
// We will import the arrays and map them to entries with stable ids.

import { idleActions, combatActions, deadActions, exploringActions, wanderAction } from "./brain";

// Placeholder: we will fill this from policy at runtime by scanning brain's action sets if needed.
const TAG_REGISTRY: Record<string, string[]> = {
  'Взять задание': ['quest','city'],
  'Сделать привал': ['rest','travel'],
  'Переночевать в таверне': ['rest','city'],
  'Отдохнуть в таверне': ['rest','city'],
  'Торговать с торговцем': ['trade','city'],
  'Продать хлам': ['trade','city'],
  'Найти врага': ['combat','explore'],
  'Сбежать из боя': ['combat','safety'],
  'Использовать зелье здоровья': ['safety'],
};

function toEntries(prefix: string, actions: Action[]): CatalogEntry[] {
  return actions.map((a, idx) => ({
    id: `${prefix}:${a.name || idx}`,
    category: a.type,
    tags: TAG_REGISTRY[a.name] || undefined,
    action: a,
  }));
}

export const ACTION_CATALOG: CatalogEntry[] = [
  ...toEntries('idle', idleActions),
  ...toEntries('combat', combatActions),
  ...toEntries('dead', deadActions),
  ...toEntries('exploring', exploringActions),
  { id: 'fallback:wander', category: 'explore', action: wanderAction },
];


