# Canonical Player ID Migration Guide

## Overview
This migration adds a `canonical_player_id` field to the players table to link the same person across different seasons and teams. This allows the player detail modal to show career stats across all seasons.

## What Changed

### Database
- Added `canonical_player_id` column to `statstracker.players` table
- For existing players, the canonical_player_id is set to the minimum player ID for each unique name
- For new players, canonical_player_id is automatically set based on matching names

### Backend (Go)
- Updated `Player` model to include `CanonicalPlayerID *int`
- Modified `CreatePlayer` handler to:
  - Check for existing players with the same name (case-insensitive)
  - Assign the existing canonical_player_id if found
  - Set canonical_player_id to the new player's own ID if it's a new person
- Updated `GetPlayers` and `GetPlayer` queries to include canonical_player_id

### Frontend (TypeScript)
- Updated `Player` interface to include `canonical_player_id?: number`
- Modified `PlayerDetailModal` to:
  - Accept `allPlayers` prop
  - Filter stats using canonical_player_id to show career stats across all seasons
  - Display stats for all player records that share the same canonical_player_id

## Migration Steps

### 1. Run the SQL Migration
Execute the migration file to add the column and populate existing data:

```bash
# If using Supabase
psql -h <your-host> -U <your-user> -d <your-db> -f db\ files/add_canonical_player_id.sql

# Or run directly in Supabase SQL editor
```

### 2. Restart the Backend
The Go backend will automatically pick up the new field:

```bash
# Stop the current backend
# Restart it
go run main.go
```

### 3. Test the Changes

#### Test 1: Existing Players
1. Go to the Players page
2. Click on a player who exists in multiple seasons
3. Verify the modal shows stats from ALL seasons

#### Test 2: New Player (Same Name)
1. Create a new player with the same name as an existing player but in a different season
2. Check that the new player has the same canonical_player_id as the existing one
3. Click on either player record - both should show combined career stats

#### Test 3: New Player (New Name)
1. Create a player with a completely new name
2. Check that canonical_player_id equals their own player ID
3. Stats should only show for that one season

## How It Works

### Player Creation Logic
```
When creating a new player:
1. Check if any player with the same name exists (case-insensitive, trimmed)
2. If yes → Use their canonical_player_id
3. If no → After insertion, set canonical_player_id = new player's ID
```

### Stats Display Logic
```
When viewing player details:
1. Get the canonical_player_id from the clicked player
2. Find ALL player records with that canonical_player_id
3. Collect stats from all those player records
4. Aggregate and display as career stats
```

## Example Scenario

**Before Migration:**
- Season 1: Akeeme (ID: 1, Team: Rhinos)
- Season 2: Akeeme (ID: 15, Team: Rhinos)
- Clicking either player only shows that season's stats

**After Migration:**
- Season 1: Akeeme (ID: 1, canonical_player_id: 1)
- Season 2: Akeeme (ID: 15, canonical_player_id: 1)
- Clicking either player shows combined stats from both seasons

## Troubleshooting

### Issue: Stats not showing for all seasons
**Solution:** Check that all player records have the correct canonical_player_id:
```sql
SELECT id, name, season, canonical_player_id 
FROM statstracker.players 
WHERE name = 'Player Name' 
ORDER BY season;
```

### Issue: New players not getting canonical_player_id
**Solution:** Check backend logs for errors in the CreatePlayer handler

### Issue: Duplicate canonical IDs
**Solution:** Re-run the migration update query:
```sql
UPDATE statstracker.players p1
SET canonical_player_id = (
    SELECT MIN(id)
    FROM statstracker.players p2
    WHERE LOWER(TRIM(p2.name)) = LOWER(TRIM(p1.name))
    AND p2.is_deleted = FALSE
);
```

## Future Enhancements

1. **Admin UI for Managing Canonical IDs**
   - Allow admins to manually link/unlink player records
   - Handle name changes (e.g., "Mike" → "Michael")

2. **Merge Player Records**
   - Tool to combine stats from incorrectly split players

3. **Player Profiles**
   - Add a separate `persons` table for true normalization
   - Store bio, photo, etc. at the person level
