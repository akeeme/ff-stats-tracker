# Flag Football Stats Tracker - Go Version

A high-performance API for managing flag football statistics, built with Go, Fiber, and PostgreSQL.

## Features

- **Teams Management**: Create, read, update, and delete teams
- **Players Management**: Manage players with team assignments and jersey numbers
- **Games Management**: Track games, scores, and winning teams
- **Player Statistics**: Comprehensive stats tracking for QB, WR, RB, and Defense positions
- **Season Management**: End seasons and copy teams between seasons
- **Optimistic Locking**: Version-based concurrency control
- **Soft Deletes**: Data preservation with soft delete functionality

## Tech Stack

- **Go 1.21+**
- **Fiber v2** - High-performance HTTP framework
- **pgx v5** - PostgreSQL driver and toolkit
- **godotenv** - Environment variable management

## Quick Start

### Prerequisites

- Go 1.21 or later
- PostgreSQL database
- Git

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd ff-stats-tracker
   ```

2. **Install dependencies**

   ```bash
   go mod tidy
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory:

   ```env
   # Database Configuration
   DB_HOST=localhost
   DB_PORT=5432
   DB_USER=your_username
   DB_PASSWORD=your_password
   DB_NAME=ff_stats
   DB_SSLMODE=disable

   # Server Configuration
   PORT=8080
   ```

4. **Set up the database**

   - Create a PostgreSQL database named `ff_stats`
   - The application will automatically run migrations on startup

5. **Run the application**
   ```bash
   go run main.go
   ```

The API will be available at `http://localhost:8080`

## API Endpoints

### Teams

- `POST /api/teams` - Create a new team
- `GET /api/teams` - Get all teams
- `GET /api/teams/:id` - Get team by ID
- `PUT /api/teams/:id` - Update team
- `DELETE /api/teams/:id` - Delete team (soft delete)
- `POST /api/teams/end-season` - Mark all teams from a season as inactive
- `POST /api/teams/copy-to-season` - Copy teams from one season to another

### Players

- `POST /api/players` - Create a new player
- `GET /api/players` - Get all players
- `GET /api/players/:id` - Get player by ID
- `PUT /api/players/:id` - Update player
- `DELETE /api/players/:id` - Delete player (soft delete)

### Games

- `POST /api/games` - Create a new game
- `GET /api/games` - Get all games
- `GET /api/games/:id` - Get game by ID
- `PUT /api/games/:id` - Update game
- `DELETE /api/games/:id` - Delete game (soft delete)

### Player Statistics

- `POST /api/stats` - Create new player stats
- `GET /api/stats` - Get all player stats
- `GET /api/stats/:id` - Get player stats by ID
- `PUT /api/stats/:id` - Update player stats
- `DELETE /api/stats/:id` - Delete player stats (soft delete)

## Query Parameters

Most GET endpoints support these query parameters:

- `skip` - Number of records to skip (default: 0)
- `limit` - Maximum number of records to return (default: 100)
- `include_deleted` - Include soft-deleted records (default: false)

Update and delete operations require a `version` query parameter for optimistic locking.

## Example Usage

### Create a Team

```bash
curl -X POST http://localhost:8080/api/teams \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Thunder",
    "season": 2024,
    "league": "Premier"
  }'
```

### Create a Player

```bash
curl -X POST http://localhost:8080/api/players \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "team_name": "Thunder",
    "season": 2024,
    "jersey_number": "12"
  }'
```

### Create a Game

```bash
curl -X POST http://localhost:8080/api/games \
  -H "Content-Type: application/json" \
  -d '{
    "week": 1,
    "league": "Premier",
    "season": 2024,
    "team1_name": "Thunder",
    "team2_name": "Lightning",
    "team1_score": 21,
    "team2_score": 14,
    "winning_team_name": "Thunder"
  }'
```

### Add Player Stats

```bash
curl -X POST http://localhost:8080/api/stats \
  -H "Content-Type: application/json" \
  -d '{
    "player_name": "John Doe",
    "game_week": 1,
    "game_season": 2024,
    "league": "Premier",
    "team1_name": "Thunder",
    "team2_name": "Lightning",
    "passing_tds": 2,
    "passes_completed": 15,
    "passes_attempted": 20,
    "receptions": 3,
    "targets": 5
  }'
```

## Database Schema

The application uses PostgreSQL with the following main tables:

- `teams` - Team information
- `players` - Player information with team relationships
- `games` - Game information with team relationships
- `player_stats` - Player statistics for specific games

All tables include:

- Optimistic locking with `version` field
- Soft delete support with `is_deleted` and `deleted_at` fields
- Audit timestamps with `created_at` and `updated_at` fields

## Performance Features

- **Connection Pooling**: Efficient database connection management with pgx
- **Prepared Statements**: Optimized query performance
- **Fiber Framework**: High-performance HTTP handling
- **Concurrent Processing**: Go's goroutines for handling multiple requests

## Development

### Running Tests

```bash
go test ./...
```

### Building for Production

```bash
go build -o ff-stats-tracker main.go
```

### Docker Support

A Dockerfile can be added for containerized deployment.

## Migration from Python/FastAPI

This Go version maintains API compatibility with the original Python FastAPI version while providing:

- Better performance and lower memory usage
- Stronger type safety
- Better error handling
- Simplified deployment (single binary)

## License

[Add your license information here]
