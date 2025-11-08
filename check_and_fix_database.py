#!/usr/bin/env python3
"""
Check and fix database schema for employee creation
"""

import os
import sys
from supabase import create_client, Client

def get_supabase_client():
    """Get Supabase client"""
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    
    if not url or not key:
        print("❌ Missing Supabase credentials")
        print("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables")
        return None
    
    return create_client(url, key)

def check_password_hash_column():
    """Check if password_hash column exists"""
    print("🔍 Checking if password_hash column exists...")
    
    supabase = get_supabase_client()
    if not supabase:
        return False
    
    try:
        # Try to query the password_hash column
        result = supabase.table("users").select("password_hash").limit(1).execute()
        print("✅ password_hash column exists")
        return True
    except Exception as e:
        if "column" in str(e).lower() and "does not exist" in str(e).lower():
            print("❌ password_hash column does not exist")
            return False
        else:
            print(f"❌ Error checking column: {str(e)}")
            return False

def add_password_hash_column():
    """Add password_hash column to users table"""
    print("🔧 Adding password_hash column...")
    
    supabase = get_supabase_client()
    if not supabase:
        return False
    
    try:
        # Execute SQL to add the column
        sql = """
        ALTER TABLE users 
        ADD COLUMN password_hash TEXT;
        """
        
        result = supabase.rpc('exec_sql', {'sql': sql}).execute()
        print("✅ password_hash column added successfully")
        return True
    except Exception as e:
        print(f"❌ Error adding column: {str(e)}")
        print("📝 Manual fix: Run this SQL in Supabase SQL Editor:")
        print("ALTER TABLE users ADD COLUMN password_hash TEXT;")
        return False

def test_user_creation():
    """Test creating a user with password_hash"""
    print("🧪 Testing user creation with password_hash...")
    
    supabase = get_supabase_client()
    if not supabase:
        return False
    
    try:
        # Test data
        test_user = {
            "id": "test-user-123",
            "email": "test@example.com",
            "full_name": "Test User",
            "role": "employee",
            "password_hash": "$2b$12$test.hash.here",
            "is_active": True,
            "created_at": "2024-01-01T00:00:00Z",
            "updated_at": "2024-01-01T00:00:00Z"
        }
        
        # Try to insert
        result = supabase.table("users").insert(test_user).execute()
        print("✅ User creation with password_hash works")
        
        # Clean up
        supabase.table("users").delete().eq("id", "test-user-123").execute()
        print("🧹 Test data cleaned up")
        return True
        
    except Exception as e:
        print(f"❌ Error testing user creation: {str(e)}")
        return False

def main():
    """Main function"""
    print("🚀 Database Schema Checker")
    print("=" * 50)
    
    # Check if password_hash column exists
    if check_password_hash_column():
        print("✅ Database schema is correct")
        test_user_creation()
    else:
        print("🔧 Fixing database schema...")
        if add_password_hash_column():
            print("✅ Database schema fixed")
            test_user_creation()
        else:
            print("❌ Could not fix database schema automatically")
            print("📝 Please run the SQL manually:")
            print("ALTER TABLE users ADD COLUMN password_hash TEXT;")
    
    print("\n📋 Next Steps:")
    print("1. Ensure password_hash column exists in users table")
    print("2. Test employee creation again")
    print("3. Check authentication is working")
    print("4. Verify all required fields are provided")

if __name__ == "__main__":
    main()
