package handlers

import (
	"context"
	"fmt"
	"strconv"
	"time"

	"ff-stats-tracker/internal/models"

	"github.com/gofiber/fiber/v2"
)

func (h *Handlers) CreateGame(c *fiber.Ctx) error {
	var req models.GameCreateRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(models.GameResponse{
			BaseResponse: models.BaseResponse{
				Success: false,
				Message: "Invalid request body",
			},
		})
	}

	// Find teams by name
	var team1ID, team2ID int
	teamQuery := "SELECT id FROM statstracker.teams WHERE name = $1 AND is_deleted = false"

	err := h.db.QueryRow(context.Background(), teamQuery, req.Team1Name).Scan(&team1ID)
	if err != nil {
		return c.Status(404).JSON(models.GameResponse{
			BaseResponse: models.BaseResponse{
				Success: false,
				Message: fmt.Sprintf("Team '%s' not found", req.Team1Name),
			},
		})
	}

	err = h.db.QueryRow(context.Background(), teamQuery, req.Team2Name).Scan(&team2ID)
	if err != nil {
		return c.Status(404).JSON(models.GameResponse{
			BaseResponse: models.BaseResponse{
				Success: false,
				Message: fmt.Sprintf("Team '%s' not found", req.Team2Name),
			},
		})
	}

	// Set defaults
	team1Score := 0
	team2Score := 0
	if req.Team1Score != nil {
		team1Score = *req.Team1Score
	}
	if req.Team2Score != nil {
		team2Score = *req.Team2Score
	}

	// Determine winning team
	var winningTeamID *int
	if req.WinningTeamName != nil {
		if *req.WinningTeamName == req.Team1Name {
			winningTeamID = &team1ID
			// Validate winning team score
			if team1Score <= team2Score {
				return c.Status(400).JSON(models.GameResponse{
					BaseResponse: models.BaseResponse{
						Success: false,
						Message: "Winning team score must be higher than losing team score",
					},
				})
			}
		} else if *req.WinningTeamName == req.Team2Name {
			winningTeamID = &team2ID
			// Validate winning team score
			if team2Score <= team1Score {
				return c.Status(400).JSON(models.GameResponse{
					BaseResponse: models.BaseResponse{
						Success: false,
						Message: "Winning team score must be higher than losing team score",
					},
				})
			}
		} else {
			return c.Status(400).JSON(models.GameResponse{
				BaseResponse: models.BaseResponse{
					Success: false,
					Message: fmt.Sprintf("Winning team '%s' must be either '%s' or '%s'", *req.WinningTeamName, req.Team1Name, req.Team2Name),
				},
			})
		}
	}

	now := time.Now()
	game := models.Game{
		Week:          req.Week,
		League:        req.League,
		Season:        req.Season,
		Team1ID:       &team1ID,
		Team1Score:    team1Score,
		Team2ID:       &team2ID,
		Team2Score:    team2Score,
		WinningTeamID: winningTeamID,
		BaseModel: models.BaseModel{
			Version:   1,
			IsDeleted: false,
			CreatedAt: now,
			UpdatedAt: now,
		},
	}

	query := `
		INSERT INTO statstracker.games (week, league, season, team1_id, team1_score, team2_id, team2_score, winning_team_id, version, is_deleted, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
		RETURNING id
	`

	var id int
	err = h.db.QueryRow(context.Background(), query,
		game.Week, game.League, game.Season, game.Team1ID, game.Team1Score,
		game.Team2ID, game.Team2Score, game.WinningTeamID,
		game.Version, game.IsDeleted, game.CreatedAt, game.UpdatedAt,
	).Scan(&id)

	if err != nil {
		return c.Status(500).JSON(models.GameResponse{
			BaseResponse: models.BaseResponse{
				Success: false,
				Message: "Failed to create game",
			},
		})
	}

	game.ID = id

	return c.Status(201).JSON(models.GameResponse{
		BaseResponse: models.BaseResponse{
			Success: true,
			Message: "Game created successfully",
		},
		Data: &game,
	})
}

func (h *Handlers) GetGames(c *fiber.Ctx) error {
	skip, _ := strconv.Atoi(c.Query("skip", "0"))
	limit, _ := strconv.Atoi(c.Query("limit", "100"))
	includeDeleted := c.Query("include_deleted", "false") == "true"

	whereClause := "WHERE g.is_deleted = false"
	if includeDeleted {
		whereClause = ""
	}

	query := fmt.Sprintf(`
		SELECT g.id, g.week, g.league, g.season, g.team1_id, g.team1_score, g.team2_id, g.team2_score, 
		       g.winning_team_id, g.version, g.is_deleted, g.created_at, g.updated_at, g.deleted_at,
		       t1.name as team1_name, t2.name as team2_name, wt.name as winning_team_name
		FROM games g
		LEFT JOIN teams t1 ON g.team1_id = t1.id
		LEFT JOIN teams t2 ON g.team2_id = t2.id
		LEFT JOIN teams wt ON g.winning_team_id = wt.id
		%s
		ORDER BY g.id
		LIMIT $1 OFFSET $2
	`, whereClause)

	args := []interface{}{limit, skip}

	rows, err := h.db.Query(context.Background(), query, args...)
	if err != nil {
		return c.Status(500).JSON(models.BaseResponse{
			Success: false,
			Message: "Failed to fetch games",
		})
	}
	defer rows.Close()

	var games []models.GameWithTeams
	for rows.Next() {
		var game models.GameWithTeams
		var team1Name, team2Name *string
		var winningTeamName *string
		err := rows.Scan(
			&game.ID, &game.Week, &game.League, &game.Season, &game.Team1ID, &game.Team1Score,
			&game.Team2ID, &game.Team2Score, &game.WinningTeamID,
			&game.Version, &game.IsDeleted, &game.CreatedAt, &game.UpdatedAt, &game.DeletedAt,
			&team1Name, &team2Name, &winningTeamName,
		)
		if err != nil {
			return c.Status(500).JSON(models.BaseResponse{
				Success: false,
				Message: "Failed to scan game data",
			})
		}
		if team1Name != nil {
			game.Team1Name = *team1Name
		}
		if team2Name != nil {
			game.Team2Name = *team2Name
		}
		if winningTeamName != nil {
			game.WinningTeamName = winningTeamName
		}
		games = append(games, game)
	}

	return c.JSON(games)
}

func (h *Handlers) GetGame(c *fiber.Ctx) error {
	id, err := strconv.Atoi(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(models.GameResponse{
			BaseResponse: models.BaseResponse{
				Success: false,
				Message: "Invalid game ID",
			},
		})
	}

	includeDeleted := c.Query("include_deleted", "false") == "true"

	whereClause := "WHERE g.id = $1 AND g.is_deleted = false"
	args := []interface{}{id}
	if includeDeleted {
		whereClause = "WHERE g.id = $1"
	}

	query := fmt.Sprintf(`
		SELECT g.id, g.week, g.league, g.season, g.team1_id, g.team1_score, g.team2_id, g.team2_score, 
		       g.winning_team_id, g.version, g.is_deleted, g.created_at, g.updated_at, g.deleted_at,
		       t1.name as team1_name, t2.name as team2_name, wt.name as winning_team_name
		FROM games g
		LEFT JOIN teams t1 ON g.team1_id = t1.id
		LEFT JOIN teams t2 ON g.team2_id = t2.id
		LEFT JOIN teams wt ON g.winning_team_id = wt.id
		%s
	`, whereClause)

	var game models.GameWithTeams
	var team1Name, team2Name *string
	var winningTeamName *string
	err = h.db.QueryRow(context.Background(), query, args...).Scan(
		&game.ID, &game.Week, &game.League, &game.Season, &game.Team1ID, &game.Team1Score,
		&game.Team2ID, &game.Team2Score, &game.WinningTeamID,
		&game.Version, &game.IsDeleted, &game.CreatedAt, &game.UpdatedAt, &game.DeletedAt,
		&team1Name, &team2Name, &winningTeamName,
	)

	if err != nil {
		return c.Status(404).JSON(models.GameResponse{
			BaseResponse: models.BaseResponse{
				Success: false,
				Message: "Game not found",
			},
		})
	}

	if team1Name != nil {
		game.Team1Name = *team1Name
	}
	if team2Name != nil {
		game.Team2Name = *team2Name
	}
	if winningTeamName != nil {
		game.WinningTeamName = winningTeamName
	}

	return c.JSON(models.GameResponse{
		BaseResponse: models.BaseResponse{
			Success: true,
			Message: "Game retrieved successfully",
		},
		Data: &game.Game,
	})
}

func (h *Handlers) UpdateGame(c *fiber.Ctx) error {
	id, err := strconv.Atoi(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(models.GameResponse{
			BaseResponse: models.BaseResponse{
				Success: false,
				Message: "Invalid game ID",
			},
		})
	}

	version, err := strconv.Atoi(c.Query("version"))
	if err != nil {
		return c.Status(400).JSON(models.GameResponse{
			BaseResponse: models.BaseResponse{
				Success: false,
				Message: "Version parameter is required",
			},
		})
	}

	var req models.GameUpdateRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(models.GameResponse{
			BaseResponse: models.BaseResponse{
				Success: false,
				Message: "Invalid request body",
			},
		})
	}

	// Check if game exists and get current version
	var currentVersion int
	checkQuery := "SELECT version FROM statstracker.games WHERE id = $1 AND is_deleted = false"
	err = h.db.QueryRow(context.Background(), checkQuery, id).Scan(&currentVersion)
	if err != nil {
		return c.Status(404).JSON(models.GameResponse{
			BaseResponse: models.BaseResponse{
				Success: false,
				Message: "Game not found",
			},
		})
	}

	// Check version for optimistic locking
	if currentVersion != version {
		return c.Status(409).JSON(models.GameResponse{
			BaseResponse: models.BaseResponse{
				Success: false,
				Message: "Record has been modified. Please refresh and try again.",
			},
		})
	}

	// Handle team name updates
	if req.Team1Name != nil {
		var teamID int
		teamQuery := "SELECT id FROM statstracker.teams WHERE name = $1 AND is_deleted = false"
		err = h.db.QueryRow(context.Background(), teamQuery, *req.Team1Name).Scan(&teamID)
		if err != nil {
			return c.Status(404).JSON(models.GameResponse{
				BaseResponse: models.BaseResponse{
					Success: false,
					Message: fmt.Sprintf("Team '%s' not found", *req.Team1Name),
				},
			})
		}
		req.Team1ID = &teamID
	}

	if req.Team2Name != nil {
		var teamID int
		teamQuery := "SELECT id FROM statstracker.teams WHERE name = $1 AND is_deleted = false"
		err = h.db.QueryRow(context.Background(), teamQuery, *req.Team2Name).Scan(&teamID)
		if err != nil {
			return c.Status(404).JSON(models.GameResponse{
				BaseResponse: models.BaseResponse{
					Success: false,
					Message: fmt.Sprintf("Team '%s' not found", *req.Team2Name),
				},
			})
		}
		req.Team2ID = &teamID
	}

	if req.WinningTeamName != nil {
		if *req.WinningTeamName != "" {
			var teamID int
			teamQuery := "SELECT id FROM statstracker.teams WHERE name = $1 AND is_deleted = false"
			err = h.db.QueryRow(context.Background(), teamQuery, *req.WinningTeamName).Scan(&teamID)
			if err != nil {
				return c.Status(404).JSON(models.GameResponse{
					BaseResponse: models.BaseResponse{
						Success: false,
						Message: fmt.Sprintf("Team '%s' not found", *req.WinningTeamName),
					},
				})
			}
			req.WinningTeamID = &teamID
		} else {
			req.WinningTeamID = nil
		}
	}

	// Build update query dynamically
	setParts := []string{"version = version + 1", "updated_at = $1"}
	args := []interface{}{time.Now()}
	argIndex := 2

	if req.Week != nil {
		setParts = append(setParts, fmt.Sprintf("week = $%d", argIndex))
		args = append(args, *req.Week)
		argIndex++
	}
	if req.League != nil {
		setParts = append(setParts, fmt.Sprintf("league = $%d", argIndex))
		args = append(args, *req.League)
		argIndex++
	}
	if req.Season != nil {
		setParts = append(setParts, fmt.Sprintf("season = $%d", argIndex))
		args = append(args, *req.Season)
		argIndex++
	}
	if req.Team1ID != nil {
		setParts = append(setParts, fmt.Sprintf("team1_id = $%d", argIndex))
		args = append(args, *req.Team1ID)
		argIndex++
	}
	if req.Team1Score != nil {
		setParts = append(setParts, fmt.Sprintf("team1_score = $%d", argIndex))
		args = append(args, *req.Team1Score)
		argIndex++
	}
	if req.Team2ID != nil {
		setParts = append(setParts, fmt.Sprintf("team2_id = $%d", argIndex))
		args = append(args, *req.Team2ID)
		argIndex++
	}
	if req.Team2Score != nil {
		setParts = append(setParts, fmt.Sprintf("team2_score = $%d", argIndex))
		args = append(args, *req.Team2Score)
		argIndex++
	}
	if req.WinningTeamID != nil {
		setParts = append(setParts, fmt.Sprintf("winning_team_id = $%d", argIndex))
		args = append(args, *req.WinningTeamID)
		argIndex++
	}

	args = append(args, id)
	updateQuery := fmt.Sprintf(`
		UPDATE games 
		SET %s 
		WHERE id = $%d AND is_deleted = false
		RETURNING id, week, league, season, team1_id, team1_score, team2_id, team2_score, winning_team_id, version, is_deleted, created_at, updated_at, deleted_at
	`, fmt.Sprintf("%s", setParts[0]), argIndex)

	for i := 1; i < len(setParts); i++ {
		updateQuery = fmt.Sprintf(`
			UPDATE games 
			SET %s 
			WHERE id = $%d AND is_deleted = false
			RETURNING id, week, league, season, team1_id, team1_score, team2_id, team2_score, winning_team_id, version, is_deleted, created_at, updated_at, deleted_at
		`, fmt.Sprintf("%s, %s", setParts[0], setParts[i]), argIndex)
	}

	var game models.Game
	err = h.db.QueryRow(context.Background(), updateQuery, args...).Scan(
		&game.ID, &game.Week, &game.League, &game.Season, &game.Team1ID, &game.Team1Score,
		&game.Team2ID, &game.Team2Score, &game.WinningTeamID,
		&game.Version, &game.IsDeleted, &game.CreatedAt, &game.UpdatedAt, &game.DeletedAt,
	)

	if err != nil {
		return c.Status(500).JSON(models.GameResponse{
			BaseResponse: models.BaseResponse{
				Success: false,
				Message: "Failed to update game",
			},
		})
	}

	return c.JSON(models.GameResponse{
		BaseResponse: models.BaseResponse{
			Success: true,
			Message: "Game updated successfully",
		},
		Data: &game,
	})
}

func (h *Handlers) DeleteGame(c *fiber.Ctx) error {
	id, err := strconv.Atoi(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(models.GameResponse{
			BaseResponse: models.BaseResponse{
				Success: false,
				Message: "Invalid game ID",
			},
		})
	}

	version, err := strconv.Atoi(c.Query("version"))
	if err != nil {
		return c.Status(400).JSON(models.GameResponse{
			BaseResponse: models.BaseResponse{
				Success: false,
				Message: "Version parameter is required",
			},
		})
	}

	// Check if game exists and get current version
	var currentVersion int
	checkQuery := "SELECT version FROM statstracker.games WHERE id = $1 AND is_deleted = false"
	err = h.db.QueryRow(context.Background(), checkQuery, id).Scan(&currentVersion)
	if err != nil {
		return c.Status(404).JSON(models.GameResponse{
			BaseResponse: models.BaseResponse{
				Success: false,
				Message: "Game not found",
			},
		})
	}

	// Check version for optimistic locking
	if currentVersion != version {
		return c.Status(409).JSON(models.GameResponse{
			BaseResponse: models.BaseResponse{
				Success: false,
				Message: "Record has been modified. Please refresh and try again.",
			},
		})
	}

	// Soft delete
	now := time.Now()
	updateQuery := `
		UPDATE games 
		SET is_deleted = true, deleted_at = $1, version = version + 1, updated_at = $1
		WHERE id = $2 AND is_deleted = false
	`

	_, err = h.db.Exec(context.Background(), updateQuery, now, id)
	if err != nil {
		return c.Status(500).JSON(models.GameResponse{
			BaseResponse: models.BaseResponse{
				Success: false,
				Message: "Failed to delete game",
			},
		})
	}

	return c.JSON(models.GameResponse{
		BaseResponse: models.BaseResponse{
			Success: true,
			Message: "Game deleted successfully",
		},
	})
}
