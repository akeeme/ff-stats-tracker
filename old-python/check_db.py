from sqlalchemy import create_engine, inspect

# Connect to the database
uri = "sqlite:///C:/sqlite/flag_football.db"
engine = create_engine(uri)

# Create an inspector
inspector = inspect(engine)

# Get all table names
tables = inspector.get_table_names()
print("Tables in database:")
for table in tables:
    print(f"- {table}")
    
    # Get columns for each table
    columns = inspector.get_columns(table)
    print(f"  Columns in {table}:")
    for column in columns:
        print(f"  - {column['name']} ({column['type']})") 