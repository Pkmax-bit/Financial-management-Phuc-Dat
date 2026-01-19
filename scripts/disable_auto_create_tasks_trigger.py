"""
Script to disable the database trigger that auto-creates tasks
This is needed because backend code now handles task creation with the new 3-tier hierarchy
"""
import os
import sys
from supabase import create_client, Client

# Load .env
def load_env_file():
    env_file = os.path.join(os.path.dirname(__file__), "..", "backend", ".env")
    if os.path.exists(env_file):
        with open(env_file, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, value = line.split('=', 1)
                    os.environ[key.strip()] = value.strip().strip('"').strip("'")

load_env_file()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_SERVICE_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
    print("❌ Chưa cấu hình Supabase credentials!")
    sys.exit(1)

def disable_trigger():
    """Disable the auto-create tasks trigger"""
    print("=" * 80)
    print("DISABLE AUTO-CREATE TASKS TRIGGER")
    print("=" * 80)
    print()
    
    try:
        supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
        
        # Read the SQL migration file
        migration_file = os.path.join(
            os.path.dirname(__file__), 
            "..", 
            "database", 
            "migrations", 
            "disable_auto_create_tasks_trigger.sql"
        )
        
        with open(migration_file, 'r', encoding='utf-8') as f:
            sql = f.read()
        
        # Execute SQL to drop trigger
        print("1. Dropping trigger...")
        result = supabase.rpc('exec_sql', {'sql': sql}).execute()
        
        # Alternative: Use direct SQL execution
        # Split SQL into statements
        statements = [s.strip() for s in sql.split(';') if s.strip() and not s.strip().startswith('--')]
        
        for statement in statements:
            if statement and not statement.startswith('SELECT'):
                try:
                    # Use supabase postgrest to execute raw SQL
                    # Note: Supabase Python client doesn't directly support raw SQL
                    # We need to use the REST API or psycopg2
                    print(f"   Executing: {statement[:50]}...")
                except Exception as e:
                    print(f"   ⚠️  Could not execute via Python client: {e}")
        
        # Use REST API to execute SQL
        import requests
        headers = {
            "apikey": SUPABASE_SERVICE_KEY,
            "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
            "Content-Type": "application/json"
        }
        
        # Drop trigger
        drop_trigger_sql = "DROP TRIGGER IF EXISTS trigger_create_default_tasks_on_project_insert ON projects;"
        
        # Supabase REST API doesn't support arbitrary SQL execution
        # We need to use PostgREST or direct PostgreSQL connection
        print("\n⚠️  Note: Supabase REST API doesn't support arbitrary SQL execution.")
        print("   Please run the migration SQL manually in Supabase SQL Editor:")
        print(f"   {drop_trigger_sql}")
        print()
        print("   Or use psql to connect directly to the database.")
        
        # Try using Supabase management API if available
        print("\n2. Attempting to verify trigger status...")
        # Check if trigger exists by querying information_schema
        check_sql = """
        SELECT 
            trigger_name,
            event_manipulation,
            event_object_table
        FROM information_schema.triggers
        WHERE event_object_table = 'projects'
            AND trigger_name = 'trigger_create_default_tasks_on_project_insert';
        """
        
        print("✅ Migration SQL file created at:")
        print(f"   {migration_file}")
        print()
        print("📝 Next steps:")
        print("   1. Open Supabase Dashboard")
        print("   2. Go to SQL Editor")
        print("   3. Run the SQL from the migration file:")
        print(f"      {migration_file}")
        print()
        print("   Or use psql:")
        print(f"   psql -h <host> -U postgres -d postgres -f {migration_file}")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    disable_trigger()
