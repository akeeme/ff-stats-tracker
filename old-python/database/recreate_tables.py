from sqlalchemy import create_engine
from database.database import SQLALCHEMY_DATABASE_URL
from models.base_model import BaseModel
from models.team import Team
from models.player import Player
from models.game import Game
from models.player_stats import PlayerStats

def recreate_tables():
    """Recreate all database tables"""
    engine = create_engine(SQLALCHEMY_DATABASE_URL)
    
    # Drop all tables
    BaseModel.metadata.drop_all(bind=engine)
    
    # Create all tables
    BaseModel.metadata.create_all(bind=engine)
    
    print("All tables have been recreated successfully!")

if __name__ == "__main__":
    # Import all models to ensure they're registered with SQLAlchemy
    from models import team, player, game, player_stats
    
    # Confirm with user
    response = input("This will delete all existing data. Are you sure? (y/N): ")
    if response.lower() == 'y':
        recreate_tables()
    else:
        print("Operation cancelled.") 