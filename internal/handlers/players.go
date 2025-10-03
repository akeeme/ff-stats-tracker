package handlers

import (
	"context"
	"fmt"
	"strconv"
	"time"

	"ff-stats-tracker/internal/models"

	"github.com/gofiber/fiber/v2"
)

func (h *Handlers) CreatePlayer(c *fiber.Ctx) error {
	var req models.PlayerCreateRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(models.PlayerResponse{
			BaseResponse: models.BaseResponse{
				Success: false,
				Message: "Invalid request body",
			},
		})
	}

	// Find team by name
	var teamID int
	teamQuery := "SELECT id FROM statstracker.teams WHERE name = $1 AND is_deleted = false"
	err := h.db.QueryRow(context.Background(), teamQuery, req.TeamName).Scan(&teamID)
	if err != nil {
		return c.Status(404).JSON(models.PlayerResponse{
			BaseResponse: models.BaseResponse{
				Success: false,
				Message: fmt.Sprintf("Team '%s' not found", req.TeamName),
			},
		})
	}

	// Set defaults
	isActive := true
	if req.IsActive != nil {
		isActive = *req.IsActive
	}

	now := time.Now()
	player := models.Player{
		Name:         req.Name,
		TeamID:       teamID,
		Season:       req.Season,
		IsActive:     isActive,
		JerseyNumber: req.JerseyNumber,
		BaseModel: models.BaseModel{
			Version:   1,
			IsDeleted: false,
			CreatedAt: now,
			UpdatedAt: now,
		},
	}

	query := `
		INSERT INTO statstracker.players (name, team_id, season, is_active, jersey_number, version, is_deleted, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
		RETURNING id
	`

	var id int
	err = h.db.QueryRow(context.Background(), query,
		player.Name, player.TeamID, player.Season, player.IsActive, player.JerseyNumber,
		player.Version, player.IsDeleted, player.CreatedAt, player.UpdatedAt,
	).Scan(&id)

	if err != nil {
		return c.Status(500).JSON(models.PlayerResponse{
			BaseResponse: models.BaseResponse{
				Success: false,
				Message: "Failed to create player",
			},
		})
	}

	player.ID = id

	return c.Status(201).JSON(models.PlayerResponse{
		BaseResponse: models.BaseResponse{
			Success: true,
			Message: "Player created successfully",
		},
		Data: &player,
	})
}

func (h *Handlers) GetPlayers(c *fiber.Ctx) error {
	skip, _ := strconv.Atoi(c.Query("skip", "0"))
	limit, _ := strconv.Atoi(c.Query("limit", "100"))
	includeDeleted := c.Query("include_deleted", "false") == "true"

	whereClause := "WHERE p.is_deleted = false"
	if includeDeleted {
		whereClause = ""
	}

	query := fmt.Sprintf(`
		SELECT p.id, p.name, p.team_id, p.season, p.is_active, p.jersey_number, 
		       p.version, p.is_deleted, p.created_at, p.updated_at, p.deleted_at,
		       t.name as team_name
		FROM players p
		LEFT JOIN teams t ON p.team_id = t.id
		%s
		ORDER BY p.id
		LIMIT $1 OFFSET $2
	`, whereClause)

	args := []interface{}{limit, skip}

	rows, err := h.db.Query(context.Background(), query, args...)
	if err != nil {
		return c.Status(500).JSON(models.BaseResponse{
			Success: false,
			Message: "Failed to fetch players",
		})
	}
	defer rows.Close()

	var players []models.PlayerWithTeam
	for rows.Next() {
		var player models.PlayerWithTeam
		var teamName *string
		err := rows.Scan(
			&player.ID, &player.Name, &player.TeamID, &player.Season, &player.IsActive, &player.JerseyNumber,
			&player.Version, &player.IsDeleted, &player.CreatedAt, &player.UpdatedAt, &player.DeletedAt,
			&teamName,
		)
		if err != nil {
			return c.Status(500).JSON(models.BaseResponse{
				Success: false,
				Message: "Failed to scan player data",
			})
		}
		if teamName != nil {
			player.TeamName = *teamName
		}
		players = append(players, player)
	}

	return c.JSON(players)
}

func (h *Handlers) GetPlayer(c *fiber.Ctx) error {
	id, err := strconv.Atoi(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(models.PlayerResponse{
			BaseResponse: models.BaseResponse{
				Success: false,
				Message: "Invalid player ID",
			},
		})
	}

	includeDeleted := c.Query("include_deleted", "false") == "true"

	whereClause := "WHERE p.id = $1 AND p.is_deleted = false"
	args := []interface{}{id}
	if includeDeleted {
		whereClause = "WHERE p.id = $1"
	}

	query := fmt.Sprintf(`
		SELECT p.id, p.name, p.team_id, p.season, p.is_active, p.jersey_number, 
		       p.version, p.is_deleted, p.created_at, p.updated_at, p.deleted_at,
		       t.name as team_name
		FROM players p
		LEFT JOIN teams t ON p.team_id = t.id
		%s
	`, whereClause)

	var player models.PlayerWithTeam
	var teamName *string
	err = h.db.QueryRow(context.Background(), query, args...).Scan(
		&player.ID, &player.Name, &player.TeamID, &player.Season, &player.IsActive, &player.JerseyNumber,
		&player.Version, &player.IsDeleted, &player.CreatedAt, &player.UpdatedAt, &player.DeletedAt,
		&teamName,
	)

	if err != nil {
		return c.Status(404).JSON(models.PlayerResponse{
			BaseResponse: models.BaseResponse{
				Success: false,
				Message: "Player not found",
			},
		})
	}

	if teamName != nil {
		player.TeamName = *teamName
	}

	return c.JSON(models.PlayerResponse{
		BaseResponse: models.BaseResponse{
			Success: true,
			Message: "Player retrieved successfully",
		},
		Data: &player.Player,
	})
}

func (h *Handlers) UpdatePlayer(c *fiber.Ctx) error {
	id, err := strconv.Atoi(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(models.PlayerResponse{
			BaseResponse: models.BaseResponse{
				Success: false,
				Message: "Invalid player ID",
			},
		})
	}

	version, err := strconv.Atoi(c.Query("version"))
	if err != nil {
		return c.Status(400).JSON(models.PlayerResponse{
			BaseResponse: models.BaseResponse{
				Success: false,
				Message: "Version parameter is required",
			},
		})
	}

	var req models.PlayerUpdateRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(models.PlayerResponse{
			BaseResponse: models.BaseResponse{
				Success: false,
				Message: "Invalid request body",
			},
		})
	}

	// Check if player exists and get current version
	var currentVersion int
	checkQuery := "SELECT version FROM statstracker.players WHERE id = $1 AND is_deleted = false"
	err = h.db.QueryRow(context.Background(), checkQuery, id).Scan(&currentVersion)
	if err != nil {
		return c.Status(404).JSON(models.PlayerResponse{
			BaseResponse: models.BaseResponse{
				Success: false,
				Message: "Player not found",
			},
		})
	}

	// Check version for optimistic locking
	if currentVersion != version {
		return c.Status(409).JSON(models.PlayerResponse{
			BaseResponse: models.BaseResponse{
				Success: false,
				Message: "Record has been modified. Please refresh and try again.",
			},
		})
	}

	// Handle team name update if provided
	if req.TeamName != nil {
		var teamID int
		teamQuery := "SELECT id FROM statstracker.teams WHERE name = $1 AND is_deleted = false"
		err = h.db.QueryRow(context.Background(), teamQuery, *req.TeamName).Scan(&teamID)
		if err != nil {
			return c.Status(404).JSON(models.PlayerResponse{
				BaseResponse: models.BaseResponse{
					Success: false,
					Message: fmt.Sprintf("Team '%s' not found", *req.TeamName),
				},
			})
		}
		req.TeamID = &teamID
	}

	// Build update query dynamically
	setParts := []string{"version = version + 1", "updated_at = $1"}
	args := []interface{}{time.Now()}
	argIndex := 2

	if req.Name != nil {
		setParts = append(setParts, fmt.Sprintf("name = $%d", argIndex))
		args = append(args, *req.Name)
		argIndex++
	}
	if req.TeamID != nil {
		setParts = append(setParts, fmt.Sprintf("team_id = $%d", argIndex))
		args = append(args, *req.TeamID)
		argIndex++
	}
	if req.Season != nil {
		setParts = append(setParts, fmt.Sprintf("season = $%d", argIndex))
		args = append(args, *req.Season)
		argIndex++
	}
	if req.IsActive != nil {
		setParts = append(setParts, fmt.Sprintf("is_active = $%d", argIndex))
		args = append(args, *req.IsActive)
		argIndex++
	}
	if req.JerseyNumber != nil {
		setParts = append(setParts, fmt.Sprintf("jersey_number = $%d", argIndex))
		args = append(args, *req.JerseyNumber)
		argIndex++
	}

	args = append(args, id)
	updateQuery := fmt.Sprintf(`
		UPDATE players 
		SET %s 
		WHERE id = $%d AND is_deleted = false
		RETURNING id, name, team_id, season, is_active, jersey_number, version, is_deleted, created_at, updated_at, deleted_at
	`, fmt.Sprintf("%s", setParts[0]), argIndex)

	for i := 1; i < len(setParts); i++ {
		updateQuery = fmt.Sprintf(`
			UPDATE players 
			SET %s 
			WHERE id = $%d AND is_deleted = false
			RETURNING id, name, team_id, season, is_active, jersey_number, version, is_deleted, created_at, updated_at, deleted_at
		`, fmt.Sprintf("%s, %s", setParts[0], setParts[i]), argIndex)
	}

	var player models.Player
	err = h.db.QueryRow(context.Background(), updateQuery, args...).Scan(
		&player.ID, &player.Name, &player.TeamID, &player.Season, &player.IsActive, &player.JerseyNumber,
		&player.Version, &player.IsDeleted, &player.CreatedAt, &player.UpdatedAt, &player.DeletedAt,
	)

	if err != nil {
		return c.Status(500).JSON(models.PlayerResponse{
			BaseResponse: models.BaseResponse{
				Success: false,
				Message: "Failed to update player",
			},
		})
	}

	return c.JSON(models.PlayerResponse{
		BaseResponse: models.BaseResponse{
			Success: true,
			Message: "Player updated successfully",
		},
		Data: &player,
	})
}

func (h *Handlers) DeletePlayer(c *fiber.Ctx) error {
	id, err := strconv.Atoi(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(models.PlayerResponse{
			BaseResponse: models.BaseResponse{
				Success: false,
				Message: "Invalid player ID",
			},
		})
	}

	version, err := strconv.Atoi(c.Query("version"))
	if err != nil {
		return c.Status(400).JSON(models.PlayerResponse{
			BaseResponse: models.BaseResponse{
				Success: false,
				Message: "Version parameter is required",
			},
		})
	}

	// Check if player exists and get current version
	var currentVersion int
	checkQuery := "SELECT version FROM statstracker.players WHERE id = $1 AND is_deleted = false"
	err = h.db.QueryRow(context.Background(), checkQuery, id).Scan(&currentVersion)
	if err != nil {
		return c.Status(404).JSON(models.PlayerResponse{
			BaseResponse: models.BaseResponse{
				Success: false,
				Message: "Player not found",
			},
		})
	}

	// Check version for optimistic locking
	if currentVersion != version {
		return c.Status(409).JSON(models.PlayerResponse{
			BaseResponse: models.BaseResponse{
				Success: false,
				Message: "Record has been modified. Please refresh and try again.",
			},
		})
	}

	// Soft delete
	now := time.Now()
	updateQuery := `
		UPDATE players 
		SET is_deleted = true, deleted_at = $1, version = version + 1, updated_at = $1
		WHERE id = $2 AND is_deleted = false
	`

	_, err = h.db.Exec(context.Background(), updateQuery, now, id)
	if err != nil {
		return c.Status(500).JSON(models.PlayerResponse{
			BaseResponse: models.BaseResponse{
				Success: false,
				Message: "Failed to delete player",
			},
		})
	}

	return c.JSON(models.PlayerResponse{
		BaseResponse: models.BaseResponse{
			Success: true,
			Message: "Player deleted successfully",
		},
	})
}
