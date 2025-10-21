import { resourceNodes, getNodesAtLocation } from '../src/data/resourceNodes.js';

console.log('🎯 Checking resource nodes...\n');

const outskirts = [
  'whiterun_outskirts',
  'solitude_outskirts',
  'windhelm_outskirts',
  'riften_outskirts',
  'markarth_outskirts',
  'dawnstar_outskirts',
  'winterhold_outskirts',
  'morthal_outskirts',
  'falkreath_outskirts'
];

console.log(`📊 Total resource nodes: ${resourceNodes.length}\n`);

outskirts.forEach(locationId => {
  const nodes = getNodesAtLocation(locationId);
  console.log(`\n📍 ${locationId}:`);
  console.log('─'.repeat(60));
  
  if (nodes.length === 0) {
    console.log('  ⚠️  No resource nodes found!');
  } else {
    nodes.forEach(node => {
      const rarityIcon = 
        node.rarity === 'legendary' ? '⭐' :
        node.rarity === 'rare' ? '💎' :
        node.rarity === 'uncommon' ? '✨' :
        '📦';
      
      console.log(`  ${rarityIcon} ${node.name} - ${node.resource} (x${node.yieldPerTick})`);
    });
  }
});

console.log('\n' + '─'.repeat(60));

// Category breakdown
const categories = {
  ore: resourceNodes.filter(n => n.resource.startsWith('ore_')),
  ingredient: resourceNodes.filter(n => n.resource.startsWith('ingredient_')),
  material: resourceNodes.filter(n => n.resource.startsWith('material_'))
};

console.log('\n📊 Resources by category:');
console.log(`  ⛏️  Ores: ${categories.ore.length} nodes`);
console.log(`  🌿 Ingredients: ${categories.ingredient.length} nodes`);
console.log(`  🪵 Materials: ${categories.material.length} nodes`);

console.log('\n✅ Resource nodes check complete!\n');

