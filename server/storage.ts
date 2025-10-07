import { drizzle } from 'drizzle-orm/node-postgres';
import { eq, desc, and, lt, sql } from 'drizzle-orm';
import pg from 'pg';
import * as schema from '../shared/schema';

const { Pool } = pg;

// Create a singleton connection pool
let pool: pg.Pool | null = null;

function getPool() {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
  }
  return pool;
}

export const db = drizzle(getPool(), { schema });

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
  const [user] = await db.select().from(schema.users).where(eq(schema.users.email, email)).limit(1);
  return user;
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
  const [session] = await db.select().from(schema.sessions).where(eq(schema.sessions.token, token)).limit(1);
  return session;
}

export async function deleteSession(token: string) {
  await db.delete(schema.sessions).where(eq(schema.sessions.token, token));
}

export async function deleteExpiredSessions() {
  await db.delete(schema.sessions).where(eq(schema.sessions.expiresAt, Date.now()));
}

// Character functions
export async function saveCharacter(characterData: any) {
  const existing = await db.select().from(schema.characters).where(eq(schema.characters.id, characterData.id)).limit(1);
  
  if (existing.length > 0) {
    // Update existing character
    const [updated] = await db.update(schema.characters)
      .set({
        ...characterData,
        lastUpdatedAt: Date.now(),
      })
      .where(eq(schema.characters.id, characterData.id))
      .returning();
    return updated;
  } else {
    // Insert new character
    const [created] = await db.insert(schema.characters)
      .values({
        ...characterData,
        userId: characterData.id, // User ID is same as character ID
        createdAt: characterData.createdAt || Date.now(),
        lastUpdatedAt: Date.now(),
        lastProcessedAt: Date.now(),
      })
      .returning();
    return created;
  }
}

export async function getCharacterById(id: string) {
  const [character] = await db.select().from(schema.characters).where(eq(schema.characters.id, id)).limit(1);
  return character;
}

export async function getAllActiveCharacters() {
  return await db.select().from(schema.characters).where(eq(schema.characters.isActive, true));
}

export async function updateCharacterLastProcessed(id: string, timestamp: number) {
  await db.update(schema.characters)
    .set({ lastProcessedAt: timestamp })
    .where(eq(schema.characters.id, id));
}

// Chronicle functions
export async function addChronicleEntry(characterId: string, entry: Omit<schema.NewChronicleDB, 'id' | 'characterId'>) {
  const [created] = await db.insert(schema.chronicle)
    .values({
      characterId,
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
  
  // Enforce max 40 unread events per character (circular buffer)
  await trimUnreadOfflineEvents(characterId, 40);
  
  return created;
}

// Helper function to keep only the latest N unread events for a character
async function trimUnreadOfflineEvents(characterId: string, maxCount: number) {
  // Get count of unread events
  const unreadEvents = await db.select()
    .from(schema.offlineEvents)
    .where(and(
      eq(schema.offlineEvents.characterId, characterId),
      eq(schema.offlineEvents.isRead, false)
    ))
    .orderBy(desc(schema.offlineEvents.timestamp));
  
  if (unreadEvents.length > maxCount) {
    // Delete oldest unread events beyond the limit
    const eventsToDelete = unreadEvents.slice(maxCount);
    const idsToDelete = eventsToDelete.map(e => e.id);
    
    if (idsToDelete.length > 0) {
      // Delete in batches of 500 to avoid PostgreSQL parameter limit (max 1664)
      const BATCH_SIZE = 500;
      for (let i = 0; i < idsToDelete.length; i += BATCH_SIZE) {
        const batch = idsToDelete.slice(i, i + BATCH_SIZE);
        await db.delete(schema.offlineEvents)
          .where(sql`${schema.offlineEvents.id} = ANY(ARRAY[${sql.join(batch.map(id => sql`${id}`), sql`, `)}])`);
      }
    }
  }
}

export async function getUnreadOfflineEvents(characterId: string) {
  return await db.select()
    .from(schema.offlineEvents)
    .where(and(
      eq(schema.offlineEvents.characterId, characterId),
      eq(schema.offlineEvents.isRead, false)
    ))
    .orderBy(schema.offlineEvents.timestamp);
}

export async function markOfflineEventsAsRead(characterId: string) {
  await db.update(schema.offlineEvents)
    .set({ isRead: true })
    .where(eq(schema.offlineEvents.characterId, characterId));
}

export async function deleteOldOfflineEvents(characterId: string, olderThan: number) {
  await db.delete(schema.offlineEvents)
    .where(and(
      eq(schema.offlineEvents.characterId, characterId),
      eq(schema.offlineEvents.isRead, true),
      lt(schema.offlineEvents.timestamp, olderThan)
    ));
}
