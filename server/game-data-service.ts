import dotenv from 'dotenv';
dotenv.config();
import { drizzle } from 'drizzle-orm/node-postgres';
import { eq } from 'drizzle-orm';
import pkg from 'pg';
const { Pool } = pkg;

import * as schema from '../shared/schema';
import { gameLocations, gameItems, gameNpcs, gameEnemies, type GameLocation, type GameItem, type GameNpc, type GameEnemy } from '../shared/schema';
import type { Location } from '../src/types/location';
import type { CharacterInventoryItem } from '../src/types/character';
import type { NPC } from '../src/types/npc';
import type { Enemy } from '../src/types/enemy';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool, { schema });

export class GameDataService {
  async getAllLocations(): Promise<Location[]> {
    const locations = await db.select().from(gameLocations);
    
    return locations.map(loc => ({
      id: loc.id,
      name: loc.name,
      type: loc.type as 'city' | 'town' | 'ruin' | 'dungeon' | 'camp',
      coords: {
        x: loc.coordX,
        y: loc.coordY,
      },
      isSafe: loc.isSafe,
    }));
  }

  async getAllItems(): Promise<CharacterInventoryItem[]> {
    const items = await db.select().from(gameItems);
    
    return items.map(item => ({
      id: item.id,
      name: item.name,
      weight: item.weight,
      quantity: 1,
      type: item.type as any,
      rarity: item.rarity as any,
      equipmentSlot: item.equipmentSlot as any,
      damage: item.damage || undefined,
      armor: item.armor || undefined,
      effect: item.effect || undefined,
      spellId: item.spellId || undefined,
      learningEffect: item.learningEffect || undefined,
    }));
  }

  async getItemById(id: string): Promise<CharacterInventoryItem | null> {
    const items = await db.select().from(gameItems).where(eq(gameItems.id, id));
    const item = items[0];
    
    if (!item) return null;
    
    return {
      id: item.id,
      name: item.name,
      weight: item.weight,
      quantity: 1,
      type: item.type as any,
      rarity: item.rarity as any,
      equipmentSlot: item.equipmentSlot as any,
      damage: item.damage || undefined,
      armor: item.armor || undefined,
      effect: item.effect || undefined,
      spellId: item.spellId || undefined,
      learningEffect: item.learningEffect || undefined,
    };
  }

  async getAllNpcs(): Promise<NPC[]> {
    const npcs = await db.select().from(gameNpcs);
    
    return npcs.map(npc => ({
      id: npc.id,
      name: npc.name,
      description: npc.description,
      location: npc.location,
      dialogue: npc.dialogue,
      inventory: npc.inventory || undefined,
      isCompanion: npc.isCompanion || false,
      hireCost: npc.hireCost || undefined,
      factionId: npc.factionId || undefined,
      companionDetails: npc.companionDetails ? {
        combatStyle: npc.companionDetails.combatStyle as any,
        primarySkill: npc.companionDetails.primarySkill,
      } : undefined,
    }));
  }

  async getNpcsByLocation(location: string): Promise<NPC[]> {
    const allNpcs = await this.getAllNpcs();
    return allNpcs.filter(npc => npc.location === location);
  }

  async getNpcById(id: string): Promise<NPC | null> {
    const npcs = await db.select().from(gameNpcs).where(eq(gameNpcs.id, id));
    const npc = npcs[0];
    
    if (!npc) return null;
    
    return {
      id: npc.id,
      name: npc.name,
      description: npc.description,
      location: npc.location,
      dialogue: npc.dialogue,
      inventory: npc.inventory || undefined,
      isCompanion: npc.isCompanion || false,
      hireCost: npc.hireCost || undefined,
      factionId: npc.factionId || undefined,
      companionDetails: npc.companionDetails ? {
        combatStyle: npc.companionDetails.combatStyle as any,
        primarySkill: npc.companionDetails.primarySkill,
      } : undefined,
    };
  }

  async getAllEnemies(): Promise<Enemy[]> {
    const enemies = await db.select().from(gameEnemies);
    
    return enemies.map(enemy => ({
      id: enemy.id,
      name: enemy.name,
      health: enemy.health,
      damage: enemy.damage,
      xp: enemy.xp,
      level: enemy.level || 1,
      minLevel: enemy.minLevel || undefined,
      isUnique: enemy.isUnique || false,
      guaranteedDrop: enemy.guaranteedDrop || undefined,
      appliesEffect: enemy.appliesEffect || undefined,
    }));
  }

  async getEnemyById(id: string): Promise<Enemy | null> {
    const enemies = await db.select().from(gameEnemies).where(eq(gameEnemies.id, id));
    const enemy = enemies[0];
    
    if (!enemy) return null;
    
    return {
      id: enemy.id,
      name: enemy.name,
      health: enemy.health,
      damage: enemy.damage,
      xp: enemy.xp,
      level: enemy.level || 1,
      minLevel: enemy.minLevel || undefined,
      isUnique: enemy.isUnique || false,
      guaranteedDrop: enemy.guaranteedDrop || undefined,
      appliesEffect: enemy.appliesEffect || undefined,
    };
  }
}

export const gameDataService = new GameDataService();
