import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import pkg from 'pg';
const { Pool } = pkg;
import { gameLocations, gameItems, gameNpcs, gameEnemies, gameThoughts, npcDialogueLines } from '../shared/schema.js';

// Import game data from static files
import { initialLocations } from '../src/data/locations.js';
import { initialItems } from '../src/data/items.js';
import { initialNpcs } from '../src/data/npcs.js';
import { initialEnemies } from '../src/data/enemies.js';
import { getFallbackThought } from '../src/data/thoughts.js';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool);

async function migrateGameData() {
  console.log('🔄 Starting game data migration...\n');

  try {
    // Migrate Locations
    console.log('📍 Migrating locations...');
    const locationData = initialLocations.map(loc => ({
      id: loc.id,
      name: loc.name,
      type: loc.type,
      coordX: loc.coords.x,
      coordY: loc.coords.y,
      isSafe: loc.isSafe,
    }));
    
    await db.insert(gameLocations)
      .values(locationData)
      .onConflictDoNothing();
    console.log(`✅ Migrated ${locationData.length} locations\n`);

    // Migrate Items
    console.log('⚔️ Migrating items...');
    const itemData = initialItems.map(item => ({
      id: item.id,
      name: item.name,
      weight: item.weight,
      type: item.type,
      rarity: item.rarity || null,
      equipmentSlot: item.equipmentSlot || null,
      damage: item.damage || null,
      armor: item.armor || null,
      effect: item.effect || null,
      spellId: item.spellId || null,
      learningEffect: item.learningEffect || null,
    }));
    
    await db.insert(gameItems)
      .values(itemData)
      .onConflictDoNothing();
    console.log(`✅ Migrated ${itemData.length} items\n`);

    // Migrate NPCs
    console.log('👥 Migrating NPCs...');
    const npcData = initialNpcs.map(npc => ({
      id: npc.id,
      name: npc.name,
      description: npc.description,
      location: npc.location,
      dialogue: npc.dialogue,
      inventory: npc.inventory || null,
      isCompanion: npc.isCompanion || false,
      hireCost: npc.hireCost || null,
      factionId: npc.factionId || null,
      companionDetails: npc.companionDetails || null,
    }));
    
    await db.insert(gameNpcs)
      .values(npcData)
      .onConflictDoNothing();
    console.log(`✅ Migrated ${npcData.length} NPCs\n`);

    // Migrate Enemies
    console.log('🐉 Migrating enemies...');
    const enemyData = initialEnemies.map(enemy => ({
      id: enemy.id,
      name: enemy.name,
      health: enemy.health,
      damage: enemy.damage,
      armor: (enemy as any).armor || 10, // Default armor
      xp: enemy.xp,
      level: enemy.level || 1,
      minLevel: enemy.minLevel || null,
      isUnique: enemy.isUnique || false,
      guaranteedDrop: enemy.guaranteedDrop || null,
      appliesEffect: enemy.appliesEffect || null,
    }));
    
    await db.insert(gameEnemies)
      .values(enemyData)
      .onConflictDoNothing();
    console.log(`✅ Migrated ${enemyData.length} enemies\n`);

    console.log('✨ Game data migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

migrateGameData();
