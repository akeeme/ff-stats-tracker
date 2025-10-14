package models

// Request types for API endpoints

// Team requests
type TeamCreateRequest struct {
	Name     string `json:"name" validate:"required"`
	Season   int    `json:"season" validate:"required"`
	League   string `json:"league" validate:"required"`
	Wins     *int   `json:"wins,omitempty"`
	Losses   *int   `json:"losses,omitempty"`
	Ties     *int   `json:"ties,omitempty"`
	IsActive *int   `json:"is_active,omitempty"`
}

type TeamUpdateRequest struct {
	Name     *string `json:"name,omitempty"`
	Season   *int    `json:"season,omitempty"`
	League   *string `json:"league,omitempty"`
	Wins     *int    `json:"wins,omitempty"`
	Losses   *int    `json:"losses,omitempty"`
	Ties     *int    `json:"ties,omitempty"`
	IsActive *int    `json:"is_active,omitempty"`
}

// Player requests
type PlayerCreateRequest struct {
	Name         string  `json:"name" validate:"required"`
	TeamName     string  `json:"team_name" validate:"required"`
	Season       int     `json:"season" validate:"required"`
	IsActive     *bool   `json:"is_active,omitempty"`
	JerseyNumber *string `json:"jersey_number,omitempty"`
}

type PlayerUpdateRequest struct {
	Name         *string `json:"name,omitempty"`
	TeamName     *string `json:"team_name,omitempty"`
	TeamID       *int    `json:"team_id,omitempty"`
	Season       *int    `json:"season,omitempty"`
	IsActive     *bool   `json:"is_active,omitempty"`
	JerseyNumber *string `json:"jersey_number,omitempty"`
}

// Game requests
type GameCreateRequest struct {
	Week            int     `json:"week" validate:"required"`
	League          string  `json:"league" validate:"required"`
	Season          int     `json:"season" validate:"required"`
	GameType        string  `json:"game_type"` // regular, playoff, championship (defaults to regular)
	Team1Name       string  `json:"team1_name" validate:"required"`
	Team1Score      *int    `json:"team1_score,omitempty"`
	Team2Name       string  `json:"team2_name" validate:"required"`
	Team2Score      *int    `json:"team2_score,omitempty"`
	WinningTeamName *string `json:"winning_team_name,omitempty"`
}

type GameUpdateRequest struct {
	Week            *int    `json:"week,omitempty"`
	League          *string `json:"league,omitempty"`
	Season          *int    `json:"season,omitempty"`
	GameType        *string `json:"game_type,omitempty"` // regular, playoff, championship
	Team1Name       *string `json:"team1_name,omitempty"`
	Team1ID         *int    `json:"team1_id,omitempty"`
	Team1Score      *int    `json:"team1_score,omitempty"`
	Team2Name       *string `json:"team2_name,omitempty"`
	Team2ID         *int    `json:"team2_id,omitempty"`
	Team2Score      *int    `json:"team2_score,omitempty"`
	WinningTeamName *string `json:"winning_team_name,omitempty"`
	WinningTeamID   *int    `json:"winning_team_id,omitempty"`
}

// PlayerStats requests
type PlayerStatsCreateRequest struct {
	PlayerName string `json:"player_name" validate:"required"`
	GameWeek   int    `json:"game_week" validate:"required"`
	GameSeason int    `json:"game_season" validate:"required"`
	League     string `json:"league" validate:"required"`
	Team1Name  string `json:"team1_name" validate:"required"`
	Team2Name  string `json:"team2_name" validate:"required"`

	// QB stats
	PassingTDs          *int `json:"passing_tds,omitempty"`
	PassesCompleted     *int `json:"passes_completed,omitempty"`
	PassesAttempted     *int `json:"passes_attempted,omitempty"`
	InterceptionsThrown *int `json:"interceptions_thrown,omitempty"`

	// WR stats
	Receptions   *int `json:"receptions,omitempty"`
	Targets      *int `json:"targets,omitempty"`
	ReceivingTDs *int `json:"receiving_tds,omitempty"`
	Drops        *int `json:"drops,omitempty"`
	FirstDowns   *int `json:"first_downs,omitempty"`

	// RB stats
	RushingTDs   *int `json:"rushing_tds,omitempty"`
	RushAttempts *int `json:"rush_attempts,omitempty"`

	// Defense stats
	FlagPulls     *int `json:"flag_pulls,omitempty"`
	Sacks         *int `json:"sacks,omitempty"`
	Interceptions *int `json:"interceptions,omitempty"`
	PassBreakups  *int `json:"pass_breakups,omitempty"`
	DefTD         *int `json:"def_td,omitempty"`
}

type PlayerStatsUpdateRequest struct {
	// QB stats
	PassingTDs          *int `json:"passing_tds,omitempty"`
	PassesCompleted     *int `json:"passes_completed,omitempty"`
	PassesAttempted     *int `json:"passes_attempted,omitempty"`
	InterceptionsThrown *int `json:"interceptions_thrown,omitempty"`

	// WR stats
	Receptions   *int `json:"receptions,omitempty"`
	Targets      *int `json:"targets,omitempty"`
	ReceivingTDs *int `json:"receiving_tds,omitempty"`
	Drops        *int `json:"drops,omitempty"`
	FirstDowns   *int `json:"first_downs,omitempty"`

	// RB stats
	RushingTDs   *int `json:"rushing_tds,omitempty"`
	RushAttempts *int `json:"rush_attempts,omitempty"`

	// Defense stats
	FlagPulls     *int `json:"flag_pulls,omitempty"`
	Sacks         *int `json:"sacks,omitempty"`
	Interceptions *int `json:"interceptions,omitempty"`
	PassBreakups  *int `json:"pass_breakups,omitempty"`
	DefTD         *int `json:"def_td,omitempty"`
}

// Special requests
type EndSeasonRequest struct {
	Season int `json:"season" validate:"required"`
}

type CopyTeamsRequest struct {
	FromSeason int `json:"from_season" validate:"required"`
	ToSeason   int `json:"to_season" validate:"required"`
}
