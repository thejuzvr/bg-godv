ALTER TABLE characters ADD COLUMN IF NOT EXISTS crafting_level integer NOT NULL DEFAULT 1;
ALTER TABLE characters ADD COLUMN IF NOT EXISTS crafting_xp integer NOT NULL DEFAULT 0;

