import os
import psycopg2
from dotenv import load_dotenv

# Load environment variables
load_dotenv(os.path.join(os.path.dirname(__file__), '..', 'backend', '.env'))

def run_migration():
    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        print("Error: DATABASE_URL not found in environment variables")
        return

    try:
        conn = psycopg2.connect(db_url)
        cur = conn.cursor()
        
        # Read SQL file
        sql_path = os.path.join(os.path.dirname(__file__), '..', 'database', 'migrations', 'add_parent_id_to_tasks.sql')
        with open(sql_path, 'r') as f:
            sql = f.read()
            
        print("Executing migration...")
        cur.execute(sql)
        conn.commit()
        print("Migration executed successfully!")
        
        cur.close()
        conn.close()
    except Exception as e:
        print(f"Error executing migration: {str(e)}")

if __name__ == "__main__":
    run_migration()
