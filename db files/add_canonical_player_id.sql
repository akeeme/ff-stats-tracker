-- Migration: Add canonical_player_id to players table
-- This allows tracking the same person across multiple seasons/teams

-- Step 1: Add the canonical_player_id column
ALTER TABLE statstracker.players 
ADD COLUMN canonical_player_id INTEGER;

-- Step 2: Populate canonical_player_id for existing players
-- For each unique player name, assign the minimum player ID as the canonical ID
UPDATE statstracker.players p1
SET canonical_player_id = (
    SELECT MIN(id)
    FROM statstracker.players p2
    WHERE LOWER(TRIM(p2.name)) = LOWER(TRIM(p1.name))
    AND p2.is_deleted = FALSE
);

-- Step 3: For new players, canonical_player_id should default to their own ID
-- This will be handled in the application logic when creating new players

-- Step 4: Add index for better query performance
CREATE INDEX idx_players_canonical_player_id 
ON statstracker.players(canonical_player_id);

-- Step 5: Add comment for documentation
COMMENT ON COLUMN statstracker.players.canonical_player_id IS 
'References the canonical player ID to link the same person across different seasons and teams';
