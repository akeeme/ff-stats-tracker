from sqlalchemy import create_engine, text
import os
import sys

# Add the parent directory to Python path
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
sys.path.insert(0, parent_dir)

from database.database import engine, Base
from models.player_stats import PlayerStats

def recreate_tables():
    try:
        # Drop the existing player_stats table if it exists
        with engine.connect() as connection:
            connection.execute(text("DROP TABLE IF EXISTS player_stats"))
            connection.commit()
            print("Dropped existing player_stats table")

        # Create all tables
        Base.metadata.create_all(bind=engine)
        print("Successfully recreated player_stats table")
        return True
    except Exception as e:
        print(f"Failed to recreate tables. Error: {e}")
        return False

if __name__ == "__main__":
    recreate_tables() 