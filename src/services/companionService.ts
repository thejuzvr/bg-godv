'use server';

import { db } from '../../server/storage';
import * as schema from '../../shared/schema';
import { and, eq } from 'drizzle-orm';
import type { Character } from '@/types/character';
import type { CompanionTemplate } from '@/types/companion';

export interface HireCompanionInput {
  characterId: string;
  npcId: string;
  template: CompanionTemplate;
}

export async function listCharacterCompanions(characterId: string) {
  const companions = await db.select()
    .from(schema.characterCompanions)
    .where(eq(schema.characterCompanions.characterId, characterId));
  return companions;
}

export async function getActiveCompanion(characterId: string) {
  const [companion] = await db.select()
    .from(schema.characterCompanions)
    .where(
      and(
        eq(schema.characterCompanions.characterId, characterId),
        eq(schema.characterCompanions.isActive, true)
      )
    )
    .limit(1);
  return companion || null;
}

export async function hireCompanion(input: HireCompanionInput) {
  const { characterId, npcId, template } = input;
  
  // Check if character already has this companion
  const [existing] = await db.select()
    .from(schema.characterCompanions)
    .where(
      and(
        eq(schema.characterCompanions.characterId, characterId),
        eq(schema.characterCompanions.npcId, npcId)
      )
    )
    .limit(1);
  
  if (existing) {
    return { ok: false, error: 'Companion already hired', companion: null };
  }
  
  // Create companion from template
  const [companion] = await db.insert(schema.characterCompanions).values({
    characterId,
    npcId,
    name: template.name,
    class: template.class,
    rarity: template.rarity,
    level: 1,
    stats: {
      health: {
        current: template.baseStats.health,
        max: template.baseStats.health,
      },
      damage: template.baseStats.damage,
      armor: template.baseStats.armor,
    },
    skills: {
      combat: template.baseSkills.combat,
      magic: template.baseSkills.magic,
      stealth: template.baseSkills.stealth,
    },
    abilities: template.availableAbilities.slice(0, 2), // Start with 2 abilities
    personality: {
      loyalty: 50,
      courage: 50,
      humor: 50,
    },
    experience: 0,
    mood: 50,
    isActive: false,
    acquiredAt: Date.now(),
  }).returning();
  
  // Update character's companions list
  const [char] = await db.select()
    .from(schema.characters)
    .where(eq(schema.characters.id, characterId))
    .limit(1);
  
  if (char) {
    const companionsList = (char as any).companions || [];
    await db.update(schema.characters)
      .set({
        companions: [...companionsList, companion.id] as any,
      })
      .where(eq(schema.characters.id, characterId));
  }
  
  return { ok: true, companion, error: null };
}

export async function setActiveCompanion(characterId: string, companionId: string | null) {
  // Deactivate all companions
  await db.update(schema.characterCompanions)
    .set({ isActive: false })
    .where(eq(schema.characterCompanions.characterId, characterId));
  
  // Activate selected companion
  if (companionId) {
    const [companion] = await db.update(schema.characterCompanions)
      .set({ isActive: true })
      .where(
        and(
          eq(schema.characterCompanions.characterId, characterId),
          eq(schema.characterCompanions.id, companionId)
        )
      )
      .returning();
    
    if (!companion) {
      return { ok: false, error: 'Companion not found' };
    }
  }
  
  // Update character's activeCompanion field
  await db.update(schema.characters)
    .set({ activeCompanion: companionId as any })
    .where(eq(schema.characters.id, characterId));
  
  return { ok: true, error: null };
}

export async function dismissCompanion(characterId: string, companionId: string) {
  // Check if companion is active, deactivate first
  const [companion] = await db.select()
    .from(schema.characterCompanions)
    .where(
      and(
        eq(schema.characterCompanions.characterId, characterId),
        eq(schema.characterCompanions.id, companionId)
      )
    )
    .limit(1);
  
  if (!companion) {
    return { ok: false, error: 'Companion not found' };
  }
  
  if ((companion as any).isActive) {
    await setActiveCompanion(characterId, null);
  }
  
  // Delete companion
  await db.delete(schema.characterCompanions)
    .where(
      and(
        eq(schema.characterCompanions.characterId, characterId),
        eq(schema.characterCompanions.id, companionId)
      )
    );
  
  // Update character's companions list
  const [char] = await db.select()
    .from(schema.characters)
    .where(eq(schema.characters.id, characterId))
    .limit(1);
  
  if (char) {
    const companionsList = ((char as any).companions || []).filter((id: string) => id !== companionId);
    await db.update(schema.characters)
      .set({ companions: companionsList as any })
      .where(eq(schema.characters.id, characterId));
  }
  
  return { ok: true, error: null };
}

export async function levelUpCompanion(companionId: string) {
  const [companion] = await db.select()
    .from(schema.characterCompanions)
    .where(eq(schema.characterCompanions.id, companionId))
    .limit(1);
  
  if (!companion) {
    return { ok: false, error: 'Companion not found' };
  }
  
  const newLevel = (companion as any).level + 1;
  const stats = (companion as any).stats;
  
  // Increase stats
  const newStats = {
    health: {
      current: Math.floor(stats.health.max * 1.1),
      max: Math.floor(stats.health.max * 1.1),
    },
    damage: Math.floor(stats.damage * 1.05),
    armor: Math.floor(stats.armor * 1.05),
  };
  
  await db.update(schema.characterCompanions)
    .set({
      level: newLevel,
      stats: newStats as any,
      experience: 0,
    })
    .where(eq(schema.characterCompanions.id, companionId));
  
  return { ok: true, error: null };
}
