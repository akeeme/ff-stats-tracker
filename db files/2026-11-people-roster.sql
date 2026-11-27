-- People / per-season roster backfill for the option-A overhaul.
-- NOT run automatically. Run by hand (psql -v ON_ERROR_STOP=1 -f ...) only after akeeme OKs it,
-- and after a pg_dump of schema statstracker. Section 0 is a read-only dry run: run it alone first.
--
-- Model: statstracker.people = one row per human (id = players.canonical_player_id).
--        statstracker.players = per-season roster rows (season, team_id, jersey_number) -> people.
-- Snapshot dry run (2026-11-26): 44 roster rows -> 16 people, 0 name collisions,
-- 110 of 187 stat rows relinked to the game's season row, 0 ambiguous.

-- 0. DRY RUN (read-only) ---------------------------------------------------------------
-- a) names that map to more than one canonical id (ambiguous people -> ask akeeme)
SELECT lower(trim(name)) AS name, array_agg(DISTINCT canonical_player_id) AS ids
FROM statstracker.players WHERE NOT is_deleted GROUP BY 1 HAVING count(DISTINCT canonical_player_id) > 1;
-- b) stat rows whose roster row is from another season, and their target row
SELECT s.id AS stat_id, p.name, p.season AS row_season, g.season AS game_season,
       (SELECT array_agg(p2.id) FROM statstracker.players p2
         WHERE p2.canonical_player_id = p.canonical_player_id AND p2.season = g.season AND NOT p2.is_deleted) AS targets
FROM statstracker.player_stats s
JOIN statstracker.players p ON p.id = s.player_id
JOIN statstracker.games g ON g.id = s.game_id
WHERE NOT s.is_deleted AND p.season <> g.season
ORDER BY array_length((SELECT array_agg(p2.id) FROM statstracker.players p2
         WHERE p2.canonical_player_id = p.canonical_player_id AND p2.season = g.season AND NOT p2.is_deleted), 1) NULLS FIRST, s.id;
-- rows with targets NULL or >1 element are ambiguous: they are left untouched by step 3.

-- 1..4 WRITE (one transaction) ----------------------------------------------------------
BEGIN;

-- 1. people from canonical ids (name from the earliest roster row)
INSERT INTO statstracker.people (id, name)
SELECT DISTINCT ON (canonical_player_id) canonical_player_id, trim(name)
FROM statstracker.players
WHERE canonical_player_id IS NOT NULL AND NOT is_deleted
ORDER BY canonical_player_id, season, id
ON CONFLICT (id) DO NOTHING;

-- 2. every roster row must belong to a person
UPDATE statstracker.players SET canonical_player_id = id WHERE canonical_player_id IS NULL;
INSERT INTO statstracker.people (id, name)
SELECT id, trim(name) FROM statstracker.players p
WHERE NOT EXISTS (SELECT 1 FROM statstracker.people x WHERE x.id = p.canonical_player_id)
ON CONFLICT (id) DO NOTHING;
ALTER TABLE statstracker.players
  ADD CONSTRAINT players_person_fk FOREIGN KEY (canonical_player_id) REFERENCES statstracker.people(id);
ALTER TABLE statstracker.mvp_votes
  ADD CONSTRAINT mvp_votes_person_fk FOREIGN KEY (person_id) REFERENCES statstracker.people(id) ON DELETE CASCADE;

-- 3. relink stat rows to the same person's roster row for the game's season (unambiguous only)
UPDATE statstracker.player_stats s
SET player_id = t.target, updated_at = NOW(), version = s.version + 1
FROM (
  SELECT s2.id AS stat_id, min(p2.id) AS target
  FROM statstracker.player_stats s2
  JOIN statstracker.players p ON p.id = s2.player_id
  JOIN statstracker.games g ON g.id = s2.game_id
  JOIN statstracker.players p2 ON p2.canonical_player_id = p.canonical_player_id AND p2.season = g.season AND NOT p2.is_deleted
  WHERE NOT s2.is_deleted AND p.season <> g.season
  GROUP BY s2.id HAVING count(*) = 1
) t
WHERE s.id = t.stat_id;

-- 4. point roster rows and games at the Rhinos team row of their own season (rows exist for S1-S4)
UPDATE statstracker.players p SET team_id = t.id, updated_at = NOW()
FROM statstracker.teams t
WHERE t.name = 'Rhinos' AND t.season = p.season AND NOT t.is_deleted AND p.team_id <> t.id;

UPDATE statstracker.games g SET team1_id = t.id
FROM statstracker.teams t, statstracker.teams cur
WHERE cur.id = g.team1_id AND t.name = cur.name AND t.season = g.season AND t.league = g.league
  AND NOT t.is_deleted AND g.team1_id <> t.id;
UPDATE statstracker.games g SET team2_id = t.id
FROM statstracker.teams t, statstracker.teams cur
WHERE cur.id = g.team2_id AND t.name = cur.name AND t.season = g.season AND t.league = g.league
  AND NOT t.is_deleted AND g.team2_id <> t.id;
UPDATE statstracker.games g SET winning_team_id = CASE
    WHEN team1_score > team2_score THEN team1_id WHEN team2_score > team1_score THEN team2_id END
WHERE winning_team_id IS DISTINCT FROM CASE
    WHEN team1_score > team2_score THEN team1_id WHEN team2_score > team1_score THEN team2_id END;

-- checks: must both be 0 before COMMIT
SELECT count(*) AS stats_off_season FROM statstracker.player_stats s
JOIN statstracker.players p ON p.id = s.player_id JOIN statstracker.games g ON g.id = s.game_id
WHERE NOT s.is_deleted AND p.season <> g.season;
SELECT count(*) AS roster_rows_without_person FROM statstracker.players p
WHERE NOT EXISTS (SELECT 1 FROM statstracker.people x WHERE x.id = p.canonical_player_id);

COMMIT;
