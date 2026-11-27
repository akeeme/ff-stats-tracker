package handlers

import (
	"errors"
	"io"
	"log"
	"regexp"
	"strconv"
	"strings"
	"unicode"
	"unicode/utf8"

	"ff-stats-tracker/internal/avatar"
	"ff-stats-tracker/internal/middleware"

	"github.com/gofiber/fiber/v2"
	"github.com/jackc/pgx/v5"
)

// Reactions on any card. The catalog (statstracker.reactions) is data, edited at /admin/reactions.
// Each device can put each reaction once on each target (target_type + target_id).

type reactionType struct {
	Code      string `json:"code"`
	Label     string `json:"label"`
	Kind      string `json:"kind"` // unicode | image
	Value     string `json:"value"`
	Category  string `json:"category"`
	SortOrder int    `json:"sort_order"`
	Active    bool   `json:"active"`
	Uses      *int   `json:"uses,omitempty"` // admin list only
}

var (
	codeRe     = regexp.MustCompile(`^[a-z0-9_]{1,32}$`)
	targetKind = map[string]string{ // target_type -> existence check
		"game":   `SELECT EXISTS (SELECT 1 FROM statstracker.games WHERE id = $1 AND NOT is_deleted)`,
		"stat":   `SELECT EXISTS (SELECT 1 FROM statstracker.player_stats WHERE id = $1 AND NOT is_deleted)`,
		"person": `SELECT EXISTS (SELECT 1 FROM statstracker.people WHERE id = $1)`,
	}
)

const maxTargets = 100

// GetReactionTypes: active catalog in order. ?all=1 (admin) adds hidden ones and usage counts.
func (h *Handlers) GetReactionTypes(c *fiber.Ctx) error {
	all := c.Query("all") == "1"
	if all && !middleware.IsAdmin(c) {
		return c.Status(403).JSON(fiber.Map{"success": false, "message": "Admin only"})
	}
	rows, err := h.db.Query(c.Context(), `
		SELECT r.code, r.label, r.kind, r.value, r.category, r.sort_order, r.active,
		       (SELECT count(*) FROM statstracker.target_reactions t WHERE t.code = r.code)::int
		FROM statstracker.reactions r WHERE $1 OR r.active ORDER BY r.sort_order, r.code`, all)
	if err != nil {
		return fail(c, err)
	}
	defer rows.Close()
	out := []reactionType{}
	for rows.Next() {
		var r reactionType
		var uses int
		if err := rows.Scan(&r.Code, &r.Label, &r.Kind, &r.Value, &r.Category, &r.SortOrder, &r.Active, &uses); err != nil {
			return fail(c, err)
		}
		if all {
			r.Uses = &uses
		}
		out = append(out, r)
	}
	if err := rows.Err(); err != nil {
		return fail(c, err)
	}
	return c.JSON(out)
}

// parseTargets reads "game:27,stat:101" into parallel slices.
func parseTargets(s string) (types []string, ids []int, err error) {
	for _, t := range strings.Split(s, ",") {
		if t == "" {
			continue
		}
		kind, idStr, ok := strings.Cut(t, ":")
		id, e := strconv.Atoi(idStr)
		if _, known := targetKind[kind]; !ok || !known || e != nil || id <= 0 {
			return nil, nil, fiber.NewError(400, "Invalid target "+strconv.Quote(t))
		}
		types, ids = append(types, kind), append(ids, id)
	}
	if len(types) > maxTargets {
		return nil, nil, fiber.NewError(400, "Too many targets")
	}
	return types, ids, nil
}

type targetCounts struct {
	Counts map[string]int `json:"counts"`
	Mine   []string       `json:"mine"`
}

// GetReactionCounts: GET /reactions/counts?t=game:27,stat:101 -> {"game:27": {"counts": {"fire": 3}, "mine": ["fire"]}}
// Only active reactions count. Targets with no reactions are left out.
func (h *Handlers) GetReactionCounts(c *fiber.Ctx) error {
	types, ids, err := parseTargets(c.Query("t"))
	if err != nil {
		return fail(c, err)
	}
	out := map[string]*targetCounts{}
	if len(types) == 0 {
		return c.JSON(out)
	}
	dev := deviceID(c)
	rows, err := h.db.Query(c.Context(), `
		SELECT t.target_type, t.target_id, t.code, count(*)::int, bool_or(t.device_id::text = $3)
		FROM statstracker.target_reactions t JOIN statstracker.reactions r ON r.code = t.code AND r.active
		WHERE (t.target_type, t.target_id) IN (SELECT * FROM unnest($1::text[], $2::int[]))
		GROUP BY 1, 2, 3`, types, ids, dev)
	if err != nil {
		return fail(c, err)
	}
	defer rows.Close()
	for rows.Next() {
		var kind, code string
		var id, n int
		var me bool
		if err := rows.Scan(&kind, &id, &code, &n, &me); err != nil {
			return fail(c, err)
		}
		k := kind + ":" + strconv.Itoa(id)
		tc := out[k]
		if tc == nil {
			tc = &targetCounts{Counts: map[string]int{}, Mine: []string{}}
			out[k] = tc
		}
		tc.Counts[code] = n
		if me {
			tc.Mine = append(tc.Mine, code)
		}
	}
	if err := rows.Err(); err != nil {
		return fail(c, err)
	}
	return c.JSON(out)
}

// ToggleTargetReaction: POST /reactions/toggle {"target_type":"stat","target_id":101,"code":"fire"}
func (h *Handlers) ToggleTargetReaction(c *fiber.Ctx) error {
	var b struct {
		TargetType string `json:"target_type"`
		TargetID   int    `json:"target_id"`
		Code       string `json:"code"`
	}
	if err := c.BodyParser(&b); err != nil || !codeRe.MatchString(b.Code) || b.TargetID <= 0 {
		return fail(c, fiber.NewError(400, "Invalid reaction"))
	}
	check, ok := targetKind[b.TargetType]
	if !ok {
		return fail(c, fiber.NewError(400, "Invalid reaction"))
	}
	var exists, active bool
	if err := h.db.QueryRow(c.Context(), check, b.TargetID).Scan(&exists); err != nil {
		return fail(c, err)
	}
	if !exists {
		return fail(c, fiber.NewError(404, "Not found"))
	}
	if err := h.db.QueryRow(c.Context(), `SELECT EXISTS (SELECT 1 FROM statstracker.reactions WHERE code = $1 AND active)`, b.Code).Scan(&active); err != nil {
		return fail(c, err)
	}
	if !active {
		return fail(c, fiber.NewError(400, "Unsupported reaction"))
	}
	dev := deviceID(c)
	if dev == "" {
		return fail(c, errors.New("no device id"))
	}
	n, err := h.db.Exec(c.Context(), `DELETE FROM statstracker.target_reactions WHERE target_type=$1 AND target_id=$2 AND device_id=$3 AND code=$4`,
		b.TargetType, b.TargetID, dev, b.Code)
	if err != nil {
		return fail(c, err)
	}
	if n == 0 {
		if _, err := h.db.Exec(c.Context(), `INSERT INTO statstracker.target_reactions (target_type, target_id, device_id, code) VALUES ($1,$2,$3,$4) ON CONFLICT DO NOTHING`,
			b.TargetType, b.TargetID, dev, b.Code); err != nil {
			return fail(c, err)
		}
	}
	return c.JSON(fiber.Map{"success": true, "on": n == 0})
}

// ---- admin catalog ----

func validEmoji(v string) bool {
	if v == "" || len(v) > 32 || !utf8.ValidString(v) {
		return false
	}
	for _, r := range v {
		if r < 0x80 || unicode.IsSpace(r) { // emoji only: no ASCII text, markup or spaces
			return false
		}
	}
	return true
}

func cleanLabel(s string) (string, bool) {
	s = strings.TrimSpace(s)
	return s, s != "" && utf8.RuneCountInString(s) <= 60
}

func cleanCategory(s string) (string, bool) {
	s = strings.ToLower(strings.TrimSpace(s))
	if s == "" {
		s = "general"
	}
	return s, codeRe.MatchString(s) && len(s) <= 30
}

// CreateReactionType (admin): multipart or form fields code, label, category, and either
// value (an emoji) or file (png/webp/jpeg, <= 500 KB, stored as a 128px transparent square PNG).
func (h *Handlers) CreateReactionType(c *fiber.Ctx) error {
	code := strings.ToLower(strings.TrimSpace(c.FormValue("code")))
	label, okL := cleanLabel(c.FormValue("label"))
	cat, okC := cleanCategory(c.FormValue("category"))
	if !codeRe.MatchString(code) {
		return fail(c, fiber.NewError(400, "Code must be 1-32 lowercase letters, digits or _"))
	}
	if !okL || !okC {
		return fail(c, fiber.NewError(400, "Label (60 max) and category (a-z, 0-9, _) are required"))
	}
	var taken bool
	if err := h.db.QueryRow(c.Context(), `SELECT EXISTS (SELECT 1 FROM statstracker.reactions WHERE code = $1)`, code).Scan(&taken); err != nil {
		return fail(c, err)
	}
	if taken {
		return fail(c, fiber.NewError(409, "That code is already used"))
	}

	kind, value, key := "unicode", strings.TrimSpace(c.FormValue("value")), ""
	if fh, err := c.FormFile("file"); err == nil {
		if h.avatars == nil {
			return fail(c, fiber.NewError(503, "Image storage is not configured"))
		}
		if fh.Size > avatar.IconMaxBytes {
			return fail(c, fiber.NewError(413, "Image is larger than 500 KB"))
		}
		f, err := fh.Open()
		if err != nil {
			return fail(c, fiber.NewError(400, "Could not read upload"))
		}
		data, err := io.ReadAll(io.LimitReader(f, avatar.IconMaxBytes+1))
		f.Close()
		if err != nil {
			return fail(c, fiber.NewError(400, "Could not read upload"))
		}
		img, err := avatar.ProcessIcon(data)
		if err != nil {
			return fail(c, fiber.NewError(415, err.Error())) // our own messages
		}
		if key, err = avatar.NewIconKey(code); err == nil {
			err = h.avatars.Put(c.Context(), key, img)
		}
		if err != nil {
			log.Printf("reaction icon put: %v", err)
			return fail(c, fiber.NewError(502, "Image storage failed"))
		}
		kind, value = "image", h.avatars.URL(key)
	} else if !validEmoji(value) {
		return fail(c, fiber.NewError(400, "Pick an emoji or upload an image"))
	}

	_, err := h.db.Exec(c.Context(), `
		INSERT INTO statstracker.reactions (code, label, kind, value, category, sort_order)
		VALUES ($1, $2, $3, $4, $5, (SELECT COALESCE(MAX(sort_order), 0) + 10 FROM statstracker.reactions))`,
		code, label, kind, value, cat)
	if err != nil {
		if key != "" {
			if derr := h.avatars.Delete(c.Context(), key); derr != nil {
				log.Printf("reaction icon cleanup %s: %v", key, derr)
			}
		}
		return fail(c, err)
	}
	return c.JSON(fiber.Map{"success": true, "code": code, "kind": kind, "value": value})
}

// UpdateReactionType (admin): PUT /reactions/:code {"label","category","active"}; omitted fields stay.
func (h *Handlers) UpdateReactionType(c *fiber.Ctx) error {
	var b struct {
		Label    *string `json:"label"`
		Category *string `json:"category"`
		Active   *bool   `json:"active"`
	}
	if err := c.BodyParser(&b); err != nil {
		return fail(c, fiber.NewError(400, "Invalid request body"))
	}
	if b.Label != nil {
		l, ok := cleanLabel(*b.Label)
		if !ok {
			return fail(c, fiber.NewError(400, "Label is required (60 max)"))
		}
		b.Label = &l
	}
	if b.Category != nil {
		cat, ok := cleanCategory(*b.Category)
		if !ok {
			return fail(c, fiber.NewError(400, "Category: a-z, 0-9, _"))
		}
		b.Category = &cat
	}
	n, err := h.db.Exec(c.Context(), `UPDATE statstracker.reactions SET
		label = COALESCE($2, label), category = COALESCE($3, category), active = COALESCE($4, active) WHERE code = $1`,
		c.Params("code"), b.Label, b.Category, b.Active)
	if err != nil {
		return fail(c, err)
	}
	if n == 0 {
		return fail(c, fiber.NewError(404, "Reaction not found"))
	}
	return c.JSON(fiber.Map{"success": true})
}

// ReorderReactionTypes (admin): PUT /reactions/order {"codes":["fire","rhino",...]}; listed codes get 10, 20, ...
func (h *Handlers) ReorderReactionTypes(c *fiber.Ctx) error {
	var b struct {
		Codes []string `json:"codes"`
	}
	if err := c.BodyParser(&b); err != nil || len(b.Codes) == 0 || len(b.Codes) > 500 {
		return fail(c, fiber.NewError(400, "Invalid order"))
	}
	if _, err := h.db.Exec(c.Context(), `
		UPDATE statstracker.reactions r SET sort_order = o.n * 10
		FROM unnest($1::text[]) WITH ORDINALITY AS o(code, n) WHERE r.code = o.code`, b.Codes); err != nil {
		return fail(c, err)
	}
	return c.JSON(fiber.Map{"success": true})
}

// DeleteReactionType (admin): never used -> deleted (with its image); used -> hidden, so nobody's
// reactions are lost. Hidden ones can be shown again from the admin page.
func (h *Handlers) DeleteReactionType(c *fiber.Ctx) error {
	code := c.Params("code")
	var kind, value string
	var uses int
	err := h.db.QueryRow(c.Context(), `SELECT kind, value, (SELECT count(*) FROM statstracker.target_reactions WHERE code = $1)::int
		FROM statstracker.reactions WHERE code = $1`, code).Scan(&kind, &value, &uses)
	if errors.Is(err, pgx.ErrNoRows) {
		return fail(c, fiber.NewError(404, "Reaction not found"))
	}
	if err != nil {
		return fail(c, err)
	}
	if uses > 0 {
		if _, err := h.db.Exec(c.Context(), `UPDATE statstracker.reactions SET active = false WHERE code = $1`, code); err != nil {
			return fail(c, err)
		}
		return c.JSON(fiber.Map{"success": true, "deleted": false, "hidden": true, "uses": uses})
	}
	// the FK from target_reactions makes this fail (not cascade) if someone reacted in the meantime
	if _, err := h.db.Exec(c.Context(), `DELETE FROM statstracker.reactions WHERE code = $1`, code); err != nil {
		return fail(c, err)
	}
	if kind == "image" && h.avatars != nil {
		if k := h.avatars.KeyFromURL(value); k != "" {
			if err := h.avatars.Delete(c.Context(), k); err != nil {
				log.Printf("reaction icon delete %s: %v", k, err) // orphan object only
			}
		}
	}
	return c.JSON(fiber.Map{"success": true, "deleted": true})
}
