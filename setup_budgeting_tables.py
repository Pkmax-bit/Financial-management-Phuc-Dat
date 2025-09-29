#!/usr/bin/env python3
"""
Script to setup Budgeting tables in Supabase
Run this script to create the necessary database tables for Budgeting functionality.
"""

import os
import sys
from pathlib import Path

# Add the backend directory to the Python path
backend_dir = Path(__file__).parent / "backend"
sys.path.insert(0, str(backend_dir))

# Load environment variables
from dotenv import load_dotenv
load_dotenv('backend/.env')

def main():
    print("🔧 Setting up Budgeting tables...")
    print("=" * 50)
    
    # Check if we have the required environment variables
    required_vars = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY']
    missing_vars = [var for var in required_vars if not os.getenv(var)]
    
    if missing_vars:
        print(f"❌ Missing required environment variables: {', '.join(missing_vars)}")
        print("Please check your backend/.env file")
        return
    
    print("✅ Environment variables found")
    
    # Read the SQL file
    sql_file = Path(__file__).parent / "create_budgeting_schema.sql"
    if not sql_file.exists():
        print(f"❌ SQL file not found: {sql_file}")
        return
    
    with open(sql_file, 'r', encoding='utf-8') as f:
        sql_content = f.read()
    
    print("✅ SQL file loaded")
    print("\n📋 Instructions:")
    print("1. Go to your Supabase Dashboard")
    print("2. Navigate to SQL Editor")
    print("3. Copy and paste the following SQL commands:")
    print("4. Execute the SQL commands")
    print("\n" + "=" * 50)
    print(sql_content)
    print("=" * 50)
    
    print("\n✅ SQL commands ready to execute!")
    print("After executing the SQL commands, the Budgeting functionality will be available.")

if __name__ == "__main__":
    main()
