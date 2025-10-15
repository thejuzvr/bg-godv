-- Realms table
CREATE TABLE IF NOT EXISTS "realms" (
  "id" text PRIMARY KEY,
  "name" text NOT NULL,
  "status" text NOT NULL DEFAULT 'active',
  "created_at" timestamp NOT NULL DEFAULT now()
);

-- Add realm_id columns with default 'global'
ALTER TABLE "characters" ADD COLUMN IF NOT EXISTS "realm_id" text NOT NULL DEFAULT 'global';
ALTER TABLE "chronicle" ADD COLUMN IF NOT EXISTS "realm_id" text NOT NULL DEFAULT 'global';
ALTER TABLE "offline_events" ADD COLUMN IF NOT EXISTS "realm_id" text NOT NULL DEFAULT 'global';
ALTER TABLE "combat_analytics" ADD COLUMN IF NOT EXISTS "realm_id" text NOT NULL DEFAULT 'global';

-- Indexes to speed up realm-scoped queries
CREATE INDEX IF NOT EXISTS idx_characters_realm_id ON "characters" ("realm_id");
CREATE INDEX IF NOT EXISTS idx_chronicle_realm_id ON "chronicle" ("realm_id");
CREATE INDEX IF NOT EXISTS idx_offline_events_realm_id ON "offline_events" ("realm_id");
CREATE INDEX IF NOT EXISTS idx_combat_analytics_realm_id ON "combat_analytics" ("realm_id");


