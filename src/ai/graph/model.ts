import { z } from 'zod';

export type PortType = 'number' | 'boolean' | 'string' | 'vector' | 'json';

export interface GraphNode {
  id: string;
  type: string; // e.g., 'Sensor.Fatigue', 'Eval.Priority', 'Plan.Goal', 'Act.Dispatch'
  inputs: Record<string, PortType>;
  outputs: Record<string, PortType>;
  config?: Record<string, unknown>;
  tickFrequency?: 'every' | 'sometimes' | 'rare';
}

export interface GraphEdge {
  from: { nodeId: string; port: string };
  to: { nodeId: string; port: string };
}

export interface GraphModel {
  nodes: GraphNode[];
  edges: GraphEdge[];
  version: number;
}

export const PortTypeSchema = z.enum(['number', 'boolean', 'string', 'vector', 'json']);

export const GraphNodeSchema = z.object({
  id: z.string(),
  type: z.string(),
  inputs: z.record(PortTypeSchema),
  outputs: z.record(PortTypeSchema),
  config: z.record(z.any()).optional(),
  tickFrequency: z.enum(['every', 'sometimes', 'rare']).optional(),
});

export const GraphEdgeSchema = z.object({
  from: z.object({ nodeId: z.string(), port: z.string() }),
  to: z.object({ nodeId: z.string(), port: z.string() }),
});

export const GraphModelSchema = z.object({
  nodes: z.array(GraphNodeSchema),
  edges: z.array(GraphEdgeSchema),
  version: z.number().int().nonnegative(),
});

export type ValidGraph = z.infer<typeof GraphModelSchema>;


