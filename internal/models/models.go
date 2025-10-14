package models

import (
	"time"
)

// BaseModel represents common fields for all models
type BaseModel struct {
	Version   int        `json:"version" db:"version"`
	IsDeleted bool       `json:"is_deleted" db:"is_deleted"`
	CreatedAt time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt time.Time  `json:"updated_at" db:"updated_at"`
	DeletedAt *time.Time `json:"deleted_at" db:"deleted_at"`
}

// Team represents a team in the system
type Team struct {
	ID          int    `json:"id" db:"id"`
	Name        string `json:"name" db:"name"`
	Season      int    `json:"season" db:"season"`
	League      string `json:"league" db:"league"`
	Wins        int    `json:"wins" db:"wins"`
	Losses      int    `json:"losses" db:"losses"`
	Ties        int    `json:"ties" db:"ties"`
	IsActive    int    `json:"is_active" db:"is_active"`
	DisplayName string `json:"display_name"`
	BaseModel
}

// Player represents a player in the system
type Player struct {
	ID                int     `json:"id" db:"id"`
	Name              string  `json:"name" db:"name"`
	TeamID            int     `json:"team_id" db:"team_id"`
	Season            int     `json:"season" db:"season"`
	IsActive          bool    `json:"is_active" db:"is_active"`
	JerseyNumber      *string `json:"jersey_number" db:"jersey_number"`
	CanonicalPlayerID *int    `json:"canonical_player_id" db:"canonical_player_id"`
	BaseModel
}

// Game represents a game in the system
type Game struct {
	ID            int    `json:"id" db:"id"`
	Week          int    `json:"week" db:"week"`
	League        string `json:"league" db:"league"`
	Season        int    `json:"season" db:"season"`
	GameType      string `json:"game_type" db:"game_type"` // regular, playoff, championship
	Team1ID       *int   `json:"team1_id" db:"team1_id"`
	Team1Score    int    `json:"team1_score" db:"team1_score"`
	Team2ID       *int   `json:"team2_id" db:"team2_id"`
	Team2Score    int    `json:"team2_score" db:"team2_score"`
	WinningTeamID *int   `json:"winning_team_id" db:"winning_team_id"`
	BaseModel
}

// PlayerStats represents player statistics for a game
type PlayerStats struct {
	ID int `json:"id" db:"id"`

	// General
	PlayerID int `json:"player_id" db:"player_id"`
	GameID   int `json:"game_id" db:"game_id"`

	// QB stats
	PassingTDs          int `json:"passing_tds" db:"passing_tds"`
	PassesCompleted     int `json:"passes_completed" db:"passes_completed"`
	PassesAttempted     int `json:"passes_attempted" db:"passes_attempted"`
	InterceptionsThrown int `json:"interceptions_thrown" db:"interceptions_thrown"`

	// WR stats
	Receptions   int `json:"receptions" db:"receptions"`
	Targets      int `json:"targets" db:"targets"`
	ReceivingTDs int `json:"receiving_tds" db:"receiving_tds"`
	Drops        int `json:"drops" db:"drops"`
	FirstDowns   int `json:"first_downs" db:"first_downs"`

	// RB stats
	RushingTDs   int `json:"rushing_tds" db:"rushing_tds"`
	RushAttempts int `json:"rush_attempts" db:"rush_attempts"`

	// Defense stats
	FlagPulls     int `json:"flag_pulls" db:"flag_pulls"`
	Sacks         int `json:"sacks" db:"sacks"`
	Interceptions int `json:"interceptions" db:"interceptions"`
	PassBreakups  int `json:"pass_breakups" db:"pass_breakups"`
	DefTD         int `json:"def_td" db:"def_td"`

	BaseModel
}

// Response types for API
type BaseResponse struct {
	Success bool   `json:"success"`
	Message string `json:"message,omitempty"`
}

type TeamResponse struct {
	BaseResponse
	Data *Team `json:"data,omitempty"`
}

type PlayerResponse struct {
	BaseResponse
	Data *Player `json:"data,omitempty"`
}

type GameResponse struct {
	BaseResponse
	Data *Game `json:"data,omitempty"`
}

type PlayerStatsResponse struct {
	BaseResponse
	Data *PlayerStats `json:"data,omitempty"`
}

// Extended response types with relationships
type TeamWithPlayers struct {
	Team
	Players []Player `json:"players"`
}

type PlayerWithTeam struct {
	Player
	TeamName string `json:"team_name"`
}

type GameWithTeams struct {
	Game
	Team1Name       string  `json:"team1_name"`
	Team2Name       string  `json:"team2_name"`
	WinningTeamName *string `json:"winning_team_name"`
}

type PlayerStatsWithDetails struct {
	PlayerStats
	PlayerName string `json:"player_name"`
	GameWeek   int    `json:"game_week"`
	GameSeason int    `json:"game_season"`
	League     string `json:"league"`
	Team1Name  string `json:"team1_name"`
	Team2Name  string `json:"team2_name"`
}
