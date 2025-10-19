export type ResourceType = 'ore_iron' | 'ore_silver' | 'ore_gold';

export interface ResourceNode {
  id: string;
  name: string;
  locationId: string; // ties to a Location id
  resource: ResourceType;
  yieldPerTick: number; // average items per gather action
  rarity: 'common' | 'uncommon' | 'rare';
}

export const resourceNodes: ResourceNode[] = [
  { id: 'node_whiterun_iron_1', name: 'Железная жила', locationId: 'whiterun_outskirts', resource: 'ore_iron', yieldPerTick: 2, rarity: 'common' },
  { id: 'node_markarth_silver_1', name: 'Серебряная жила', locationId: 'markarth_outskirts', resource: 'ore_silver', yieldPerTick: 1, rarity: 'uncommon' },
  { id: 'node_riften_gold_1', name: 'Золотая жила', locationId: 'riften_outskirts', resource: 'ore_gold', yieldPerTick: 1, rarity: 'uncommon' },
];

export function getNodesAtLocation(locationId: string): ResourceNode[] {
  return resourceNodes.filter((n) => n.locationId === locationId);
}


