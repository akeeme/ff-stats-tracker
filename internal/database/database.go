package database

import (
	"context"
	"fmt"
	"log"

	"ff-stats-tracker/internal/config"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type DB struct {
	Pool *pgxpool.Pool
}

func Connect(cfg *config.Config) (*DB, error) {
	var poolConfig *pgxpool.Config
	var err error

	// Use DATABASE_URL if provided, otherwise build from individual parameters
	if cfg.Database.Url != "" {
		log.Printf("Using DATABASE_URL for connection")
		log.Printf("Connection URL: %s", cfg.Database.Url)

		// Parse the URL and create pool config
		poolConfig, err = pgxpool.ParseConfig(cfg.Database.Url)
		if err != nil {
			return nil, fmt.Errorf("failed to parse DATABASE_URL: %w", err)
		}

		// Set search path
		poolConfig.ConnConfig.RuntimeParams["search_path"] = cfg.Database.Schema
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

		poolConfig, err = pgxpool.ParseConfig(dsn)
		if err != nil {
			return nil, fmt.Errorf("failed to parse connection string: %w", err)
		}
	}

	// Create connection pool
	pool, err := pgxpool.NewWithConfig(context.Background(), poolConfig)
	if err != nil {
		return nil, fmt.Errorf("failed to create connection pool: %w", err)
	}

	// Test the connection
	if err := pool.Ping(context.Background()); err != nil {
		pool.Close()
		return nil, fmt.Errorf("failed to ping database: %w", err)
	}

	log.Printf("Successfully connected to database: %s@%s:%d/%s (schema: %s)",
		cfg.Database.User, cfg.Database.Host, cfg.Database.Port, cfg.Database.Name, cfg.Database.Schema)
	return &DB{Pool: pool}, nil
}

func (db *DB) Close() {
	if db.Pool != nil {
		db.Pool.Close()
	}
}

func (db *DB) Query(ctx context.Context, sql string, args ...interface{}) (pgx.Rows, error) {
	return db.Pool.Query(ctx, sql, args...)
}

func (db *DB) QueryRow(ctx context.Context, sql string, args ...interface{}) pgx.Row {
	return db.Pool.QueryRow(ctx, sql, args...)
}

func (db *DB) Exec(ctx context.Context, sql string, args ...interface{}) (int64, error) {
	commandTag, err := db.Pool.Exec(ctx, sql, args...)
	if err != nil {
		return 0, err
	}
	return commandTag.RowsAffected(), nil
}

func (db *DB) Begin(ctx context.Context) (pgx.Tx, error) {
	return db.Pool.Begin(ctx)
}
