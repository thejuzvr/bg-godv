'use server';

import { db } from '../../../../server/storage';
import { realms } from '../../../../shared/schema';
import { eq } from 'drizzle-orm';

export async function listRealms() {
  return await db.select().from(realms);
}

export async function createRealm(id: string, name: string) {
  await db.insert(realms).values({ id, name, status: 'active' });
}

export async function updateRealm(id: string, updates: { name?: string; status?: string }) {
  const set: any = {};
  if (updates.name !== undefined) set.name = updates.name;
  if (updates.status !== undefined) set.status = updates.status;
  if (Object.keys(set).length === 0) return;
  await db.update(realms).set(set).where(eq(realms.id, id));
}

export async function deleteRealm(id: string) {
  await db.delete(realms).where(eq(realms.id, id));
}
