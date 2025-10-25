'use server';

import { db } from '../../server/storage';
import * as schema from '../../shared/schema';
import { and, asc, desc, eq } from 'drizzle-orm';
import { initialQuests } from '@/data/quests';
import type { Quest } from '@/types/quest';
import type { Character } from '@/types/character';
import { applyRewards as applyStandardRewards } from './rewardsService';

export interface CreateQuestInput {
  characterId: string;
  templateId?: string | null;
  title: string;
  description: string;
  location: string;
  type: 'main' | 'side' | 'bounty' | 'urgent';
  rewards: schema.QuestDB['rewards'];
  expiresAt?: number | null;
  tasks?: Array<{ title: string; type: string; data?: Record<string, any> | null }>;
  status?: 'available' | 'in-progress' | 'completed' | 'failed';
}

export async function listQuests(characterId: string) {
  const rows = await db.select().from(schema.quests).where(eq(schema.quests.characterId, characterId)).orderBy(desc(schema.quests.createdAt));
  const tasks = await db.select().from(schema.questTasks).where(eq(schema.questTasks.questId, '')); // placeholder to hint type
  return rows;
}

export async function getQuest(questId: string) {
  const [quest] = await db.select().from(schema.quests).where(eq(schema.quests.id, questId)).limit(1);
  if (!quest) return null;
  const subtasks = await db.select().from(schema.questTasks).where(eq(schema.questTasks.questId, quest.id)).orderBy(asc(schema.questTasks.idx));
  return { quest, tasks: subtasks };
}

export async function createQuest(input: CreateQuestInput) {
  const [row] = await db.insert(schema.quests).values({
    characterId: input.characterId,
    templateId: input.templateId || null as any,
    title: input.title,
    description: input.description,
    location: input.location,
    type: input.type,
    status: (input.status as any) || 'in-progress',
    rewards: input.rewards,
    progress: 0,
    metadata: {},
    expiresAt: input.expiresAt || null as any,
  }).returning();

  if (input.tasks && input.tasks.length > 0) {
    for (let i = 0; i < input.tasks.length; i++) {
      const t = input.tasks[i];
      await db.insert(schema.questTasks).values({
        questId: row.id,
        idx: i,
        title: t.title,
        type: t.type,
        data: (t.data || null) as any,
      });
    }
  }

  return await getQuest(row.id);
}

export async function updateQuestProgress(questId: string, progress: number) {
  const clamped = Math.max(0, Math.min(100, Math.floor(progress)));
  const [row] = await db.update(schema.quests).set({ progress: clamped, updatedAt: new Date() }).where(eq(schema.quests.id, questId)).returning();
  return row;
}

export async function setTaskStatus(taskId: string, status: 'pending' | 'in-progress' | 'completed' | 'failed', progress?: number) {
  const patch: any = { status, updatedAt: new Date() };
  if (typeof progress === 'number') patch.progress = Math.max(0, Math.min(100, Math.floor(progress)));
  if (status === 'completed') {
    patch.completedAt = new Date();
    patch.progress = 100;
  }
  const [row] = await db.update(schema.questTasks).set(patch).where(eq(schema.questTasks.id, taskId)).returning();
  
  // Automatically sync quest progress when task changes
  if (row) {
    await syncQuestProgress(row.questId);
  }
  
  return row;
}

export async function acceptQuest(questId: string, setAsActive: boolean = false): Promise<{ ok: boolean; error?: string; quest?: any }> {
  const [quest] = await db.select().from(schema.quests).where(eq(schema.quests.id, questId)).limit(1);
  if (!quest) return { ok: false, error: 'Quest not found' };
  if ((quest as any).status !== 'available') return { ok: false, error: 'Quest is not available' };
  
  // No longer restricting to one in-progress quest - characters can have multiple quests
  // But only one can be active at a time
  
  const patch: any = { status: 'in-progress' as any, updatedAt: new Date() };
  
  if (setAsActive) {
    // If setting as active, first deactivate all other quests for this character
    await db.update(schema.quests)
      .set({ isActive: false, updatedAt: new Date() })
      .where(and(
        eq(schema.quests.characterId, (quest as any).characterId),
        eq(schema.quests.isActive, true)
      ));
    patch.isActive = true;
  }
  
  const [updated] = await db.update(schema.quests)
    .set(patch)
    .where(eq(schema.quests.id, questId))
    .returning();
  return { ok: true, quest: updated };
}

export async function completeQuest(questId: string) {
  const [quest] = await db.select().from(schema.quests).where(eq(schema.quests.id, questId)).limit(1);
  if (!quest) return null;
  const [updated] = await db.update(schema.quests)
    .set({ 
      status: 'completed', 
      progress: 100, 
      isActive: false, // Deactivate when completed
      updatedAt: new Date(), 
      completedAt: new Date() 
    })
    .where(eq(schema.quests.id, questId))
    .returning();
  return updated;
}

// Reward payout helpers
export async function applyRewardsToCharacter(character: any, rewards: schema.QuestDB['rewards']): Promise<{ character: any; log: string }> {
  return await applyStandardRewards(character, { gold: rewards?.gold, xp: rewards?.xp, items: rewards?.items });
}

// === Template selection and instancing ===
export async function selectQuestTemplatesForCharacter(character: Character, options?: { limit?: number; excludeCompletedIds?: string[] }) {
  const limit = options?.limit ?? 5;
  const exclude = new Set(options?.excludeCompletedIds || []);
  const candidates = initialQuests.filter(q => {
    if (exclude.has(q.id)) return false;
    if (q.location !== character.location) return false;
    if (character.level < q.requiredLevel) return false;
    if ((character.completedQuests || []).includes(q.id)) return false;
    if (q.requiredFaction) {
      const rep = (character.factions as any)?.[q.requiredFaction.id]?.reputation || 0;
      if (rep < q.requiredFaction.reputation) return false;
    }
    return true;
  });
  // Heuristic scoring: prefer nearer requiredLevel and non-bounty unless high mood
  const scored = candidates.map(q => ({ q, score: Math.abs(q.requiredLevel - character.level) + (q.type === 'bounty' ? 1 : 0) }));
  const sorted = scored.sort((a, b) => a.score - b.score).map(s => s.q);
  return sorted.slice(0, limit);
}

export async function createQuestFromTemplate(character: Character, template: Quest, autoAccept: boolean = false) {
  const baseTasks: Array<{ title: string; type: string; data?: Record<string, any> }> = [];
  if (template.type === 'bounty' && template.targetEnemyId) {
    baseTasks.push({ title: 'Найти цель', type: 'travel', data: { location: template.location } });
    baseTasks.push({ title: 'Победить врага', type: 'combat', data: { enemyId: template.targetEnemyId } });
    baseTasks.push({ title: 'Получить вознаграждение', type: 'report', data: { to: 'ярл' } });
  } else {
    baseTasks.push({ title: 'Исследовать местность', type: 'explore', data: { location: template.location } });
    if (template.combatChance && template.combatChance > 0.2 && template.targetEnemyId) {
      baseTasks.push({ title: 'Сразиться с угрозой', type: 'combat', data: { enemyId: template.targetEnemyId } });
    }
    baseTasks.push({ title: 'Завершить поручение', type: 'report' });
  }
  const created = await createQuest({
    characterId: character.id,
    templateId: template.id,
    title: template.title,
    description: template.description,
    location: template.location,
    type: template.type as any,
    rewards: template.reward as any,
    tasks: baseTasks,
    status: autoAccept ? 'in-progress' : 'available',
  });
  return created;
}

// === Quest priority and active quest management ===

/**
 * Get the currently active quest for a character
 */
export async function getActiveQuest(characterId: string) {
  const [quest] = await db.select()
    .from(schema.quests)
    .where(and(
      eq(schema.quests.characterId, characterId),
      eq(schema.quests.isActive, true),
      eq(schema.quests.status, 'in-progress' as any)
    ))
    .limit(1);
  
  if (!quest) return null;
  
  // Get tasks for this quest
  const tasks = await db.select()
    .from(schema.questTasks)
    .where(eq(schema.questTasks.questId, quest.id))
    .orderBy(asc(schema.questTasks.idx));
  
  return { quest, tasks };
}

/**
 * Set a quest as the active quest for a character
 * Automatically deactivates other quests
 */
export async function setActiveQuest(characterId: string, questId: string): Promise<{ ok: boolean; error?: string; quest?: any }> {
  // Verify quest belongs to character and is in-progress
  const [quest] = await db.select()
    .from(schema.quests)
    .where(and(
      eq(schema.quests.id, questId),
      eq(schema.quests.characterId, characterId)
    ))
    .limit(1);
  
  if (!quest) return { ok: false, error: 'Quest not found' };
  if ((quest as any).status !== 'in-progress') {
    return { ok: false, error: 'Only in-progress quests can be set as active' };
  }
  
  // Deactivate all other quests for this character
  await db.update(schema.quests)
    .set({ isActive: false, updatedAt: new Date() })
    .where(and(
      eq(schema.quests.characterId, characterId),
      eq(schema.quests.isActive, true)
    ));
  
  // Activate the selected quest
  const [updated] = await db.update(schema.quests)
    .set({ isActive: true, updatedAt: new Date() })
    .where(eq(schema.quests.id, questId))
    .returning();
  
  return { ok: true, quest: updated };
}

/**
 * Calculate quest progress based on tasks
 * For quests with tasks: progress = weighted average of task progress
 * For quests without tasks: use quest.progress directly
 */
export async function calculateQuestProgress(questId: string): Promise<number> {
  const [quest] = await db.select().from(schema.quests).where(eq(schema.quests.id, questId)).limit(1);
  if (!quest) return 0;
  
  const tasks = await db.select()
    .from(schema.questTasks)
    .where(eq(schema.questTasks.questId, questId))
    .orderBy(asc(schema.questTasks.idx));
  
  // If no tasks, return quest progress directly (simple quest)
  if (tasks.length === 0) {
    return (quest as any).progress || 0;
  }
  
  // Calculate progress based on tasks (multi-step quest)
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const inProgressTasks = tasks.filter(t => t.status === 'in-progress');
  
  // Base progress from completed tasks
  let progress = (completedTasks / totalTasks) * 100;
  
  // Add partial progress from in-progress tasks
  inProgressTasks.forEach(task => {
    progress += (task.progress / 100) * (1 / totalTasks) * 100;
  });
  
  return Math.min(100, Math.floor(progress));
}

/**
 * Update quest progress based on its tasks
 * Call this after updating any task to keep quest.progress in sync
 */
export async function syncQuestProgress(questId: string) {
  const progress = await calculateQuestProgress(questId);
  await db.update(schema.quests)
    .set({ progress, updatedAt: new Date() })
    .where(eq(schema.quests.id, questId));
  return progress;
}

/**
 * Get all in-progress quests for a character, sorted by priority
 */
export async function listInProgressQuests(characterId: string) {
  return await db.select()
    .from(schema.quests)
    .where(and(
      eq(schema.quests.characterId, characterId),
      eq(schema.quests.status, 'in-progress' as any)
    ))
    .orderBy(desc(schema.quests.priority), desc(schema.quests.createdAt));
}

/**
 * Automatically select and activate the next quest based on priority
 * Called when active quest is completed or cancelled
 */
export async function autoSelectNextQuest(characterId: string): Promise<{ ok: boolean; quest?: any }> {
  const inProgress = await listInProgressQuests(characterId);
  
  if (inProgress.length === 0) {
    return { ok: false };
  }
  
  // Select highest priority quest that can be auto-completed
  const nextQuest = inProgress.find(q => (q as any).canAutoComplete);
  
  if (!nextQuest) {
    return { ok: false };
  }
  
  const result = await setActiveQuest(characterId, nextQuest.id);
  return result;
}

// === Backfill helpers ===
export async function listAvailableQuests(characterId: string) {
  return await db.select().from(schema.quests).where(and(eq(schema.quests.characterId, characterId), eq(schema.quests.status, 'available' as any))).orderBy(desc(schema.quests.createdAt));
}

export async function ensureQuestBackfill(character: Character, minAvailable: number = 3) {
  const existing = await listAvailableQuests(character.id);
  const need = Math.max(0, minAvailable - existing.length);
  if (need <= 0) return existing;
  const templates = await selectQuestTemplatesForCharacter(character, { limit: minAvailable * 2, excludeCompletedIds: (character.completedQuests || []) });
  const picks = templates.slice(0, need);
  const created: any[] = [];
  for (const t of picks) {
    const tasks: Array<{ title: string; type: string; data?: Record<string, any> }> = [];
    if ((t as any).type === 'bounty' && (t as any).targetEnemyId) {
      tasks.push({ title: 'Найти цель', type: 'travel', data: { location: (t as any).location } });
      tasks.push({ title: 'Победить врага', type: 'combat', data: { enemyId: (t as any).targetEnemyId } });
      tasks.push({ title: 'Получить вознаграждение', type: 'report', data: { to: 'ярл' } });
    } else {
      tasks.push({ title: 'Исследовать местность', type: 'explore', data: { location: (t as any).location } });
      tasks.push({ title: 'Завершить поручение', type: 'report' });
    }
    const row = await createQuest({
      characterId: character.id,
      templateId: (t as any).id,
      title: (t as any).title,
      description: (t as any).description,
      location: (t as any).location,
      type: (t as any).type,
      rewards: (t as any).reward,
      tasks,
      status: 'available',
    });
    created.push(row);
  }
  return existing.concat(created);
}


