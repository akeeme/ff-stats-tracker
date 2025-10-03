package handlers

import (
	"context"
	"fmt"
	"strconv"
	"time"

	"ff-stats-tracker/internal/models"

	"github.com/gofiber/fiber/v2"
)

func (h *Handlers) CreateTeam(c *fiber.Ctx) error {
	var req models.TeamCreateRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(models.TeamResponse{
			BaseResponse: models.BaseResponse{
				Success: false,
				Message: "Invalid request body",
			},
		})
	}

	// Set defaults
	wins := 0
	losses := 0
	ties := 0
	isActive := 1

	if req.Wins != nil {
		wins = *req.Wins
	}
	if req.Losses != nil {
		losses = *req.Losses
	}
	if req.Ties != nil {
		ties = *req.Ties
	}
	if req.IsActive != nil {
		isActive = *req.IsActive
	}

	now := time.Now()
	team := models.Team{
		Name:     req.Name,
		Season:   req.Season,
		League:   req.League,
		Wins:     wins,
		Losses:   losses,
		Ties:     ties,
		IsActive: isActive,
		BaseModel: models.BaseModel{
			Version:   1,
			IsDeleted: false,
			CreatedAt: now,
			UpdatedAt: now,
		},
	}

	query := `
		INSERT INTO statstracker.teams (name, season, league, wins, losses, ties, is_active, version, is_deleted, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
		RETURNING id
	`

	var id int
	err := h.db.QueryRow(context.Background(), query,
		team.Name, team.Season, team.League, team.Wins, team.Losses, team.Ties,
		team.IsActive, team.Version, team.IsDeleted, team.CreatedAt, team.UpdatedAt,
	).Scan(&id)

	if err != nil {
		return c.Status(500).JSON(models.TeamResponse{
			BaseResponse: models.BaseResponse{
				Success: false,
				Message: "Failed to create team",
			},
		})
	}

	team.ID = id
	team.DisplayName = fmt.Sprintf("%s (Season %d)", team.Name, team.Season)

	return c.Status(201).JSON(models.TeamResponse{
		BaseResponse: models.BaseResponse{
			Success: true,
			Message: "Team created successfully",
		},
		Data: &team,
	})
}

func (h *Handlers) GetTeams(c *fiber.Ctx) error {
	skip, _ := strconv.Atoi(c.Query("skip", "0"))
	limit, _ := strconv.Atoi(c.Query("limit", "100"))
	includeDeleted := c.Query("include_deleted", "false") == "true"

	whereClause := "WHERE is_deleted = false"
	if includeDeleted {
		whereClause = ""
	}

	query := fmt.Sprintf(`
		SELECT id, name, season, league, wins, losses, ties, is_active, version, is_deleted, created_at, updated_at, deleted_at
		FROM teams %s
		ORDER BY id
		LIMIT $1 OFFSET $2
	`, whereClause)

	args := []interface{}{limit, skip}
	if !includeDeleted {
		args = []interface{}{limit, skip}
	}

	rows, err := h.db.Query(context.Background(), query, args...)
	if err != nil {
		return c.Status(500).JSON(models.BaseResponse{
			Success: false,
			Message: "Failed to fetch teams",
		})
	}
	defer rows.Close()

	var teams []models.Team
	for rows.Next() {
		var team models.Team
		err := rows.Scan(
			&team.ID, &team.Name, &team.Season, &team.League, &team.Wins, &team.Losses, &team.Ties,
			&team.IsActive, &team.Version, &team.IsDeleted, &team.CreatedAt, &team.UpdatedAt, &team.DeletedAt,
		)
		if err != nil {
			return c.Status(500).JSON(models.BaseResponse{
				Success: false,
				Message: "Failed to scan team data",
			})
		}
		team.DisplayName = fmt.Sprintf("%s (Season %d)", team.Name, team.Season)
		teams = append(teams, team)
	}

	return c.JSON(teams)
}

func (h *Handlers) GetTeam(c *fiber.Ctx) error {
	id, err := strconv.Atoi(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(models.TeamResponse{
			BaseResponse: models.BaseResponse{
				Success: false,
				Message: "Invalid team ID",
			},
		})
	}

	includeDeleted := c.Query("include_deleted", "false") == "true"

	whereClause := "WHERE id = $1 AND is_deleted = false"
	args := []interface{}{id}
	if includeDeleted {
		whereClause = "WHERE id = $1"
	}

	query := fmt.Sprintf(`
		SELECT id, name, season, league, wins, losses, ties, is_active, version, is_deleted, created_at, updated_at, deleted_at
		FROM teams %s
	`, whereClause)

	var team models.Team
	err = h.db.QueryRow(context.Background(), query, args...).Scan(
		&team.ID, &team.Name, &team.Season, &team.League, &team.Wins, &team.Losses, &team.Ties,
		&team.IsActive, &team.Version, &team.IsDeleted, &team.CreatedAt, &team.UpdatedAt, &team.DeletedAt,
	)

	if err != nil {
		return c.Status(404).JSON(models.TeamResponse{
			BaseResponse: models.BaseResponse{
				Success: false,
				Message: "Team not found",
			},
		})
	}

	team.DisplayName = fmt.Sprintf("%s (Season %d)", team.Name, team.Season)

	return c.JSON(models.TeamResponse{
		BaseResponse: models.BaseResponse{
			Success: true,
			Message: "Team retrieved successfully",
		},
		Data: &team,
	})
}

func (h *Handlers) UpdateTeam(c *fiber.Ctx) error {
	id, err := strconv.Atoi(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(models.TeamResponse{
			BaseResponse: models.BaseResponse{
				Success: false,
				Message: "Invalid team ID",
			},
		})
	}

	version, err := strconv.Atoi(c.Query("version"))
	if err != nil {
		return c.Status(400).JSON(models.TeamResponse{
			BaseResponse: models.BaseResponse{
				Success: false,
				Message: "Version parameter is required",
			},
		})
	}

	var req models.TeamUpdateRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(models.TeamResponse{
			BaseResponse: models.BaseResponse{
				Success: false,
				Message: "Invalid request body",
			},
		})
	}

	// Check if team exists and get current version
	var currentVersion int
	checkQuery := "SELECT version FROM statstracker.teams WHERE id = $1 AND is_deleted = false"
	err = h.db.QueryRow(context.Background(), checkQuery, id).Scan(&currentVersion)
	if err != nil {
		return c.Status(404).JSON(models.TeamResponse{
			BaseResponse: models.BaseResponse{
				Success: false,
				Message: "Team not found",
			},
		})
	}

	// Check version for optimistic locking
	if currentVersion != version {
		return c.Status(409).JSON(models.TeamResponse{
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

	if req.Name != nil {
		setParts = append(setParts, fmt.Sprintf("name = $%d", argIndex))
		args = append(args, *req.Name)
		argIndex++
	}
	if req.Season != nil {
		setParts = append(setParts, fmt.Sprintf("season = $%d", argIndex))
		args = append(args, *req.Season)
		argIndex++
	}
	if req.League != nil {
		setParts = append(setParts, fmt.Sprintf("league = $%d", argIndex))
		args = append(args, *req.League)
		argIndex++
	}
	if req.Wins != nil {
		setParts = append(setParts, fmt.Sprintf("wins = $%d", argIndex))
		args = append(args, *req.Wins)
		argIndex++
	}
	if req.Losses != nil {
		setParts = append(setParts, fmt.Sprintf("losses = $%d", argIndex))
		args = append(args, *req.Losses)
		argIndex++
	}
	if req.Ties != nil {
		setParts = append(setParts, fmt.Sprintf("ties = $%d", argIndex))
		args = append(args, *req.Ties)
		argIndex++
	}
	if req.IsActive != nil {
		setParts = append(setParts, fmt.Sprintf("is_active = $%d", argIndex))
		args = append(args, *req.IsActive)
		argIndex++
	}

	args = append(args, id)
	updateQuery := fmt.Sprintf(`
		UPDATE teams 
		SET %s 
		WHERE id = $%d AND is_deleted = false
		RETURNING id, name, season, league, wins, losses, ties, is_active, version, is_deleted, created_at, updated_at, deleted_at
	`, fmt.Sprintf("%s", setParts[0]), argIndex)

	for i := 1; i < len(setParts); i++ {
		updateQuery = fmt.Sprintf(`
			UPDATE teams 
			SET %s 
			WHERE id = $%d AND is_deleted = false
			RETURNING id, name, season, league, wins, losses, ties, is_active, version, is_deleted, created_at, updated_at, deleted_at
		`, fmt.Sprintf("%s, %s", setParts[0], setParts[i]), argIndex)
	}

	var team models.Team
	err = h.db.QueryRow(context.Background(), updateQuery, args...).Scan(
		&team.ID, &team.Name, &team.Season, &team.League, &team.Wins, &team.Losses, &team.Ties,
		&team.IsActive, &team.Version, &team.IsDeleted, &team.CreatedAt, &team.UpdatedAt, &team.DeletedAt,
	)

	if err != nil {
		return c.Status(500).JSON(models.TeamResponse{
			BaseResponse: models.BaseResponse{
				Success: false,
				Message: "Failed to update team",
			},
		})
	}

	team.DisplayName = fmt.Sprintf("%s (Season %d)", team.Name, team.Season)

	return c.JSON(models.TeamResponse{
		BaseResponse: models.BaseResponse{
			Success: true,
			Message: "Team updated successfully",
		},
		Data: &team,
	})
}

func (h *Handlers) DeleteTeam(c *fiber.Ctx) error {
	id, err := strconv.Atoi(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(models.TeamResponse{
			BaseResponse: models.BaseResponse{
				Success: false,
				Message: "Invalid team ID",
			},
		})
	}

	version, err := strconv.Atoi(c.Query("version"))
	if err != nil {
		return c.Status(400).JSON(models.TeamResponse{
			BaseResponse: models.BaseResponse{
				Success: false,
				Message: "Version parameter is required",
			},
		})
	}

	// Check if team exists and get current version
	var currentVersion int
	checkQuery := "SELECT version FROM statstracker.teams WHERE id = $1 AND is_deleted = false"
	err = h.db.QueryRow(context.Background(), checkQuery, id).Scan(&currentVersion)
	if err != nil {
		return c.Status(404).JSON(models.TeamResponse{
			BaseResponse: models.BaseResponse{
				Success: false,
				Message: "Team not found",
			},
		})
	}

	// Check version for optimistic locking
	if currentVersion != version {
		return c.Status(409).JSON(models.TeamResponse{
			BaseResponse: models.BaseResponse{
				Success: false,
				Message: "Record has been modified. Please refresh and try again.",
			},
		})
	}

	// Soft delete
	now := time.Now()
	updateQuery := `
		UPDATE teams 
		SET is_deleted = true, deleted_at = $1, version = version + 1, updated_at = $1
		WHERE id = $2 AND is_deleted = false
	`

	_, err = h.db.Exec(context.Background(), updateQuery, now, id)
	if err != nil {
		return c.Status(500).JSON(models.TeamResponse{
			BaseResponse: models.BaseResponse{
				Success: false,
				Message: "Failed to delete team",
			},
		})
	}

	return c.JSON(models.TeamResponse{
		BaseResponse: models.BaseResponse{
			Success: true,
			Message: "Team deleted successfully",
		},
	})
}
