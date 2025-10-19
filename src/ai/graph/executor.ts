import type { GraphModel, GraphNode, GraphEdge } from './model';
import { GraphModelSchema } from './model';
import { getNodeImpl, type NodeExecutionContext } from './nodes';
import type { Character } from '@/types/character';
import type { GameData } from '@/services/gameDataService';

type Compiled = {
  order: GraphNode[];
  edges: GraphEdge[];
};

export type GraphDecision = {
  selectedActionName?: string | null;
};

export function validateGraph(graph: GraphModel): { ok: true } | { ok: false; error: string } {
  const parsed = GraphModelSchema.safeParse(graph);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.message };
  }
  // Simple cycle check using DFS
  const idToNode = new Map(graph.nodes.map(n => [n.id, n] as const));
  const adj = new Map<string, string[]>();
  for (const e of graph.edges) {
    const arr = adj.get(e.from.nodeId) || [];
    arr.push(e.to.nodeId);
    adj.set(e.from.nodeId, arr);
    if (!idToNode.has(e.from.nodeId) || !idToNode.has(e.to.nodeId)) {
      return { ok: false, error: 'Edge references missing node' };
    }
  }
  const visited = new Set<string>();
  const stack = new Set<string>();
  const hasCycle = (n: string): boolean => {
    if (stack.has(n)) return true;
    if (visited.has(n)) return false;
    visited.add(n);
    stack.add(n);
    for (const m of adj.get(n) || []) {
      if (hasCycle(m)) return true;
    }
    stack.delete(n);
    return false;
  };
  for (const n of graph.nodes) {
    if (hasCycle(n.id)) return { ok: false, error: 'Graph contains cycles' };
  }
  return { ok: true };
}

function topoSort(nodes: GraphNode[], edges: GraphEdge[]): GraphNode[] {
  const inDeg = new Map<string, number>(nodes.map(n => [n.id, 0] as const));
  for (const e of edges) {
    inDeg.set(e.to.nodeId, (inDeg.get(e.to.nodeId) || 0) + 1);
  }
  const q: GraphNode[] = nodes.filter(n => (inDeg.get(n.id) || 0) === 0);
  const res: GraphNode[] = [];
  const out = new Map<string, string[]>();
  for (const e of edges) {
    const arr = out.get(e.from.nodeId) || [];
    arr.push(e.to.nodeId);
    out.set(e.from.nodeId, arr);
  }
  const idToNode = new Map(nodes.map(n => [n.id, n] as const));
  while (q.length) {
    const n = q.shift()!;
    res.push(n);
    for (const m of out.get(n.id) || []) {
      inDeg.set(m, (inDeg.get(m) || 0) - 1);
      if ((inDeg.get(m) || 0) === 0) {
        const node = idToNode.get(m);
        if (node) q.push(node);
      }
    }
  }
  return res;
}

function compileGraph(graph: GraphModel): Compiled {
  const order = topoSort(graph.nodes, graph.edges);
  return { order, edges: graph.edges };
}

export async function executeGraph(
  character: Character,
  gameData: GameData,
  graph: GraphModel
): Promise<GraphDecision> {
  const valid = validateGraph(graph);
  if (!('ok' in valid) || !valid.ok) {
    throw new Error(`Invalid graph: ${(valid as any).error}`);
  }
  const compiled = compileGraph(graph);
  const outputs = new Map<string, Map<string, any>>();
  const getInput = (nodeId: string, port: string) => {
    // follow reverse edges to find upstream outputs with same port name
    for (const e of compiled.edges) {
      if (e.to.nodeId === nodeId && e.to.port === port) {
        const up = outputs.get(e.from.nodeId)?.get(e.from.port);
        return up;
      }
    }
    return undefined;
  };
  const setOutput = (nodeId: string, port: string, value: any) => {
    if (!outputs.has(nodeId)) outputs.set(nodeId, new Map());
    outputs.get(nodeId)!.set(port, value);
  };
  const ctx: NodeExecutionContext = { character, gameData, getInput, setOutput };
  for (const node of compiled.order) {
    const impl = getNodeImpl(node.type);
    if (!impl) continue;
    await impl.execute(node, ctx);
  }
  // Heuristic: if any node produced selectedActionName, pick the last one in order
  let selectedActionName: string | null = null;
  for (const node of compiled.order) {
    const name = outputs.get(node.id)?.get('selectedActionName');
    if (typeof name === 'string' && name) selectedActionName = name;
  }
  return { selectedActionName };
}


