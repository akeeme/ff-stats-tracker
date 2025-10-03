package handlers

import (
	"context"
	"fmt"
	"strconv"
	"time"

	"ff-stats-tracker/internal/models"

	"github.com/gofiber/fiber/v2"
)

func (h *Handlers) CreatePlayerStats(c *fiber.Ctx) error {
	var req models.PlayerStatsCreateRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(models.PlayerStatsResponse{
			BaseResponse: models.BaseResponse{
				Success: false,
				Message: "Invalid request body",
			},
		})
	}

	// Find player by name
	var playerID int
	playerQuery := "SELECT id FROM statstracker.players WHERE name = $1 AND is_deleted = false"
	err := h.db.QueryRow(context.Background(), playerQuery, req.PlayerName).Scan(&playerID)
	if err != nil {
		return c.Status(404).JSON(models.PlayerStatsResponse{
			BaseResponse: models.BaseResponse{
				Success: false,
				Message: fmt.Sprintf("Player '%s' not found", req.PlayerName),
			},
		})
	}

	// Find game by week, season, league, and teams
	var gameID int
	gameQuery := `
		SELECT g.id FROM statstracker.games g
		LEFT JOIN statstracker.teams t1 ON g.team1_id = t1.id
		LEFT JOIN statstracker.teams t2 ON g.team2_id = t2.id
		WHERE g.week = $1 AND g.season = $2 AND g.league = $3 
		AND t1.name = $4 AND t2.name = $5 AND g.is_deleted = false
	`
	err = h.db.QueryRow(context.Background(), gameQuery,
		req.GameWeek, req.GameSeason, req.League, req.Team1Name, req.Team2Name,
	).Scan(&gameID)
	if err != nil {
		return c.Status(404).JSON(models.PlayerStatsResponse{
			BaseResponse: models.BaseResponse{
				Success: false,
				Message: fmt.Sprintf("Game not found for week %d, season %d, league %s between %s and %s",
					req.GameWeek, req.GameSeason, req.League, req.Team1Name, req.Team2Name),
			},
		})
	}

	// Set defaults for stats
	stats := models.PlayerStats{
		PlayerID: playerID,
		GameID:   gameID,
		BaseModel: models.BaseModel{
			Version:   1,
			IsDeleted: false,
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
		},
	}

	// Set QB stats
	if req.PassingTDs != nil {
		stats.PassingTDs = *req.PassingTDs
	}
	if req.PassesCompleted != nil {
		stats.PassesCompleted = *req.PassesCompleted
	}
	if req.PassesAttempted != nil {
		stats.PassesAttempted = *req.PassesAttempted
	}
	if req.InterceptionsThrown != nil {
		stats.InterceptionsThrown = *req.InterceptionsThrown
	}

	// Set WR stats
	if req.Receptions != nil {
		stats.Receptions = *req.Receptions
	}
	if req.Targets != nil {
		stats.Targets = *req.Targets
	}
	if req.ReceivingTDs != nil {
		stats.ReceivingTDs = *req.ReceivingTDs
	}
	if req.Drops != nil {
		stats.Drops = *req.Drops
	}
	if req.FirstDowns != nil {
		stats.FirstDowns = *req.FirstDowns
	}

	// Set RB stats
	if req.RushingTDs != nil {
		stats.RushingTDs = *req.RushingTDs
	}
	if req.RushAttempts != nil {
		stats.RushAttempts = *req.RushAttempts
	}

	// Set Defense stats
	if req.FlagPulls != nil {
		stats.FlagPulls = *req.FlagPulls
	}
	if req.Interceptions != nil {
		stats.Interceptions = *req.Interceptions
	}
	if req.PassBreakups != nil {
		stats.PassBreakups = *req.PassBreakups
	}
	if req.DefTD != nil {
		stats.DefTD = *req.DefTD
	}

	query := `
		INSERT INTO statstracker.player_stats (
			player_id, game_id, passing_tds, passes_completed, passes_attempted, interceptions_thrown,
			receptions, targets, receiving_tds, drops, first_downs, rushing_tds, rush_attempts,
			flag_pulls, interceptions, pass_breakups, def_td, version, is_deleted, created_at, updated_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
		RETURNING id
	`

	var id int
	err = h.db.QueryRow(context.Background(), query,
		stats.PlayerID, stats.GameID, stats.PassingTDs, stats.PassesCompleted, stats.PassesAttempted, stats.InterceptionsThrown,
		stats.Receptions, stats.Targets, stats.ReceivingTDs, stats.Drops, stats.FirstDowns,
		stats.RushingTDs, stats.RushAttempts, stats.FlagPulls, stats.Interceptions, stats.PassBreakups, stats.DefTD,
		stats.Version, stats.IsDeleted, stats.CreatedAt, stats.UpdatedAt,
	).Scan(&id)

	if err != nil {
		return c.Status(500).JSON(models.PlayerStatsResponse{
			BaseResponse: models.BaseResponse{
				Success: false,
				Message: "Failed to create player stats",
			},
		})
	}

	stats.ID = id

	return c.Status(201).JSON(models.PlayerStatsResponse{
		BaseResponse: models.BaseResponse{
			Success: true,
			Message: "Player stats created successfully",
		},
		Data: &stats,
	})
}

func (h *Handlers) GetPlayerStats(c *fiber.Ctx) error {
	skip, _ := strconv.Atoi(c.Query("skip", "0"))
	limit, _ := strconv.Atoi(c.Query("limit", "100"))
	includeDeleted := c.Query("include_deleted", "false") == "true"

	whereClause := "WHERE ps.is_deleted = false"
	if includeDeleted {
		whereClause = ""
	}

	query := fmt.Sprintf(`
		SELECT ps.id, ps.player_id, ps.game_id, ps.passing_tds, ps.passes_completed, ps.passes_attempted, ps.interceptions_thrown,
		       ps.receptions, ps.targets, ps.receiving_tds, ps.drops, ps.first_downs, ps.rushing_tds, ps.rush_attempts,
		       ps.flag_pulls, ps.interceptions, ps.pass_breakups, ps.def_td, ps.version, ps.is_deleted, ps.created_at, ps.updated_at, ps.deleted_at,
		       p.name as player_name, g.week as game_week, g.season as game_season, g.league,
		       t1.name as team1_name, t2.name as team2_name
		FROM player_stats ps
		LEFT JOIN players p ON ps.player_id = p.id
		LEFT JOIN games g ON ps.game_id = g.id
		LEFT JOIN statstracker.teams t1 ON g.team1_id = t1.id
		LEFT JOIN statstracker.teams t2 ON g.team2_id = t2.id
		%s
		ORDER BY ps.id
		LIMIT $1 OFFSET $2
	`, whereClause)

	args := []interface{}{limit, skip}

	rows, err := h.db.Query(context.Background(), query, args...)
	if err != nil {
		return c.Status(500).JSON(models.BaseResponse{
			Success: false,
			Message: "Failed to fetch player stats",
		})
	}
	defer rows.Close()

	var stats []models.PlayerStatsWithDetails
	for rows.Next() {
		var stat models.PlayerStatsWithDetails
		var playerName, league, team1Name, team2Name *string
		err := rows.Scan(
			&stat.ID, &stat.PlayerID, &stat.GameID, &stat.PassingTDs, &stat.PassesCompleted, &stat.PassesAttempted, &stat.InterceptionsThrown,
			&stat.Receptions, &stat.Targets, &stat.ReceivingTDs, &stat.Drops, &stat.FirstDowns, &stat.RushingTDs, &stat.RushAttempts,
			&stat.FlagPulls, &stat.Interceptions, &stat.PassBreakups, &stat.DefTD,
			&stat.Version, &stat.IsDeleted, &stat.CreatedAt, &stat.UpdatedAt, &stat.DeletedAt,
			&playerName, &stat.GameWeek, &stat.GameSeason, &league, &team1Name, &team2Name,
		)
		if err != nil {
			return c.Status(500).JSON(models.BaseResponse{
				Success: false,
				Message: "Failed to scan player stats data",
			})
		}
		if playerName != nil {
			stat.PlayerName = *playerName
		}
		if league != nil {
			stat.League = *league
		}
		if team1Name != nil {
			stat.Team1Name = *team1Name
		}
		if team2Name != nil {
			stat.Team2Name = *team2Name
		}
		stats = append(stats, stat)
	}

	return c.JSON(stats)
}

func (h *Handlers) GetPlayerStat(c *fiber.Ctx) error {
	id, err := strconv.Atoi(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(models.PlayerStatsResponse{
			BaseResponse: models.BaseResponse{
				Success: false,
				Message: "Invalid stats ID",
			},
		})
	}

	includeDeleted := c.Query("include_deleted", "false") == "true"

	whereClause := "WHERE ps.id = $1 AND ps.is_deleted = false"
	args := []interface{}{id}
	if includeDeleted {
		whereClause = "WHERE ps.id = $1"
	}

	query := fmt.Sprintf(`
		SELECT ps.id, ps.player_id, ps.game_id, ps.passing_tds, ps.passes_completed, ps.passes_attempted, ps.interceptions_thrown,
		       ps.receptions, ps.targets, ps.receiving_tds, ps.drops, ps.first_downs, ps.rushing_tds, ps.rush_attempts,
		       ps.flag_pulls, ps.interceptions, ps.pass_breakups, ps.def_td, ps.version, ps.is_deleted, ps.created_at, ps.updated_at, ps.deleted_at,
		       p.name as player_name, g.week as game_week, g.season as game_season, g.league,
		       t1.name as team1_name, t2.name as team2_name
		FROM player_stats ps
		LEFT JOIN players p ON ps.player_id = p.id
		LEFT JOIN games g ON ps.game_id = g.id
		LEFT JOIN statstracker.teams t1 ON g.team1_id = t1.id
		LEFT JOIN statstracker.teams t2 ON g.team2_id = t2.id
		%s
	`, whereClause)

	var stat models.PlayerStatsWithDetails
	var playerName, league, team1Name, team2Name *string
	err = h.db.QueryRow(context.Background(), query, args...).Scan(
		&stat.ID, &stat.PlayerID, &stat.GameID, &stat.PassingTDs, &stat.PassesCompleted, &stat.PassesAttempted, &stat.InterceptionsThrown,
		&stat.Receptions, &stat.Targets, &stat.ReceivingTDs, &stat.Drops, &stat.FirstDowns, &stat.RushingTDs, &stat.RushAttempts,
		&stat.FlagPulls, &stat.Interceptions, &stat.PassBreakups, &stat.DefTD,
		&stat.Version, &stat.IsDeleted, &stat.CreatedAt, &stat.UpdatedAt, &stat.DeletedAt,
		&playerName, &stat.GameWeek, &stat.GameSeason, &league, &team1Name, &team2Name,
	)

	if err != nil {
		return c.Status(404).JSON(models.PlayerStatsResponse{
			BaseResponse: models.BaseResponse{
				Success: false,
				Message: "Player stats not found",
			},
		})
	}

	if playerName != nil {
		stat.PlayerName = *playerName
	}
	if league != nil {
		stat.League = *league
	}
	if team1Name != nil {
		stat.Team1Name = *team1Name
	}
	if team2Name != nil {
		stat.Team2Name = *team2Name
	}

	return c.JSON(models.PlayerStatsResponse{
		BaseResponse: models.BaseResponse{
			Success: true,
			Message: "Player stats retrieved successfully",
		},
		Data: &stat.PlayerStats,
	})
}

func (h *Handlers) UpdatePlayerStats(c *fiber.Ctx) error {
	id, err := strconv.Atoi(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(models.PlayerStatsResponse{
			BaseResponse: models.BaseResponse{
				Success: false,
				Message: "Invalid stats ID",
			},
		})
	}

	version, err := strconv.Atoi(c.Query("version"))
	if err != nil {
		return c.Status(400).JSON(models.PlayerStatsResponse{
			BaseResponse: models.BaseResponse{
				Success: false,
				Message: "Version parameter is required",
			},
		})
	}

	var req models.PlayerStatsUpdateRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(models.PlayerStatsResponse{
			BaseResponse: models.BaseResponse{
				Success: false,
				Message: "Invalid request body",
			},
		})
	}

	// Check if stats exist and get current version
	var currentVersion int
	checkQuery := "SELECT version FROM statstracker.player_stats WHERE id = $1 AND is_deleted = false"
	err = h.db.QueryRow(context.Background(), checkQuery, id).Scan(&currentVersion)
	if err != nil {
		return c.Status(404).JSON(models.PlayerStatsResponse{
			BaseResponse: models.BaseResponse{
				Success: false,
				Message: "Player stats not found",
			},
		})
	}

	// Check version for optimistic locking
	if currentVersion != version {
		return c.Status(409).JSON(models.PlayerStatsResponse{
			BaseResponse: models.BaseResponse{
				Success: false,
				Message: "Record has been modified. Please refresh and try again.",
			},
		})
	}

	// Build update query dynamically
	setParts := []string{"version = version + 1", "updated_at = $1"}
	args := []interface{}{time.Now()}
	argIndex := 2

	// QB stats
	if req.PassingTDs != nil {
		setParts = append(setParts, fmt.Sprintf("passing_tds = $%d", argIndex))
		args = append(args, *req.PassingTDs)
		argIndex++
	}
	if req.PassesCompleted != nil {
		setParts = append(setParts, fmt.Sprintf("passes_completed = $%d", argIndex))
		args = append(args, *req.PassesCompleted)
		argIndex++
	}
	if req.PassesAttempted != nil {
		setParts = append(setParts, fmt.Sprintf("passes_attempted = $%d", argIndex))
		args = append(args, *req.PassesAttempted)
		argIndex++
	}
	if req.InterceptionsThrown != nil {
		setParts = append(setParts, fmt.Sprintf("interceptions_thrown = $%d", argIndex))
		args = append(args, *req.InterceptionsThrown)
		argIndex++
	}

	// WR stats
	if req.Receptions != nil {
		setParts = append(setParts, fmt.Sprintf("receptions = $%d", argIndex))
		args = append(args, *req.Receptions)
		argIndex++
	}
	if req.Targets != nil {
		setParts = append(setParts, fmt.Sprintf("targets = $%d", argIndex))
		args = append(args, *req.Targets)
		argIndex++
	}
	if req.ReceivingTDs != nil {
		setParts = append(setParts, fmt.Sprintf("receiving_tds = $%d", argIndex))
		args = append(args, *req.ReceivingTDs)
		argIndex++
	}
	if req.Drops != nil {
		setParts = append(setParts, fmt.Sprintf("drops = $%d", argIndex))
		args = append(args, *req.Drops)
		argIndex++
	}
	if req.FirstDowns != nil {
		setParts = append(setParts, fmt.Sprintf("first_downs = $%d", argIndex))
		args = append(args, *req.FirstDowns)
		argIndex++
	}

	// RB stats
	if req.RushingTDs != nil {
		setParts = append(setParts, fmt.Sprintf("rushing_tds = $%d", argIndex))
		args = append(args, *req.RushingTDs)
		argIndex++
	}
	if req.RushAttempts != nil {
		setParts = append(setParts, fmt.Sprintf("rush_attempts = $%d", argIndex))
		args = append(args, *req.RushAttempts)
		argIndex++
	}

	// Defense stats
	if req.FlagPulls != nil {
		setParts = append(setParts, fmt.Sprintf("flag_pulls = $%d", argIndex))
		args = append(args, *req.FlagPulls)
		argIndex++
	}
	if req.Interceptions != nil {
		setParts = append(setParts, fmt.Sprintf("interceptions = $%d", argIndex))
		args = append(args, *req.Interceptions)
		argIndex++
	}
	if req.PassBreakups != nil {
		setParts = append(setParts, fmt.Sprintf("pass_breakups = $%d", argIndex))
		args = append(args, *req.PassBreakups)
		argIndex++
	}
	if req.DefTD != nil {
		setParts = append(setParts, fmt.Sprintf("def_td = $%d", argIndex))
		args = append(args, *req.DefTD)
		argIndex++
	}

	args = append(args, id)
	updateQuery := fmt.Sprintf(`
		UPDATE player_stats 
		SET %s 
		WHERE id = $%d AND is_deleted = false
		RETURNING id, player_id, game_id, passing_tds, passes_completed, passes_attempted, interceptions_thrown,
		          receptions, targets, receiving_tds, drops, first_downs, rushing_tds, rush_attempts,
		          flag_pulls, interceptions, pass_breakups, def_td, version, is_deleted, created_at, updated_at, deleted_at
	`, fmt.Sprintf("%s", setParts[0]), argIndex)

	for i := 1; i < len(setParts); i++ {
		updateQuery = fmt.Sprintf(`
			UPDATE player_stats 
			SET %s 
			WHERE id = $%d AND is_deleted = false
			RETURNING id, player_id, game_id, passing_tds, passes_completed, passes_attempted, interceptions_thrown,
			          receptions, targets, receiving_tds, drops, first_downs, rushing_tds, rush_attempts,
			          flag_pulls, interceptions, pass_breakups, def_td, version, is_deleted, created_at, updated_at, deleted_at
		`, fmt.Sprintf("%s, %s", setParts[0], setParts[i]), argIndex)
	}

	var stats models.PlayerStats
	err = h.db.QueryRow(context.Background(), updateQuery, args...).Scan(
		&stats.ID, &stats.PlayerID, &stats.GameID, &stats.PassingTDs, &stats.PassesCompleted, &stats.PassesAttempted, &stats.InterceptionsThrown,
		&stats.Receptions, &stats.Targets, &stats.ReceivingTDs, &stats.Drops, &stats.FirstDowns, &stats.RushingTDs, &stats.RushAttempts,
		&stats.FlagPulls, &stats.Interceptions, &stats.PassBreakups, &stats.DefTD,
		&stats.Version, &stats.IsDeleted, &stats.CreatedAt, &stats.UpdatedAt, &stats.DeletedAt,
	)

	if err != nil {
		return c.Status(500).JSON(models.PlayerStatsResponse{
			BaseResponse: models.BaseResponse{
				Success: false,
				Message: "Failed to update player stats",
			},
		})
	}

	return c.JSON(models.PlayerStatsResponse{
		BaseResponse: models.BaseResponse{
			Success: true,
			Message: "Player stats updated successfully",
		},
		Data: &stats,
	})
}

func (h *Handlers) DeletePlayerStats(c *fiber.Ctx) error {
	id, err := strconv.Atoi(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(models.PlayerStatsResponse{
			BaseResponse: models.BaseResponse{
				Success: false,
				Message: "Invalid stats ID",
			},
		})
	}

	version, err := strconv.Atoi(c.Query("version"))
	if err != nil {
		return c.Status(400).JSON(models.PlayerStatsResponse{
			BaseResponse: models.BaseResponse{
				Success: false,
				Message: "Version parameter is required",
			},
		})
	}

	// Check if stats exist and get current version
	var currentVersion int
	checkQuery := "SELECT version FROM statstracker.player_stats WHERE id = $1 AND is_deleted = false"
	err = h.db.QueryRow(context.Background(), checkQuery, id).Scan(&currentVersion)
	if err != nil {
		return c.Status(404).JSON(models.PlayerStatsResponse{
			BaseResponse: models.BaseResponse{
				Success: false,
				Message: "Player stats not found",
			},
		})
	}

	// Check version for optimistic locking
	if currentVersion != version {
		return c.Status(409).JSON(models.PlayerStatsResponse{
			BaseResponse: models.BaseResponse{
				Success: false,
				Message: "Record has been modified. Please refresh and try again.",
			},
		})
	}

	// Soft delete
	now := time.Now()
	updateQuery := `
		UPDATE player_stats 
		SET is_deleted = true, deleted_at = $1, version = version + 1, updated_at = $1
		WHERE id = $2 AND is_deleted = false
	`

	_, err = h.db.Exec(context.Background(), updateQuery, now, id)
	if err != nil {
		return c.Status(500).JSON(models.PlayerStatsResponse{
			BaseResponse: models.BaseResponse{
				Success: false,
				Message: "Failed to delete player stats",
			},
		})
	}

	return c.JSON(models.PlayerStatsResponse{
		BaseResponse: models.BaseResponse{
			Success: true,
			Message: "Player stats deleted successfully",
		},
	})
}
