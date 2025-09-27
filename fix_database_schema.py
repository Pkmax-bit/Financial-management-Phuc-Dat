#!/usr/bin/env python3
"""
Script to fix database schema issues
"""

import os
import sys
from supabase import create_client, Client

# Add the backend directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from services.supabase_client import get_supabase_client

def check_and_fix_schema():
    """Check and fix database schema issues"""
    
    print("=== Database Schema Check and Fix ===")
    
    try:
        supabase = get_supabase_client()
        print("✅ Connected to Supabase")
        
        # Check if positions table has correct columns
        print("\n1. Checking positions table structure...")
        try:
            result = supabase.table("positions").select("id, name, code, title").limit(1).execute()
            print("✅ Positions table accessible")
            
            # Check if we have both name and title columns
            if result.data:
                columns = list(result.data[0].keys())
                print(f"Available columns: {columns}")
                
                if 'title' in columns and 'name' not in columns:
                    print("⚠️  Found 'title' column but not 'name' - schema mismatch!")
                    return False
                elif 'name' in columns and 'title' not in columns:
                    print("✅ Found 'name' column - schema is correct")
                    return True
                else:
                    print("✅ Both columns exist - checking which one to use")
                    return True
            else:
                print("⚠️  No data in positions table")
                return True
                
        except Exception as e:
            print(f"❌ Error checking positions table: {e}")
            return False
            
        # Check foreign key relationships
        print("\n2. Checking foreign key relationships...")
        try:
            # Test a simple join query
            result = supabase.table("employees")\
                .select("id, first_name, last_name, position_id, positions(name)")\
                .limit(1)\
                .execute()
            
            if result.data:
                print("✅ Foreign key relationship works")
                return True
            else:
                print("⚠️  No employees found, but relationship seems OK")
                return True
                
        except Exception as e:
            print(f"❌ Foreign key relationship error: {e}")
            return False
            
    except Exception as e:
        print(f"❌ Database connection error: {e}")
        return False

def create_sample_data():
    """Create sample data if needed"""
    
    print("\n=== Creating Sample Data ===")
    
    try:
        supabase = get_supabase_client()
        
        # Check if we have departments
        dept_result = supabase.table("departments").select("id").limit(1).execute()
        if not dept_result.data:
            print("Creating sample departments...")
            departments = [
                {"name": "IT Department", "code": "IT", "description": "Information Technology"},
                {"name": "Human Resources", "code": "HR", "description": "Human Resources Management"},
                {"name": "Finance", "code": "FIN", "description": "Financial Management"}
            ]
            
            for dept in departments:
                supabase.table("departments").insert(dept).execute()
            print("✅ Sample departments created")
        
        # Check if we have positions
        pos_result = supabase.table("positions").select("id").limit(1).execute()
        if not pos_result.data:
            print("Creating sample positions...")
            
            # Get department IDs
            dept_result = supabase.table("departments").select("id, name").execute()
            dept_map = {dept["name"]: dept["id"] for dept in dept_result.data}
            
            positions = [
                {"name": "Software Developer", "code": "DEV001", "description": "Full-stack developer", "department_id": dept_map.get("IT Department")},
                {"name": "HR Manager", "code": "HR001", "description": "Human Resources Manager", "department_id": dept_map.get("Human Resources")},
                {"name": "Finance Manager", "code": "FIN001", "description": "Financial Manager", "department_id": dept_map.get("Finance")}
            ]
            
            for pos in positions:
                supabase.table("positions").insert(pos).execute()
            print("✅ Sample positions created")
        
        print("✅ Sample data setup complete")
        return True
        
    except Exception as e:
        print(f"❌ Error creating sample data: {e}")
        return False

def main():
    """Main function"""
    
    print("Database Schema Fix Script")
    print("=" * 50)
    
    # Check schema
    schema_ok = check_and_fix_schema()
    
    if not schema_ok:
        print("\n❌ Schema issues detected!")
        print("Please check your database schema and ensure:")
        print("1. positions table has 'name' column (not 'title')")
        print("2. Foreign key relationships are properly set up")
        print("3. All required tables exist")
        return False
    
    # Create sample data
    data_ok = create_sample_data()
    
    if schema_ok and data_ok:
        print("\n✅ Database schema check complete!")
        print("Database is ready for use.")
        return True
    else:
        print("\n❌ Some issues remain.")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
