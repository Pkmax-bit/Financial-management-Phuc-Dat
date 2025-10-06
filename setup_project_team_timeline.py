#!/usr/bin/env python3
"""
Setup script for project team and timeline tables
"""

import os
import sys
from dotenv import load_dotenv
from supabase import create_client, Client

# Load environment variables
load_dotenv()

def get_supabase_client():
    """Get Supabase client"""
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_ANON_KEY")
    
    if not url or not key:
        print("❌ SUPABASE_URL or SUPABASE_ANON_KEY not found in environment variables")
        sys.exit(1)
    
    return create_client(url, key)

def run_sql_file(supabase: Client, sql_file: str):
    """Run SQL file"""
    try:
        with open(sql_file, 'r', encoding='utf-8') as f:
            sql_content = f.read()
        
        # Split by semicolon and execute each statement
        statements = [stmt.strip() for stmt in sql_content.split(';') if stmt.strip()]
        
        for statement in statements:
            if statement:
                print(f"Executing: {statement[:50]}...")
                result = supabase.rpc('exec_sql', {'sql': statement}).execute()
                print(f"✅ Executed successfully")
        
        return True
    except Exception as e:
        print(f"❌ Error executing SQL: {e}")
        return False

def main():
    """Main function"""
    print("🚀 Setting up project team and timeline tables...")
    
    # Get Supabase client
    supabase = get_supabase_client()
    print("✅ Connected to Supabase")
    
    # Run SQL file
    sql_file = "create_project_team_timeline_tables.sql"
    if not os.path.exists(sql_file):
        print(f"❌ SQL file not found: {sql_file}")
        sys.exit(1)
    
    print(f"📄 Reading SQL file: {sql_file}")
    success = run_sql_file(supabase, sql_file)
    
    if success:
        print("✅ Database setup completed successfully!")
        print("\n📋 Created tables:")
        print("  - project_team")
        print("  - project_timeline") 
        print("  - timeline_attachments")
        print("\n🔧 Next steps:")
        print("  1. Configure Supabase storage bucket 'minhchung_chiphi'")
        print("  2. Set up RLS policies if needed")
        print("  3. Test the API endpoints")
    else:
        print("❌ Database setup failed!")
        sys.exit(1)

if __name__ == "__main__":
    main()
