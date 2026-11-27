package handlers

import (
	"fmt"

	"ff-stats-tracker/internal/avatar"
	"ff-stats-tracker/internal/database"
	"ff-stats-tracker/internal/middleware"
	"ff-stats-tracker/internal/models"

	"github.com/gofiber/fiber/v2"
)

type Handlers struct {
	db      *database.DB
	avatars *avatar.Store // nil when S3_* env is unset
}

func New(db *database.DB) *Handlers {
	return &Handlers{db: db, avatars: avatar.FromEnv()}
}

func (h *Handlers) SetupRoutes(app fiber.Router) {
	// Teams routes
	app.Post("/teams", middleware.AdminRequired(), h.CreateTeam)
	app.Get("/teams", h.GetTeams)
	app.Get("/teams/:id", h.GetTeam)
	app.Put("/teams/:id", middleware.AdminRequired(), h.UpdateTeam)
	app.Delete("/teams/:id", middleware.AdminRequired(), h.DeleteTeam)
	app.Post("/teams/end-season", middleware.AdminRequired(), h.EndSeason)
	app.Post("/teams/copy-to-season", middleware.AdminRequired(), h.CopyTeamsToSeason)

	// Players routes
	app.Post("/players", middleware.AdminRequired(), h.CreatePlayer)
	app.Get("/players", h.GetPlayers)
	app.Get("/players/:id", h.GetPlayer)
	app.Put("/players/:id", middleware.AdminRequired(), h.UpdatePlayer)
	app.Delete("/players/:id", middleware.AdminRequired(), h.DeletePlayer)

	// Games routes
	app.Post("/games", middleware.AdminRequired(), h.CreateGame)
	app.Get("/games", h.GetGames)
	app.Get("/games/:id", h.GetGame)
	app.Put("/games/:id", middleware.AdminRequired(), h.UpdateGame)
	app.Delete("/games/:id", middleware.AdminRequired(), h.DeleteGame)

	// Stats routes
	app.Post("/stats", middleware.AdminRequired(), h.CreatePlayerStats)
	app.Get("/stats", h.GetPlayerStats)
	app.Get("/stats/:id", h.GetPlayerStat)
	app.Put("/stats/:id", middleware.AdminRequired(), h.UpdatePlayerStats)
	app.Delete("/stats/:id", middleware.AdminRequired(), h.DeletePlayerStats)

	// Admin session (key -> httpOnly cookie)
	app.Get("/admin/session", middleware.Session)
	app.Post("/admin/session", middleware.Login)
	app.Delete("/admin/session", middleware.Logout)

	// People (one per human) and game social
	app.Get("/people", h.GetPeople)
	app.Put("/people/:id", middleware.AdminRequired(), h.UpdatePerson)
	app.Post("/people/:id/avatar", middleware.AdminRequired(), h.UploadAvatar)
	app.Delete("/people/:id/avatar", middleware.AdminRequired(), h.DeleteAvatar)
	app.Get("/games/:id/social", h.GetGameSocial)
	app.Post("/games/:id/react", SocialLimiter(), h.ToggleReaction)
	app.Post("/games/:id/mvp", SocialLimiter(), h.VoteMVP)
}

// EndSeason marks all teams from a specific season as inactive
func (h *Handlers) EndSeason(c *fiber.Ctx) error {
	var req models.EndSeasonRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(models.BaseResponse{
			Success: false,
			Message: "Invalid request body",
		})
	}

	query := `
		UPDATE teams 
		SET is_active = 0, updated_at = NOW()
		WHERE season = $1 AND is_active = 1 AND is_deleted = false
	`

	result, err := h.db.Exec(c.Context(), query, req.Season)
	if err != nil {
		return c.Status(500).JSON(models.BaseResponse{
			Success: false,
			Message: "Failed to end season",
		})
	}

	rowsAffected := result

	return c.JSON(map[string]interface{}{
		"success":       true,
		"message":       fmt.Sprintf("Successfully marked all teams from season %d as inactive", req.Season),
		"teams_updated": rowsAffected,
	})
}

// CopyTeamsToSeason copies teams from one season to another
func (h *Handlers) CopyTeamsToSeason(c *fiber.Ctx) error {
	var req models.CopyTeamsRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(models.BaseResponse{
			Success: false,
			Message: "Invalid request body",
		})
	}

	// Get teams from source season
	selectQuery := `
		SELECT name, league FROM statstracker.teams 
		WHERE season = $1 AND is_deleted = false
	`
	rows, err := h.db.Query(c.Context(), selectQuery, req.FromSeason)
	if err != nil {
		return c.Status(500).JSON(models.BaseResponse{
			Success: false,
			Message: "Failed to fetch source teams",
		})
	}
	defer rows.Close()

	var teamsCopied int
	for rows.Next() {
		var name, league string
		if err := rows.Scan(&name, &league); err != nil {
			continue
		}

		// Insert new team for target season
		insertQuery := `
			INSERT INTO statstracker.teams (name, season, league, wins, losses, ties, is_active, version, is_deleted, created_at, updated_at)
			VALUES ($1, $2, $3, 0, 0, 0, 1, 1, false, NOW(), NOW())
		`
		_, err := h.db.Exec(c.Context(), insertQuery, name, req.ToSeason, league)
		if err != nil {
			continue // Skip teams that fail to insert
		}
		teamsCopied++
	}

	return c.JSON(map[string]interface{}{
		"success":      true,
		"message":      fmt.Sprintf("Successfully copied %d teams from season %d to season %d", teamsCopied, req.FromSeason, req.ToSeason),
		"teams_copied": teamsCopied,
	})
}
