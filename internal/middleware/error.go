package middleware

import (
	"log"

	"github.com/gofiber/fiber/v2"
)

type ErrorResponse struct {
	Success bool   `json:"success"`
	Message string `json:"message"`
	Error   string `json:"error,omitempty"`
}

func ErrorHandler(c *fiber.Ctx, err error) error {
	code := fiber.StatusInternalServerError
	message := "Internal Server Error"

	if e, ok := err.(*fiber.Error); ok {
		code = e.Code
		message = e.Message
	}

	log.Printf("Error %d: %s", code, message)

	return c.Status(code).JSON(ErrorResponse{
		Success: false,
		Message: message,
		Error:   err.Error(),
	})
}
