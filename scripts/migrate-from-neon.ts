import { drizzle } from 'drizzle-orm/node-postgres';
import pkg from 'pg';
const { Pool } = pkg;
import * as schema from '../shared/schema.js';


async function migrate() {
  console.log('🔄 Starting migration from Neon to PostgreSQL...\n');

  const sourceUrl = process.env.NEON_DATABASE_URL;
  const targetUrl = process.env.DATABASE_URL;

  if (!sourceUrl || !targetUrl) {
    console.error('❌ Error: Missing database URLs');
    console.error('Please set NEON_DATABASE_URL (source) and DATABASE_URL (target)');
    process.exit(1);
  }

  const sourcePool = new Pool({ connectionString: sourceUrl });
  const targetPool = new Pool({ connectionString: targetUrl });

  const sourceDb = drizzle(sourcePool, { schema });
  const targetDb = drizzle(targetPool, { schema });

  try {
    console.log('📊 Fetching data from Neon...');

    const users = await sourceDb.select().from(schema.users);
    const characters = await sourceDb.select().from(schema.characters);
    const chronicle = await sourceDb.select().from(schema.chronicle);
    const offlineEvents = await sourceDb.select().from(schema.offlineEvents);

    console.log(`✅ Found ${users.length} users`);
    console.log(`✅ Found ${characters.length} characters`);
    console.log(`✅ Found ${chronicle.length} chronicle entries`);
    console.log(`✅ Found ${offlineEvents.length} offline events\n`);

    console.log('📥 Migrating data to new PostgreSQL...');

    if (users.length > 0) {
      console.log('→ Migrating users...');
      await targetDb.insert(schema.users).values(users).onConflictDoNothing();
      console.log(`  ✓ Migrated ${users.length} users`);
    }

    if (characters.length > 0) {
      console.log('→ Migrating characters...');
      await targetDb.insert(schema.characters).values(characters).onConflictDoNothing();
      console.log(`  ✓ Migrated ${characters.length} characters`);
    }

    if (chronicle.length > 0) {
      console.log('→ Migrating chronicle entries...');
      await targetDb.insert(schema.chronicle).values(chronicle).onConflictDoNothing();
      console.log(`  ✓ Migrated ${chronicle.length} chronicle entries`);
    }

    if (offlineEvents.length > 0) {
      console.log('→ Migrating offline events...');
      await targetDb.insert(schema.offlineEvents).values(offlineEvents).onConflictDoNothing();
      console.log(`  ✓ Migrated ${offlineEvents.length} offline events`);
    }

    console.log('\n✨ Migration completed successfully!');
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    throw error;
  } finally {
    await sourcePool.end();
    await targetPool.end();
  }
}

migrate().catch(console.error);
