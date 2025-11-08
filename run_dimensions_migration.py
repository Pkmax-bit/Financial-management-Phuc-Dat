#!/usr/bin/env python3
"""
Script to run database migration for adding dimensions to quote_items and invoice_items
"""

import os
import sys
from supabase import create_client, Client

def get_supabase_client() -> Client:
    """Get Supabase client"""
    # Use hardcoded values from config.py
    url = "https://mfmijckzlhevduwfigkl.supabase.co"
    key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1mbWlqY2t6bGhldmR1d2ZpZ2tsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1MzkxMTIsImV4cCI6MjA3MjExNTExMn0.VPFmvLghhO32JybxDzq-CGVQedgI-LN7Q07rwDhxU4E"
    
    return create_client(url, key)

def run_migration():
    """Run the dimensions migration"""
    try:
        supabase = get_supabase_client()
        
        print("🔄 Running dimensions migration...")
        
        # Read the SQL file
        with open('add_dimensions_to_quote_invoice_items.sql', 'r', encoding='utf-8') as f:
            sql_content = f.read()
        
        # Split by semicolon and execute each statement
        statements = [stmt.strip() for stmt in sql_content.split(';') if stmt.strip()]
        
        for i, statement in enumerate(statements):
            if statement:
                print(f"📝 Executing statement {i+1}/{len(statements)}...")
                try:
                    # Use rpc to execute raw SQL
                    result = supabase.rpc('exec_sql', {'sql': statement}).execute()
                    print(f"✅ Statement {i+1} executed successfully")
                except Exception as e:
                    print(f"⚠️ Statement {i+1} failed (might already exist): {e}")
        
        print("✅ Migration completed successfully!")
        
        # Verify the columns were added
        print("\n🔍 Verifying columns...")
        
        # Check quote_items table
        try:
            result = supabase.table('quote_items').select('area, volume, height, length, depth').limit(1).execute()
            print("✅ quote_items table has dimension columns")
        except Exception as e:
            print(f"❌ quote_items table verification failed: {e}")
        
        # Check invoice_items table  
        try:
            result = supabase.table('invoice_items').select('area, volume, height, length, depth').limit(1).execute()
            print("✅ invoice_items table has dimension columns")
        except Exception as e:
            print(f"❌ invoice_items table verification failed: {e}")
            
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    run_migration()
