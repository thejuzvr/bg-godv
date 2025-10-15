import dotenv from 'dotenv';
dotenv.config();
import { drizzle } from 'drizzle-orm/node-postgres';
import { eq } from 'drizzle-orm';
import pkg from 'pg';
const { Pool } = pkg;

import * as schema from '../shared/schema';
import { gameLocations, gameItems, gameNpcs, gameEnemies, gameThoughts, npcDialogueLines, type GameLocation, type GameItem, type GameNpc, type GameEnemy, type GameThought, type NpcDialogueLine } from '../shared/schema';
import type { Location } from '../src/types/location';
import type { CharacterInventoryItem } from '../src/types/character';
import type { NPC } from '../src/types/npc';
import type { Enemy } from '../src/types/enemy';
import { initialItems } from '../src/data/items';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: Number(process.env.PG_POOL_MAX || '5'),
  idleTimeoutMillis: Number(process.env.PG_IDLE_TIMEOUT_MS || '30000'),
  connectionTimeoutMillis: Number(process.env.PG_CONN_TIMEOUT_MS || '10000'),
  keepAlive: true as any,
  ssl: String(process.env.PGSSL || '').toLowerCase() === 'true' ? { rejectUnauthorized: String(process.env.PGSSL_REJECT_UNAUTHORIZED || 'false').toLowerCase() === 'true' } as any : undefined,
});

const db = drizzle(pool, { schema });

async function withDbRetries<T>(label: string, fn: () => Promise<T>, maxAttempts?: number): Promise<T> {
  const attempts = Number(process.env.DB_RETRY_ATTEMPTS || (maxAttempts ?? 3));
  const maxBackoffMs = Number(process.env.DB_RETRY_MAX_MS || '3000');
  let lastErr: any;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await fn();
    } catch (err: any) {
      lastErr = err;
      const msg = (err?.message || '').toLowerCase();
      const transient = msg.includes('terminated') || msg.includes('timeout') || msg.includes('reset');
      if (!transient) throw err;
      const base = Math.min(maxBackoffMs, 200 * attempt * attempt);
      const jitter = Math.floor(Math.random() * 100);
      const backoff = base + jitter;
      console.warn(`[DB-Retry] ${label} failed (attempt ${attempt}/${attempts}): ${err?.message || err}. Retrying in ${backoff}ms`);
      await new Promise(r => setTimeout(r, backoff));
    }
  }
  throw lastErr;
}

export class GameDataService {
  // ===== LOCATIONS =====
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

  async getLocationById(id: string): Promise<Location | null> {
    const rows = await db.select().from(gameLocations).where(eq(gameLocations.id, id));
    const loc = rows[0];
    if (!loc) return null;
    return {
      id: loc.id,
      name: loc.name,
      type: loc.type as any,
      coords: { x: loc.coordX, y: loc.coordY },
      isSafe: loc.isSafe,
    };
  }

  async createLocation(payload: { id: string; name: string; type: 'city' | 'town' | 'ruin' | 'dungeon' | 'camp'; coords: { x: number; y: number }; isSafe: boolean }): Promise<Location> {
    await db.insert(gameLocations).values({
      id: payload.id,
      name: payload.name,
      type: payload.type,
      coordX: payload.coords.x,
      coordY: payload.coords.y,
      isSafe: payload.isSafe,
    });
    const created = await this.getLocationById(payload.id);
    if (!created) throw new Error('Failed to create location');
    return created;
  }

  async updateLocation(id: string, updates: Partial<{ name: string; type: 'city' | 'town' | 'ruin' | 'dungeon' | 'camp'; coords: { x: number; y: number }; isSafe: boolean }>): Promise<Location | null> {
    const set: any = {};
    if (updates.name !== undefined) set.name = updates.name;
    if (updates.type !== undefined) set.type = updates.type;
    if (updates.coords !== undefined) {
      set.coordX = updates.coords.x;
      set.coordY = updates.coords.y;
    }
    if (updates.isSafe !== undefined) set.isSafe = updates.isSafe;
    if (Object.keys(set).length === 0) return await this.getLocationById(id);
    set.updatedAt = new Date();
    await db.update(gameLocations).set(set).where(eq(gameLocations.id, id));
    return await this.getLocationById(id);
  }

  async deleteLocation(id: string): Promise<void> {
    await db.delete(gameLocations).where(eq(gameLocations.id, id));
  }

  // ===== ITEMS =====
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
    
    if (!item) {
      // Fallback to static items if not present in DB
      const fallback = initialItems.find(i => i.id === id);
      if (!fallback) return null;
      return {
        id: fallback.id,
        name: fallback.name,
        weight: fallback.weight,
        quantity: 1,
        type: fallback.type as any,
        rarity: fallback.rarity as any,
        equipmentSlot: (fallback as any).equipmentSlot,
        damage: (fallback as any).damage,
        armor: (fallback as any).armor,
        effect: (fallback as any).effect,
        spellId: (fallback as any).spellId,
        learningEffect: (fallback as any).learningEffect,
      };
    }
    
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

  async createItem(payload: { id: string; name: string; weight: number; type: string; rarity?: string | null; equipmentSlot?: string | null; damage?: number | null; armor?: number | null; effect?: any | null; spellId?: string | null; learningEffect?: any | null }): Promise<CharacterInventoryItem> {
    await db.insert(gameItems).values({
      id: payload.id,
      name: payload.name,
      weight: payload.weight,
      type: payload.type,
      rarity: payload.rarity ?? null,
      equipmentSlot: payload.equipmentSlot ?? null,
      damage: payload.damage ?? null,
      armor: payload.armor ?? null,
      effect: payload.effect ?? null,
      spellId: payload.spellId ?? null,
      learningEffect: payload.learningEffect ?? null,
    });
    const created = await this.getItemById(payload.id);
    if (!created) throw new Error('Failed to create item');
    return created;
  }

  async updateItem(id: string, updates: Partial<{ name: string; weight: number; type: string; rarity?: string | null; equipmentSlot?: string | null; damage?: number | null; armor?: number | null; effect?: any | null; spellId?: string | null; learningEffect?: any | null }>): Promise<CharacterInventoryItem | null> {
    const set: any = {};
    if (updates.name !== undefined) set.name = updates.name;
    if (updates.weight !== undefined) set.weight = updates.weight;
    if (updates.type !== undefined) set.type = updates.type;
    if (updates.rarity !== undefined) set.rarity = updates.rarity;
    if (updates.equipmentSlot !== undefined) set.equipmentSlot = updates.equipmentSlot;
    if (updates.damage !== undefined) set.damage = updates.damage;
    if (updates.armor !== undefined) set.armor = updates.armor;
    if (updates.effect !== undefined) set.effect = updates.effect;
    if (updates.spellId !== undefined) set.spellId = updates.spellId;
    if (updates.learningEffect !== undefined) set.learningEffect = updates.learningEffect;
    if (Object.keys(set).length > 0) {
      set.updatedAt = new Date();
      await db.update(gameItems).set(set).where(eq(gameItems.id, id));
    }
    return await this.getItemById(id);
  }

  async deleteItem(id: string): Promise<void> {
    await db.delete(gameItems).where(eq(gameItems.id, id));
  }

  // ===== NPCs =====
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

  async decrementNpcStock(npcId: string, itemId: string, quantity: number = 1): Promise<void> {
    const npcs = await db.select().from(gameNpcs).where(eq(gameNpcs.id, npcId));
    const npc = npcs[0];
    if (!npc || !npc.inventory) return;
    const newInv = (npc.inventory as any[]).map(entry => {
      if (entry.itemId === itemId) {
        return { ...entry, stock: Math.max(0, (entry.stock || 0) - quantity) };
      }
      return entry;
    });
    await db.update(gameNpcs).set({ inventory: newInv, updatedAt: new Date() }).where(eq(gameNpcs.id, npcId));
  }

  async nightlyRestockAllMerchants(): Promise<number> {
    const npcs = await db.select().from(gameNpcs);
    let updated = 0;
    for (const npc of npcs) {
      if (!npc.inventory || npc.inventory.length === 0) continue;
      const restocked = (npc.inventory as any[]).map(entry => {
        const baseStock = entry.stock ?? 0;
        const target = Math.max(5, baseStock);
        const newStock = Math.min(99, target); // cap
        return { ...entry, stock: newStock };
      });
      await db.update(gameNpcs).set({ inventory: restocked, updatedAt: new Date() }).where(eq(gameNpcs.id, npc.id));
      updated += 1;
    }
    return updated;
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

  async createNpc(payload: { id: string; name: string; description: string; location: string; dialogue: string[]; inventory?: Array<{ itemId: string; stock: number; priceModifier?: number }>; isCompanion?: boolean; hireCost?: number | null; factionId?: string | null; companionDetails?: { combatStyle: string; primarySkill: string } | null }): Promise<NPC> {
    await db.insert(gameNpcs).values({
      id: payload.id,
      name: payload.name,
      description: payload.description,
      location: payload.location,
      dialogue: payload.dialogue,
      inventory: payload.inventory,
      isCompanion: payload.isCompanion ?? false,
      hireCost: payload.hireCost ?? null,
      factionId: payload.factionId ?? null,
      companionDetails: payload.companionDetails ?? null,
    });
    const created = await this.getNpcById(payload.id);
    if (!created) throw new Error('Failed to create NPC');
    return created;
  }

  async updateNpc(id: string, updates: Partial<{ name: string; description: string; location: string; dialogue: string[]; inventory?: Array<{ itemId: string; stock: number; priceModifier?: number }>; isCompanion?: boolean; hireCost?: number | null; factionId?: string | null; companionDetails?: { combatStyle: string; primarySkill: string } | null }>): Promise<NPC | null> {
    const set: any = {};
    if (updates.name !== undefined) set.name = updates.name;
    if (updates.description !== undefined) set.description = updates.description;
    if (updates.location !== undefined) set.location = updates.location;
    if (updates.dialogue !== undefined) set.dialogue = updates.dialogue as any;
    if (updates.inventory !== undefined) set.inventory = updates.inventory as any;
    if (updates.isCompanion !== undefined) set.isCompanion = updates.isCompanion;
    if (updates.hireCost !== undefined) set.hireCost = updates.hireCost as any;
    if (updates.factionId !== undefined) set.factionId = updates.factionId as any;
    if (updates.companionDetails !== undefined) set.companionDetails = updates.companionDetails as any;
    if (Object.keys(set).length > 0) {
      set.updatedAt = new Date();
      await db.update(gameNpcs).set(set).where(eq(gameNpcs.id, id));
    }
    return await this.getNpcById(id);
  }

  async deleteNpc(id: string): Promise<void> {
    await db.delete(gameNpcs).where(eq(gameNpcs.id, id));
  }

  // ===== ENEMIES =====
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

  async createEnemy(payload: { id: string; name: string; health: number; damage: number; xp: number; level?: number; minLevel?: number | null; isUnique?: boolean; guaranteedDrop?: Array<{ id: string; quantity: number }> | null; appliesEffect?: { id: string; name: string; description: string; icon: string; type: 'debuff'; chance: number; duration: number; value?: number } | null; armor?: number | null }): Promise<Enemy> {
    await db.insert(gameEnemies).values({
      id: payload.id,
      name: payload.name,
      health: payload.health,
      damage: payload.damage,
      xp: payload.xp,
      level: payload.level ?? 1,
      minLevel: payload.minLevel ?? null,
      isUnique: payload.isUnique ?? false,
      guaranteedDrop: payload.guaranteedDrop ?? null,
      appliesEffect: payload.appliesEffect ?? null,
      armor: payload.armor ?? 10,
    });
    const created = await this.getEnemyById(payload.id);
    if (!created) throw new Error('Failed to create enemy');
    return created;
  }

  async updateEnemy(id: string, updates: Partial<{ name: string; health: number; damage: number; xp: number; level?: number; minLevel?: number | null; isUnique?: boolean; guaranteedDrop?: Array<{ id: string; quantity: number }> | null; appliesEffect?: { id: string; name: string; description: string; icon: string; type: 'debuff'; chance: number; duration: number; value?: number } | null; armor?: number | null }>): Promise<Enemy | null> {
    const set: any = {};
    if (updates.name !== undefined) set.name = updates.name;
    if (updates.health !== undefined) set.health = updates.health;
    if (updates.damage !== undefined) set.damage = updates.damage;
    if (updates.xp !== undefined) set.xp = updates.xp;
    if (updates.level !== undefined) set.level = updates.level;
    if (updates.minLevel !== undefined) set.minLevel = updates.minLevel as any;
    if (updates.isUnique !== undefined) set.isUnique = updates.isUnique;
    if (updates.guaranteedDrop !== undefined) set.guaranteedDrop = updates.guaranteedDrop as any;
    if (updates.appliesEffect !== undefined) set.appliesEffect = updates.appliesEffect as any;
    if (updates.armor !== undefined) set.armor = updates.armor as any;
    if (Object.keys(set).length > 0) {
      set.updatedAt = new Date();
      await db.update(gameEnemies).set(set).where(eq(gameEnemies.id, id));
    }
    return await this.getEnemyById(id);
  }

  async deleteEnemy(id: string): Promise<void> {
    await db.delete(gameEnemies).where(eq(gameEnemies.id, id));
  }

  // ===== THOUGHTS =====
  async getAllThoughts(): Promise<Array<{
    id: string;
    text: string;
    tags: string[];
    conditions: Record<string, any> | null;
    weight: number;
    cooldownKey?: string | null;
    locale: string;
    isEnabled: boolean;
  }>> {
    const rows = await db.select().from(gameThoughts);
    return rows.map(r => ({
      id: r.id,
      text: r.text,
      tags: (r.tags as any) || [],
      conditions: (r.conditions as any) || null,
      weight: r.weight || 1,
      cooldownKey: (r.cooldownKey as any) || null,
      locale: r.locale || 'ru',
      isEnabled: !!r.isEnabled,
    }));
  }

  async getThoughtById(id: string): Promise<{
    id: string;
    text: string;
    tags: string[];
    conditions: Record<string, any> | null;
    weight: number;
    cooldownKey?: string | null;
    locale: string;
    isEnabled: boolean;
  } | null> {
    const rows = await db.select().from(gameThoughts).where(eq(gameThoughts.id, id));
    const r = rows[0];
    if (!r) return null;
    return {
      id: r.id,
      text: r.text,
      tags: (r.tags as any) || [],
      conditions: (r.conditions as any) || null,
      weight: r.weight || 1,
      cooldownKey: (r.cooldownKey as any) || null,
      locale: r.locale || 'ru',
      isEnabled: !!r.isEnabled,
    };
  }

  async createThought(payload: {
    id: string;
    text: string;
    tags?: string[] | null;
    conditions?: Record<string, any> | null;
    weight?: number | null;
    cooldownKey?: string | null;
    locale?: string | null;
    isEnabled?: boolean | null;
  }): Promise<NonNullable<Awaited<ReturnType<GameDataService['getThoughtById']>>>> {
    await db.insert(gameThoughts).values({
      id: payload.id,
      text: payload.text,
      tags: payload.tags ?? null,
      conditions: payload.conditions ?? null,
      weight: payload.weight ?? 1,
      cooldownKey: payload.cooldownKey ?? null,
      locale: payload.locale ?? 'ru',
      isEnabled: payload.isEnabled ?? true,
    });
    const created = await this.getThoughtById(payload.id);
    if (!created) throw new Error('Failed to create thought');
    return created;
  }

  async updateThought(id: string, updates: Partial<{
    text: string;
    tags: string[] | null;
    conditions: Record<string, any> | null;
    weight: number | null;
    cooldownKey: string | null;
    locale: string | null;
    isEnabled: boolean | null;
  }>): Promise<ReturnType<GameDataService['getThoughtById']>> {
    const set: any = {};
    if (updates.text !== undefined) set.text = updates.text;
    if (updates.tags !== undefined) set.tags = updates.tags as any;
    if (updates.conditions !== undefined) set.conditions = updates.conditions as any;
    if (updates.weight !== undefined) set.weight = updates.weight as any;
    if (updates.cooldownKey !== undefined) set.cooldownKey = updates.cooldownKey as any;
    if (updates.locale !== undefined) set.locale = updates.locale as any;
    if (updates.isEnabled !== undefined) set.isEnabled = updates.isEnabled as any;
    if (Object.keys(set).length > 0) {
      set.updatedAt = new Date();
      await db.update(gameThoughts).set(set).where(eq(gameThoughts.id, id));
    }
    return await this.getThoughtById(id);
  }

  async deleteThought(id: string): Promise<void> {
    await db.delete(gameThoughts).where(eq(gameThoughts.id, id));
  }

  // ===== NPC DIALOGUE LINES =====
  async getAllNpcDialogueLines(): Promise<Array<NpcDialogueLine>> {
    const rows = await db.select().from(npcDialogueLines);
    return rows as unknown as NpcDialogueLine[];
  }

  async getNpcDialogueLinesByNpcId(npcId: string): Promise<Array<NpcDialogueLine>> {
    const rows = await db.select().from(npcDialogueLines).where(eq(npcDialogueLines.npcId, npcId));
    return rows as unknown as NpcDialogueLine[];
  }

  async getNpcDialogueLineById(id: string): Promise<NpcDialogueLine | null> {
    const rows = await db.select().from(npcDialogueLines).where(eq(npcDialogueLines.id, id));
    return (rows[0] as unknown as NpcDialogueLine) || null;
  }

  async createNpcDialogueLine(payload: {
    id?: string; // optional, default uuid set in schema
    npcId: string;
    text: string;
    tags?: string[] | null;
    conditions?: Record<string, any> | null;
    weight?: number | null;
    cooldownKey?: string | null;
    locale?: string | null;
    isEnabled?: boolean | null;
  }): Promise<NpcDialogueLine> {
    await db.insert(npcDialogueLines).values({
      id: (payload as any).id ?? undefined,
      npcId: payload.npcId,
      text: payload.text,
      tags: payload.tags ?? null,
      conditions: payload.conditions ?? null,
      weight: payload.weight ?? 1,
      cooldownKey: payload.cooldownKey ?? null,
      locale: payload.locale ?? 'ru',
      isEnabled: payload.isEnabled ?? true,
    });
    const created = await db.select().from(npcDialogueLines).where(eq(npcDialogueLines.npcId, payload.npcId));
    const last = created[created.length - 1];
    if (!last) throw new Error('Failed to create dialogue line');
    return last as unknown as NpcDialogueLine;
  }

  async updateNpcDialogueLine(id: string, updates: Partial<{
    text: string;
    tags: string[] | null;
    conditions: Record<string, any> | null;
    weight: number | null;
    cooldownKey: string | null;
    locale: string | null;
    isEnabled: boolean | null;
  }>): Promise<NpcDialogueLine | null> {
    const set: any = {};
    if (updates.text !== undefined) set.text = updates.text;
    if (updates.tags !== undefined) set.tags = updates.tags as any;
    if (updates.conditions !== undefined) set.conditions = updates.conditions as any;
    if (updates.weight !== undefined) set.weight = updates.weight as any;
    if (updates.cooldownKey !== undefined) set.cooldownKey = updates.cooldownKey as any;
    if (updates.locale !== undefined) set.locale = updates.locale as any;
    if (updates.isEnabled !== undefined) set.isEnabled = updates.isEnabled as any;
    if (Object.keys(set).length > 0) {
      set.updatedAt = new Date();
      await db.update(npcDialogueLines).set(set).where(eq(npcDialogueLines.id, id));
    }
    return await this.getNpcDialogueLineById(id);
  }

  async deleteNpcDialogueLine(id: string): Promise<void> {
    await db.delete(npcDialogueLines).where(eq(npcDialogueLines.id, id));
  }
}

export const gameDataService = new GameDataService();
