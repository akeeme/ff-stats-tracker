from fastapi import FastAPI
from database.create_models import create_database, recreate_all_tables
from models.player import Player
from models.game import Game
from models.player_stats import PlayerStats
from models.team import Team
from routers import player, game, team, stats

app = FastAPI(
    title="Flag Football Stats API",
    version="1.0.0",
    description="API for managing flag football statistics"
)

# Include all routers
app.include_router(player.router)
app.include_router(game.router)
app.include_router(team.router)
app.include_router(stats.router)

def create_db():
    # Import all models to ensure they're registered with SQLAlchemy
    from models import player, game, player_stats, team
    
    # create db
    create_database()
    
def main():
    recreate_all_tables()
    
if __name__ == '__main__':
    main()