# Database Setup for Self-Hosted Supabase

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Database Configuration
DB_HOST=your-supabase-host
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your-database-password
DB_NAME=postgres
DB_SCHEMA=statstracker

# Server Configuration
PORT=8080
```

## Self-Hosted Supabase Setup

1. **Set up your self-hosted Supabase instance**
2. **Get your connection details:**

   - Host: Your Supabase host
   - Port: `5432` (default PostgreSQL port)
   - Database: `postgres`
   - Username: `postgres`
   - Password: (your database password)

3. **Run the schema script:**
   - Connect to your PostgreSQL database
   - Copy and paste the contents of `supabase-schema.sql`
   - Run the script

## Schema Structure

All tables are created in the `statstracker` schema:

- `statstracker.teams` - Team information
- `statstracker.players` - Player information
- `statstracker.games` - Game information
- `statstracker.player_stats` - Player statistics

## Connection Details

The Go backend is configured to:

- Use direct connection (no SSL required for self-hosted)
- Set search path to `statstracker, public`
- Use simple `pgx.Connect()` for database connection
- Properly encode special characters in passwords

## Testing the Connection

Run the Go backend:

```bash
go run main.go
```

You should see:

```
Successfully connected to database: postgres@your-supabase-host:5432/postgres (schema: statstracker)
Database migrations completed successfully
```

## Troubleshooting

1. **Connection refused**: Check your DB_HOST and DB_PORT
2. **Authentication failed**: Verify DB_USER and DB_PASSWORD
3. **Schema not found**: Make sure you ran the supabase-schema.sql script
4. **Network issues**: Ensure your self-hosted Supabase is accessible from your application
