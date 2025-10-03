package database

import (
	"context"
	"fmt"
	"log"
)

func Migrate(db *DB) error {
	ctx := context.Background()

	// Create schema first
	if _, err := db.Exec(ctx, "CREATE SCHEMA IF NOT EXISTS statstracker"); err != nil {
		return fmt.Errorf("failed to create schema: %w", err)
	}

	// Set search path to include statstracker schema
	if _, err := db.Exec(ctx, "SET search_path TO statstracker, public"); err != nil {
		return fmt.Errorf("failed to set search path: %w", err)
	}

	// Create tables in order of dependencies
	tables := []string{
		createTeamsTable,
		createPlayersTable,
		createGamesTable,
		createPlayerStatsTable,
	}

	for _, tableSQL := range tables {
		if _, err := db.Exec(ctx, tableSQL); err != nil {
			return fmt.Errorf("failed to create table: %w", err)
		}
	}

	log.Println("Database migrations completed successfully")
	return nil
}

const createTeamsTable = `
CREATE TABLE IF NOT EXISTS statstracker.teams (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    season INTEGER NOT NULL,
    league VARCHAR(255) NOT NULL,
    wins INTEGER DEFAULT 0,
    losses INTEGER DEFAULT 0,
    ties INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    display_name VARCHAR(255),
    version INTEGER DEFAULT 1 NOT NULL,
    is_deleted BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT unique_team_season UNIQUE (name, season, league)
);

CREATE INDEX IF NOT EXISTS idx_teams_id ON statstracker.teams(id);
CREATE INDEX IF NOT EXISTS idx_teams_name ON statstracker.teams(name);
CREATE INDEX IF NOT EXISTS idx_teams_season ON statstracker.teams(season);
CREATE INDEX IF NOT EXISTS idx_teams_league ON statstracker.teams(league);
CREATE INDEX IF NOT EXISTS idx_teams_active ON statstracker.teams(is_active);
`

const createPlayersTable = `
CREATE TABLE IF NOT EXISTS statstracker.players (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    team_id INTEGER NOT NULL REFERENCES statstracker.teams(id) ON DELETE CASCADE,
    season INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    jersey_number VARCHAR(10),
    display_name VARCHAR(255),
    version INTEGER DEFAULT 1 NOT NULL,
    is_deleted BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_players_id ON statstracker.players(id);
CREATE INDEX IF NOT EXISTS idx_players_name ON statstracker.players(name);
CREATE INDEX IF NOT EXISTS idx_players_season ON statstracker.players(season);
CREATE INDEX IF NOT EXISTS idx_players_team_id ON statstracker.players(team_id);
CREATE INDEX IF NOT EXISTS idx_players_active ON statstracker.players(is_active);
`

const createGamesTable = `
CREATE TABLE IF NOT EXISTS statstracker.games (
    id SERIAL PRIMARY KEY,
    week INTEGER NOT NULL,
    league VARCHAR(255) NOT NULL,
    season INTEGER NOT NULL,
    team1_id INTEGER REFERENCES statstracker.teams(id) ON DELETE SET NULL,
    team1_score INTEGER DEFAULT 0,
    team2_id INTEGER REFERENCES statstracker.teams(id) ON DELETE SET NULL,
    team2_score INTEGER DEFAULT 0,
    winning_team_id INTEGER REFERENCES statstracker.teams(id) ON DELETE SET NULL,
    completed BOOLEAN DEFAULT FALSE,
    version INTEGER DEFAULT 1 NOT NULL,
    is_deleted BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_games_id ON statstracker.games(id);
CREATE INDEX IF NOT EXISTS idx_games_week ON statstracker.games(week);
CREATE INDEX IF NOT EXISTS idx_games_season ON statstracker.games(season);
CREATE INDEX IF NOT EXISTS idx_games_league ON statstracker.games(league);
CREATE INDEX IF NOT EXISTS idx_games_team1_id ON statstracker.games(team1_id);
CREATE INDEX IF NOT EXISTS idx_games_team2_id ON statstracker.games(team2_id);
CREATE INDEX IF NOT EXISTS idx_games_winning_team_id ON statstracker.games(winning_team_id);
`

const createPlayerStatsTable = `
CREATE TABLE IF NOT EXISTS statstracker.player_stats (
    id SERIAL PRIMARY KEY,
    player_id INTEGER NOT NULL REFERENCES statstracker.players(id) ON DELETE CASCADE,
    game_id INTEGER NOT NULL REFERENCES statstracker.games(id) ON DELETE CASCADE,
    
    -- QB stats
    passing_tds INTEGER DEFAULT 0,
    passes_completed INTEGER DEFAULT 0,
    passes_attempted INTEGER DEFAULT 0,
    interceptions_thrown INTEGER DEFAULT 0,
    qb_rushing_tds INTEGER DEFAULT 0,
    sacks INTEGER DEFAULT 0,
    
    -- WR stats
    receptions INTEGER DEFAULT 0,
    targets INTEGER DEFAULT 0,
    receiving_tds INTEGER DEFAULT 0,
    drops INTEGER DEFAULT 0,
    first_downs INTEGER DEFAULT 0,
    
    -- RB stats
    rushing_tds INTEGER DEFAULT 0,
    rush_attempts INTEGER DEFAULT 0,
    
    -- Defense stats
    flag_pulls INTEGER DEFAULT 0,
    interceptions INTEGER DEFAULT 0,
    pass_breakups INTEGER DEFAULT 0,
    def_td INTEGER DEFAULT 0,
    
    version INTEGER DEFAULT 1 NOT NULL,
    is_deleted BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_player_stats_id ON statstracker.player_stats(id);
CREATE INDEX IF NOT EXISTS idx_player_stats_player_id ON statstracker.player_stats(player_id);
CREATE INDEX IF NOT EXISTS idx_player_stats_game_id ON statstracker.player_stats(game_id);
`
