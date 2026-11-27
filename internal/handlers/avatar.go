package handlers

import (
	"errors"
	"io"
	"log"

	"ff-stats-tracker/internal/avatar"

	"github.com/gofiber/fiber/v2"
	"github.com/jackc/pgx/v5"
)

// UploadAvatar (admin): multipart field "file" -> 512px square JPEG in the avatar bucket.
// Saves the URL on the person and deletes the previous object on replace.
func (h *Handlers) UploadAvatar(c *fiber.Ctx) error {
	if h.avatars == nil {
		return c.Status(503).JSON(fiber.Map{"success": false, "message": "Avatar storage is not configured"})
	}
	id, err := c.ParamsInt("id")
	if err != nil || id <= 0 {
		return c.Status(400).JSON(fiber.Map{"success": false, "message": "Invalid id"})
	}
	fh, err := c.FormFile("file")
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"success": false, "message": "Missing file"})
	}
	if fh.Size > avatar.MaxUploadBytes {
		return c.Status(413).JSON(fiber.Map{"success": false, "message": "Image is larger than 5 MB"})
	}
	f, err := fh.Open()
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"success": false, "message": "Could not read upload"})
	}
	data, err := io.ReadAll(io.LimitReader(f, avatar.MaxUploadBytes+1))
	f.Close()
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"success": false, "message": "Could not read upload"})
	}
	if len(data) > avatar.MaxUploadBytes {
		return c.Status(413).JSON(fiber.Map{"success": false, "message": "Image is larger than 5 MB"})
	}

	var old *string
	if err := h.db.QueryRow(c.Context(), `SELECT avatar_url FROM statstracker.people WHERE id = $1`, id).Scan(&old); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return c.Status(404).JSON(fiber.Map{"success": false, "message": "Person not found"})
		}
		log.Printf("UploadAvatar lookup: %v", err)
		return c.Status(500).JSON(fiber.Map{"success": false, "message": "Failed to upload photo"})
	}

	img, err := avatar.Process(data)
	if err != nil {
		return c.Status(415).JSON(fiber.Map{"success": false, "message": err.Error()}) // messages are ours, not user input
	}
	key, err := avatar.NewKey(id)
	if err == nil {
		err = h.avatars.Put(c.Context(), key, img)
	}
	if err != nil {
		log.Printf("UploadAvatar put: %v", err)
		return c.Status(502).JSON(fiber.Map{"success": false, "message": "Photo storage failed"})
	}
	url := h.avatars.URL(key)
	if _, err := h.db.Exec(c.Context(), `UPDATE statstracker.people SET avatar_url = $2, updated_at = NOW() WHERE id = $1`, id, url); err != nil {
		log.Printf("UploadAvatar save: %v", err)
		if derr := h.avatars.Delete(c.Context(), key); derr != nil {
			log.Printf("UploadAvatar cleanup %s: %v", key, derr)
		}
		return c.Status(500).JSON(fiber.Map{"success": false, "message": "Failed to save photo"})
	}
	if old != nil {
		if k := h.avatars.KeyFromURL(*old); k != "" {
			if err := h.avatars.Delete(c.Context(), k); err != nil {
				log.Printf("UploadAvatar delete old %s: %v", k, err) // orphan only; the new photo is saved
			}
		}
	}
	return c.JSON(fiber.Map{"success": true, "avatar_url": url})
}

// DeleteAvatar (admin): removes the photo object and clears avatar_url, so the UI falls back to initials.
// The object goes first: if storage fails, nothing changes and a retry is safe (S3 DELETE of a missing key is 204).
func (h *Handlers) DeleteAvatar(c *fiber.Ctx) error {
	id, err := c.ParamsInt("id")
	if err != nil || id <= 0 {
		return c.Status(400).JSON(fiber.Map{"success": false, "message": "Invalid id"})
	}
	var old *string
	if err := h.db.QueryRow(c.Context(), `SELECT avatar_url FROM statstracker.people WHERE id = $1`, id).Scan(&old); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return c.Status(404).JSON(fiber.Map{"success": false, "message": "Person not found"})
		}
		log.Printf("DeleteAvatar lookup: %v", err)
		return c.Status(500).JSON(fiber.Map{"success": false, "message": "Failed to remove photo"})
	}
	if old == nil || *old == "" {
		return c.JSON(fiber.Map{"success": true, "removed": false, "message": "No photo to remove"})
	}
	if h.avatars == nil {
		return c.Status(503).JSON(fiber.Map{"success": false, "message": "Avatar storage is not configured"})
	}
	// a URL outside the bucket (legacy) has no object of ours to delete; just clear it
	if k := h.avatars.KeyFromURL(*old); k != "" {
		if err := h.avatars.Delete(c.Context(), k); err != nil {
			log.Printf("DeleteAvatar %s: %v", k, err)
			return c.Status(502).JSON(fiber.Map{"success": false, "message": "Photo storage failed"})
		}
	}
	// only clear the URL we deleted, so a concurrent upload isn't wiped
	if _, err := h.db.Exec(c.Context(), `UPDATE statstracker.people SET avatar_url = NULL, updated_at = NOW() WHERE id = $1 AND avatar_url = $2`, id, *old); err != nil {
		log.Printf("DeleteAvatar save: %v", err)
		return c.Status(500).JSON(fiber.Map{"success": false, "message": "Failed to remove photo"})
	}
	return c.JSON(fiber.Map{"success": true, "removed": true})
}
