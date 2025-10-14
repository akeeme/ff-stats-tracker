# Game Type Feature Migration

## Overview
Added `game_type` field to games table to distinguish between regular season, playoff, and championship games.

## Database Changes

### Migration Script
Run the SQL migration file: `db files/add_game_type.sql`

```sql
-- Add game_type column with default value 'regular'
ALTER TABLE statstracker.games 
ADD COLUMN game_type VARCHAR(20) DEFAULT 'regular' NOT NULL;

-- Add check constraint to ensure only valid game types
ALTER TABLE statstracker.games
ADD CONSTRAINT games_game_type_check 
CHECK (game_type IN ('regular', 'playoff', 'championship'));
```

### Update Existing Playoff Games
After running the migration, update any existing playoff games:

```sql
-- Example: Mark Season 1, Week 7 as playoff
UPDATE statstracker.games 
SET game_type = 'playoff' 
WHERE season = 1 AND week = 7;
```

## Backend Changes

### Models Updated
- `internal/models/models.go`: Added `GameType` field to `Game` struct
- `internal/models/requests.go`: Added `GameType` to `GameCreateRequest` and `GameUpdateRequest`

### Handlers Updated
- `internal/handlers/games.go`:
  - `CreateGame`: Accepts `game_type` in request (defaults to 'regular')
  - `GetGames`: Returns `game_type` in response
  - `UpdateGame`: Allows updating `game_type`

## Frontend Changes

### TypeScript Interface
- `frontend/src/lib/api.ts`: Added `game_type: 'regular' | 'playoff' | 'championship'` to `Game` interface

### UI Updates
- `frontend/src/app/games/page.tsx`: Added "Game Type" dropdown in create game form with options:
  - Regular Season
  - Playoff
  - Championship

## Usage

### Creating a Game
When creating a new game, select the appropriate game type from the dropdown. It defaults to "Regular Season".

### Displaying Game Type
Game cards and lists can now show badges/indicators for playoff and championship games to distinguish them from regular season games.

### Future Enhancements
- Add visual indicators (badges, colors) for playoff/championship games in game lists
- Filter stats by game type (regular season vs playoffs)
- Show separate playoff records in player stats
- Add playoff-specific leaderboards

## Testing

1. Run the database migration
2. Restart the backend server
3. Create a new game and verify the game_type dropdown appears
4. Create games with different types (regular, playoff, championship)
5. Verify games are saved with the correct game_type
6. Update existing playoff games using SQL
