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
  if (status === 'completed') patch.completedAt = new Date();
  const [row] = await db.update(schema.questTasks).set(patch).where(eq(schema.questTasks.id, taskId)).returning();
  return row;
}

export async function completeQuest(questId: string) {
  const [quest] = await db.select().from(schema.quests).where(eq(schema.quests.id, questId)).limit(1);
  if (!quest) return null;
  const [updated] = await db.update(schema.quests)
    .set({ status: 'completed', progress: 100, updatedAt: new Date(), completedAt: new Date() })
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

export async function createQuestFromTemplate(character: Character, template: Quest) {
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
  });
  return created;
}

// === Backfill helpers ===
export async function listAvailableQuests(characterId: string) {
  return await db.select().from(schema.quests).where(and(eq(schema.quests.characterId, characterId), eq(schema.quests.status, 'available' as any))).orderBy(desc(schema.quests.createdAt));
}

export async function ensureQuestBackfill(character: Character, minAvailable: number = 3) {
  const existing = await listAvailableQuests(character.id);
  const need = Math.max(0, minAvailable - existing.length);
  if (need <= 0) return existing;
  const templates = selectQuestTemplatesForCharacter(character, { limit: minAvailable * 2, excludeCompletedIds: (character.completedQuests || []) });
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


