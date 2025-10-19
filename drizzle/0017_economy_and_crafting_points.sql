-- Add crafting progression fields to characters
ALTER TABLE characters ADD COLUMN IF NOT EXISTS crafting_points integer NOT NULL DEFAULT 0;
ALTER TABLE characters ADD COLUMN IF NOT EXISTS unlocked_recipes jsonb;

-- Create global market table
CREATE TABLE IF NOT EXISTS global_market (
  item_id text PRIMARY KEY,
  price real NOT NULL,
  supply bigint NOT NULL DEFAULT 0,
  demand bigint NOT NULL DEFAULT 0,
  updated_at timestamp NOT NULL DEFAULT now()
);

-- Basic seed (optional safe defaults) will be handled by service if absent

