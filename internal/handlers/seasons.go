package handlers

import (
	"errors"
	"fmt"
	"strings"
	"unicode/utf8"

	"github.com/gofiber/fiber/v2"
	"github.com/jackc/pgx/v5/pgconn"
)

// TeamName is how the app finds "us" in every game (frontend derive.ts TEAM). Renaming it breaks scores.
const TeamName = "Rhinos"

func isUnique(err error) bool {
	var pe *pgconn.PgError
	return errors.As(err, &pe) && pe.Code == "23505"
}

// GetSeasons: seasons started from /admin/seasons (with their league). Older seasons only exist
// through their teams and games, so callers merge this with those.
func (h *Handlers) GetSeasons(c *fiber.Ctx) error {
	rows, err := h.db.Query(c.Context(), `SELECT season, league FROM statstracker.seasons ORDER BY season DESC`)
	if err != nil {
		return fail(c, err)
	}
	defer rows.Close()
	type season struct {
		Season int    `json:"season"`
		League string `json:"league"`
	}
	out := []season{}
	for rows.Next() {
		var s season
		if err := rows.Scan(&s.Season, &s.League); err != nil {
			return fail(c, err)
		}
		out = append(out, s)
	}
	if err := rows.Err(); err != nil {
		return fail(c, err)
	}
	return c.JSON(out)
}

type startSeasonReq struct {
	Season   int      `json:"season"`
	League   string   `json:"league"`
	CarryIDs []int    `json:"carry_team_ids"`
	NewTeams []string `json:"new_teams"`
}

// cleanTeams trims names and rejects blanks, >255 chars and case-insensitive duplicates.
func cleanTeams(names []string) ([]string, error) {
	seen := map[string]bool{}
	out := make([]string, 0, len(names))
	for _, n := range names {
		n = strings.TrimSpace(n)
		if n == "" || utf8.RuneCountInString(n) > 255 {
			return nil, fiber.NewError(400, "Team names must be 1-255 characters")
		}
		k := strings.ToLower(n)
		if seen[k] {
			return nil, fiber.NewError(400, fmt.Sprintf("%q is in the list twice", n))
		}
		seen[k] = true
		out = append(out, n)
	}
	return out, nil
}

// StartSeason (admin): POST /seasons/start {"season":5,"league":"Volo","carry_team_ids":[40],"new_teams":["HFB"]}
// Creates the season and its team rows (0-0, active) in one transaction. Carried teams must come from
// the latest existing season. Zero teams is allowed: the season row alone holds the league.
func (h *Handlers) StartSeason(c *fiber.Ctx) error {
	var b startSeasonReq
	if err := c.BodyParser(&b); err != nil {
		return fail(c, fiber.NewError(400, "Invalid request body"))
	}
	b.League = strings.TrimSpace(b.League)
	if b.League == "" || utf8.RuneCountInString(b.League) > 255 {
		return fail(c, fiber.NewError(400, "League name is required"))
	}
	if len(b.CarryIDs)+len(b.NewTeams) > 100 {
		return fail(c, fiber.NewError(400, "Too many teams"))
	}

	tx, err := h.db.Begin(c.Context())
	if err != nil {
		return fail(c, err)
	}
	defer tx.Rollback(c.Context()) //nolint:errcheck // no-op after commit

	var latest int
	if err := tx.QueryRow(c.Context(), `SELECT GREATEST(
		(SELECT COALESCE(MAX(season), 0) FROM statstracker.teams WHERE NOT is_deleted),
		(SELECT COALESCE(MAX(season), 0) FROM statstracker.games WHERE NOT is_deleted),
		(SELECT COALESCE(MAX(season), 0) FROM statstracker.seasons))`).Scan(&latest); err != nil {
		return fail(c, err)
	}
	if b.Season != latest+1 {
		return fail(c, fiber.NewError(409, fmt.Sprintf("The next season is %d", latest+1)))
	}

	names := []string{}
	if len(b.CarryIDs) > 0 {
		rows, err := tx.Query(c.Context(), `SELECT name FROM statstracker.teams WHERE id = ANY($1) AND season = $2 AND NOT is_deleted ORDER BY name`, b.CarryIDs, latest)
		if err != nil {
			return fail(c, err)
		}
		for rows.Next() {
			var n string
			if err := rows.Scan(&n); err != nil {
				rows.Close()
				return fail(c, err)
			}
			names = append(names, n)
		}
		rows.Close()
		if err := rows.Err(); err != nil {
			return fail(c, err)
		}
		if len(names) != len(b.CarryIDs) {
			return fail(c, fiber.NewError(400, fmt.Sprintf("Only Season %d teams can be carried over", latest)))
		}
	}
	names, err = cleanTeams(append(names, b.NewTeams...))
	if err != nil {
		return fail(c, err)
	}

	if _, err := tx.Exec(c.Context(), `INSERT INTO statstracker.seasons (season, league) VALUES ($1, $2)`, b.Season, b.League); err != nil {
		if isUnique(err) {
			return fail(c, fiber.NewError(409, fmt.Sprintf("Season %d has already been started", b.Season)))
		}
		return fail(c, err)
	}
	for _, n := range names {
		if _, err := tx.Exec(c.Context(), `INSERT INTO statstracker.teams (name, season, league, wins, losses, ties, is_active, version, is_deleted, created_at, updated_at)
			VALUES ($1, $2, $3, 0, 0, 0, 1, 1, false, NOW(), NOW())`, n, b.Season, b.League); err != nil {
			return fail(c, err)
		}
	}
	if err := tx.Commit(c.Context()); err != nil {
		return fail(c, err)
	}
	return c.JSON(fiber.Map{"success": true, "season": b.Season, "league": b.League, "teams": names})
}
