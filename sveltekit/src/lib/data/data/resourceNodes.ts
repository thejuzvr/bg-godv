export type ResourceType = 
  // Ores
  | 'ore_iron' | 'ore_silver' | 'ore_gold' | 'ore_corundum' | 'ore_quicksilver' 
  | 'ore_moonstone' | 'ore_malachite' | 'ore_orichalcum' | 'ore_ebony'
  // Alchemy ingredients
  | 'ingredient_blue_mountain_flower' | 'ingredient_lavender' | 'ingredient_red_mountain_flower'
  | 'ingredient_thistle_branch' | 'ingredient_tundra_cotton' | 'ingredient_snowberry'
  | 'ingredient_wheat' | 'ingredient_jazbay_grapes' | 'ingredient_nirnroot'
  | 'ingredient_imp_stool' | 'ingredient_white_cap' | 'ingredient_blisterwort'
  | 'ingredient_glowing_mushroom' | 'ingredient_creep_cluster' | 'ingredient_mora_tapinella'
  | 'ingredient_scaly_pholiota' | 'ingredient_ectoplasm' | 'ingredient_bone_meal'
  // Materials
  | 'material_firewood' | 'material_charcoal' | 'material_linen';

export interface ResourceNode {
  id: string;
  name: string;
  locationId: string; // ties to a Location id
  resource: ResourceType;
  yieldPerTick: number; // average items per gather action
  rarity: 'common' | 'uncommon' | 'rare';
}

export const resourceNodes: ResourceNode[] = [
  // === WHITERUN OUTSKIRTS ===
  { id: 'node_whiterun_iron_1', name: 'Железная жила', locationId: 'whiterun_outskirts', resource: 'ore_iron', yieldPerTick: 2, rarity: 'common' },
  { id: 'node_whiterun_corundum_1', name: 'Корундовая жила', locationId: 'whiterun_outskirts', resource: 'ore_corundum', yieldPerTick: 1, rarity: 'uncommon' },
  { id: 'node_whiterun_flowers_1', name: 'Поляна горных цветов', locationId: 'whiterun_outskirts', resource: 'ingredient_blue_mountain_flower', yieldPerTick: 3, rarity: 'common' },
  { id: 'node_whiterun_wheat_1', name: 'Поле пшеницы', locationId: 'whiterun_outskirts', resource: 'ingredient_wheat', yieldPerTick: 2, rarity: 'common' },
  
  // === MARKARTH OUTSKIRTS ===
  { id: 'node_markarth_silver_1', name: 'Серебряная жила', locationId: 'markarth_outskirts', resource: 'ore_silver', yieldPerTick: 1, rarity: 'uncommon' },
  { id: 'node_markarth_gold_1', name: 'Золотая жила', locationId: 'markarth_outskirts', resource: 'ore_gold', yieldPerTick: 1, rarity: 'uncommon' },
  { id: 'node_markarth_malachite_1', name: 'Малахитовая жила', locationId: 'markarth_outskirts', resource: 'ore_malachite', yieldPerTick: 1, rarity: 'rare' },
  { id: 'node_markarth_creep_1', name: 'Заросли ползучего кластера', locationId: 'markarth_outskirts', resource: 'ingredient_creep_cluster', yieldPerTick: 2, rarity: 'uncommon' },
  
  // === RIFTEN OUTSKIRTS ===
  { id: 'node_riften_gold_1', name: 'Золотая жила', locationId: 'riften_outskirts', resource: 'ore_gold', yieldPerTick: 1, rarity: 'uncommon' },
  { id: 'node_riften_iron_1', name: 'Железная жила', locationId: 'riften_outskirts', resource: 'ore_iron', yieldPerTick: 2, rarity: 'common' },
  { id: 'node_riften_mushrooms_1', name: 'Грибная поляна', locationId: 'riften_outskirts', resource: 'ingredient_blisterwort', yieldPerTick: 3, rarity: 'common' },
  { id: 'node_riften_thistle_1', name: 'Заросли чертополоха', locationId: 'riften_outskirts', resource: 'ingredient_thistle_branch', yieldPerTick: 2, rarity: 'common' },
  
  // === SOLITUDE OUTSKIRTS ===
  { id: 'node_solitude_quicksilver_1', name: 'Ртутная жила', locationId: 'solitude_outskirts', resource: 'ore_quicksilver', yieldPerTick: 1, rarity: 'uncommon' },
  { id: 'node_solitude_iron_1', name: 'Железная жила', locationId: 'solitude_outskirts', resource: 'ore_iron', yieldPerTick: 2, rarity: 'common' },
  { id: 'node_solitude_lavender_1', name: 'Лавандовое поле', locationId: 'solitude_outskirts', resource: 'ingredient_lavender', yieldPerTick: 3, rarity: 'common' },
  { id: 'node_solitude_snowberry_1', name: 'Кусты снежной ягоды', locationId: 'solitude_outskirts', resource: 'ingredient_snowberry', yieldPerTick: 2, rarity: 'common' },
  
  // === WINDHELM OUTSKIRTS ===
  { id: 'node_windhelm_iron_1', name: 'Железная жила', locationId: 'windhelm_outskirts', resource: 'ore_iron', yieldPerTick: 2, rarity: 'common' },
  { id: 'node_windhelm_corundum_1', name: 'Корундовая жила', locationId: 'windhelm_outskirts', resource: 'ore_corundum', yieldPerTick: 1, rarity: 'uncommon' },
  { id: 'node_windhelm_tundra_1', name: 'Тундровый хлопок', locationId: 'windhelm_outskirts', resource: 'ingredient_tundra_cotton', yieldPerTick: 2, rarity: 'common' },
  { id: 'node_windhelm_imp_1', name: 'Грибы-бесовники', locationId: 'windhelm_outskirts', resource: 'ingredient_imp_stool', yieldPerTick: 2, rarity: 'common' },
  
  // === DAWNSTAR OUTSKIRTS ===
  { id: 'node_dawnstar_iron_1', name: 'Железная жила', locationId: 'dawnstar_outskirts', resource: 'ore_iron', yieldPerTick: 2, rarity: 'common' },
  { id: 'node_dawnstar_quicksilver_1', name: 'Ртутная жила', locationId: 'dawnstar_outskirts', resource: 'ore_quicksilver', yieldPerTick: 1, rarity: 'uncommon' },
  { id: 'node_dawnstar_snowberry_1', name: 'Снежная ягода', locationId: 'dawnstar_outskirts', resource: 'ingredient_snowberry', yieldPerTick: 3, rarity: 'common' },
  
  // === WINTERHOLD OUTSKIRTS ===
  { id: 'node_winterhold_moonstone_1', name: 'Лунный камень', locationId: 'winterhold_outskirts', resource: 'ore_moonstone', yieldPerTick: 1, rarity: 'rare' },
  { id: 'node_winterhold_ice_1', name: 'Морозные кристаллы', locationId: 'winterhold_outskirts', resource: 'ingredient_frost_salts', yieldPerTick: 1, rarity: 'uncommon' },
  { id: 'node_winterhold_glow_1', name: 'Светящиеся грибы', locationId: 'winterhold_outskirts', resource: 'ingredient_glowing_mushroom', yieldPerTick: 2, rarity: 'uncommon' },
  
  // === MORTHAL OUTSKIRTS ===
  { id: 'node_morthal_iron_1', name: 'Железная жила', locationId: 'morthal_outskirts', resource: 'ore_iron', yieldPerTick: 2, rarity: 'common' },
  { id: 'node_morthal_mushroom_1', name: 'Болотные грибы', locationId: 'morthal_outskirts', resource: 'ingredient_white_cap', yieldPerTick: 3, rarity: 'common' },
  { id: 'node_morthal_bone_1', name: 'Костная мука', locationId: 'morthal_outskirts', resource: 'ingredient_bone_meal', yieldPerTick: 2, rarity: 'common' },
  { id: 'node_morthal_ecto_1', name: 'Эктоплазма', locationId: 'morthal_outskirts', resource: 'ingredient_ectoplasm', yieldPerTick: 1, rarity: 'uncommon' },
  
  // === FALKREATH OUTSKIRTS ===
  { id: 'node_falkreath_iron_1', name: 'Железная жила', locationId: 'falkreath_outskirts', resource: 'ore_iron', yieldPerTick: 2, rarity: 'common' },
  { id: 'node_falkreath_wood_1', name: 'Лесные дрова', locationId: 'falkreath_outskirts', resource: 'material_firewood', yieldPerTick: 3, rarity: 'common' },
  { id: 'node_falkreath_mora_1', name: 'Мора Тапинелла', locationId: 'falkreath_outskirts', resource: 'ingredient_mora_tapinella', yieldPerTick: 2, rarity: 'uncommon' },
  { id: 'node_falkreath_scaly_1', name: 'Чешуйчатая фолиота', locationId: 'falkreath_outskirts', resource: 'ingredient_scaly_pholiota', yieldPerTick: 2, rarity: 'uncommon' },
];

export function getNodesAtLocation(locationId: string): ResourceNode[] {
  return resourceNodes.filter((n) => n.locationId === locationId);
}


