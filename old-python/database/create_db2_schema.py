import ibm_db
import os
from dotenv import load_dotenv

load_dotenv()

def get_db2_conn():
    db2_user = os.getenv('db2_user')
    db2_pw = os.getenv('db2_pw')
    db2_host = os.getenv('db2_host')
    db2_port = os.getenv('db2_port')
    db2_db = os.getenv('db2_db')
    if not all([db2_user, db2_pw, db2_host, db2_port, db2_db]):
        raise ValueError("One or more DB2 environment variables are not set")
    conn_str = (
        f"DATABASE={db2_db};HOSTNAME={db2_host};PORT={db2_port};PROTOCOL=TCPIP;UID={db2_user};PWD={db2_pw};"
    )
    return ibm_db.connect(conn_str, '', '')

def execute_ddl_from_file(conn, ddl_path):
    with open(ddl_path, 'r') as f:
        sql = f.read()
    # Split on semicolon, but ignore empty statements
    stmts = [stmt.strip() for stmt in sql.split(';') if stmt.strip()]
    for stmt in stmts:
        try:
            ibm_db.exec_immediate(conn, stmt)
            print(f"Executed: {stmt[:60]}...")
        except Exception as e:
            print(f"Error executing statement: {e}\nSQL: {stmt}")

def main():
    try:
        conn = get_db2_conn()
        print("Connected to IBM Db2!")
        ddl_path = os.path.join(os.path.dirname(__file__), 'schema_db2.sql')
        execute_ddl_from_file(conn, ddl_path)
        ibm_db.close(conn)
        print("All tables created successfully.")
    except Exception as e:
        print(f"Failed to create tables: {e}")

if __name__ == "__main__":
    main() 