#!/usr/bin/env python3
"""
Simple script to add dimension columns to quote_items and invoice_items tables
"""

from supabase import create_client, Client

def get_supabase_client() -> Client:
    """Get Supabase client from environment variables"""
    import os
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_ANON_KEY")
    
    if not url:
        raise ValueError("SUPABASE_URL environment variable is required")
    if not key:
        raise ValueError("SUPABASE_ANON_KEY environment variable is required")
    
    return create_client(url, key)

def test_connection():
    """Test connection and check current table structure"""
    try:
        supabase = get_supabase_client()
        
        print("🔄 Testing Supabase connection...")
        
        # Test connection by trying to select from quote_items
        try:
            result = supabase.table('quote_items').select('*').limit(1).execute()
            print("✅ Successfully connected to Supabase")
            print(f"📊 Found {len(result.data)} quote_items records")
        except Exception as e:
            print(f"❌ Failed to connect to quote_items: {e}")
            return False
        
        # Test connection by trying to select from invoice_items
        try:
            result = supabase.table('invoice_items').select('*').limit(1).execute()
            print(f"📊 Found {len(result.data)} invoice_items records")
        except Exception as e:
            print(f"❌ Failed to connect to invoice_items: {e}")
            return False
        
        return True
        
    except Exception as e:
        print(f"❌ Connection failed: {e}")
        return False

def check_columns():
    """Check if dimension columns already exist"""
    try:
        supabase = get_supabase_client()
        
        print("\n🔍 Checking existing columns...")
        
        # Try to select dimension columns from quote_items
        try:
            result = supabase.table('quote_items').select('area, volume, height, length, depth').limit(1).execute()
            print("✅ quote_items already has dimension columns")
            return True
        except Exception as e:
            print(f"ℹ️ quote_items doesn't have dimension columns yet: {e}")
        
        # Try to select dimension columns from invoice_items
        try:
            result = supabase.table('invoice_items').select('area, volume, height, length, depth').limit(1).execute()
            print("✅ invoice_items already has dimension columns")
            return True
        except Exception as e:
            print(f"ℹ️ invoice_items doesn't have dimension columns yet: {e}")
        
        return False
        
    except Exception as e:
        print(f"❌ Failed to check columns: {e}")
        return False

def main():
    """Main function"""
    print("🚀 Starting dimensions migration check...")
    
    # Test connection
    if not test_connection():
        print("❌ Cannot proceed without database connection")
        return
    
    # Check if columns already exist
    if check_columns():
        print("✅ Dimension columns already exist!")
        return
    
    print("\n⚠️ Dimension columns don't exist yet.")
    print("📝 You need to run the SQL migration manually in your Supabase dashboard:")
    print("   1. Go to your Supabase project dashboard")
    print("   2. Navigate to SQL Editor")
    print("   3. Run the contents of 'add_dimensions_to_quote_invoice_items.sql'")
    print("   4. Or use a PostgreSQL client to connect and run the SQL")

if __name__ == "__main__":
    main()
