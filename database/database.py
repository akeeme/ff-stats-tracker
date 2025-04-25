from sqlalchemy import create_engine, Column, Integer, String
from sqlalchemy.orm import declarative_base, sessionmaker
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Create a single Base instance that all models will use
Base = declarative_base()

def connect():
    # Create the sqlite directory if it doesn't exist
    sqlite_dir = os.path.dirname(os.getenv('DATABASE_URL').replace('sqlite:///', ''))
    if not os.path.exists(sqlite_dir):
        try:
            os.makedirs(sqlite_dir)
            print(f"Created directory: {sqlite_dir}")
        except Exception as e:
            print(f"Failed to create directory {sqlite_dir}. Error: {e}")
            raise
    
    uri = os.getenv('DATABASE_URL')
    if not uri:
        raise ValueError("DATABASE_URL environment variable is not set")
        
    engine = create_engine(uri, connect_args={'check_same_thread': False})
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    
    return engine, SessionLocal, Base

# Get database session
def get_db():
    _, SessionLocal, _ = connect()
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

engine, SessionLocal, Base = connect()


class TestTable(Base):
    __tablename__ = "test_table"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    value = Column(Integer)


def create_test_table():
    try:
        # Create all tables
        Base.metadata.create_all(bind=engine)
        print(f"Database URL: {engine.url}")
        
        
        # Print tables that will be created
        print("Tables to be created:")
        for table in Base.metadata.tables.values():
            print(f"- {table.name}")
            
        print("Test table created successfully!")
        return True
    except Exception as e:
        print(f"Failed to create test table. Error: {e}")
        return False


def test_connection():
    try:
        # Try to connect to the database
        with engine.connect() as connection:
            print("Successfully connected to the database!")
            return True
    except Exception as e:
        print(f"Failed to connect to the database. Error: {e}")
        return False


if __name__ == "__main__":
    if test_connection():
        create_test_table()
    
    
