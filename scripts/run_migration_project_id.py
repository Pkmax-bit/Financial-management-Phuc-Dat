#!/usr/bin/env python3
"""
Script to run migration for adding project_id to internal_conversations
"""
import os
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from services.supabase_client import get_supabase_client

def run_migration():
    """Run the migration to add project_id column"""
    try:
        supabase = get_supabase_client()
        
        # Read migration file
        migration_file = Path(__file__).parent.parent / "database" / "migrations" / "add_project_id_to_internal_conversations.sql"
        
        if not migration_file.exists():
            print(f"Error: Migration file not found at {migration_file}")
            return False
        
        with open(migration_file, 'r', encoding='utf-8') as f:
            sql = f.read()
        
        # Execute SQL
        # Note: Supabase client doesn't support raw SQL execution directly
        # You need to run this via psql or Supabase dashboard
        print("=" * 60)
        print("MIGRATION: Add project_id to internal_conversations")
        print("=" * 60)
        print("\nPlease run this SQL manually in your database:")
        print("\n" + sql)
        print("\n" + "=" * 60)
        print("\nOr run via psql:")
        print(f"psql -d your_database -f {migration_file}")
        print("\nOr via Supabase Dashboard SQL Editor")
        print("=" * 60)
        
        return True
        
    except Exception as e:
        print(f"Error: {str(e)}")
        return False

if __name__ == "__main__":
    success = run_migration()
    sys.exit(0 if success else 1)

