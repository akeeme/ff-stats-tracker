from database.database import connect
from models.player import Player
from models.game import Game
from models.player_stats import PlayerStats
from models.team import Team
import traceback
from sqlalchemy import create_engine, MetaData, text
from sqlalchemy.orm import sessionmaker, clear_mappers
from database.database import Base, engine
import importlib

def recreate_all_tables():
    """Recreate all tables in the correct order"""
    try:
        # Get a fresh connection
        engine, SessionLocal, Base = connect()
        
        # Drop tables in reverse dependency order
        with engine.connect() as conn:
            # First drop indices
            conn.execute(text("DROP INDEX IF EXISTS ix_player_stats_id"))
            conn.execute(text("DROP INDEX IF EXISTS ix_players_id"))
            conn.execute(text("DROP INDEX IF EXISTS ix_games_id"))
            conn.execute(text("DROP INDEX IF EXISTS ix_teams_id"))
            
            # Then drop tables
            conn.execute(text("DROP TABLE IF EXISTS player_stats"))
            conn.execute(text("DROP TABLE IF EXISTS players"))
            conn.execute(text("DROP TABLE IF EXISTS games"))
            conn.execute(text("DROP TABLE IF EXISTS teams"))
            conn.commit()
            print("Dropped all existing tables and indices")
        
        # Clear all mappers and reload models
        clear_mappers()
        Base.metadata.clear()
        
        # Reload all models
        importlib.reload(importlib.import_module('models.base_model'))
        importlib.reload(importlib.import_module('models.team'))
        importlib.reload(importlib.import_module('models.player'))
        importlib.reload(importlib.import_module('models.game'))
        importlib.reload(importlib.import_module('models.player_stats'))
        
        # Create all tables (SQLAlchemy will handle dependencies)
        Base.metadata.create_all(bind=engine)
        print("Successfully recreated all tables!")
        return True
    except Exception as e:
        print(f"Failed to recreate tables. Error: {e}")
        print("Full traceback:")
        print(traceback.format_exc())
        return False
    finally:
        if engine:
            engine.dispose()

def create_database():
    """Create database tables if they don't exist"""
    engine = None
    try:
        engine, SessionLocal, Base = connect()
        
        # Print database URL for debugging
        print(f"Database URL: {engine.url}")
        
        # Import all models to ensure they're registered with Base.metadata
        from models import player, game, player_stats, team
        
        # Print tables that will be created
        print("Tables to be created:")
        for table in Base.metadata.tables.values():
            print(f"- {table.name}")
            
        # Create all tables
        Base.metadata.create_all(bind=engine)
        print("Database tables created successfully!")
        return True
    except Exception as e:
        print(f"Failed to create database tables. Error: {e}")
        print("Full traceback:")
        print(traceback.format_exc())
        return False
    finally:
        if engine:
            engine.dispose()

if __name__ == "__main__":
    recreate_all_tables() 