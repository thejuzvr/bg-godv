-- Add learning and experiment group to character_ai_state
ALTER TABLE "character_ai_state"
  ADD COLUMN IF NOT EXISTS "learning" jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS "experiment_group" text;

CREATE INDEX IF NOT EXISTS idx_character_ai_state_exp_group ON "character_ai_state" ("experiment_group");


