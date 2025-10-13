#!/usr/bin/env python3
"""
Check Actual Data in Database
Check what data actually exists without date filters
"""

import os
import sys
from datetime import datetime, date
from dotenv import load_dotenv
from supabase import create_client, Client

def check_actual_data():
    """Check actual data in database"""
    try:
        load_dotenv()
        
        url = os.getenv('SUPABASE_URL')
        key = os.getenv('SUPABASE_ANON_KEY')
        
        if not url or not key:
            print("Missing Supabase credentials")
            return False
            
        supabase: Client = create_client(url, key)
        
        # Check all invoices without date filter
        print("=== ALL INVOICES ===")
        invoices = supabase.table("invoices").select("*").execute()
        print(f"Found {len(invoices.data)} invoices")
        for invoice in invoices.data:
            print(f"  {invoice['invoice_number']}: Total={invoice['total_amount']}, Paid={invoice['paid_amount']}, Issue Date={invoice['issue_date']}, Status={invoice['payment_status']}")
        
        # Check all bills without date filter
        print("\n=== ALL BILLS ===")
        bills = supabase.table("bills").select("*").execute()
        print(f"Found {len(bills.data)} bills")
        for bill in bills.data:
            print(f"  {bill['bill_number']}: Amount={bill['amount']}, Paid={bill['paid_amount']}, Issue Date={bill['issue_date']}, Status={bill['status']}")
        
        # Check all projects without date filter
        print("\n=== ALL PROJECTS ===")
        projects = supabase.table("projects").select("*").execute()
        print(f"Found {len(projects.data)} projects")
        for project in projects.data:
            print(f"  {project['project_code']}: Budget={project['budget']}, Created={project['created_at']}")
        
        # Check all expenses without date filter
        print("\n=== ALL EXPENSES ===")
        expenses = supabase.table("expenses").select("*").execute()
        print(f"Found {len(expenses.data)} expenses")
        for expense in expenses.data:
            print(f"  {expense['expense_code']}: Amount={expense['amount']}, Date={expense['expense_date']}, Status={expense['status']}")
        
        return True
        
    except Exception as e:
        print(f"Error checking actual data: {e}")
        return False

def main():
    """Main function"""
    print("Checking actual data in database...")
    
    if not check_actual_data():
        print("Check failed!")
        return
    
    print("\nCheck completed!")

if __name__ == "__main__":
    main()
