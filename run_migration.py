#!/usr/bin/env python3
"""
Script to run database migrations
"""
import sys
import os
from pathlib import Path

# Add backend directory to Python path
backend_path = Path(__file__).parent / 'backend'
database_path = Path(__file__).parent / 'database'
sys.path.insert(0, str(backend_path))

from services.supabase_client import get_supabase_client

def run_migration(migration_filename=None):
    """Run database migration"""
    try:
        supabase = get_supabase_client()

        # Get migration file from command line argument or use default
        if migration_filename:
            migration_file = database_path / 'migrations' / migration_filename
        else:
            migration_file = database_path / 'migrations' / 'drop_custom_products_tables.sql'
        with open(migration_file, 'r', encoding='utf-8') as f:
            sql = f.read()

        print("Running migration...")
        print("SQL to execute:")
        print(sql)
        print("\n" + "="*50)

        # Execute migration
        result = supabase.rpc('exec_sql', {'sql': sql}).execute()

        print("Migration completed successfully!")
        print(f"Result: {result}")

    except Exception as e:
        print(f"Migration failed: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    # Get migration filename from command line argument
    migration_filename = sys.argv[1] if len(sys.argv) > 1 else None
    run_migration(migration_filename)
