"""
Test script to verify Supabase connection and API endpoints
"""

import asyncio
import sys
from services.supabase_client import get_supabase_client, get_supabase_anon_client
from config import settings
import json

async def test_supabase_connection():
    """Test Supabase connection and basic operations"""
    
    print("🔍 Testing Supabase Connection...")
    print(f"URL: {settings.SUPABASE_URL}")
    print(f"Anon Key: {settings.SUPABASE_ANON_KEY[:20]}...")
    print(f"Service Key: {settings.SUPABASE_SERVICE_KEY[:20]}...")
    print("-" * 50)
    
    try:
        # Test service key client
        print("1. Testing Service Key Client...")
        service_client = get_supabase_client()
        
        # Test basic database query
        response = service_client.table('users').select("id, email, full_name").limit(5).execute()
        print(f"✅ Service client works. Found {len(response.data)} users.")
        
        if response.data:
            print("Sample users:")
            for user in response.data[:3]:
                print(f"  - {user.get('email', 'No email')} ({user.get('full_name', 'No name')})")
        
        print()
        
        # Test anon key client
        print("2. Testing Anon Key Client...")
        anon_client = get_supabase_anon_client()
        
        # Test public endpoint (this might fail if RLS is enabled)
        try:
            response = anon_client.table('users').select("count").execute()
            print("✅ Anon client works")
        except Exception as e:
            print(f"⚠️ Anon client limited (expected with RLS): {e}")
        
        print()
        
        # Test auth functionality
        print("3. Testing Authentication...")
        
        # Try to create a session (this tests if auth is working)
        try:
            auth_response = anon_client.auth.sign_in_with_password({
                "email": "admin@example.com",
                "password": "admin123"
            })
            
            if auth_response.user:
                print(f"✅ Authentication works. User: {auth_response.user.email}")
                print(f"✅ JWT Token generated: {auth_response.session.access_token[:20]}...")
                
                # Sign out
                anon_client.auth.sign_out()
                print("✅ Sign out successful")
            else:
                print("❌ Authentication failed - no user returned")
                
        except Exception as auth_error:
            print(f"❌ Authentication error: {auth_error}")
        
        print()
        
        # Test specific tables
        print("4. Testing Database Tables...")
        
        tables_to_test = ['users', 'employees', 'customers', 'projects', 'expenses', 'invoices']
        
        for table in tables_to_test:
            try:
                response = service_client.table(table).select("count").execute()
                count = len(response.data) if response.data else 0
                print(f"  ✅ {table}: {count} records")
            except Exception as e:
                print(f"  ❌ {table}: Error - {e}")
        
        print()
        print("🎉 Supabase connection test completed!")
        
    except Exception as e:
        print(f"❌ Supabase connection failed: {e}")
        sys.exit(1)

def test_environment_variables():
    """Test if all required environment variables are set"""
    
    print("🔍 Testing Environment Variables...")
    print("-" * 50)
    
    required_vars = [
        ('SUPABASE_URL', settings.SUPABASE_URL),
        ('SUPABASE_SERVICE_KEY', settings.SUPABASE_SERVICE_KEY),
        ('SUPABASE_ANON_KEY', settings.SUPABASE_ANON_KEY),
    ]
    
    optional_vars = [
        ('SUPABASE_DB_HOST', settings.SUPABASE_DB_HOST),
        ('SUPABASE_DB_USER', settings.SUPABASE_DB_USER),
        ('SUPABASE_DB_PASSWORD', settings.SUPABASE_DB_PASSWORD),
        ('DIFY_API_KEY', settings.DIFY_API_KEY),
        ('SMTP_USER', settings.SMTP_USER),
    ]
    
    print("Required Variables:")
    for name, value in required_vars:
        if value:
            print(f"  ✅ {name}: {value[:20]}..." if len(value) > 20 else f"  ✅ {name}: {value}")
        else:
            print(f"  ❌ {name}: Not set!")
    
    print("\nOptional Variables:")
    for name, value in optional_vars:
        if value:
            print(f"  ✅ {name}: {value[:20]}..." if len(value) > 20 else f"  ✅ {name}: {value}")
        else:
            print(f"  ⚠️ {name}: Not set")
    
    print()

async def main():
    """Main test function"""
    print("🚀 Starting Supabase Integration Test")
    print("=" * 60)
    
    # Test environment variables
    test_environment_variables()
    
    # Test Supabase connection
    await test_supabase_connection()
    
    print("=" * 60)
    print("✨ All tests completed!")

if __name__ == "__main__":
    asyncio.run(main())