-- Migration: Add game_type column to games table
-- This allows distinguishing between regular season, playoff, and championship games

-- Add game_type column with default value 'regular'
ALTER TABLE statstracker.games 
ADD COLUMN game_type VARCHAR(20) DEFAULT 'regular' NOT NULL;

-- Add check constraint to ensure only valid game types
ALTER TABLE statstracker.games
ADD CONSTRAINT games_game_type_check 
CHECK (game_type IN ('regular', 'playoff', 'championship'));

-- Add comment to document the column
COMMENT ON COLUMN statstracker.games.game_type IS 'Type of game: regular, playoff, or championship';

-- Update existing playoff games based on current data
-- Season 1: Weeks 1-6 are regular season, weeks 7+ are playoffs
UPDATE statstracker.games 
SET game_type = 'playoff' 
WHERE season = 1 AND week >= 7;

-- Season 2: Weeks 1-6 are regular season, weeks 7+ are playoffs  
UPDATE statstracker.games 
SET game_type = 'playoff' 
WHERE season = 2 AND week >= 7;

-- Season 4: Week 1 is regular season (already default)
-- No update needed for Season 4 as it defaults to 'regular'

-- Verify the updates
SELECT season, week, game_type, team1_id, team2_id 
FROM statstracker.games
ORDER BY season, week;
