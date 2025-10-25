-- Add priority and active quest system to quests table
-- This migration adds support for quest prioritization and active quest tracking

-- Add new columns to quests table
ALTER TABLE "quests" ADD COLUMN "priority" integer DEFAULT 50 NOT NULL;
ALTER TABLE "quests" ADD COLUMN "is_active" boolean DEFAULT false NOT NULL;
ALTER TABLE "quests" ADD COLUMN "can_auto_complete" boolean DEFAULT true NOT NULL;

-- Add index for faster active quest lookups
CREATE INDEX IF NOT EXISTS "quests_character_active_idx" ON "quests" ("character_id", "is_active") WHERE "is_active" = true;

-- Add index for priority-based sorting
CREATE INDEX IF NOT EXISTS "quests_priority_idx" ON "quests" ("character_id", "priority" DESC, "created_at" DESC);

-- Ensure only one quest can be active per character
-- This is a constraint that will be enforced at the application level
-- but we add a comment for documentation
COMMENT ON COLUMN "quests"."is_active" IS 'Only one quest per character can have is_active=true at a time';

-- Set reasonable priorities for existing quests based on their type
UPDATE "quests" SET 
  "priority" = CASE 
    WHEN "type" = 'urgent' THEN 90
    WHEN "type" = 'main' THEN 70
    WHEN "type" = 'bounty' THEN 60
    WHEN "type" = 'side' THEN 40
    ELSE 50
  END
WHERE "priority" = 50;

-- Set first in-progress quest as active for each character (if exists)
WITH first_active AS (
  SELECT DISTINCT ON ("character_id") 
    "id", 
    "character_id"
  FROM "quests"
  WHERE "status" = 'in-progress'
  ORDER BY "character_id", "created_at" ASC
)
UPDATE "quests" 
SET "is_active" = true
FROM first_active
WHERE "quests"."id" = first_active."id";
