import { drizzle } from 'drizzle-orm/node-postgres';
import { eq, desc, and, lt, sql } from 'drizzle-orm';
import pg from 'pg';
import * as schema from '../shared/schema';
import { loadEnv } from './load-env';
import { v4 as uuidv4 } from 'uuid';

// Ensure environment is loaded for scripts and worker
loadEnv();

const { Pool } = pg;

// Create a singleton connection pool
let pool: pg.Pool | null = null;

function getPool() {
  if (!pool) {
    const useSsl = String(process.env.PGSSL || '').toLowerCase() === 'true';
    const rejectUnauthorized = String(process.env.PGSSL_REJECT_UNAUTHORIZED || 'false').toLowerCase() === 'true';
    const max = Number(process.env.PG_POOL_MAX || '5');
    const idleTimeoutMillis = Number(process.env.PG_IDLE_TIMEOUT_MS || '30000');
    const connectionTimeoutMillis = Number(process.env.PG_CONN_TIMEOUT_MS || '10000');
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max,
      idleTimeoutMillis,
      connectionTimeoutMillis,
      keepAlive: true,
      ssl: useSsl ? { rejectUnauthorized } as any : undefined,
    });
  }
  return pool;
}

export const db = drizzle(getPool(), { schema });

// === Transient DB retry helper ===
function isTransientDbError(error: any): boolean {
  const msg = (error?.message || '').toLowerCase();
  return (
    msg.includes('connection terminated') ||
    msg.includes('terminat') ||
    msg.includes('timeout') ||
    msg.includes('econnreset') ||
    msg.includes('etimedout')
  );
}

async function withDbRetries<T>(label: string, fn: () => Promise<T>, maxAttempts?: number): Promise<T> {
  const attempts = Number(process.env.DB_RETRY_ATTEMPTS || (maxAttempts ?? 3));
  const maxBackoffMs = Number(process.env.DB_RETRY_MAX_MS || '3000');
  let lastErr: any;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await fn();
    } catch (err: any) {
      lastErr = err;
      if (!isTransientDbError(err)) throw err;
      const base = Math.min(maxBackoffMs, 200 * attempt * attempt);
      const jitter = Math.floor(Math.random() * 100);
      const backoff = base + jitter;
      console.warn(`[DB-Retry] ${label} failed (attempt ${attempt}/${attempts}): ${err?.message || err}. Retrying in ${backoff}ms`);
      await new Promise(r => setTimeout(r, backoff));
    }
  }
  throw lastErr;
}

// User functions
export async function createUser(id: string, email: string, passwordHash: string) {
  const [user] = await db.insert(schema.users).values({
    id,
    email,
    passwordHash,
  }).returning();
  return user;
}

export async function getUserById(id: string) {
  const [user] = await db.select().from(schema.users).where(eq(schema.users.id, id)).limit(1);
  return user;
}

export async function getUserByEmail(email: string) {
  return await withDbRetries('getUserByEmail', async () => {
    const [user] = await db.select().from(schema.users).where(eq(schema.users.email, email)).limit(1);
    return user;
  });
}

export async function updateUserLastLogin(id: string) {
  await db.update(schema.users).set({ lastLogin: new Date() }).where(eq(schema.users.id, id));
}

// Session functions
export async function createSession(token: string, userId: string, expiresAt: number) {
  const [session] = await db.insert(schema.sessions).values({
    token,
    userId,
    expiresAt,
  }).returning();
  return session;
}

export async function getSession(token: string) {
  return await withDbRetries('getSession', async () => {
    const [session] = await db.select().from(schema.sessions).where(eq(schema.sessions.token, token)).limit(1);
    return session;
  });
}

export async function deleteSession(token: string) {
  await db.delete(schema.sessions).where(eq(schema.sessions.token, token));
}

export async function deleteExpiredSessions() {
  await db.delete(schema.sessions).where(lt(schema.sessions.expiresAt, Date.now()));
}

// Character functions
export async function saveCharacter(characterData: any) {
  // Serialize writes with a row-level lock
  return await db.transaction(async (tx) => {
    // Ensure the owning user exists to satisfy FK constraint
    const [user] = await tx.select().from(schema.users).where(eq(schema.users.id, characterData.userId || characterData.id)).limit(1);
    if (!user) {
      throw new Error(`User ${characterData.userId || characterData.id} not found; cannot save character`);
    }

    // Lock the row if it exists
    const existing = await tx.select().from(schema.characters).where(eq(schema.characters.id, characterData.id)).limit(1);

    if (existing.length > 0) {
      const [updated] = await tx.update(schema.characters)
        .set({
          ...characterData,
          lastUpdatedAt: Date.now(),
        })
        .where(eq(schema.characters.id, characterData.id))
        .returning();
      return updated;
    } else {
      const [created] = await tx.insert(schema.characters)
        .values({
          ...characterData,
          userId: characterData.userId || characterData.id, // default to auth id
          realmId: characterData.realmId || 'global',
          createdAt: characterData.createdAt || Date.now(),
          lastUpdatedAt: Date.now(),
          lastProcessedAt: Date.now(),
        })
        .returning();
      return created;
    }
  });
}

export async function getCharacterById(id: string) {
  const [character] = await db.select().from(schema.characters).where(eq(schema.characters.id, id)).limit(1);
  return character;
}

export async function getAllActiveCharacters() {
  return await withDbRetries('getAllActiveCharacters', async () => {
    return await db.select().from(schema.characters).where(eq(schema.characters.isActive, true));
  });
}

export async function updateCharacterLastProcessed(id: string, timestamp: number) {
  await db.update(schema.characters)
    .set({ lastProcessedAt: timestamp })
    .where(eq(schema.characters.id, id));
}

// Chronicle functions
export async function addChronicleEntry(characterId: string, entry: Omit<schema.NewChronicleDB, 'id' | 'characterId'>) {
  const realmId = (await getCharacterById(characterId))?.realmId || 'global';
  const [created] = await db.insert(schema.chronicle)
    .values({
      characterId,
      realmId,
      timestamp: entry.timestamp || Date.now(),
      type: entry.type,
      title: entry.title,
      description: entry.description,
      icon: entry.icon,
      data: entry.data,
    })
    .returning();
  return created;
}

export async function getChronicleEntries(characterId: string, limit = 100) {
  return await db.select()
    .from(schema.chronicle)
    .where(eq(schema.chronicle.characterId, characterId))
    .orderBy(desc(schema.chronicle.timestamp))
    .limit(limit);
}

// Offline events functions
export async function addOfflineEvent(characterId: string, event: Omit<schema.NewOfflineEvent, 'id' | 'characterId'>) {
  // Check for duplicate event (same message, type, and timestamp within 1 second)
  const oneSecondAgo = (event.timestamp || Date.now()) - 1000;
  const existingEvent = await db.select()
    .from(schema.offlineEvents)
    .where(and(
      eq(schema.offlineEvents.characterId, characterId),
      eq(schema.offlineEvents.type, event.type),
      eq(schema.offlineEvents.message, event.message),
      // Check for events within the last second to prevent duplicates
      sql`${schema.offlineEvents.timestamp} >= ${oneSecondAgo}`
    ))
    .limit(1);
  
  if (existingEvent.length > 0) {
    console.log(`[Storage] Skipping duplicate event for character ${characterId}: ${event.message}`);
    return existingEvent[0]; // Return existing event instead of creating duplicate
  }
  
  // Fixed-size circular buffer across ALL events (read + unread): keep max 40
  // If fewer than 40 events exist, insert a new one; otherwise overwrite the oldest row
  const latestIds = await db.select({ id: schema.offlineEvents.id })
    .from(schema.offlineEvents)
    .where(eq(schema.offlineEvents.characterId, characterId))
    .orderBy(desc(schema.offlineEvents.timestamp))
    .limit(40);

  if (latestIds.length < 40) {
    const [created] = await db.insert(schema.offlineEvents)
      .values({
        characterId,
        timestamp: event.timestamp || Date.now(),
        type: event.type,
        message: event.message,
        data: event.data,
        isRead: false,
        realmId: (await getCharacterById(characterId))?.realmId || 'global',
      })
      .returning();
    return created;
  } else {
    // Find the oldest event row and overwrite it
    const oldest = await db.select()
      .from(schema.offlineEvents)
      .where(eq(schema.offlineEvents.characterId, characterId))
      .orderBy(schema.offlineEvents.timestamp)
      .limit(1);
    const row = oldest[0];
    if (!row) {
      // Fallback: insert if we failed to fetch oldest (shouldn't happen)
      const [created] = await db.insert(schema.offlineEvents)
        .values({
          characterId,
          timestamp: event.timestamp || Date.now(),
          type: event.type,
          message: event.message,
          data: event.data,
          isRead: false,
        })
        .returning();
      return created;
    }
    const [updated] = await db.update(schema.offlineEvents)
      .set({
        timestamp: event.timestamp || Date.now(),
        type: event.type,
        message: event.message,
        data: event.data,
        isRead: false,
      })
      .where(eq(schema.offlineEvents.id, row.id))
      .returning();
    return updated;
  }
}

// Removed unread-only trimming; circular buffer is enforced in addOfflineEvent()

export async function getUnreadOfflineEvents(characterId: string) {
  return await db.select()
    .from(schema.offlineEvents)
    .where(and(
      eq(schema.offlineEvents.characterId, characterId),
      eq(schema.offlineEvents.isRead, false)
    ))
    .orderBy(desc(schema.offlineEvents.timestamp));
}

export async function getRecentOfflineEvents(characterId: string, limit = 40) {
  return await db.select()
    .from(schema.offlineEvents)
    .where(eq(schema.offlineEvents.characterId, characterId))
    .orderBy(desc(schema.offlineEvents.timestamp))
    .limit(limit);
}

export async function markOfflineEventsAsRead(characterId: string) {
  await db.update(schema.offlineEvents)
    .set({ isRead: true })
    .where(eq(schema.offlineEvents.characterId, characterId));
}

export async function deleteOldOfflineEvents(characterId: string, olderThan: number) {
  // Keep at least the latest 40 events regardless of age
  const newest = await db.select({ id: schema.offlineEvents.id })
    .from(schema.offlineEvents)
    .where(eq(schema.offlineEvents.characterId, characterId))
    .orderBy(desc(schema.offlineEvents.timestamp))
    .limit(40);
  const keep = new Set(newest.map(r => r.id));

  const candidates = await db.select()
    .from(schema.offlineEvents)
    .where(and(
      eq(schema.offlineEvents.characterId, characterId),
      eq(schema.offlineEvents.isRead, true),
      lt(schema.offlineEvents.timestamp, olderThan)
    ));

  const idsToDelete = candidates.filter(e => !keep.has((e as any).id)).map(e => (e as any).id);
  if (idsToDelete.length === 0) return;

  const BATCH_SIZE = 500;
  for (let i = 0; i < idsToDelete.length; i += BATCH_SIZE) {
    const batch = idsToDelete.slice(i, i + BATCH_SIZE);
    await db.delete(schema.offlineEvents)
      .where(sql`${schema.offlineEvents.id} = ANY(ARRAY[${sql.join(batch.map(id => sql`${id}`), sql`, `)}])`);
  }
}

// === Snapshots ===
export async function insertCharacterSnapshot(realmId: string, characterId: string, asOfTick: number, summary: any) {
  await db.insert(schema.characterStateSnapshots).values({
    realmId,
    characterId,
    asOfTick,
    summary,
  });
}

export async function cleanupOldSnapshots(characterId: string, keepLatest: number = 100) {
  const rows = await db.select().from(schema.characterStateSnapshots)
    .where(eq(schema.characterStateSnapshots.characterId, characterId))
    .orderBy(desc(schema.characterStateSnapshots.asOfTick));
  if (rows.length <= keepLatest) return;
  const toDelete = rows.slice(keepLatest);
  for (const r of toDelete) {
    await db.delete(schema.characterStateSnapshots).where(eq(schema.characterStateSnapshots.id, (r as any).id));
  }
}

// === Shouts helpers ===
export async function getAllShouts() {
  return await db.select().from(schema.shouts);
}

export async function getKnownShouts(characterId: string) {
  const rows = await db.select()
    .from(schema.characterShouts)
    .where(eq(schema.characterShouts.characterId, characterId));
  if (rows.length === 0) return [] as any[];
  const shoutIds = rows.map((r: any) => (r as any).shoutId);
  const all = await db.select().from(schema.shouts);
  return all.filter((s: any) => shoutIds.includes((s as any).id));
}

export async function grantShout(characterId: string, shoutId: string) {
  const [existing] = await db.select()
    .from(schema.characterShouts)
    .where(and(eq(schema.characterShouts.characterId, characterId), eq(schema.characterShouts.shoutId, shoutId)))
    .limit(1);
  if (existing) return existing;
  const [row] = await db.insert(schema.characterShouts).values({ characterId, shoutId }).returning();
  return row;
}

export async function revokeShout(characterId: string, shoutId: string) {
  await db.delete(schema.characterShouts).where(and(eq(schema.characterShouts.characterId, characterId), eq(schema.characterShouts.shoutId, shoutId)));
  return { ok: true };
}

// === Telegram storage ===
export async function createTelegramLinkToken(userId: string, token: string, expiresAt: number) {
  const [row] = await db.insert(schema.telegramLinkTokens).values({ userId, token, expiresAt }).returning();
  return row;
}

export async function consumeTelegramLinkToken(token: string) {
  const [row] = await db.select().from(schema.telegramLinkTokens).where(eq(schema.telegramLinkTokens.token, token)).limit(1);
  if (!row) return null;
  await db.delete(schema.telegramLinkTokens).where(eq(schema.telegramLinkTokens.token, token));
  if ((row as any).expiresAt < Date.now()) return null;
  return row;
}

export async function upsertTelegramSubscription(userId: string, chatId: string, mode: string = 'daily', locale: string = 'ru') {
  const existing = await db.select().from(schema.telegramSubscriptions)
    .where(and(eq(schema.telegramSubscriptions.userId, userId), eq(schema.telegramSubscriptions.chatId, chatId)))
    .limit(1);
  if (existing.length > 0) {
    const [updated] = await db.update(schema.telegramSubscriptions)
      .set({ isActive: true, mode, locale })
      .where(eq(schema.telegramSubscriptions.id, (existing[0] as any).id))
      .returning();
    return updated;
  } else {
    const [row] = await db.insert(schema.telegramSubscriptions).values({ id: uuidv4(), userId, chatId, mode, locale, isActive: true }).returning();
    return row;
  }
}

export async function getActiveTelegramSubscriptions() {
  return await db.select().from(schema.telegramSubscriptions).where(eq(schema.telegramSubscriptions.isActive, true));
}

export async function setTelegramLastSentAt(id: string, ts: number) {
  await db.update(schema.telegramSubscriptions).set({ lastSentAt: ts }).where(eq(schema.telegramSubscriptions.id, id));
}

export async function deactivateTelegramSubscription(id: string) {
  await db.update(schema.telegramSubscriptions).set({ isActive: false }).where(eq(schema.telegramSubscriptions.id, id));
}

export async function activateTelegramSubscription(id: string) {
  await db.update(schema.telegramSubscriptions).set({ isActive: true }).where(eq(schema.telegramSubscriptions.id, id));
}

export async function getAllTelegramSubscriptions() {
  const rows = await db.select({
    id: schema.telegramSubscriptions.id,
    userId: schema.telegramSubscriptions.userId,
    chatId: schema.telegramSubscriptions.chatId,
    mode: schema.telegramSubscriptions.mode,
    locale: schema.telegramSubscriptions.locale,
    lastSentAt: schema.telegramSubscriptions.lastSentAt,
    isActive: schema.telegramSubscriptions.isActive,
    createdAt: schema.telegramSubscriptions.createdAt,
    email: schema.users.email,
  })
  .from(schema.telegramSubscriptions)
  .leftJoin(schema.users, eq(schema.telegramSubscriptions.userId, schema.users.id))
  .orderBy(desc(schema.telegramSubscriptions.createdAt));
  return rows as Array<any>;
}

export async function getUserActiveTelegramSubscription(userId: string) {
  const rows = await db.select()
    .from(schema.telegramSubscriptions)
    .where(and(eq(schema.telegramSubscriptions.userId, userId), eq(schema.telegramSubscriptions.isActive, true)))
    .orderBy(desc(schema.telegramSubscriptions.createdAt))
    .limit(1);
  return rows[0] || null;
}