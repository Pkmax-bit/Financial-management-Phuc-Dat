import os
import sys
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'backend'))

from services.supabase_client import get_supabase_client

def run_migration():
    try:
        supabase = get_supabase_client()

        # Read SQL file
        sql_path = os.path.join(os.path.dirname(__file__), '..', 'database', 'migrations', 'add_accountable_person_to_tasks.sql')
        with open(sql_path, 'r') as f:
            sql = f.read()

        print("Executing migration to add accountable_person column...")

        # Execute the SQL directly using Supabase
        result = supabase.rpc('exec_sql', {'sql': sql}).execute()

        print("Migration executed successfully!")

    except Exception as e:
        print(f"Error executing migration: {str(e)}")

if __name__ == "__main__":
    run_migration()
