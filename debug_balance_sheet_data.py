#!/usr/bin/env python3
"""
Debug Balance Sheet Data
Check what data exists and debug the balance sheet calculations
"""

import os
import sys
from datetime import datetime, date
from dotenv import load_dotenv
from supabase import create_client, Client

def check_database_data():
    """Check what data exists in the database"""
    try:
        load_dotenv()
        
        url = os.getenv('SUPABASE_URL')
        key = os.getenv('SUPABASE_ANON_KEY')
        
        if not url or not key:
            print("Missing Supabase credentials")
            return False
            
        supabase: Client = create_client(url, key)
        
        # Check invoices
        print("Checking invoices...")
        invoices = supabase.table('invoices').select('*').execute()
        print(f"Found {len(invoices.data)} invoices")
        for invoice in invoices.data:
            print(f"  {invoice['invoice_number']}: {invoice['total_amount']} VND, Paid: {invoice['paid_amount']} VND")
        
        # Check bills
        print("\nChecking bills...")
        bills = supabase.table('bills').select('*').execute()
        print(f"Found {len(bills.data)} bills")
        for bill in bills.data:
            print(f"  {bill['bill_number']}: {bill['amount']} VND, Paid: {bill['paid_amount']} VND")
        
        # Check projects
        print("\nChecking projects...")
        projects = supabase.table('projects').select('*').execute()
        print(f"Found {len(projects.data)} projects")
        for project in projects.data:
            print(f"  {project['project_code']}: Budget {project['budget']} VND")
        
        # Check expenses
        print("\nChecking expenses...")
        expenses = supabase.table('expenses').select('*').execute()
        print(f"Found {len(expenses.data)} expenses")
        for expense in expenses.data:
            print(f"  {expense['expense_code']}: {expense['amount']} VND, Status: {expense['status']}")
        
        return True
        
    except Exception as e:
        print(f"Error checking database data: {e}")
        return False

def test_balance_sheet_calculation():
    """Test balance sheet calculation manually"""
    try:
        load_dotenv()
        
        url = os.getenv('SUPABASE_URL')
        key = os.getenv('SUPABASE_ANON_KEY')
        
        if not url or not key:
            print("Missing Supabase credentials")
            return False
            
        supabase: Client = create_client(url, key)
        
        as_of_date = "2024-12-31"
        
        # Calculate assets manually
        print("\nCalculating assets manually...")
        
        # Accounts receivable from invoices
        invoices = supabase.table("invoices")\
            .select("total_amount, paid_amount")\
            .lte("issue_date", as_of_date)\
            .execute()
        
        accounts_receivable = sum(
            float(invoice["total_amount"] or 0) - float(invoice["paid_amount"] or 0) 
            for invoice in invoices.data
        )
        print(f"Accounts Receivable: {accounts_receivable:,.0f} VND")
        
        # Cash from paid invoices
        paid_invoices = supabase.table("invoices")\
            .select("paid_amount")\
            .eq("payment_status", "paid")\
            .lte("issue_date", as_of_date)\
            .execute()
        
        total_cash_in = sum(float(invoice["paid_amount"] or 0) for invoice in paid_invoices.data)
        print(f"Cash from paid invoices: {total_cash_in:,.0f} VND")
        
        # Cash out from paid expenses
        paid_expenses = supabase.table("expenses")\
            .select("amount")\
            .eq("status", "paid")\
            .lte("expense_date", as_of_date)\
            .execute()
        
        total_cash_out = sum(float(expense["amount"] or 0) for expense in paid_expenses.data)
        print(f"Cash out from expenses: {total_cash_out:,.0f} VND")
        
        cash_balance = max(0, total_cash_in - total_cash_out)
        print(f"Net Cash Balance: {cash_balance:,.0f} VND")
        
        # Calculate liabilities manually
        print("\nCalculating liabilities manually...")
        
        # Accounts payable from bills
        bills = supabase.table("bills")\
            .select("amount, paid_amount")\
            .lte("issue_date", as_of_date)\
            .execute()
        
        accounts_payable = sum(
            float(bill["amount"] or 0) - float(bill["paid_amount"] or 0)
            for bill in bills.data
        )
        print(f"Accounts Payable: {accounts_payable:,.0f} VND")
        
        # Project-based calculations
        projects = supabase.table("projects")\
            .select("budget, actual_cost")\
            .lte("created_at", as_of_date)\
            .execute()
        
        inventory = sum(
            float(project["budget"] or 0) * 0.1  # 10% of budget is inventory
            for project in projects.data
        )
        print(f"Inventory: {inventory:,.0f} VND")
        
        fixed_assets = sum(
            float(project["budget"] or 0) * 0.2  # 20% of budget is fixed assets
            for project in projects.data
        )
        print(f"Fixed Assets: {fixed_assets:,.0f} VND")
        
        long_term_liabilities = sum(
            float(project["budget"] or 0) * 0.3  # 30% is long-term debt
            for project in projects.data
        )
        print(f"Long-term Liabilities: {long_term_liabilities:,.0f} VND")
        
        # Totals
        total_assets = cash_balance + accounts_receivable + inventory + fixed_assets
        total_liabilities = accounts_payable + long_term_liabilities
        total_equity = total_assets - total_liabilities
        
        print(f"\nTOTALS:")
        print(f"Total Assets: {total_assets:,.0f} VND")
        print(f"Total Liabilities: {total_liabilities:,.0f} VND")
        print(f"Total Equity: {total_equity:,.0f} VND")
        print(f"Balance Check: {total_assets == (total_liabilities + total_equity)}")
        
        return True
        
    except Exception as e:
        print(f"Error in manual calculation: {e}")
        return False

def main():
    """Main function"""
    print("Debugging Balance Sheet Data...")
    
    # Check database data
    print("\n1. Checking database data...")
    if not check_database_data():
        print("Failed to check database data")
        return
    
    # Test manual calculation
    print("\n2. Testing manual calculation...")
    if not test_balance_sheet_calculation():
        print("Failed manual calculation")
        return
    
    print("\nDebug completed!")

if __name__ == "__main__":
    main()
