-- Add discovery system fields to locations
ALTER TABLE game_locations 
ADD COLUMN is_starting_location BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN travel_distance INTEGER DEFAULT 100;

-- Mark major cities and towns as starting locations
UPDATE game_locations 
SET is_starting_location = true 
WHERE type IN ('city', 'town') 
  AND id IN ('solitude', 'windhelm', 'whiterun', 'markarth', 'riften', 'dawnstar', 'winterhold', 'morthal', 'falkreath');

-- Set appropriate travel distances based on location type
UPDATE game_locations 
SET travel_distance = CASE
  WHEN type = 'city' THEN 150
  WHEN type = 'town' AND is_starting_location = true THEN 140
  WHEN type = 'town' AND is_starting_location = false THEN 85
  WHEN type = 'outskirts' THEN 70
  WHEN type = 'ruin' THEN 110
  WHEN type = 'dungeon' THEN 120
  ELSE 100
END;

