package handlers

import (
	"fmt"
	"log"
	"os"
	"strings"
	"time"
	"unicode/utf8"

	"ff-stats-tracker/internal/middleware"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/limiter"
	"github.com/google/uuid"
)

// ---- people (one row per human; players rows are per-season roster rows) ----

type person struct {
	ID        int     `json:"id"`
	Name      string  `json:"name"`
	Nickname  *string `json:"nickname"`
	Bio       *string `json:"bio"`
	AvatarURL *string `json:"avatar_url"`
}

func (h *Handlers) GetPeople(c *fiber.Ctx) error {
	rows, err := h.db.Query(c.Context(), `SELECT id, name, nickname, bio, avatar_url FROM statstracker.people ORDER BY name`)
	if err != nil {
		log.Printf("GetPeople: %v", err)
		return c.Status(500).JSON(fiber.Map{"success": false, "message": "Failed to fetch people"})
	}
	defer rows.Close()
	out := []person{}
	for rows.Next() {
		var p person
		if err := rows.Scan(&p.ID, &p.Name, &p.Nickname, &p.Bio, &p.AvatarURL); err != nil {
			log.Printf("GetPeople scan: %v", err)
			return c.Status(500).JSON(fiber.Map{"success": false, "message": "Failed to fetch people"})
		}
		out = append(out, p)
	}
	return c.JSON(out)
}

// UpdatePerson (admin): nickname, bio, avatar_url. Empty string clears a field.
func (h *Handlers) UpdatePerson(c *fiber.Ctx) error {
	id, err := c.ParamsInt("id")
	if err != nil || id <= 0 {
		return c.Status(400).JSON(fiber.Map{"success": false, "message": "Invalid id"})
	}
	var b struct {
		Nickname  *string `json:"nickname"`
		Bio       *string `json:"bio"`
		AvatarURL *string `json:"avatar_url"`
	}
	if err := c.BodyParser(&b); err != nil {
		return c.Status(400).JSON(fiber.Map{"success": false, "message": "Invalid request body"})
	}
	if msg := validatePerson(b.Nickname, b.Bio, b.AvatarURL); msg != "" {
		return c.Status(400).JSON(fiber.Map{"success": false, "message": msg})
	}
	// nil = leave unchanged, "" = clear
	n, err := h.db.Exec(c.Context(), `
		UPDATE statstracker.people SET
		  nickname   = CASE WHEN $2::text IS NULL THEN nickname   ELSE NULLIF($2, '') END,
		  bio        = CASE WHEN $3::text IS NULL THEN bio        ELSE NULLIF($3, '') END,
		  avatar_url = CASE WHEN $4::text IS NULL THEN avatar_url ELSE NULLIF($4, '') END,
		  updated_at = NOW()
		WHERE id = $1`, id, b.Nickname, b.Bio, b.AvatarURL)
	if err != nil {
		log.Printf("UpdatePerson: %v", err)
		return c.Status(500).JSON(fiber.Map{"success": false, "message": "Failed to update person"})
	}
	if n == 0 {
		return c.Status(404).JSON(fiber.Map{"success": false, "message": "Person not found"})
	}
	return c.JSON(fiber.Map{"success": true})
}

func validatePerson(nick, bio, avatar *string) string {
	if nick != nil && utf8.RuneCountInString(*nick) > 60 {
		return "nickname too long (60 max)"
	}
	if bio != nil && utf8.RuneCountInString(*bio) > 280 {
		return "bio too long (280 max)"
	}
	if avatar != nil && *avatar != "" {
		allowed := os.Getenv("AVATAR_URL_PREFIX") // e.g. https://s3-api.keemlab.com/rhinos-avatars/
		if len(*avatar) > 500 || !strings.HasPrefix(*avatar, "https://") || (allowed != "" && !strings.HasPrefix(*avatar, allowed)) {
			return "avatar_url must be an https URL from the avatar bucket"
		}
	}
	return ""
}

// ---- reactions + MVP poll: no logins, one per device (random httpOnly cookie) + IP rate limit ----

const deviceCookie = "rhinos_did"

func deviceID(c *fiber.Ctx) string {
	if id, err := uuid.Parse(c.Cookies(deviceCookie)); err == nil {
		return id.String()
	}
	id, err := uuid.NewRandom()
	if err != nil {
		return ""
	}
	c.Cookie(&fiber.Cookie{Name: deviceCookie, Value: id.String(), Path: "/api", MaxAge: 400 * 24 * 3600,
		HTTPOnly: true, SameSite: "Lax", Secure: os.Getenv("COOKIE_INSECURE") != "1"})
	return id.String()
}

// SocialLimiter: 20 writes/min per client IP.
func SocialLimiter() fiber.Handler {
	return limiter.New(limiter.Config{Max: 20, Expiration: time.Minute, KeyGenerator: middleware.ClientIP,
		LimitReached: func(c *fiber.Ctx) error {
			return c.Status(429).JSON(fiber.Map{"success": false, "message": "Slow down"})
		}})
}

func (h *Handlers) gameSeason(c *fiber.Ctx) (int, int, error) {
	id, err := c.ParamsInt("id")
	if err != nil || id <= 0 {
		return 0, 0, fiber.NewError(400, "Invalid game id")
	}
	var season int
	if err := h.db.QueryRow(c.Context(), `SELECT season FROM statstracker.games WHERE id = $1 AND NOT is_deleted`, id).Scan(&season); err != nil {
		return 0, 0, fiber.NewError(404, "Game not found")
	}
	return id, season, nil
}

func fail(c *fiber.Ctx, err error) error {
	if fe, ok := err.(*fiber.Error); ok {
		return c.Status(fe.Code).JSON(fiber.Map{"success": false, "message": fe.Message})
	}
	log.Printf("social: %v", err)
	return c.Status(500).JSON(fiber.Map{"success": false, "message": "Something went wrong"})
}

func (h *Handlers) GetGameSocial(c *fiber.Ctx) error {
	gid, _, err := h.gameSeason(c)
	if err != nil {
		return fail(c, err)
	}
	dev := deviceID(c)
	type tally struct {
		PersonID int `json:"person_id"`
		Votes    int `json:"votes"`
	}
	mvp := []tally{}
	var myVote *int
	rows, err := h.db.Query(c.Context(), `SELECT person_id, count(*), bool_or(device_id::text = $2) FROM statstracker.mvp_votes WHERE game_id = $1 GROUP BY person_id ORDER BY 2 DESC`, gid, dev)
	if err != nil {
		return fail(c, err)
	}
	defer rows.Close()
	for rows.Next() {
		var t tally
		var me bool
		if err := rows.Scan(&t.PersonID, &t.Votes, &me); err != nil {
			return fail(c, err)
		}
		if me {
			v := t.PersonID
			myVote = &v
		}
		mvp = append(mvp, t)
	}
	return c.JSON(fiber.Map{"mvp": mvp, "my_vote": myVote})
}

// VoteMVP: POST /games/:id/mvp {"person_id": 25, "voter_name": "Akeeme"}  (one vote per device, can change)
func (h *Handlers) VoteMVP(c *fiber.Ctx) error {
	gid, season, err := h.gameSeason(c)
	if err != nil {
		return fail(c, err)
	}
	var b struct {
		PersonID  int    `json:"person_id"`
		VoterName string `json:"voter_name"`
	}
	if err := c.BodyParser(&b); err != nil || b.PersonID <= 0 || utf8.RuneCountInString(b.VoterName) > 60 {
		return fail(c, fiber.NewError(400, "Invalid vote"))
	}
	var ok bool
	if err := h.db.QueryRow(c.Context(), `SELECT EXISTS (SELECT 1 FROM statstracker.players WHERE canonical_player_id=$1 AND season=$2 AND NOT is_deleted)`, b.PersonID, season).Scan(&ok); err != nil {
		return fail(c, err)
	}
	if !ok {
		return fail(c, fiber.NewError(400, "Player wasn't on the roster that season"))
	}
	dev := deviceID(c)
	if dev == "" {
		return fail(c, fmt.Errorf("no device id"))
	}
	if _, err := h.db.Exec(c.Context(), `
		INSERT INTO statstracker.mvp_votes (game_id, device_id, person_id, voter_name) VALUES ($1,$2,$3,NULLIF($4,''))
		ON CONFLICT (game_id, device_id) DO UPDATE SET person_id = EXCLUDED.person_id, voter_name = EXCLUDED.voter_name, created_at = NOW()`,
		gid, dev, b.PersonID, strings.TrimSpace(b.VoterName)); err != nil {
		return fail(c, err)
	}
	return c.JSON(fiber.Map{"success": true})
}
