--
-- File generated with SQLiteStudio v3.4.17 on Fri Sep 19 23:54:55 2025
--
-- Text encoding used: UTF-8
--
PRAGMA foreign_keys = off;
BEGIN TRANSACTION;

-- Table: games
CREATE TABLE IF NOT EXISTS games (
	id INTEGER NOT NULL, 
	week INTEGER, 
	league VARCHAR, 
	season INTEGER, 
	team1_id INTEGER, 
	team1_score INTEGER, 
	team2_id INTEGER, 
	team2_score INTEGER, 
	winning_team_id INTEGER, 
	version INTEGER NOT NULL, 
	is_deleted BOOLEAN NOT NULL, 
	created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL, 
	updated_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL, 
	deleted_at DATETIME, completed BOOLEAN DEFAULT 0, 
	PRIMARY KEY (id), 
	FOREIGN KEY(team1_id) REFERENCES teams (id) ON DELETE SET NULL, 
	FOREIGN KEY(team2_id) REFERENCES teams (id) ON DELETE SET NULL, 
	FOREIGN KEY(winning_team_id) REFERENCES teams (id) ON DELETE SET NULL
);
INSERT INTO games (id, week, league, season, team1_id, team1_score, team2_id, team2_score, winning_team_id, version, is_deleted, created_at, updated_at, deleted_at, completed) VALUES (1, 1, 'ZogSports', 1, 6, 20, 4, 69, 4, 1, 0, '2025-04-25 21:12:18', '2025-05-11 02:33:51', NULL, 1);
INSERT INTO games (id, week, league, season, team1_id, team1_score, team2_id, team2_score, winning_team_id, version, is_deleted, created_at, updated_at, deleted_at, completed) VALUES (2, 2, 'ZogSports', 1, 6, 20, 5, 44, 5, 1, 0, '2025-04-25 21:16:21', '2025-04-25 21:16:21', NULL, 0);
INSERT INTO games (id, week, league, season, team1_id, team1_score, team2_id, team2_score, winning_team_id, version, is_deleted, created_at, updated_at, deleted_at, completed) VALUES (3, 3, 'ZogSports', 1, 6, 53, 7, 47, 6, 1, 0, '2025-04-25 21:17:32', '2025-05-11 04:10:17', NULL, 1);
INSERT INTO games (id, week, league, season, team1_id, team1_score, team2_id, team2_score, winning_team_id, version, is_deleted, created_at, updated_at, deleted_at, completed) VALUES (4, 4, 'ZogSports', 1, 6, 52, 8, 24, 6, 1, 0, '2025-04-25 21:18:37', '2025-05-11 05:06:19', NULL, 1);
INSERT INTO games (id, week, league, season, team1_id, team1_score, team2_id, team2_score, winning_team_id, version, is_deleted, created_at, updated_at, deleted_at, completed) VALUES (5, 5, 'ZogSports', 1, 6, 34, 9, 27, 6, 1, 0, '2025-04-25 21:19:15', '2025-05-11 05:36:59', NULL, 1);
INSERT INTO games (id, week, league, season, team1_id, team1_score, team2_id, team2_score, winning_team_id, version, is_deleted, created_at, updated_at, deleted_at, completed) VALUES (6, 6, 'ZogSports', 1, 6, 36, 5, 20, 6, 1, 0, '2025-05-12 03:54:29', '2025-05-12 21:36:17', NULL, 1);
INSERT INTO games (id, week, league, season, team1_id, team1_score, team2_id, team2_score, winning_team_id, version, is_deleted, created_at, updated_at, deleted_at, completed) VALUES (7, 7, 'ZogSports', 1, 6, 22, 4, 34, 4, 1, 0, '2025-05-12 03:56:52', '2025-05-13 04:19:23', NULL, 1);
INSERT INTO games (id, week, league, season, team1_id, team1_score, team2_id, team2_score, winning_team_id, version, is_deleted, created_at, updated_at, deleted_at, completed) VALUES (8, 1, 'ZogSports', 2, 6, 52, 4, 38, 6, 1, 0, '2025-05-13 16:50:17', '2025-05-13 17:57:41', NULL, 1);
INSERT INTO games (id, week, league, season, team1_id, team1_score, team2_id, team2_score, winning_team_id, version, is_deleted, created_at, updated_at, deleted_at, completed) VALUES (9, 2, 'ZogSports', 2, 6, 33, 8, 36, 8, 1, 0, '2025-05-13 16:52:18', '2025-05-16 19:33:40', NULL, 1);
INSERT INTO games (id, week, league, season, team1_id, team1_score, team2_id, team2_score, winning_team_id, version, is_deleted, created_at, updated_at, deleted_at, completed) VALUES (10, 3, 'ZogSports', 2, 6, 50, 2, 40, 6, 1, 0, '2025-05-13 16:57:09', '2025-05-13 16:57:09', NULL, 0);
INSERT INTO games (id, week, league, season, team1_id, team1_score, team2_id, team2_score, winning_team_id, version, is_deleted, created_at, updated_at, deleted_at, completed) VALUES (11, 4, 'ZogSports', 2, 6, 54, 4, 20, 6, 1, 0, '2025-05-13 16:57:35', '2025-05-13 16:57:35', NULL, 0);
INSERT INTO games (id, week, league, season, team1_id, team1_score, team2_id, team2_score, winning_team_id, version, is_deleted, created_at, updated_at, deleted_at, completed) VALUES (12, 5, 'ZogSports', 2, 6, 40, 8, 24, 6, 1, 0, '2025-05-13 16:57:57', '2025-05-13 16:57:57', NULL, 0);
INSERT INTO games (id, week, league, season, team1_id, team1_score, team2_id, team2_score, winning_team_id, version, is_deleted, created_at, updated_at, deleted_at, completed) VALUES (13, 6, 'ZogSports', 2, 6, 44, 2, 45, 2, 1, 0, '2025-05-13 16:58:28', '2025-05-13 16:58:28', NULL, 0);

-- Table: player_stats
CREATE TABLE IF NOT EXISTS player_stats (
	id INTEGER NOT NULL, 
	player_id INTEGER, 
	game_id INTEGER, 
	passing_tds INTEGER, 
	passes_completed INTEGER, 
	passes_attempted INTEGER, 
	interceptions_thrown INTEGER, 
	receptions INTEGER, 
	targets INTEGER, 
	receiving_tds INTEGER, 
	drops INTEGER, 
	first_downs INTEGER, 
	rushing_tds INTEGER, 
	rush_attempts INTEGER, 
	flag_pulls INTEGER, 
	interceptions INTEGER, 
	pass_breakups INTEGER, 
	def_td INTEGER, 
	version INTEGER NOT NULL, 
	is_deleted BOOLEAN NOT NULL, 
	created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL, 
	updated_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL, 
	deleted_at DATETIME, sacks INTEGER DEFAULT 0, qb_rushing_tds INTEGER DEFAULT 0, 
	PRIMARY KEY (id), 
	FOREIGN KEY(player_id) REFERENCES players (id) ON DELETE CASCADE, 
	FOREIGN KEY(game_id) REFERENCES games (id) ON DELETE CASCADE
);
INSERT INTO player_stats (id, player_id, game_id, passing_tds, passes_completed, passes_attempted, interceptions_thrown, receptions, targets, receiving_tds, drops, first_downs, rushing_tds, rush_attempts, flag_pulls, interceptions, pass_breakups, def_td, version, is_deleted, created_at, updated_at, deleted_at, sacks, qb_rushing_tds) VALUES (1, 1, 1, 2, 11, 26, 3, 0, 0, 0, 0, 0, 0, 0, 3, 0, 0, 0, 39, 0, '2025-05-11 00:55:29', '2025-05-11 01:59:12', NULL, 0, 0);
INSERT INTO player_stats (id, player_id, game_id, passing_tds, passes_completed, passes_attempted, interceptions_thrown, receptions, targets, receiving_tds, drops, first_downs, rushing_tds, rush_attempts, flag_pulls, interceptions, pass_breakups, def_td, version, is_deleted, created_at, updated_at, deleted_at, sacks, qb_rushing_tds) VALUES (2, 6, 1, 0, 0, 0, 0, 3, 8, 0, 1, 2, 0, 0, 1, 0, 0, 0, 9, 0, '2025-05-11 00:56:06', '2025-05-11 02:32:45', NULL, 0, 0);
INSERT INTO player_stats (id, player_id, game_id, passing_tds, passes_completed, passes_attempted, interceptions_thrown, receptions, targets, receiving_tds, drops, first_downs, rushing_tds, rush_attempts, flag_pulls, interceptions, pass_breakups, def_td, version, is_deleted, created_at, updated_at, deleted_at, sacks, qb_rushing_tds) VALUES (3, 7, 1, 0, 0, 0, 0, 3, 7, 0, 1, 0, 0, 0, 1, 0, 1, 0, 10, 0, '2025-05-11 00:56:17', '2025-05-11 01:45:53', NULL, 0, 0);
INSERT INTO player_stats (id, player_id, game_id, passing_tds, passes_completed, passes_attempted, interceptions_thrown, receptions, targets, receiving_tds, drops, first_downs, rushing_tds, rush_attempts, flag_pulls, interceptions, pass_breakups, def_td, version, is_deleted, created_at, updated_at, deleted_at, sacks, qb_rushing_tds) VALUES (4, 5, 1, 0, 0, 0, 0, 2, 3, 0, 0, 1, 0, 1, 1, 0, 0, 0, 7, 0, '2025-05-11 00:57:42', '2025-05-11 02:33:27', NULL, 0, 0);
INSERT INTO player_stats (id, player_id, game_id, passing_tds, passes_completed, passes_attempted, interceptions_thrown, receptions, targets, receiving_tds, drops, first_downs, rushing_tds, rush_attempts, flag_pulls, interceptions, pass_breakups, def_td, version, is_deleted, created_at, updated_at, deleted_at, sacks, qb_rushing_tds) VALUES (5, 9, 1, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, '2025-05-11 00:59:24', '2025-05-11 00:59:24', NULL, 0, 0);
INSERT INTO player_stats (id, player_id, game_id, passing_tds, passes_completed, passes_attempted, interceptions_thrown, receptions, targets, receiving_tds, drops, first_downs, rushing_tds, rush_attempts, flag_pulls, interceptions, pass_breakups, def_td, version, is_deleted, created_at, updated_at, deleted_at, sacks, qb_rushing_tds) VALUES (6, 10, 1, 0, 0, 0, 0, 0, 4, 0, 0, 0, 0, 0, 0, 1, 0, 1, 7, 0, '2025-05-11 01:02:31', '2025-05-11 01:51:05', NULL, 2, 0);
INSERT INTO player_stats (id, player_id, game_id, passing_tds, passes_completed, passes_attempted, interceptions_thrown, receptions, targets, receiving_tds, drops, first_downs, rushing_tds, rush_attempts, flag_pulls, interceptions, pass_breakups, def_td, version, is_deleted, created_at, updated_at, deleted_at, sacks, qb_rushing_tds) VALUES (7, 8, 1, 0, 0, 0, 0, 2, 5, 1, 1, 1, 0, 0, 2, 0, 0, 0, 8, 0, '2025-05-11 01:07:59', '2025-05-11 02:31:47', NULL, 0, 0);
INSERT INTO player_stats (id, player_id, game_id, passing_tds, passes_completed, passes_attempted, interceptions_thrown, receptions, targets, receiving_tds, drops, first_downs, rushing_tds, rush_attempts, flag_pulls, interceptions, pass_breakups, def_td, version, is_deleted, created_at, updated_at, deleted_at, sacks, qb_rushing_tds) VALUES (8, 3, 3, 0, 0, 0, 0, 4, 5, 2, 0, 2, 0, 4, 2, 2, 3, 1, 18, 0, '2025-05-11 03:16:14', '2025-05-11 04:07:47', NULL, 0, 0);
INSERT INTO player_stats (id, player_id, game_id, passing_tds, passes_completed, passes_attempted, interceptions_thrown, receptions, targets, receiving_tds, drops, first_downs, rushing_tds, rush_attempts, flag_pulls, interceptions, pass_breakups, def_td, version, is_deleted, created_at, updated_at, deleted_at, sacks, qb_rushing_tds) VALUES (9, 7, 3, 4, 11, 18, 0, 1, 4, 0, 1, 1, 0, 0, 4, 0, 0, 0, 31, 0, '2025-05-11 03:16:47', '2025-05-11 04:09:43', NULL, 0, 0);
INSERT INTO player_stats (id, player_id, game_id, passing_tds, passes_completed, passes_attempted, interceptions_thrown, receptions, targets, receiving_tds, drops, first_downs, rushing_tds, rush_attempts, flag_pulls, interceptions, pass_breakups, def_td, version, is_deleted, created_at, updated_at, deleted_at, sacks, qb_rushing_tds) VALUES (10, 1, 3, 3, 6, 11, 1, 5, 6, 0, 1, 3, 0, 0, 2, 0, 2, 0, 25, 0, '2025-05-11 03:17:02', '2025-05-11 04:08:42', NULL, 0, 0);
INSERT INTO player_stats (id, player_id, game_id, passing_tds, passes_completed, passes_attempted, interceptions_thrown, receptions, targets, receiving_tds, drops, first_downs, rushing_tds, rush_attempts, flag_pulls, interceptions, pass_breakups, def_td, version, is_deleted, created_at, updated_at, deleted_at, sacks, qb_rushing_tds) VALUES (11, 8, 3, 0, 0, 0, 0, 4, 7, 4, 0, 0, 0, 0, 2, 0, 0, 0, 10, 0, '2025-05-11 03:19:31', '2025-05-11 04:09:25', NULL, 0, 0);
INSERT INTO player_stats (id, player_id, game_id, passing_tds, passes_completed, passes_attempted, interceptions_thrown, receptions, targets, receiving_tds, drops, first_downs, rushing_tds, rush_attempts, flag_pulls, interceptions, pass_breakups, def_td, version, is_deleted, created_at, updated_at, deleted_at, sacks, qb_rushing_tds) VALUES (12, 6, 3, 0, 0, 0, 0, 1, 3, 1, 0, 0, 0, 0, 0, 0, 1, 0, 5, 0, '2025-05-11 03:29:47', '2025-05-11 04:07:12', NULL, 0, 0);
INSERT INTO player_stats (id, player_id, game_id, passing_tds, passes_completed, passes_attempted, interceptions_thrown, receptions, targets, receiving_tds, drops, first_downs, rushing_tds, rush_attempts, flag_pulls, interceptions, pass_breakups, def_td, version, is_deleted, created_at, updated_at, deleted_at, sacks, qb_rushing_tds) VALUES (13, 10, 3, 0, 0, 0, 0, 2, 2, 0, 0, 1, 0, 0, 0, 0, 1, 0, 3, 0, '2025-05-11 03:35:25', '2025-05-11 04:02:31', NULL, 0, 0);
INSERT INTO player_stats (id, player_id, game_id, passing_tds, passes_completed, passes_attempted, interceptions_thrown, receptions, targets, receiving_tds, drops, first_downs, rushing_tds, rush_attempts, flag_pulls, interceptions, pass_breakups, def_td, version, is_deleted, created_at, updated_at, deleted_at, sacks, qb_rushing_tds) VALUES (14, 2, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 2, 0, 4, 0, '2025-05-11 03:37:47', '2025-05-11 04:02:53', NULL, 0, 0);
INSERT INTO player_stats (id, player_id, game_id, passing_tds, passes_completed, passes_attempted, interceptions_thrown, receptions, targets, receiving_tds, drops, first_downs, rushing_tds, rush_attempts, flag_pulls, interceptions, pass_breakups, def_td, version, is_deleted, created_at, updated_at, deleted_at, sacks, qb_rushing_tds) VALUES (15, 9, 3, 0, 0, 0, 0, 2, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 0, '2025-05-11 03:58:57', '2025-05-11 04:09:50', NULL, 0, 0);
INSERT INTO player_stats (id, player_id, game_id, passing_tds, passes_completed, passes_attempted, interceptions_thrown, receptions, targets, receiving_tds, drops, first_downs, rushing_tds, rush_attempts, flag_pulls, interceptions, pass_breakups, def_td, version, is_deleted, created_at, updated_at, deleted_at, sacks, qb_rushing_tds) VALUES (16, 3, 4, 0, 0, 0, 0, 6, 8, 2, 1, 2, 2, 6, 1, 2, 0, 0, 17, 0, '2025-05-11 04:19:28', '2025-05-11 05:05:09', NULL, 0, 0);
INSERT INTO player_stats (id, player_id, game_id, passing_tds, passes_completed, passes_attempted, interceptions_thrown, receptions, targets, receiving_tds, drops, first_downs, rushing_tds, rush_attempts, flag_pulls, interceptions, pass_breakups, def_td, version, is_deleted, created_at, updated_at, deleted_at, sacks, qb_rushing_tds) VALUES (17, 1, 4, 3, 15, 31, 1, 0, 0, 0, 0, 0, 0, 0, 3, 1, 1, 0, 47, 0, '2025-05-11 04:23:10', '2025-05-11 05:06:03', NULL, 0, 2);
INSERT INTO player_stats (id, player_id, game_id, passing_tds, passes_completed, passes_attempted, interceptions_thrown, receptions, targets, receiving_tds, drops, first_downs, rushing_tds, rush_attempts, flag_pulls, interceptions, pass_breakups, def_td, version, is_deleted, created_at, updated_at, deleted_at, sacks, qb_rushing_tds) VALUES (18, 8, 4, 0, 0, 0, 0, 4, 8, 0, 2, 2, 0, 0, 1, 0, 1, 0, 11, 0, '2025-05-11 04:23:21', '2025-05-11 05:05:37', NULL, 0, 0);
INSERT INTO player_stats (id, player_id, game_id, passing_tds, passes_completed, passes_attempted, interceptions_thrown, receptions, targets, receiving_tds, drops, first_downs, rushing_tds, rush_attempts, flag_pulls, interceptions, pass_breakups, def_td, version, is_deleted, created_at, updated_at, deleted_at, sacks, qb_rushing_tds) VALUES (19, 2, 4, 0, 0, 0, 0, 3, 10, 0, 2, 2, 0, 2, 3, 0, 1, 0, 17, 0, '2025-05-11 04:41:59', '2025-05-11 05:02:51', NULL, 0, 0);
INSERT INTO player_stats (id, player_id, game_id, passing_tds, passes_completed, passes_attempted, interceptions_thrown, receptions, targets, receiving_tds, drops, first_downs, rushing_tds, rush_attempts, flag_pulls, interceptions, pass_breakups, def_td, version, is_deleted, created_at, updated_at, deleted_at, sacks, qb_rushing_tds) VALUES (20, 9, 4, 0, 0, 0, 0, 0, 2, 0, 0, 0, 1, 1, 1, 0, 0, 0, 4, 0, '2025-05-11 04:43:04', '2025-05-11 05:04:15', NULL, 0, 0);
INSERT INTO player_stats (id, player_id, game_id, passing_tds, passes_completed, passes_attempted, interceptions_thrown, receptions, targets, receiving_tds, drops, first_downs, rushing_tds, rush_attempts, flag_pulls, interceptions, pass_breakups, def_td, version, is_deleted, created_at, updated_at, deleted_at, sacks, qb_rushing_tds) VALUES (21, 7, 4, 0, 0, 3, 0, 2, 4, 1, 1, 0, 0, 0, 2, 0, 0, 0, 9, 0, '2025-05-11 04:47:14', '2025-05-11 05:01:49', NULL, 0, 0);
INSERT INTO player_stats (id, player_id, game_id, passing_tds, passes_completed, passes_attempted, interceptions_thrown, receptions, targets, receiving_tds, drops, first_downs, rushing_tds, rush_attempts, flag_pulls, interceptions, pass_breakups, def_td, version, is_deleted, created_at, updated_at, deleted_at, sacks, qb_rushing_tds) VALUES (22, 6, 4, 0, 0, 0, 0, 0, 2, 0, 1, 0, 0, 0, 0, 0, 0, 0, 2, 0, '2025-05-11 04:49:10', '2025-05-11 05:00:23', NULL, 0, 0);
INSERT INTO player_stats (id, player_id, game_id, passing_tds, passes_completed, passes_attempted, interceptions_thrown, receptions, targets, receiving_tds, drops, first_downs, rushing_tds, rush_attempts, flag_pulls, interceptions, pass_breakups, def_td, version, is_deleted, created_at, updated_at, deleted_at, sacks, qb_rushing_tds) VALUES (23, 8, 5, 0, 0, 0, 0, 6, 9, 1, 1, 2, 0, 0, 4, 1, 1, 0, 16, 0, '2025-05-11 05:11:02', '2025-05-11 05:36:40', NULL, 0, 0);
INSERT INTO player_stats (id, player_id, game_id, passing_tds, passes_completed, passes_attempted, interceptions_thrown, receptions, targets, receiving_tds, drops, first_downs, rushing_tds, rush_attempts, flag_pulls, interceptions, pass_breakups, def_td, version, is_deleted, created_at, updated_at, deleted_at, sacks, qb_rushing_tds) VALUES (24, 1, 5, 4, 18, 26, 1, 1, 1, 0, 0, 0, 0, 0, 0, 1, 2, 0, 35, 0, '2025-05-11 05:11:32', '2025-05-11 05:36:32', NULL, 0, 0);
INSERT INTO player_stats (id, player_id, game_id, passing_tds, passes_completed, passes_attempted, interceptions_thrown, receptions, targets, receiving_tds, drops, first_downs, rushing_tds, rush_attempts, flag_pulls, interceptions, pass_breakups, def_td, version, is_deleted, created_at, updated_at, deleted_at, sacks, qb_rushing_tds) VALUES (25, 7, 5, 0, 0, 0, 0, 5, 7, 1, 0, 1, 0, 1, 2, 0, 3, 0, 13, 0, '2025-05-11 05:12:00', '2025-05-11 05:36:20', NULL, 0, 0);
INSERT INTO player_stats (id, player_id, game_id, passing_tds, passes_completed, passes_attempted, interceptions_thrown, receptions, targets, receiving_tds, drops, first_downs, rushing_tds, rush_attempts, flag_pulls, interceptions, pass_breakups, def_td, version, is_deleted, created_at, updated_at, deleted_at, sacks, qb_rushing_tds) VALUES (26, 2, 5, 0, 0, 0, 0, 2, 4, 1, 1, 3, 0, 7, 2, 1, 2, 0, 17, 0, '2025-05-11 05:12:29', '2025-05-11 05:36:08', NULL, 0, 0);
INSERT INTO player_stats (id, player_id, game_id, passing_tds, passes_completed, passes_attempted, interceptions_thrown, receptions, targets, receiving_tds, drops, first_downs, rushing_tds, rush_attempts, flag_pulls, interceptions, pass_breakups, def_td, version, is_deleted, created_at, updated_at, deleted_at, sacks, qb_rushing_tds) VALUES (27, 6, 5, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 1, 0, 0, 0, 0, 2, 0, '2025-05-11 05:13:00', '2025-05-11 05:17:50', NULL, 0, 0);
INSERT INTO player_stats (id, player_id, game_id, passing_tds, passes_completed, passes_attempted, interceptions_thrown, receptions, targets, receiving_tds, drops, first_downs, rushing_tds, rush_attempts, flag_pulls, interceptions, pass_breakups, def_td, version, is_deleted, created_at, updated_at, deleted_at, sacks, qb_rushing_tds) VALUES (28, 10, 5, 0, 0, 0, 0, 2, 3, 1, 0, 0, 0, 0, 0, 0, 0, 0, 3, 0, '2025-05-11 05:18:36', '2025-05-11 05:28:43', NULL, 0, 0);
INSERT INTO player_stats (id, player_id, game_id, passing_tds, passes_completed, passes_attempted, interceptions_thrown, receptions, targets, receiving_tds, drops, first_downs, rushing_tds, rush_attempts, flag_pulls, interceptions, pass_breakups, def_td, version, is_deleted, created_at, updated_at, deleted_at, sacks, qb_rushing_tds) VALUES (29, 9, 5, 0, 0, 0, 0, 2, 3, 0, 0, 0, 0, 0, 0, 0, 1, 0, 4, 0, '2025-05-11 05:20:29', '2025-05-11 05:29:50', NULL, 0, 0);
INSERT INTO player_stats (id, player_id, game_id, passing_tds, passes_completed, passes_attempted, interceptions_thrown, receptions, targets, receiving_tds, drops, first_downs, rushing_tds, rush_attempts, flag_pulls, interceptions, pass_breakups, def_td, version, is_deleted, created_at, updated_at, deleted_at, sacks, qb_rushing_tds) VALUES (30, 4, 5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 2, 0, '2025-05-11 05:20:48', '2025-05-11 05:21:26', NULL, 1, 0);
INSERT INTO player_stats (id, player_id, game_id, passing_tds, passes_completed, passes_attempted, interceptions_thrown, receptions, targets, receiving_tds, drops, first_downs, rushing_tds, rush_attempts, flag_pulls, interceptions, pass_breakups, def_td, version, is_deleted, created_at, updated_at, deleted_at, sacks, qb_rushing_tds) VALUES (31, 3, 6, 0, 0, 0, 0, 1, 4, 0, 0, 1, 0, 4, 2, 1, 5, 0, 16, 0, '2025-05-12 21:08:20', '2025-05-12 21:34:34', NULL, 0, 0);
INSERT INTO player_stats (id, player_id, game_id, passing_tds, passes_completed, passes_attempted, interceptions_thrown, receptions, targets, receiving_tds, drops, first_downs, rushing_tds, rush_attempts, flag_pulls, interceptions, pass_breakups, def_td, version, is_deleted, created_at, updated_at, deleted_at, sacks, qb_rushing_tds) VALUES (32, 8, 6, 0, 0, 0, 0, 6, 6, 3, 0, 2, 0, 0, 3, 0, 0, 0, 9, 0, '2025-05-12 21:08:47', '2025-05-12 21:35:24', NULL, 0, 0);
INSERT INTO player_stats (id, player_id, game_id, passing_tds, passes_completed, passes_attempted, interceptions_thrown, receptions, targets, receiving_tds, drops, first_downs, rushing_tds, rush_attempts, flag_pulls, interceptions, pass_breakups, def_td, version, is_deleted, created_at, updated_at, deleted_at, sacks, qb_rushing_tds) VALUES (33, 1, 6, 5, 15, 23, 1, 1, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 25, 0, '2025-05-12 21:08:55', '2025-05-12 21:35:58', NULL, 0, 0);
INSERT INTO player_stats (id, player_id, game_id, passing_tds, passes_completed, passes_attempted, interceptions_thrown, receptions, targets, receiving_tds, drops, first_downs, rushing_tds, rush_attempts, flag_pulls, interceptions, pass_breakups, def_td, version, is_deleted, created_at, updated_at, deleted_at, sacks, qb_rushing_tds) VALUES (34, 10, 6, 0, 0, 0, 0, 1, 2, 0, 0, 0, 0, 0, 1, 0, 0, 0, 3, 0, '2025-05-12 21:09:10', '2025-05-12 21:28:21', NULL, 0, 0);
INSERT INTO player_stats (id, player_id, game_id, passing_tds, passes_completed, passes_attempted, interceptions_thrown, receptions, targets, receiving_tds, drops, first_downs, rushing_tds, rush_attempts, flag_pulls, interceptions, pass_breakups, def_td, version, is_deleted, created_at, updated_at, deleted_at, sacks, qb_rushing_tds) VALUES (35, 2, 6, 0, 0, 0, 0, 2, 3, 1, 1, 0, 0, 3, 2, 1, 3, 1, 11, 0, '2025-05-12 21:10:30', '2025-05-12 21:34:42', NULL, 0, 0);
INSERT INTO player_stats (id, player_id, game_id, passing_tds, passes_completed, passes_attempted, interceptions_thrown, receptions, targets, receiving_tds, drops, first_downs, rushing_tds, rush_attempts, flag_pulls, interceptions, pass_breakups, def_td, version, is_deleted, created_at, updated_at, deleted_at, sacks, qb_rushing_tds) VALUES (36, 9, 6, 0, 0, 0, 0, 1, 3, 1, 2, 0, 0, 0, 2, 0, 3, 0, 8, 0, '2025-05-12 21:11:09', '2025-05-12 21:35:52', NULL, 0, 0);
INSERT INTO player_stats (id, player_id, game_id, passing_tds, passes_completed, passes_attempted, interceptions_thrown, receptions, targets, receiving_tds, drops, first_downs, rushing_tds, rush_attempts, flag_pulls, interceptions, pass_breakups, def_td, version, is_deleted, created_at, updated_at, deleted_at, sacks, qb_rushing_tds) VALUES (37, 6, 6, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, '2025-05-12 21:13:20', '2025-05-12 21:13:20', NULL, 0, 0);
INSERT INTO player_stats (id, player_id, game_id, passing_tds, passes_completed, passes_attempted, interceptions_thrown, receptions, targets, receiving_tds, drops, first_downs, rushing_tds, rush_attempts, flag_pulls, interceptions, pass_breakups, def_td, version, is_deleted, created_at, updated_at, deleted_at, sacks, qb_rushing_tds) VALUES (38, 7, 6, 0, 0, 0, 0, 3, 4, 0, 0, 1, 0, 0, 5, 0, 0, 0, 10, 0, '2025-05-12 21:15:30', '2025-05-12 21:33:10', NULL, 0, 0);
INSERT INTO player_stats (id, player_id, game_id, passing_tds, passes_completed, passes_attempted, interceptions_thrown, receptions, targets, receiving_tds, drops, first_downs, rushing_tds, rush_attempts, flag_pulls, interceptions, pass_breakups, def_td, version, is_deleted, created_at, updated_at, deleted_at, sacks, qb_rushing_tds) VALUES (39, 4, 6, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 0, 1, 0, 5, 0, '2025-05-12 21:18:44', '2025-05-12 21:20:38', NULL, 2, 0);
INSERT INTO player_stats (id, player_id, game_id, passing_tds, passes_completed, passes_attempted, interceptions_thrown, receptions, targets, receiving_tds, drops, first_downs, rushing_tds, rush_attempts, flag_pulls, interceptions, pass_breakups, def_td, version, is_deleted, created_at, updated_at, deleted_at, sacks, qb_rushing_tds) VALUES (40, 3, 7, 0, 0, 0, 0, 2, 8, 2, 2, 1, 0, 2, 1, 0, 0, 0, 11, 0, '2025-05-13 03:48:42', '2025-05-13 04:18:58', NULL, 0, 0);
INSERT INTO player_stats (id, player_id, game_id, passing_tds, passes_completed, passes_attempted, interceptions_thrown, receptions, targets, receiving_tds, drops, first_downs, rushing_tds, rush_attempts, flag_pulls, interceptions, pass_breakups, def_td, version, is_deleted, created_at, updated_at, deleted_at, sacks, qb_rushing_tds) VALUES (41, 7, 7, 1, 6, 9, 1, 2, 4, 1, 1, 1, 0, 0, 6, 0, 0, 0, 20, 0, '2025-05-13 03:49:04', '2025-05-13 04:17:42', NULL, 0, 0);
INSERT INTO player_stats (id, player_id, game_id, passing_tds, passes_completed, passes_attempted, interceptions_thrown, receptions, targets, receiving_tds, drops, first_downs, rushing_tds, rush_attempts, flag_pulls, interceptions, pass_breakups, def_td, version, is_deleted, created_at, updated_at, deleted_at, sacks, qb_rushing_tds) VALUES (42, 2, 7, 0, 0, 0, 0, 2, 4, 0, 1, 1, 0, 2, 4, 0, 1, 0, 11, 0, '2025-05-13 03:49:17', '2025-05-13 04:18:06', NULL, 0, 0);
INSERT INTO player_stats (id, player_id, game_id, passing_tds, passes_completed, passes_attempted, interceptions_thrown, receptions, targets, receiving_tds, drops, first_downs, rushing_tds, rush_attempts, flag_pulls, interceptions, pass_breakups, def_td, version, is_deleted, created_at, updated_at, deleted_at, sacks, qb_rushing_tds) VALUES (43, 1, 7, 2, 9, 19, 4, 0, 0, 0, 0, 1, 0, 1, 4, 0, 0, 0, 29, 0, '2025-05-13 03:50:27', '2025-05-13 04:19:09', NULL, 0, 0);
INSERT INTO player_stats (id, player_id, game_id, passing_tds, passes_completed, passes_attempted, interceptions_thrown, receptions, targets, receiving_tds, drops, first_downs, rushing_tds, rush_attempts, flag_pulls, interceptions, pass_breakups, def_td, version, is_deleted, created_at, updated_at, deleted_at, sacks, qb_rushing_tds) VALUES (44, 10, 7, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, '2025-05-13 03:51:37', '2025-05-13 03:51:37', NULL, 0, 0);
INSERT INTO player_stats (id, player_id, game_id, passing_tds, passes_completed, passes_attempted, interceptions_thrown, receptions, targets, receiving_tds, drops, first_downs, rushing_tds, rush_attempts, flag_pulls, interceptions, pass_breakups, def_td, version, is_deleted, created_at, updated_at, deleted_at, sacks, qb_rushing_tds) VALUES (45, 9, 7, 0, 0, 0, 0, 1, 2, 0, 0, 0, 0, 0, 0, 0, 2, 0, 4, 0, '2025-05-13 03:52:16', '2025-05-13 04:12:54', NULL, 0, 0);
INSERT INTO player_stats (id, player_id, game_id, passing_tds, passes_completed, passes_attempted, interceptions_thrown, receptions, targets, receiving_tds, drops, first_downs, rushing_tds, rush_attempts, flag_pulls, interceptions, pass_breakups, def_td, version, is_deleted, created_at, updated_at, deleted_at, sacks, qb_rushing_tds) VALUES (46, 8, 7, 0, 0, 0, 0, 8, 8, 0, 0, 0, 0, 0, 3, 0, 0, 0, 11, 0, '2025-05-13 03:54:23', '2025-05-13 04:18:48', NULL, 0, 0);
INSERT INTO player_stats (id, player_id, game_id, passing_tds, passes_completed, passes_attempted, interceptions_thrown, receptions, targets, receiving_tds, drops, first_downs, rushing_tds, rush_attempts, flag_pulls, interceptions, pass_breakups, def_td, version, is_deleted, created_at, updated_at, deleted_at, sacks, qb_rushing_tds) VALUES (47, 17, 8, 0, 0, 0, 0, 6, 8, 0, 0, 1, 0, 0, 5, 1, 1, 1, 16, 0, '2025-05-13 17:06:41', '2025-05-13 17:56:20', NULL, 0, 0);
INSERT INTO player_stats (id, player_id, game_id, passing_tds, passes_completed, passes_attempted, interceptions_thrown, receptions, targets, receiving_tds, drops, first_downs, rushing_tds, rush_attempts, flag_pulls, interceptions, pass_breakups, def_td, version, is_deleted, created_at, updated_at, deleted_at, sacks, qb_rushing_tds) VALUES (48, 11, 8, 5, 19, 37, 0, 0, 0, 0, 0, 1, 0, 1, 1, 0, 0, 0, 43, 0, '2025-05-13 17:10:53', '2025-05-13 17:56:58', NULL, 0, 1);
INSERT INTO player_stats (id, player_id, game_id, passing_tds, passes_completed, passes_attempted, interceptions_thrown, receptions, targets, receiving_tds, drops, first_downs, rushing_tds, rush_attempts, flag_pulls, interceptions, pass_breakups, def_td, version, is_deleted, created_at, updated_at, deleted_at, sacks, qb_rushing_tds) VALUES (49, 13, 8, 0, 0, 0, 0, 1, 6, 0, 1, 0, 0, 0, 8, 1, 2, 1, 18, 0, '2025-05-13 17:11:18', '2025-05-13 17:57:04', NULL, 0, 0);
INSERT INTO player_stats (id, player_id, game_id, passing_tds, passes_completed, passes_attempted, interceptions_thrown, receptions, targets, receiving_tds, drops, first_downs, rushing_tds, rush_attempts, flag_pulls, interceptions, pass_breakups, def_td, version, is_deleted, created_at, updated_at, deleted_at, sacks, qb_rushing_tds) VALUES (50, 12, 8, 0, 0, 0, 0, 3, 7, 1, 0, 1, 0, 1, 2, 1, 1, 0, 11, 0, '2025-05-13 17:11:32', '2025-05-13 17:51:19', NULL, 0, 0);
INSERT INTO player_stats (id, player_id, game_id, passing_tds, passes_completed, passes_attempted, interceptions_thrown, receptions, targets, receiving_tds, drops, first_downs, rushing_tds, rush_attempts, flag_pulls, interceptions, pass_breakups, def_td, version, is_deleted, created_at, updated_at, deleted_at, sacks, qb_rushing_tds) VALUES (51, 15, 8, 0, 0, 0, 0, 3, 5, 1, 0, 1, 0, 0, 0, 0, 0, 0, 5, 0, '2025-05-13 17:15:13', '2025-05-13 17:39:52', NULL, 0, 0);
INSERT INTO player_stats (id, player_id, game_id, passing_tds, passes_completed, passes_attempted, interceptions_thrown, receptions, targets, receiving_tds, drops, first_downs, rushing_tds, rush_attempts, flag_pulls, interceptions, pass_breakups, def_td, version, is_deleted, created_at, updated_at, deleted_at, sacks, qb_rushing_tds) VALUES (52, 16, 8, 0, 0, 0, 0, 6, 8, 3, 1, 3, 0, 0, 5, 0, 0, 0, 15, 0, '2025-05-13 17:16:09', '2025-05-13 17:57:36', NULL, 0, 0);
INSERT INTO player_stats (id, player_id, game_id, passing_tds, passes_completed, passes_attempted, interceptions_thrown, receptions, targets, receiving_tds, drops, first_downs, rushing_tds, rush_attempts, flag_pulls, interceptions, pass_breakups, def_td, version, is_deleted, created_at, updated_at, deleted_at, sacks, qb_rushing_tds) VALUES (53, 14, 8, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 2, 0, '2025-05-13 17:17:37', '2025-05-13 17:24:12', NULL, 1, 0);
INSERT INTO player_stats (id, player_id, game_id, passing_tds, passes_completed, passes_attempted, interceptions_thrown, receptions, targets, receiving_tds, drops, first_downs, rushing_tds, rush_attempts, flag_pulls, interceptions, pass_breakups, def_td, version, is_deleted, created_at, updated_at, deleted_at, sacks, qb_rushing_tds) VALUES (54, 18, 8, 0, 0, 0, 0, 1, 4, 0, 1, 0, 0, 0, 0, 0, 1, 0, 5, 0, '2025-05-13 17:21:46', '2025-05-13 17:56:06', NULL, 0, 0);
INSERT INTO player_stats (id, player_id, game_id, passing_tds, passes_completed, passes_attempted, interceptions_thrown, receptions, targets, receiving_tds, drops, first_downs, rushing_tds, rush_attempts, flag_pulls, interceptions, pass_breakups, def_td, version, is_deleted, created_at, updated_at, deleted_at, sacks, qb_rushing_tds) VALUES (55, 11, 9, 4, 13, 31, 0, 0, 0, 0, 0, 1, 0, 1, 1, 0, 0, 0, 30, 0, '2025-05-16 18:01:41', '2025-05-16 19:29:35', NULL, 0, 0);
INSERT INTO player_stats (id, player_id, game_id, passing_tds, passes_completed, passes_attempted, interceptions_thrown, receptions, targets, receiving_tds, drops, first_downs, rushing_tds, rush_attempts, flag_pulls, interceptions, pass_breakups, def_td, version, is_deleted, created_at, updated_at, deleted_at, sacks, qb_rushing_tds) VALUES (56, 12, 9, 0, 0, 0, 0, 3, 10, 1, 1, 1, 1, 1, 4, 0, 1, 0, 16, 0, '2025-05-16 18:02:02', '2025-05-16 19:29:03', NULL, 0, 0);
INSERT INTO player_stats (id, player_id, game_id, passing_tds, passes_completed, passes_attempted, interceptions_thrown, receptions, targets, receiving_tds, drops, first_downs, rushing_tds, rush_attempts, flag_pulls, interceptions, pass_breakups, def_td, version, is_deleted, created_at, updated_at, deleted_at, sacks, qb_rushing_tds) VALUES (57, 13, 9, 0, 0, 0, 0, 1, 5, 0, 1, 2, 0, 4, 2, 0, 1, 0, 12, 0, '2025-05-16 18:02:53', '2025-05-16 19:31:09', NULL, 0, 0);
INSERT INTO player_stats (id, player_id, game_id, passing_tds, passes_completed, passes_attempted, interceptions_thrown, receptions, targets, receiving_tds, drops, first_downs, rushing_tds, rush_attempts, flag_pulls, interceptions, pass_breakups, def_td, version, is_deleted, created_at, updated_at, deleted_at, sacks, qb_rushing_tds) VALUES (58, 17, 9, 0, 0, 0, 0, 4, 5, 1, 0, 1, 0, 0, 3, 0, 2, 0, 10, 0, '2025-05-16 18:14:16', '2025-05-16 19:30:24', NULL, 0, 0);
INSERT INTO player_stats (id, player_id, game_id, passing_tds, passes_completed, passes_attempted, interceptions_thrown, receptions, targets, receiving_tds, drops, first_downs, rushing_tds, rush_attempts, flag_pulls, interceptions, pass_breakups, def_td, version, is_deleted, created_at, updated_at, deleted_at, sacks, qb_rushing_tds) VALUES (59, 16, 9, 0, 0, 0, 0, 4, 9, 2, 0, 1, 0, 0, 3, 0, 1, 0, 14, 0, '2025-05-16 18:15:35', '2025-05-16 19:32:03', NULL, 0, 0);
INSERT INTO player_stats (id, player_id, game_id, passing_tds, passes_completed, passes_attempted, interceptions_thrown, receptions, targets, receiving_tds, drops, first_downs, rushing_tds, rush_attempts, flag_pulls, interceptions, pass_breakups, def_td, version, is_deleted, created_at, updated_at, deleted_at, sacks, qb_rushing_tds) VALUES (60, 18, 9, 0, 0, 0, 0, 1, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, '2025-05-16 19:07:03', '2025-05-16 19:25:23', NULL, 0, 0);

-- Table: players
CREATE TABLE IF NOT EXISTS players (
	id INTEGER NOT NULL, 
	name VARCHAR, 
	team_id INTEGER, 
	season INTEGER, 
	is_active BOOLEAN, 
	jersey_number VARCHAR, 
	version INTEGER NOT NULL, 
	is_deleted BOOLEAN NOT NULL, 
	created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL, 
	updated_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL, 
	deleted_at DATETIME, 
	PRIMARY KEY (id), 
	FOREIGN KEY(team_id) REFERENCES teams (id) ON DELETE CASCADE
);
INSERT INTO players (id, name, team_id, season, is_active, jersey_number, version, is_deleted, created_at, updated_at, deleted_at) VALUES (1, 'Akeeme', 6, 1, 1, NULL, 1, 0, '2025-04-25 21:04:38.209181', '2025-04-25 21:04:38.209181', NULL);
INSERT INTO players (id, name, team_id, season, is_active, jersey_number, version, is_deleted, created_at, updated_at, deleted_at) VALUES (2, 'Jeremiah', 6, 1, 1, NULL, 1, 0, '2025-04-25 21:07:26.351364', '2025-04-25 21:07:26.351364', NULL);
INSERT INTO players (id, name, team_id, season, is_active, jersey_number, version, is_deleted, created_at, updated_at, deleted_at) VALUES (3, 'Hans', 6, 1, 1, NULL, 1, 0, '2025-04-25 21:07:46.863606', '2025-04-25 21:07:46.863606', NULL);
INSERT INTO players (id, name, team_id, season, is_active, jersey_number, version, is_deleted, created_at, updated_at, deleted_at) VALUES (4, 'Cedric', 6, 1, 1, NULL, 1, 0, '2025-04-25 21:07:54.657235', '2025-04-25 21:07:54.657235', NULL);
INSERT INTO players (id, name, team_id, season, is_active, jersey_number, version, is_deleted, created_at, updated_at, deleted_at) VALUES (5, 'Kenneth', 6, 1, 1, NULL, 1, 0, '2025-04-25 21:08:01.166143', '2025-04-25 21:08:01.166143', NULL);
INSERT INTO players (id, name, team_id, season, is_active, jersey_number, version, is_deleted, created_at, updated_at, deleted_at) VALUES (6, 'Dontae', 6, 1, 1, NULL, 1, 0, '2025-04-25 21:08:09.521886', '2025-04-25 21:08:09.521886', NULL);
INSERT INTO players (id, name, team_id, season, is_active, jersey_number, version, is_deleted, created_at, updated_at, deleted_at) VALUES (7, 'LJ', 6, 1, 1, NULL, 1, 0, '2025-04-25 21:08:18.199307', '2025-04-25 21:08:18.199307', NULL);
INSERT INTO players (id, name, team_id, season, is_active, jersey_number, version, is_deleted, created_at, updated_at, deleted_at) VALUES (8, 'Louis', 6, 1, 1, NULL, 1, 0, '2025-04-25 21:08:28.410550', '2025-04-25 21:08:28.410550', NULL);
INSERT INTO players (id, name, team_id, season, is_active, jersey_number, version, is_deleted, created_at, updated_at, deleted_at) VALUES (9, 'Johnathan', 6, 1, 1, NULL, 1, 0, '2025-04-25 21:08:40.031086', '2025-04-25 21:08:40.031086', NULL);
INSERT INTO players (id, name, team_id, season, is_active, jersey_number, version, is_deleted, created_at, updated_at, deleted_at) VALUES (10, 'Noah', 6, 1, 1, NULL, 1, 0, '2025-04-25 21:08:46.995641', '2025-04-25 21:08:46.995641', NULL);
INSERT INTO players (id, name, team_id, season, is_active, jersey_number, version, is_deleted, created_at, updated_at, deleted_at) VALUES (11, 'Akeeme', 6, 2, 1, NULL, 1, 0, '2025-05-13 16:27:33.174445', '2025-05-13 16:27:33.174445', NULL);
INSERT INTO players (id, name, team_id, season, is_active, jersey_number, version, is_deleted, created_at, updated_at, deleted_at) VALUES (12, 'Jeremiah', 6, 2, 1, NULL, 1, 0, '2025-05-13 16:27:35.199924', '2025-05-13 16:27:35.199924', NULL);
INSERT INTO players (id, name, team_id, season, is_active, jersey_number, version, is_deleted, created_at, updated_at, deleted_at) VALUES (13, 'Hans', 6, 2, 1, NULL, 1, 0, '2025-05-13 16:27:37.234752', '2025-05-13 16:27:37.234752', NULL);
INSERT INTO players (id, name, team_id, season, is_active, jersey_number, version, is_deleted, created_at, updated_at, deleted_at) VALUES (14, 'Cedric', 6, 2, 1, NULL, 1, 0, '2025-05-13 16:27:39.269770', '2025-05-13 16:27:39.269770', NULL);
INSERT INTO players (id, name, team_id, season, is_active, jersey_number, version, is_deleted, created_at, updated_at, deleted_at) VALUES (15, 'Dontae', 6, 2, 1, NULL, 1, 0, '2025-05-13 16:27:41.303449', '2025-05-13 16:27:41.303449', NULL);
INSERT INTO players (id, name, team_id, season, is_active, jersey_number, version, is_deleted, created_at, updated_at, deleted_at) VALUES (16, 'LJ', 6, 2, 1, NULL, 1, 0, '2025-05-13 16:27:43.340991', '2025-05-13 16:27:43.340991', NULL);
INSERT INTO players (id, name, team_id, season, is_active, jersey_number, version, is_deleted, created_at, updated_at, deleted_at) VALUES (17, 'Louis', 6, 2, 1, NULL, 1, 0, '2025-05-13 16:27:45.371497', '2025-05-13 16:27:45.371497', NULL);
INSERT INTO players (id, name, team_id, season, is_active, jersey_number, version, is_deleted, created_at, updated_at, deleted_at) VALUES (18, 'Johnathan', 6, 2, 1, NULL, 1, 0, '2025-05-13 16:27:47.397946', '2025-05-13 16:27:47.397946', NULL);
INSERT INTO players (id, name, team_id, season, is_active, jersey_number, version, is_deleted, created_at, updated_at, deleted_at) VALUES (19, 'Noah', 6, 2, 1, NULL, 1, 0, '2025-05-13 16:27:49.425968', '2025-05-13 16:27:49.425968', NULL);
INSERT INTO players (id, name, team_id, season, is_active, jersey_number, version, is_deleted, created_at, updated_at, deleted_at) VALUES (20, 'Andre', 6, 2, 1, NULL, 1, 0, '2025-05-13 16:41:50.291073', '2025-05-13 16:41:50.291073', NULL);

-- Table: teams
CREATE TABLE IF NOT EXISTS teams (
	id INTEGER NOT NULL, 
	name VARCHAR, 
	season INTEGER, 
	league VARCHAR, 
	wins INTEGER, 
	losses INTEGER, 
	ties INTEGER, 
	is_active INTEGER, 
	version INTEGER NOT NULL, 
	is_deleted BOOLEAN NOT NULL, 
	created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL, 
	updated_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL, 
	deleted_at DATETIME, 
	PRIMARY KEY (id), 
	CONSTRAINT unique_team_season UNIQUE (name, season, league)
);
INSERT INTO teams (id, name, season, league, wins, losses, ties, is_active, version, is_deleted, created_at, updated_at, deleted_at) VALUES (1, 'MonStars', 1, 'ZogSports', 5, 0, 0, 0, 2, 0, '2025-04-25 19:09:33.326910', '2025-05-13 16:10:40', NULL);
INSERT INTO teams (id, name, season, league, wins, losses, ties, is_active, version, is_deleted, created_at, updated_at, deleted_at) VALUES (2, 'Bomb Squad', 1, 'ZogSports', 3, 2, 0, 0, 2, 0, '2025-04-25 20:53:33.830774', '2025-05-13 16:10:42', NULL);
INSERT INTO teams (id, name, season, league, wins, losses, ties, is_active, version, is_deleted, created_at, updated_at, deleted_at) VALUES (3, 'Junkyard Dogs', 1, 'ZogSports', 1, 4, 0, 0, 2, 0, '2025-04-25 20:53:46.244671', '2025-05-13 16:10:44', NULL);
INSERT INTO teams (id, name, season, league, wins, losses, ties, is_active, version, is_deleted, created_at, updated_at, deleted_at) VALUES (4, 'The Royal Ones', 1, 'ZogSports', 5, 0, 0, 0, 2, 0, '2025-04-25 20:53:58.797533', '2025-05-13 16:10:46', NULL);
INSERT INTO teams (id, name, season, league, wins, losses, ties, is_active, version, is_deleted, created_at, updated_at, deleted_at) VALUES (5, 'NYCFC', 1, 'ZogSports', 4, 1, 0, 0, 2, 0, '2025-04-25 20:54:10.416630', '2025-05-13 16:10:48', NULL);
INSERT INTO teams (id, name, season, league, wins, losses, ties, is_active, version, is_deleted, created_at, updated_at, deleted_at) VALUES (6, 'Rhinos', 1, 'ZogSports', 3, 2, 0, 0, 2, 0, '2025-04-25 20:54:18.245313', '2025-05-13 16:10:50', NULL);
INSERT INTO teams (id, name, season, league, wins, losses, ties, is_active, version, is_deleted, created_at, updated_at, deleted_at) VALUES (7, 'Touch down for what', 1, 'ZogSports', 2, 3, 0, 0, 2, 0, '2025-04-25 20:54:27.935271', '2025-05-13 16:10:52', NULL);
INSERT INTO teams (id, name, season, league, wins, losses, ties, is_active, version, is_deleted, created_at, updated_at, deleted_at) VALUES (8, 'Turbos', 1, 'ZogSports', 1, 4, 0, 0, 2, 0, '2025-04-25 20:54:38.613764', '2025-05-13 16:10:54', NULL);
INSERT INTO teams (id, name, season, league, wins, losses, ties, is_active, version, is_deleted, created_at, updated_at, deleted_at) VALUES (9, 'Beluga Barons', 1, 'ZogSports', 0, 5, 0, 0, 2, 0, '2025-04-25 20:54:49.424042', '2025-05-13 16:10:56', NULL);
INSERT INTO teams (id, name, season, league, wins, losses, ties, is_active, version, is_deleted, created_at, updated_at, deleted_at) VALUES (10, 'Bomb Squad', 2, 'ZogSports', 2, 4, 0, 1, 2, 0, '2025-05-13 16:23:53.160612', '2025-05-13 16:44:46', NULL);
INSERT INTO teams (id, name, season, league, wins, losses, ties, is_active, version, is_deleted, created_at, updated_at, deleted_at) VALUES (11, 'The Royal Ones', 2, 'ZogSports', 4, 2, 0, 1, 2, 0, '2025-05-13 16:23:55.183843', '2025-05-13 16:45:36', NULL);
INSERT INTO teams (id, name, season, league, wins, losses, ties, is_active, version, is_deleted, created_at, updated_at, deleted_at) VALUES (12, 'Rhinos', 2, 'ZogSports', 4, 2, 0, 1, 2, 0, '2025-05-13 16:23:57.208838', '2025-05-13 16:45:52', NULL);
INSERT INTO teams (id, name, season, league, wins, losses, ties, is_active, version, is_deleted, created_at, updated_at, deleted_at) VALUES (13, 'Turbos', 2, 'ZogSports', 2, 4, 0, 1, 2, 0, '2025-05-13 16:23:59.230256', '2025-05-13 16:46:04', NULL);

-- Index: ix_games_id
CREATE INDEX IF NOT EXISTS ix_games_id ON games (id);

-- Index: ix_player_stats_id
CREATE INDEX IF NOT EXISTS ix_player_stats_id ON player_stats (id);

-- Index: ix_players_id
CREATE INDEX IF NOT EXISTS ix_players_id ON players (id);

-- Index: ix_players_name
CREATE INDEX IF NOT EXISTS ix_players_name ON players (name);

-- Index: ix_players_season
CREATE INDEX IF NOT EXISTS ix_players_season ON players (season);

-- Index: ix_teams_id
CREATE INDEX IF NOT EXISTS ix_teams_id ON teams (id);

-- Index: ix_teams_name
CREATE INDEX IF NOT EXISTS ix_teams_name ON teams (name);

-- Index: ix_teams_season
CREATE INDEX IF NOT EXISTS ix_teams_season ON teams (season);

COMMIT TRANSACTION;
PRAGMA foreign_keys = on;
