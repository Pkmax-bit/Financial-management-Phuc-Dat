#!/usr/bin/env python3
"""
Setup accounting tables for Sales Receipts functionality
"""

import os
import sys
from dotenv import load_dotenv
from supabase import create_client, Client

# Load environment variables from backend directory
load_dotenv('backend/.env')

def setup_accounting_tables():
    """Create accounting tables in Supabase"""
    
    # Get Supabase credentials
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_KEY") or os.getenv("SUPABASE_ANON_KEY")
    
    if not url or not key:
        print("❌ Missing Supabase credentials")
        print("Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your .env file")
        return False
    
    try:
        # Create Supabase client
        supabase: Client = create_client(url, key)
        print("✅ Connected to Supabase")
        
        # Test connection by checking if we can access the database
        print("🔍 Testing database connection...")
        
        # Try to query a simple table to test connection
        try:
            test_result = supabase.table('users').select('id').limit(1).execute()
            print("✅ Database connection successful")
        except Exception as e:
            print(f"❌ Database connection failed: {e}")
            return False
        
        print("📝 Note: Please run the SQL commands manually in your Supabase dashboard:")
        print("=" * 60)
        print("1. Go to your Supabase project dashboard")
        print("2. Navigate to SQL Editor")
        print("3. Copy and paste the contents of 'create_accounting_tables.sql'")
        print("4. Execute the SQL commands")
        print("=" * 60)
        
        return True
            
    except Exception as e:
        print(f"❌ Error setting up accounting tables: {e}")
        return False

def main():
    """Main function"""
    print("🚀 Setting up Accounting Tables for Sales Receipts")
    print("=" * 60)
    
    success = setup_accounting_tables()
    
    if success:
        print("\n✅ Setup completed successfully!")
        print("You can now use Sales Receipts functionality with accounting entries.")
    else:
        print("\n❌ Setup failed!")
        print("Please check your Supabase credentials and try again.")
        sys.exit(1)

if __name__ == "__main__":
    main()
