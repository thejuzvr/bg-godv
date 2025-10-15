CREATE TABLE IF NOT EXISTS "character_state_snapshots" (
  "id" text PRIMARY KEY,
  "realm_id" text NOT NULL DEFAULT 'global',
  "character_id" text NOT NULL REFERENCES "characters"("id") ON DELETE CASCADE,
  "as_of_tick" bigint NOT NULL,
  "summary" jsonb NOT NULL,
  "created_at" timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_snapshots_char_tick ON "character_state_snapshots" ("character_id", "as_of_tick" DESC);
CREATE INDEX IF NOT EXISTS idx_snapshots_realm ON "character_state_snapshots" ("realm_id");

