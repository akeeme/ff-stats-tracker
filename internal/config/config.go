package config

import (
	"fmt"
	"os"
	"strconv"
)

type Config struct {
	Database DatabaseConfig
	Server   ServerConfig
}

type DatabaseConfig struct {
	Host     string
	Port     int
	User     string
	Password string
	Name     string
	Schema   string
	Url      string
}

type ServerConfig struct {
	Port string
}

func Load() *Config {
	port, _ := strconv.Atoi(getEnv("DB_PORT", "5432"))

	// Debug: Check if .env is being loaded
	databaseUrl := getEnv("DATABASE_URL", "")
	if databaseUrl == "" {
		fmt.Println("WARNING: DATABASE_URL not found in environment variables")
	} else {
		fmt.Printf("Found DATABASE_URL: %s\n", databaseUrl[:50]+"...") // Show first 50 chars
	}

	return &Config{
		Database: DatabaseConfig{
			Host:     getEnv("DB_HOST", "localhost"),
			Port:     port,
			User:     getEnv("DB_USER", "postgres"),
			Password: getEnv("DB_PASSWORD", ""),
			Name:     getEnv("DB_NAME", "ff_stats"),
			Schema:   getEnv("DB_SCHEMA", "statstracker"),
			Url:      databaseUrl,
		},
		Server: ServerConfig{
			Port: getEnv("PORT", "8080"),
		},
	}
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
