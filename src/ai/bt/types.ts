import type { Character, WorldState } from "@/types/character";
import { computeActionScores } from "../priority-engine";

// Lightweight copy of the Action interface to avoid importing brain.ts (and a circular dep)
export interface ActionLike {
  name: string;
  type: string; // 'combat' | 'quest' | 'explore' | 'travel' | 'rest' | 'learn' | 'social' | 'misc' | 'system'
  canPerform: (character: Character, world: WorldState, gameData: any) => boolean;
  getWeight?: (character: Character, world: WorldState, gameData: any) => number;
  perform: (character: Character, gameData: any) => Promise<{ character: Character; logMessage: string | string[] }>;
}

export type Blackboard = {
  character: Character;
  worldState: WorldState;
  gameData: any;
  trace?: string[];
};

export interface Node {
  evaluate(bb: Blackboard): Promise<ActionLike | null>;
}

export class ConditionNode implements Node {
  private readonly predicate: (bb: Blackboard) => boolean;
  private readonly child: Node;
  private readonly label?: string;
  constructor(predicate: (bb: Blackboard) => boolean, child: Node, label?: string) {
    this.predicate = predicate;
    this.child = child;
    this.label = label;
  }
  async evaluate(bb: Blackboard): Promise<ActionLike | null> {
    const ok = this.predicate(bb);
    if (bb.trace && this.label) bb.trace.push(`COND ${this.label}: ${ok ? 'PASS' : 'FAIL'}`);
    if (!ok) return null;
    return await this.child.evaluate(bb);
  }
}

export class SelectorNode implements Node {
  private readonly children: Node[];
  constructor(children: Node[]) { this.children = children; }
  async evaluate(bb: Blackboard): Promise<ActionLike | null> {
    for (const child of this.children) {
      const result = await child.evaluate(bb);
      if (result) return result;
    }
    return null;
  }
}

export class LeafActionNode implements Node {
  private readonly action: ActionLike;
  constructor(action: ActionLike) { this.action = action; }
  async evaluate(bb: Blackboard): Promise<ActionLike | null> {
    return this.action.canPerform(bb.character, bb.worldState, bb.gameData) ? this.action : null;
  }
}

export class UtilityPickNode implements Node {
  private readonly actions: ActionLike[];
  private readonly fallback?: ActionLike;
  constructor(actions: ActionLike[], fallback?: ActionLike) {
    this.actions = actions;
    this.fallback = fallback;
  }
  async evaluate(bb: Blackboard): Promise<ActionLike | null> {
    const available = this.actions.filter(a => a.canPerform(bb.character, bb.worldState, bb.gameData));
    if (available.length === 0) return this.fallback ?? null;

    // Build entries and score using existing priority engine (re-uses getWeight internally via multiplier)
    const entries = available.map(a => ({ id: `${a.type}:${a.name}`, category: a.type as any, action: a as any }));
    const scored = await computeActionScores({ character: bb.character, actions: entries, world: bb.worldState });
    const top = scored[0];
    const chosen = available.find(a => `${a.type}:${a.name}` === top?.actionId) || available[0];
    if (bb.trace) bb.trace.push(`UTILITY pick: ${top?.actionId || (chosen ? `${chosen.type}:${chosen.name}` : 'none')}`);
    return chosen;
  }
}


