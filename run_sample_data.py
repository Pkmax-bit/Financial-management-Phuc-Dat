#!/usr/bin/env python3
"""
Simple script to run sample data SQL directly
"""

import os
import sys
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def get_supabase_client() -> Client:
    """Initialize Supabase client"""
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_ANON_KEY")
    
    if not url or not key:
        print("Error: SUPABASE_URL and SUPABASE_ANON_KEY must be set in .env file")
        sys.exit(1)
    
    return create_client(url, key)

def main():
    """Main function"""
    print("Running Sample Data SQL Script")
    print("=" * 40)
    
    # Initialize Supabase client
    supabase = get_supabase_client()
    print("Connected to Supabase")
    
    # Read SQL file
    try:
        with open("create_sample_data.sql", 'r', encoding='utf-8') as file:
            sql_content = file.read()
        print("SQL file read successfully")
    except FileNotFoundError:
        print("Error: create_sample_data.sql file not found")
        sys.exit(1)
    
    print("\nInstructions:")
    print("1. Copy the SQL content from create_sample_data.sql")
    print("2. Go to your Supabase Dashboard")
    print("3. Navigate to SQL Editor")
    print("4. Paste and run the SQL script")
    print("5. Verify the data was inserted correctly")
    
    print("\nExpected Results:")
    print("- 5 customers")
    print("- 5 vendors") 
    print("- 5 projects")
    print("- 5 invoices")
    print("- 3 sales receipts")
    print("- 5 bills")
    print("- 5 expenses")
    print("- 5 journal entries with lines")
    print("- 2 credit memos")
    print("- 3 expense claims")
    print("- 3 budgets with lines")
    
    print("\nAfter inserting data, test these reports:")
    print("- Profit & Loss Report")
    print("- Balance Sheet Report") 
    print("- Cash Flow Statement")
    print("- Sales by Customer Report")
    print("- Expenses by Vendor Report")
    print("- General Ledger Report")

if __name__ == "__main__":
    main()
