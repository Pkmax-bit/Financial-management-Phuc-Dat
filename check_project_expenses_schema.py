#!/usr/bin/env python3
"""
Script to check project_expenses table schema
"""

import os
import sys
from supabase import create_client, Client

def check_schema():
    """Check project_expenses table schema"""
    
    # Supabase configuration
    url = os.getenv("NEXT_PUBLIC_SUPABASE_URL", "https://mfmijckzlhevduwfigkl.supabase.co")
    key = os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1mbWlqY2t6bGhldmR1d2ZpZ2tsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1MzkxMTIsImV4cCI6MjA3MjExNTExMn0.VPFmvLghhO32JybxDzq-CGVQedgI-LN7Q07rwDhxU4E")
    
    if not url or not key:
        print("ERROR: Missing Supabase configuration")
        return
    
    try:
        supabase: Client = create_client(url, key)
        
        # Check if table exists and get schema
        print("Checking project_expenses table schema...")
        
        # Try to get table info
        try:
            # Get a sample record to see structure
            result = supabase.table("project_expenses").select("*").limit(1).execute()
            
            if result.data:
                print("SUCCESS: Table exists and has data")
                print("Sample record structure:")
                for key, value in result.data[0].items():
                    print(f"  - {key}: {type(value).__name__} = {value}")
            else:
                print("WARNING: Table exists but no data")
                
        except Exception as e:
            print(f"ERROR: Error accessing table: {e}")
            
        # Check if we can insert a test record
        print("\nTesting insert capability...")
        try:
            test_data = {
                "description": "Test expense",
                "amount": 1000,
                "expense_date": "2024-01-01",
                "status": "pending"
            }
            
            result = supabase.table("project_expenses").insert(test_data).execute()
            
            if result.data:
                print("SUCCESS: Insert successful")
                print(f"Inserted record: {result.data[0]}")
                
                # Clean up test record
                if result.data[0].get('id'):
                    supabase.table("project_expenses").delete().eq("id", result.data[0]['id']).execute()
                    print("Cleaned up test record")
            else:
                print("ERROR: Insert failed")
                
        except Exception as e:
            print(f"ERROR: Insert error: {e}")
            
    except Exception as e:
        print(f"ERROR: Connection error: {e}")

if __name__ == "__main__":
    check_schema()
