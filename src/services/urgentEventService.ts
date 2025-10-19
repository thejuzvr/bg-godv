'use server';

import { db } from '../../server/storage';
import * as schema from '../../shared/schema';
import { and, asc, desc, eq } from 'drizzle-orm';
import { rollD20, mapD20 } from '@/lib/dice';
import { applyRewards } from './rewardsService';

export async function getActiveUrgentEvent(characterId: string, key?: string) {
  const rows = await db.select().from(schema.urgentEvents)
    .where(and(eq(schema.urgentEvents.characterId, characterId), eq(schema.urgentEvents.status, 'active' as any)));
  const found = key ? rows.find(r => (r as any).key === key) : rows[0];
  if (!found) return null;
  const steps = await db.select().from(schema.urgentEventSteps).where(eq(schema.urgentEventSteps.urgentEventId, (found as any).id)).orderBy(asc(schema.urgentEventSteps.idx));
  return { event: found, steps };
}

export async function triggerDyatlovo(characterId: string) {
  // Create event once per character
  const existing = await getActiveUrgentEvent(characterId, 'bleak_falls_dyatlov_mystery');
  if (existing) return existing;
  const [row] = await db.insert(schema.urgentEvents).values({
    characterId,
    key: 'bleak_falls_dyatlov_mystery',
    title: 'Тайна перевала Дятлова',
    description: 'Барды ярлов зачем-то собрались в гробнице в лютый мороз. Это подозрительно и немного смешно.',
    status: 'active',
    currentStep: 0,
    expiresAt: Date.now() + 20 * 60 * 1000,
  } as any).returning();
  const steps = [
    { idx: 0, type: 'dialogue', data: { objective: 'Узнать, что задумали барды' } },
    { idx: 1, type: 'follow', data: { objective: 'Проследить и раскрыть замысел' } },
    { idx: 2, type: 'report_d20', data: { objective: 'Рассказать всё ярлу', rewards: { low: 'attack', mid: 'report', high: 'bribe_then_report' } } },
  ];
  for (const s of steps) {
    await db.insert(schema.urgentEventSteps).values({ urgentEventId: (row as any).id, idx: s.idx, type: s.type, data: s.data as any } as any);
  }
  return await getActiveUrgentEvent(characterId, 'bleak_falls_dyatlov_mystery');
}

export async function advanceUrgentEvent(character: any): Promise<{ character: any; log?: string }> {
  const active = await getActiveUrgentEvent(character.id);
  if (!active) return { character };
  const { event, steps } = active;
  const idx = (event as any).currentStep || 0;
  const step = steps[idx];
  if (!step) return { character };

  let updated = structuredClone(character);
  let log: string | undefined;
  if ((step as any).type === 'dialogue') {
    log = 'Герой подслушивает бардов и собирает улики.';
  } else if ((step as any).type === 'follow') {
    log = 'Герой осторожно следует за бардами, стараясь не выдать себя.';
  } else if ((step as any).type === 'report_d20') {
    const roll = rollD20();
    const outcome = mapD20(roll, { low: 'low', mid: 'mid', high: 'high' } as any);
    if (outcome === 'low') {
      // Bards attack
      updated.status = 'in-combat';
      updated.combat = { enemyId: 'bards', enemy: { name: 'Разъярённые барды', health: { current: 35, max: 35 }, damage: 6, xp: 25, armor: 10 }, fleeAttempted: false } as any;
      log = `Бросок D20: ${roll}. Барды напали!`;
    } else if (outcome === 'mid') {
      const r = await applyRewards(updated, { xp: 100, items: [{ id: 'misc_gem_amethyst', quantity: 1 }] });
      updated = r.character;
      log = `Бросок D20: ${roll}. Герой рассказал всё ярлу и получил награду. ${r.log}`;
    } else {
      // High: bribe then report
      const r1 = await applyRewards(updated, { gold: 150 });
      const r2 = await applyRewards(r1.character, { xp: 150 });
      updated = r2.character;
      log = `Бросок D20: ${roll}. Барды заплатили за молчание; затем герой доложил ярлу и получил награду. ${r1.log}, ${r2.log}`;
    }
  }

  const nextStep = idx + 1;
  const isFinal = nextStep >= steps.length;
  await db.update(schema.urgentEvents)
    .set({ currentStep: Math.min(nextStep, steps.length - 1), status: isFinal ? 'completed' as any : 'active', updatedAt: new Date(), completedAt: isFinal ? new Date() : null as any })
    .where(eq(schema.urgentEvents.id, (event as any).id));
  return { character: updated, log };
}


