-- AI Profiles define behavior multipliers per tag
CREATE TABLE IF NOT EXISTS "ai_profiles" (
  "id" text PRIMARY KEY,
  "code" text NOT NULL UNIQUE,
  "name" text NOT NULL,
  "base_multipliers" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "created_at" timestamp NOT NULL DEFAULT now()
);

-- Per-character AI state: selected profile and fatigue map
CREATE TABLE IF NOT EXISTS "character_ai_state" (
  "character_id" text PRIMARY KEY REFERENCES "characters"("id") ON DELETE CASCADE,
  "profile_id" text REFERENCES "ai_profiles"("id") ON DELETE SET NULL,
  "fatigue" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "updated_at" timestamp NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_character_ai_state_char ON "character_ai_state" ("character_id");

-- Active AI modifiers that influence priorities (e.g., Luck +20%)
CREATE TABLE IF NOT EXISTS "ai_modifiers" (
  "id" text PRIMARY KEY,
  "character_id" text NOT NULL REFERENCES "characters"("id") ON DELETE CASCADE,
  "code" text NOT NULL,
  "label" text,
  "multiplier" real NOT NULL DEFAULT 0,
  "expires_at" timestamptz,
  "source" jsonb,
  "created_at" timestamp NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ai_modifiers_char ON "ai_modifiers" ("character_id");
CREATE INDEX IF NOT EXISTS idx_ai_modifiers_char_expiry ON "ai_modifiers" ("character_id", "expires_at");


