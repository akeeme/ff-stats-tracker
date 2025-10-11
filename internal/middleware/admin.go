package middleware

import (
	"os"

	"github.com/gofiber/fiber/v2"
)

// AdminRequired middleware checks if the request has a valid admin key
func AdminRequired() fiber.Handler {
	return func(c *fiber.Ctx) error {
		// Get the admin secret key from environment
		adminSecret := os.Getenv("ADMIN_SECRET_KEY")
		
		// If no admin secret is set, allow all requests (development mode)
		if adminSecret == "" {
			return c.Next()
		}

		// Get the admin key from the request header
		adminKey := c.Get("X-Admin-Key")

		// Check if the admin key matches
		if adminKey != adminSecret {
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
				"success": false,
				"message": "Admin access required",
				"error":   "Invalid or missing admin key",
			})
		}

		return c.Next()
	}
}
