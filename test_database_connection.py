#!/usr/bin/env python3
"""
Simple test for database connection and schema
"""

import sys
import os

# Add backend to path
sys.path.append('backend')

try:
    from backend.services.supabase_client import get_supabase_client
    
    print("=== Database Connection Test ===")
    
    # Test connection
    supabase = get_supabase_client()
    print("✅ Supabase client created")
    
    # Test positions table
    print("\n1. Testing positions table...")
    try:
        result = supabase.table("positions").select("id, name, code").limit(1).execute()
        print(f"✅ Positions table accessible: {len(result.data) if result.data else 0} records")
        
        if result.data:
            print(f"Sample position: {result.data[0]}")
    except Exception as e:
        print(f"❌ Positions table error: {e}")
    
    # Test departments table
    print("\n2. Testing departments table...")
    try:
        result = supabase.table("departments").select("id, name, code").limit(1).execute()
        print(f"✅ Departments table accessible: {len(result.data) if result.data else 0} records")
        
        if result.data:
            print(f"Sample department: {result.data[0]}")
    except Exception as e:
        print(f"❌ Departments table error: {e}")
    
    # Test employees table
    print("\n3. Testing employees table...")
    try:
        result = supabase.table("employees").select("id, first_name, last_name").limit(1).execute()
        print(f"✅ Employees table accessible: {len(result.data) if result.data else 0} records")
        
        if result.data:
            print(f"Sample employee: {result.data[0]}")
    except Exception as e:
        print(f"❌ Employees table error: {e}")
    
    # Test foreign key relationship
    print("\n4. Testing foreign key relationships...")
    try:
        result = supabase.table("employees")\
            .select("id, first_name, last_name, position_id, positions(name)")\
            .limit(1)\
            .execute()
        
        if result.data:
            print("✅ Foreign key relationship works")
            print(f"Sample with join: {result.data[0]}")
        else:
            print("⚠️  No employees found, but relationship seems OK")
    except Exception as e:
        print(f"❌ Foreign key relationship error: {e}")
    
    print("\n✅ Database test complete!")
    
except Exception as e:
    print(f"❌ Setup error: {e}")
    import traceback
    traceback.print_exc()
