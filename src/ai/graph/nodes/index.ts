import type { GraphNode } from '../model';
import type { Character, WorldState } from '@/types/character';
import type { GameData } from '@/services/gameDataService';
import { buildWorldState } from '@/ai/game-engine';
import { computeActionScores } from '@/ai/priority-engine';

export type NodeExecutionContext = {
  character: Character;
  gameData: GameData;
  getInput: (nodeId: string, port: string) => any;
  setOutput: (nodeId: string, port: string, value: any) => void;
};

export interface NodeImpl {
  type: string;
  execute: (node: GraphNode, ctx: NodeExecutionContext) => Promise<void> | void;
}

// Sensor: World state snapshot
const SensorWorld: NodeImpl = {
  type: 'Sensor.World',
  execute(node, ctx) {
    const world = buildWorldState(ctx.character as any, ctx.gameData as any);
    ctx.setOutput(node.id, 'world', world);
  },
};

// Action selector by name (simple override)
// config: { actionName: string }
const ActSelectByName: NodeImpl = {
  type: 'Act.SelectByName',
  execute(node, ctx) {
    const actionName = String((node.config as any)?.actionName || '');
    ctx.setOutput(node.id, 'selectedActionName', actionName);
  },
};

const registry: Record<string, NodeImpl> = {
  [SensorWorld.type]: SensorWorld,
  [ActSelectByName.type]: ActSelectByName,
};

export function getNodeImpl(type: string): NodeImpl | null {
  return registry[type] || null;
}

// Sensor: Character snapshot
const SensorCharacter: NodeImpl = {
  type: 'Sensor.Character',
  execute(node, ctx) {
    ctx.setOutput(node.id, 'character', ctx.character);
  },
};

// Sensor: Fatigue ratio (0..1)
const SensorFatigue: NodeImpl = {
  type: 'Sensor.Fatigue',
  execute(node, ctx) {
    const f = ctx.character.stats?.fatigue;
    const ratio = f ? (f.current / Math.max(1, f.max)) : 0;
    ctx.setOutput(node.id, 'ratio', Math.max(0, Math.min(1, ratio)));
  },
};

// Evaluator: Priority engine picks the best available action name
const EvalPriority: NodeImpl = {
  type: 'Eval.Priority',
  async execute(node, ctx) {
    const world: WorldState = buildWorldState(ctx.character as any, ctx.gameData as any);
    const brain = await import('@/ai/brain');
    const union = ([] as any[]).concat(
      (brain as any).idleActions,
      (brain as any).combatActions,
      (brain as any).deadActions,
      (brain as any).exploringActions
    );
    const possible = union.filter(a => {
      try { return a.canPerform(ctx.character as any, world as any, ctx.gameData as any); } catch { return false; }
    });
    if (possible.length === 0) return;
    // Build minimal catalog entries on the fly to avoid circular imports
    const subset = (possible as any[]).map((a, idx) => ({ id: `dyn:${idx}:${a.name}`, category: a.type, action: a }));
    const scored = await computeActionScores({ character: ctx.character as any, actions: subset as any, world });
    const top = scored[0];
    if (top) ctx.setOutput(node.id, 'selectedActionName', top.name);
  },
};

// Register new nodes
registry[SensorCharacter.type] = SensorCharacter;
registry[SensorFatigue.type] = SensorFatigue;
registry[EvalPriority.type] = EvalPriority;

// Sensor: Location data
const SensorLocation: NodeImpl = {
  type: 'Sensor.Location',
  execute(node, ctx) {
    const world: WorldState = buildWorldState(ctx.character as any, ctx.gameData as any);
    ctx.setOutput(node.id, 'locationId', ctx.character.location);
    ctx.setOutput(node.id, 'isSafe', world.isLocationSafe);
  },
};
registry[SensorLocation.type] = SensorLocation;

// Eval: Low health boolean
const EvalLowHealth: NodeImpl = {
  type: 'Eval.LowHealth',
  execute(node, ctx) {
    const threshold = Number((node.config as any)?.threshold ?? 0.3);
    const ratio = ctx.character.stats.health.current / Math.max(1, ctx.character.stats.health.max);
    ctx.setOutput(node.id, 'low', ratio < threshold);
  },
};
registry[EvalLowHealth.type] = EvalLowHealth;

// Eval: Is tired boolean (config.threshold)
const EvalIsTired: NodeImpl = {
  type: 'Eval.IsTired',
  execute(node, ctx) {
    const threshold = Number((node.config as any)?.threshold ?? 0.6);
    const f = ctx.character.stats?.fatigue;
    const ratio = f ? (f.current / Math.max(1, f.max)) : 0;
    ctx.setOutput(node.id, 'tired', ratio > threshold);
  },
};
registry[EvalIsTired.type] = EvalIsTired;

// Eval: Overencumbered
const EvalIsOverenc: NodeImpl = {
  type: 'Eval.IsOverencumbered',
  execute(node, ctx) {
    const world: WorldState = buildWorldState(ctx.character as any, ctx.gameData as any);
    ctx.setOutput(node.id, 'over', world.isOverencumbered);
  },
};
registry[EvalIsOverenc.type] = EvalIsOverenc;

// Action: Select by category (rest, combat, explore, social, quest, travel, learn, misc, system)
const ActSelectByCategory: NodeImpl = {
  type: 'Act.SelectByCategory',
  async execute(node, ctx) {
    const category = String((node.config as any)?.category || 'rest');
    const world: WorldState = buildWorldState(ctx.character as any, ctx.gameData as any);
    const brain = await import('@/ai/brain');
    const union = ([] as any[]).concat(
      (brain as any).idleActions,
      (brain as any).combatActions,
      (brain as any).deadActions,
      (brain as any).exploringActions
    );
    const candidates = union.filter(a => a.type === category).filter(a => {
      try { return a.canPerform(ctx.character as any, world as any, ctx.gameData as any); } catch { return false; }
    });
    if (candidates.length === 0) return;
    const subset = (candidates as any[]).map((a, idx) => ({ id: `cat:${category}:${idx}`, category: a.type, action: a }));
    const scored = await computeActionScores({ character: ctx.character as any, actions: subset as any, world });
    const top = scored[0];
    if (top) ctx.setOutput(node.id, 'selectedActionName', top.name);
  },
};
registry[ActSelectByCategory.type] = ActSelectByCategory;

// Action: Select from list of names (first available), config.names: string[]
const ActSelectFromList: NodeImpl = {
  type: 'Act.SelectFromList',
  async execute(node, ctx) {
    const names: string[] = Array.isArray((node.config as any)?.names) ? ((node.config as any)?.names as string[]) : [];
    if (names.length === 0) return;
    const brain = await import('@/ai/brain');
    const union = ([] as any[]).concat(
      (brain as any).idleActions,
      (brain as any).combatActions,
      (brain as any).deadActions,
      (brain as any).exploringActions
    );
    for (const n of names) {
      const found = union.find(a => a.name === n);
      if (found) { ctx.setOutput(node.id, 'selectedActionName', n); return; }
    }
  },
};
registry[ActSelectFromList.type] = ActSelectFromList;

// Action: Wander fallback
const ActWander: NodeImpl = {
  type: 'Act.Wander',
  async execute(node, ctx) {
    const brain = await import('@/ai/brain');
    const wander = (brain as any).wanderAction;
    if (wander?.name) ctx.setOutput(node.id, 'selectedActionName', wander.name);
  },
};
registry[ActWander.type] = ActWander;


