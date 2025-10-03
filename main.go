package main

import (
	"log"
	"os"

	"ff-stats-tracker/internal/config"
	"ff-stats-tracker/internal/database"
	"ff-stats-tracker/internal/handlers"
	"ff-stats-tracker/internal/middleware"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/joho/godotenv"
)

func main() {
	// Load environment variables
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using system environment variables")
	} else {
		log.Println("Successfully loaded .env file")
	}

	// Debug: Check environment variables
	log.Printf("DATABASE_URL from env: %s", os.Getenv("DATABASE_URL"))
	log.Printf("DB_HOST from env: %s", os.Getenv("DB_HOST"))

	// Load configuration
	cfg := config.Load()

	// Initialize database
	db, err := database.Connect(cfg)
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}
	defer db.Close()

	// Run migrations
	if err := database.Migrate(db); err != nil {
		log.Fatal("Failed to run migrations:", err)
	}

	// Create Fiber app
	app := fiber.New(fiber.Config{
		ErrorHandler: middleware.ErrorHandler,
	})

	// Middleware
	app.Use(logger.New())
	app.Use(cors.New())

	// Initialize handlers
	h := handlers.New(db)

	// Routes
	api := app.Group("/api")
	h.SetupRoutes(api)

	// Start server
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Server starting on port %s", port)
	log.Fatal(app.Listen(":" + port))
}
