-- Add danger level column to game_locations table for tracking zone danger
ALTER TABLE "game_locations" ADD COLUMN "danger_level" integer DEFAULT 0;

-- Update existing outskirts locations with initial danger levels
UPDATE "game_locations" SET "danger_level" = 25, "is_safe" = false WHERE "id" = 'whiterun_outskirts';
UPDATE "game_locations" SET "danger_level" = 20, "is_safe" = false WHERE "id" = 'solitude_outskirts';
UPDATE "game_locations" SET "danger_level" = 30, "is_safe" = false WHERE "id" = 'windhelm_outskirts';
UPDATE "game_locations" SET "danger_level" = 35, "is_safe" = false WHERE "id" = 'riften_outskirts';
UPDATE "game_locations" SET "danger_level" = 40, "is_safe" = false WHERE "id" = 'markarth_outskirts';

-- Insert new outskirts locations for towns
INSERT INTO "game_locations" ("id", "name", "type", "coord_x", "coord_y", "is_safe", "danger_level", "created_at", "updated_at")
VALUES 
  ('dawnstar_outskirts', 'Окрестности Данстара', 'outskirts', 50, 12, false, 45, NOW(), NOW()),
  ('winterhold_outskirts', 'Окрестности Винтерхолда', 'outskirts', 74, 20, false, 50, NOW(), NOW()),
  ('morthal_outskirts', 'Окрестности Морфала', 'outskirts', 36, 28, false, 35, NOW(), NOW()),
  ('falkreath_outskirts', 'Окрестности Фолкрита', 'outskirts', 42, 85, false, 30, NOW(), NOW())
ON CONFLICT ("id") DO UPDATE SET
  "name" = EXCLUDED."name",
  "type" = EXCLUDED."type",
  "coord_x" = EXCLUDED."coord_x",
  "coord_y" = EXCLUDED."coord_y",
  "is_safe" = EXCLUDED."is_safe",
  "danger_level" = EXCLUDED."danger_level",
  "updated_at" = NOW();
