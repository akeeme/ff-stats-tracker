-- Flag Football Stats Tracker - Supabase PostgreSQL Schema
-- Converted from SQLite to PostgreSQL format

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create the statstracker schema
CREATE SCHEMA IF NOT EXISTS statstracker;

-- Set the search path to include the statstracker schema
SET search_path TO statstracker, public;

-- Create custom types in the statstracker schema
CREATE TYPE statstracker.team_status AS ENUM ('active', 'inactive');

CREATE TYPE statstracker.player_status AS ENUM ('active', 'inactive');

-- Table: teams
CREATE TABLE IF NOT EXISTS statstracker.teams (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    season INTEGER NOT NULL,
    league VARCHAR(255) NOT NULL,
    wins INTEGER DEFAULT 0,
    losses INTEGER DEFAULT 0,
    ties INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1, -- 1 for active, 0 for inactive
    display_name VARCHAR(255), -- Added for compatibility with Go backend
    version INTEGER NOT NULL DEFAULT 1,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP
    WITH
        TIME ZONE DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP
    WITH
        TIME ZONE DEFAULT NOW() NOT NULL,
        deleted_at TIMESTAMP
    WITH
        TIME ZONE,
        CONSTRAINT unique_team_season UNIQUE (name, season, league)
);

-- Table: players
CREATE TABLE IF NOT EXISTS statstracker.players (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    team_id INTEGER REFERENCES statstracker.teams (id) ON DELETE CASCADE,
    season INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    jersey_number VARCHAR(10),
    display_name VARCHAR(255), -- Added for compatibility with Go backend
    version INTEGER NOT NULL DEFAULT 1,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP
    WITH
        TIME ZONE DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP
    WITH
        TIME ZONE DEFAULT NOW() NOT NULL,
        deleted_at TIMESTAMP
    WITH
        TIME ZONE
);

-- Table: games
CREATE TABLE IF NOT EXISTS statstracker.games (
    id SERIAL PRIMARY KEY,
    week INTEGER NOT NULL,
    league VARCHAR(255) NOT NULL,
    season INTEGER NOT NULL,
    team1_id INTEGER REFERENCES statstracker.teams (id) ON DELETE SET NULL,
    team1_score INTEGER DEFAULT 0,
    team2_id INTEGER REFERENCES statstracker.teams (id) ON DELETE SET NULL,
    team2_score INTEGER DEFAULT 0,
    winning_team_id INTEGER REFERENCES statstracker.teams (id) ON DELETE SET NULL,
    completed BOOLEAN DEFAULT FALSE,
    version INTEGER NOT NULL DEFAULT 1,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP
    WITH
        TIME ZONE DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP
    WITH
        TIME ZONE DEFAULT NOW() NOT NULL,
        deleted_at TIMESTAMP
    WITH
        TIME ZONE
);

-- Table: player_stats
CREATE TABLE IF NOT EXISTS statstracker.player_stats (
    id SERIAL PRIMARY KEY,
    player_id INTEGER REFERENCES statstracker.players (id) ON DELETE CASCADE,
    game_id INTEGER REFERENCES statstracker.games (id) ON DELETE CASCADE,
    -- QB Stats
    passing_tds INTEGER DEFAULT 0,
    passes_completed INTEGER DEFAULT 0,
    passes_attempted INTEGER DEFAULT 0,
    interceptions_thrown INTEGER DEFAULT 0,
    qb_rushing_tds INTEGER DEFAULT 0,
    sacks INTEGER DEFAULT 0,
    -- Receiver Stats
    receptions INTEGER DEFAULT 0,
    targets INTEGER DEFAULT 0,
    receiving_tds INTEGER DEFAULT 0,
    drops INTEGER DEFAULT 0,
    first_downs INTEGER DEFAULT 0,
    -- Rushing Stats
    rushing_tds INTEGER DEFAULT 0,
    rush_attempts INTEGER DEFAULT 0,
    -- Defense Stats
    flag_pulls INTEGER DEFAULT 0,
    interceptions INTEGER DEFAULT 0,
    pass_breakups INTEGER DEFAULT 0,
    def_td INTEGER DEFAULT 0,
    version INTEGER NOT NULL DEFAULT 1,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP
    WITH
        TIME ZONE DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP
    WITH
        TIME ZONE DEFAULT NOW() NOT NULL,
        deleted_at TIMESTAMP
    WITH
        TIME ZONE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_teams_id ON statstracker.teams (id);

CREATE INDEX IF NOT EXISTS idx_teams_name ON statstracker.teams (name);

CREATE INDEX IF NOT EXISTS idx_teams_season ON statstracker.teams (season);

CREATE INDEX IF NOT EXISTS idx_teams_league ON statstracker.teams (league);

CREATE INDEX IF NOT EXISTS idx_teams_active ON statstracker.teams (is_active);

CREATE INDEX IF NOT EXISTS idx_players_id ON statstracker.players (id);

CREATE INDEX IF NOT EXISTS idx_players_name ON statstracker.players (name);

CREATE INDEX IF NOT EXISTS idx_players_season ON statstracker.players (season);

CREATE INDEX IF NOT EXISTS idx_players_team_id ON statstracker.players (team_id);

CREATE INDEX IF NOT EXISTS idx_players_active ON statstracker.players (is_active);

CREATE INDEX IF NOT EXISTS idx_games_id ON statstracker.games (id);

CREATE INDEX IF NOT EXISTS idx_games_week ON statstracker.games (week);

CREATE INDEX IF NOT EXISTS idx_games_season ON statstracker.games (season);

CREATE INDEX IF NOT EXISTS idx_games_league ON statstracker.games (league);

CREATE INDEX IF NOT EXISTS idx_games_team1_id ON statstracker.games (team1_id);

CREATE INDEX IF NOT EXISTS idx_games_team2_id ON statstracker.games (team2_id);

CREATE INDEX IF NOT EXISTS idx_player_stats_id ON statstracker.player_stats (id);

CREATE INDEX IF NOT EXISTS idx_player_stats_player_id ON statstracker.player_stats (player_id);

CREATE INDEX IF NOT EXISTS idx_player_stats_game_id ON statstracker.player_stats (game_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION statstracker.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON statstracker.teams
    FOR EACH ROW EXECUTE FUNCTION statstracker.update_updated_at_column();

CREATE TRIGGER update_players_updated_at BEFORE UPDATE ON statstracker.players
    FOR EACH ROW EXECUTE FUNCTION statstracker.update_updated_at_column();

CREATE TRIGGER update_games_updated_at BEFORE UPDATE ON statstracker.games
    FOR EACH ROW EXECUTE FUNCTION statstracker.update_updated_at_column();

CREATE TRIGGER update_player_stats_updated_at BEFORE UPDATE ON statstracker.player_stats
    FOR EACH ROW EXECUTE FUNCTION statstracker.update_updated_at_column();

-- Insert sample data (converted from SQLite)
INSERT INTO
    statstracker.teams (
        id,
        name,
        season,
        league,
        wins,
        losses,
        ties,
        is_active,
        version,
        is_deleted,
        created_at,
        updated_at,
        deleted_at
    )
VALUES (
        1,
        'MonStars',
        1,
        'ZogSports',
        5,
        0,
        0,
        0,
        2,
        FALSE,
        '2025-04-25 19:09:33.326910',
        '2025-05-13 16:10:40',
        NULL
    ),
    (
        2,
        'Bomb Squad',
        1,
        'ZogSports',
        3,
        2,
        0,
        0,
        2,
        FALSE,
        '2025-04-25 20:53:33.830774',
        '2025-05-13 16:10:42',
        NULL
    ),
    (
        3,
        'Junkyard Dogs',
        1,
        'ZogSports',
        1,
        4,
        0,
        0,
        2,
        FALSE,
        '2025-04-25 20:53:46.244671',
        '2025-05-13 16:10:44',
        NULL
    ),
    (
        4,
        'The Royal Ones',
        1,
        'ZogSports',
        5,
        0,
        0,
        0,
        2,
        FALSE,
        '2025-04-25 20:53:58.797533',
        '2025-05-13 16:10:46',
        NULL
    ),
    (
        5,
        'NYCFC',
        1,
        'ZogSports',
        4,
        1,
        0,
        0,
        2,
        FALSE,
        '2025-04-25 20:54:10.416630',
        '2025-05-13 16:10:48',
        NULL
    ),
    (
        6,
        'Rhinos',
        1,
        'ZogSports',
        3,
        2,
        0,
        0,
        2,
        FALSE,
        '2025-04-25 20:54:18.245313',
        '2025-05-13 16:10:50',
        NULL
    ),
    (
        7,
        'Touch down for what',
        1,
        'ZogSports',
        2,
        3,
        0,
        0,
        2,
        FALSE,
        '2025-04-25 20:54:27.935271',
        '2025-05-13 16:10:52',
        NULL
    ),
    (
        8,
        'Turbos',
        1,
        'ZogSports',
        1,
        4,
        0,
        0,
        2,
        FALSE,
        '2025-04-25 20:54:38.613764',
        '2025-05-13 16:10:54',
        NULL
    ),
    (
        9,
        'Beluga Barons',
        1,
        'ZogSports',
        0,
        5,
        0,
        0,
        2,
        FALSE,
        '2025-04-25 20:54:49.424042',
        '2025-05-13 16:10:56',
        NULL
    ),
    (
        10,
        'Bomb Squad',
        2,
        'ZogSports',
        2,
        4,
        0,
        1,
        2,
        FALSE,
        '2025-05-13 16:23:53.160612',
        '2025-05-13 16:44:46',
        NULL
    ),
    (
        11,
        'The Royal Ones',
        2,
        'ZogSports',
        4,
        2,
        0,
        1,
        2,
        FALSE,
        '2025-05-13 16:23:55.183843',
        '2025-05-13 16:45:36',
        NULL
    ),
    (
        12,
        'Rhinos',
        2,
        'ZogSports',
        4,
        2,
        0,
        1,
        2,
        FALSE,
        '2025-05-13 16:23:57.208838',
        '2025-05-13 16:45:52',
        NULL
    ),
    (
        13,
        'Turbos',
        2,
        'ZogSports',
        2,
        4,
        0,
        1,
        2,
        FALSE,
        '2025-05-13 16:23:59.230256',
        '2025-05-13 16:46:04',
        NULL
    );

-- Insert players data
INSERT INTO
    statstracker.players (
        id,
        name,
        team_id,
        season,
        is_active,
        jersey_number,
        version,
        is_deleted,
        created_at,
        updated_at,
        deleted_at
    )
VALUES (
        1,
        'Akeeme',
        6,
        1,
        TRUE,
        NULL,
        1,
        FALSE,
        '2025-04-25 21:04:38.209181',
        '2025-04-25 21:04:38.209181',
        NULL
    ),
    (
        2,
        'Jeremiah',
        6,
        1,
        TRUE,
        NULL,
        1,
        FALSE,
        '2025-04-25 21:07:26.351364',
        '2025-04-25 21:07:26.351364',
        NULL
    ),
    (
        3,
        'Hans',
        6,
        1,
        TRUE,
        NULL,
        1,
        FALSE,
        '2025-04-25 21:07:46.863606',
        '2025-04-25 21:07:46.863606',
        NULL
    ),
    (
        4,
        'Cedric',
        6,
        1,
        TRUE,
        NULL,
        1,
        FALSE,
        '2025-04-25 21:07:54.657235',
        '2025-04-25 21:07:54.657235',
        NULL
    ),
    (
        5,
        'Kenneth',
        6,
        1,
        TRUE,
        NULL,
        1,
        FALSE,
        '2025-04-25 21:08:01.166143',
        '2025-04-25 21:08:01.166143',
        NULL
    ),
    (
        6,
        'Dontae',
        6,
        1,
        TRUE,
        NULL,
        1,
        FALSE,
        '2025-04-25 21:08:09.521886',
        '2025-04-25 21:08:09.521886',
        NULL
    ),
    (
        7,
        'LJ',
        6,
        1,
        TRUE,
        NULL,
        1,
        FALSE,
        '2025-04-25 21:08:18.199307',
        '2025-04-25 21:08:18.199307',
        NULL
    ),
    (
        8,
        'Louis',
        6,
        1,
        TRUE,
        NULL,
        1,
        FALSE,
        '2025-04-25 21:08:28.410550',
        '2025-04-25 21:08:28.410550',
        NULL
    ),
    (
        9,
        'Johnathan',
        6,
        1,
        TRUE,
        NULL,
        1,
        FALSE,
        '2025-04-25 21:08:40.031086',
        '2025-04-25 21:08:40.031086',
        NULL
    ),
    (
        10,
        'Noah',
        6,
        1,
        TRUE,
        NULL,
        1,
        FALSE,
        '2025-04-25 21:08:46.995641',
        '2025-04-25 21:08:46.995641',
        NULL
    ),
    (
        11,
        'Akeeme',
        6,
        2,
        TRUE,
        NULL,
        1,
        FALSE,
        '2025-05-13 16:27:33.174445',
        '2025-05-13 16:27:33.174445',
        NULL
    ),
    (
        12,
        'Jeremiah',
        6,
        2,
        TRUE,
        NULL,
        1,
        FALSE,
        '2025-05-13 16:27:35.199924',
        '2025-05-13 16:27:35.199924',
        NULL
    ),
    (
        13,
        'Hans',
        6,
        2,
        TRUE,
        NULL,
        1,
        FALSE,
        '2025-05-13 16:27:37.234752',
        '2025-05-13 16:27:37.234752',
        NULL
    ),
    (
        14,
        'Cedric',
        6,
        2,
        TRUE,
        NULL,
        1,
        FALSE,
        '2025-05-13 16:27:39.269770',
        '2025-05-13 16:27:39.269770',
        NULL
    ),
    (
        15,
        'Dontae',
        6,
        2,
        TRUE,
        NULL,
        1,
        FALSE,
        '2025-05-13 16:27:41.303449',
        '2025-05-13 16:27:41.303449',
        NULL
    ),
    (
        16,
        'LJ',
        6,
        2,
        TRUE,
        NULL,
        1,
        FALSE,
        '2025-05-13 16:27:43.340991',
        '2025-05-13 16:27:43.340991',
        NULL
    ),
    (
        17,
        'Louis',
        6,
        2,
        TRUE,
        NULL,
        1,
        FALSE,
        '2025-05-13 16:27:45.371497',
        '2025-05-13 16:27:45.371497',
        NULL
    ),
    (
        18,
        'Johnathan',
        6,
        2,
        TRUE,
        NULL,
        1,
        FALSE,
        '2025-05-13 16:27:47.397946',
        '2025-05-13 16:27:47.397946',
        NULL
    ),
    (
        19,
        'Noah',
        6,
        2,
        TRUE,
        NULL,
        1,
        FALSE,
        '2025-05-13 16:27:49.425968',
        '2025-05-13 16:27:49.425968',
        NULL
    ),
    (
        20,
        'Andre',
        6,
        2,
        TRUE,
        NULL,
        1,
        FALSE,
        '2025-05-13 16:41:50.291073',
        '2025-05-13 16:41:50.291073',
        NULL
    );

-- Insert games data
INSERT INTO
    statstracker.games (
        id,
        week,
        league,
        season,
        team1_id,
        team1_score,
        team2_id,
        team2_score,
        winning_team_id,
        version,
        is_deleted,
        created_at,
        updated_at,
        deleted_at,
        completed
    )
VALUES (
        1,
        1,
        'ZogSports',
        1,
        6,
        20,
        4,
        69,
        4,
        1,
        FALSE,
        '2025-04-25 21:12:18',
        '2025-05-11 02:33:51',
        NULL,
        TRUE
    ),
    (
        2,
        2,
        'ZogSports',
        1,
        6,
        20,
        5,
        44,
        5,
        1,
        FALSE,
        '2025-04-25 21:16:21',
        '2025-04-25 21:16:21',
        NULL,
        FALSE
    ),
    (
        3,
        3,
        'ZogSports',
        1,
        6,
        53,
        7,
        47,
        6,
        1,
        FALSE,
        '2025-04-25 21:17:32',
        '2025-05-11 04:10:17',
        NULL,
        TRUE
    ),
    (
        4,
        4,
        'ZogSports',
        1,
        6,
        52,
        8,
        24,
        6,
        1,
        FALSE,
        '2025-04-25 21:18:37',
        '2025-05-11 05:06:19',
        NULL,
        TRUE
    ),
    (
        5,
        5,
        'ZogSports',
        1,
        6,
        34,
        9,
        27,
        6,
        1,
        FALSE,
        '2025-04-25 21:19:15',
        '2025-05-11 05:36:59',
        NULL,
        TRUE
    ),
    (
        6,
        6,
        'ZogSports',
        1,
        6,
        36,
        5,
        20,
        6,
        1,
        FALSE,
        '2025-05-12 03:54:29',
        '2025-05-12 21:36:17',
        NULL,
        TRUE
    ),
    (
        7,
        7,
        'ZogSports',
        1,
        6,
        22,
        4,
        34,
        4,
        1,
        FALSE,
        '2025-05-12 03:56:52',
        '2025-05-13 04:19:23',
        NULL,
        TRUE
    ),
    (
        8,
        1,
        'ZogSports',
        2,
        6,
        52,
        4,
        38,
        6,
        1,
        FALSE,
        '2025-05-13 16:50:17',
        '2025-05-13 17:57:41',
        NULL,
        TRUE
    ),
    (
        9,
        2,
        'ZogSports',
        2,
        6,
        33,
        8,
        36,
        8,
        1,
        FALSE,
        '2025-05-13 16:52:18',
        '2025-05-16 19:33:40',
        NULL,
        TRUE
    ),
    (
        10,
        3,
        'ZogSports',
        2,
        6,
        50,
        2,
        40,
        6,
        1,
        FALSE,
        '2025-05-13 16:57:09',
        '2025-05-13 16:57:09',
        NULL,
        FALSE
    ),
    (
        11,
        4,
        'ZogSports',
        2,
        6,
        54,
        4,
        20,
        6,
        1,
        FALSE,
        '2025-05-13 16:57:35',
        '2025-05-13 16:57:35',
        NULL,
        FALSE
    ),
    (
        12,
        5,
        'ZogSports',
        2,
        6,
        40,
        8,
        24,
        6,
        1,
        FALSE,
        '2025-05-13 16:57:57',
        '2025-05-13 16:57:57',
        NULL,
        FALSE
    ),
    (
        13,
        6,
        'ZogSports',
        2,
        6,
        44,
        2,
        45,
        2,
        1,
        FALSE,
        '2025-05-13 16:58:28',
        '2025-05-13 16:58:28',
        NULL,
        FALSE
    );

-- Insert player_stats data (first 10 records as example)
INSERT INTO
    statstracker.player_stats (
        id,
        player_id,
        game_id,
        passing_tds,
        passes_completed,
        passes_attempted,
        interceptions_thrown,
        receptions,
        targets,
        receiving_tds,
        drops,
        first_downs,
        rushing_tds,
        rush_attempts,
        flag_pulls,
        interceptions,
        pass_breakups,
        def_td,
        version,
        is_deleted,
        created_at,
        updated_at,
        deleted_at,
        sacks,
        qb_rushing_tds
    )
VALUES (
        1,
        1,
        1,
        2,
        11,
        26,
        3,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        3,
        0,
        0,
        0,
        39,
        FALSE,
        '2025-05-11 00:55:29',
        '2025-05-11 01:59:12',
        NULL,
        0,
        0
    ),
    (
        2,
        6,
        1,
        0,
        0,
        0,
        0,
        3,
        8,
        0,
        1,
        2,
        0,
        0,
        1,
        0,
        0,
        0,
        9,
        FALSE,
        '2025-05-11 00:56:06',
        '2025-05-11 02:32:45',
        NULL,
        0,
        0
    ),
    (
        3,
        7,
        1,
        0,
        0,
        0,
        0,
        3,
        7,
        0,
        1,
        0,
        0,
        0,
        1,
        0,
        1,
        0,
        10,
        FALSE,
        '2025-05-11 00:56:17',
        '2025-05-11 01:45:53',
        NULL,
        0,
        0
    ),
    (
        4,
        5,
        1,
        0,
        0,
        0,
        0,
        2,
        3,
        0,
        0,
        1,
        0,
        1,
        1,
        0,
        0,
        0,
        7,
        FALSE,
        '2025-05-11 00:57:42',
        '2025-05-11 02:33:27',
        NULL,
        0,
        0
    ),
    (
        5,
        9,
        1,
        0,
        0,
        0,
        0,
        1,
        1,
        1,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        1,
        FALSE,
        '2025-05-11 00:59:24',
        '2025-05-11 00:59:24',
        NULL,
        0,
        0
    ),
    (
        6,
        10,
        1,
        0,
        0,
        0,
        0,
        0,
        4,
        0,
        0,
        0,
        0,
        0,
        0,
        1,
        0,
        1,
        7,
        FALSE,
        '2025-05-11 01:02:31',
        '2025-05-11 01:51:05',
        NULL,
        2,
        0
    ),
    (
        7,
        8,
        1,
        0,
        0,
        0,
        0,
        2,
        5,
        1,
        1,
        1,
        0,
        0,
        2,
        0,
        0,
        0,
        8,
        FALSE,
        '2025-05-11 01:07:59',
        '2025-05-11 02:31:47',
        NULL,
        0,
        0
    ),
    (
        8,
        3,
        3,
        0,
        0,
        0,
        0,
        4,
        5,
        2,
        0,
        2,
        0,
        4,
        2,
        2,
        3,
        1,
        18,
        FALSE,
        '2025-05-11 03:16:14',
        '2025-05-11 04:07:47',
        NULL,
        0,
        0
    ),
    (
        9,
        7,
        3,
        4,
        11,
        18,
        0,
        1,
        4,
        0,
        1,
        1,
        0,
        0,
        4,
        0,
        0,
        0,
        31,
        FALSE,
        '2025-05-11 03:16:47',
        '2025-05-11 04:09:43',
        NULL,
        0,
        0
    ),
    (
        10,
        1,
        3,
        3,
        6,
        11,
        1,
        5,
        6,
        0,
        1,
        3,
        0,
        0,
        2,
        0,
        2,
        0,
        25,
        FALSE,
        '2025-05-11 03:17:02',
        '2025-05-11 04:08:42',
        NULL,
        0,
        0
    );

-- Reset sequences to match the inserted data
SELECT setval (
        'statstracker.teams_id_seq', (
            SELECT MAX(id)
            FROM statstracker.teams
        )
    );

SELECT setval (
        'statstracker.players_id_seq', (
            SELECT MAX(id)
            FROM statstracker.players
        )
    );

SELECT setval (
        'statstracker.games_id_seq', (
            SELECT MAX(id)
            FROM statstracker.games
        )
    );

SELECT setval (
        'statstracker.player_stats_id_seq', (
            SELECT MAX(id)
            FROM statstracker.player_stats
        )
    );

-- Create views for easier querying
CREATE OR REPLACE VIEW statstracker.active_teams AS
SELECT *
FROM statstracker.teams
WHERE
    is_active = 1
    AND is_deleted = FALSE;

CREATE OR REPLACE VIEW statstracker.active_players AS
SELECT *
FROM statstracker.players
WHERE
    is_active = TRUE
    AND is_deleted = FALSE;

CREATE OR REPLACE VIEW statstracker.active_games AS
SELECT *
FROM statstracker.games
WHERE
    is_deleted = FALSE;

CREATE OR REPLACE VIEW statstracker.active_player_stats AS
SELECT *
FROM statstracker.player_stats
WHERE
    is_deleted = FALSE;

-- Create a view for team standings
CREATE OR REPLACE VIEW statstracker.team_standings AS
SELECT 
    t.id,
    t.name,
    t.season,
    t.league,
    t.wins,
    t.losses,
    t.ties,
    (t.wins + t.losses + t.ties) as games_played,
    CASE 
        WHEN (t.wins + t.losses + t.ties) = 0 THEN 0
        ELSE ROUND((t.wins + 0.5 * t.ties)::DECIMAL / (t.wins + t.losses + t.ties), 3)
    END as win_percentage
FROM statstracker.teams t
WHERE t.is_active = 1 AND t.is_deleted = FALSE
ORDER BY win_percentage DESC, t.wins DESC, t.losses ASC, t.ties DESC;

-- Grant necessary permissions for Supabase
GRANT USAGE ON SCHEMA statstracker TO postgres,
anon,
authenticated,
service_role;

GRANT ALL ON ALL TABLES IN SCHEMA statstracker TO postgres,
anon,
authenticated,
service_role;

GRANT ALL ON ALL SEQUENCES IN SCHEMA statstracker TO postgres,
anon,
authenticated,
service_role;

GRANT ALL ON ALL FUNCTIONS IN SCHEMA statstracker TO postgres,
anon,
authenticated,
service_role;

-- Grant permissions on views
GRANT
SELECT
    ON statstracker.active_teams TO postgres,
    anon,
    authenticated,
    service_role;

GRANT
SELECT
    ON statstracker.active_players TO postgres,
    anon,
    authenticated,
    service_role;

GRANT
SELECT
    ON statstracker.active_games TO postgres,
    anon,
    authenticated,
    service_role;

GRANT
SELECT
    ON statstracker.active_player_stats TO postgres,
    anon,
    authenticated,
    service_role;

GRANT
SELECT
    ON statstracker.team_standings TO postgres,
    anon,
    authenticated,
    service_role;