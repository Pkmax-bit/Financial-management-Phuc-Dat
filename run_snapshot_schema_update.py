#!/usr/bin/env python3
"""
Script to update expense_snapshots table schema
Adds parent_expense_id, child_expense_id, project_id columns for better querying
"""

import os
import sys
from pathlib import Path

# Add backend to path
backend_path = Path(__file__).parent / "backend"
sys.path.insert(0, str(backend_path))

from supabase import create_client, Client
from dotenv import load_dotenv

def get_supabase_client():
    """Get Supabase client"""
    load_dotenv()
    
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_ANON_KEY")
    
    if not url or not key:
        raise Exception("Missing SUPABASE_URL or SUPABASE_ANON_KEY environment variables")
    
    return create_client(url, key)

def run_sql_file(sql_file_path):
    """Run SQL file content"""
    try:
        with open(sql_file_path, 'r', encoding='utf-8') as f:
            sql_content = f.read()
        
        print(f"📄 Running SQL from: {sql_file_path}")
        print("=" * 50)
        print(sql_content)
        print("=" * 50)
        
        # Note: Supabase Python client doesn't support direct SQL execution
        # User needs to run this in Supabase Dashboard SQL Editor
        print("IMPORTANT: Please run the above SQL in Supabase Dashboard SQL Editor")
        print("   1. Go to https://supabase.com/dashboard")
        print("   2. Select your project")
        print("   3. Go to SQL Editor")
        print("   4. Paste and run the SQL above")
        
        return True
        
    except Exception as e:
        print(f"Error reading SQL file: {e}")
        return False

def main():
    """Main function"""
    print("Updating expense_snapshots schema...")
    
    try:
        # Get Supabase client
        supabase = get_supabase_client()
        print("Connected to Supabase")
        
        # Run SQL file
        sql_file = "update_snapshot_schema.sql"
        if os.path.exists(sql_file):
            success = run_sql_file(sql_file)
            if success:
                print("SQL file processed successfully")
                print("\nNext steps:")
                print("1. Run the SQL in Supabase Dashboard")
                print("2. Test the updated snapshot functionality")
                print("3. Check that parent_expense_id, child_expense_id, project_id columns exist")
            else:
                print("Failed to process SQL file")
        else:
            print(f"SQL file not found: {sql_file}")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    main()
