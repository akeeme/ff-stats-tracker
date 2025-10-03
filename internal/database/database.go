package database

import (
	"context"
	"fmt"
	"log"

	"ff-stats-tracker/internal/config"

	"github.com/jackc/pgx/v5"
)

type DB struct {
	Conn *pgx.Conn
}

func Connect(cfg *config.Config) (*DB, error) {
	var conn *pgx.Conn
	var err error

	// Use DATABASE_URL if provided, otherwise build from individual parameters
	if cfg.Database.Url != "" {
		log.Printf("Using DATABASE_URL for connection")
		log.Printf("Connection URL: %s", cfg.Database.Url)

		// Parse the URL and create connection config
		config, err := pgx.ParseConfig(cfg.Database.Url)
		if err != nil {
			return nil, fmt.Errorf("failed to parse DATABASE_URL: %w", err)
		}

		// Set search path
		config.RuntimeParams["search_path"] = cfg.Database.Schema

		// Connect using config
		conn, err = pgx.ConnectConfig(context.Background(), config)
		if err != nil {
			return nil, fmt.Errorf("failed to connect to database: %w", err)
		}
	} else {
		// Build connection string from individual parameters
		dsn := fmt.Sprintf("postgresql://%s:%s@%s:%d/%s?search_path=%s",
			cfg.Database.User,
			cfg.Database.Password,
			cfg.Database.Host,
			cfg.Database.Port,
			cfg.Database.Name,
			cfg.Database.Schema,
		)
		log.Printf("Built connection string from individual parameters")
		log.Printf("Connection URL: %s", dsn)

		conn, err = pgx.Connect(context.Background(), dsn)
		if err != nil {
			return nil, fmt.Errorf("failed to connect to database: %w", err)
		}
	}

	// Test the connection
	if err := conn.Ping(context.Background()); err != nil {
		conn.Close(context.Background())
		return nil, fmt.Errorf("failed to ping database: %w", err)
	}

	log.Printf("Successfully connected to database: %s@%s:%d/%s (schema: %s)",
		cfg.Database.User, cfg.Database.Host, cfg.Database.Port, cfg.Database.Name, cfg.Database.Schema)
	return &DB{Conn: conn}, nil
}

func (db *DB) Close() {
	if db.Conn != nil {
		db.Conn.Close(context.Background())
	}
}

func (db *DB) Query(ctx context.Context, sql string, args ...interface{}) (pgx.Rows, error) {
	return db.Conn.Query(ctx, sql, args...)
}

func (db *DB) QueryRow(ctx context.Context, sql string, args ...interface{}) pgx.Row {
	return db.Conn.QueryRow(ctx, sql, args...)
}

func (db *DB) Exec(ctx context.Context, sql string, args ...interface{}) (int64, error) {
	commandTag, err := db.Conn.Exec(ctx, sql, args...)
	if err != nil {
		return 0, err
	}
	return commandTag.RowsAffected(), nil
}

func (db *DB) Begin(ctx context.Context) (pgx.Tx, error) {
	return db.Conn.Begin(ctx)
}
