#!/usr/bin/env python3
"""
Detailed Balance Sheet Debug
Debug the balance sheet calculation step by step
"""

import os
import sys
from datetime import datetime, date
from dotenv import load_dotenv
from supabase import create_client, Client

def debug_balance_sheet_step_by_step():
    """Debug balance sheet calculation step by step"""
    try:
        load_dotenv()
        
        url = os.getenv('SUPABASE_URL')
        key = os.getenv('SUPABASE_ANON_KEY')
        
        if not url or not key:
            print("Missing Supabase credentials")
            return False
            
        supabase: Client = create_client(url, key)
        
        as_of_date = "2024-12-31"
        print(f"Debugging balance sheet for date: {as_of_date}")
        
        # Step 1: Check invoices
        print("\n=== STEP 1: INVOICES ===")
        invoices = supabase.table("invoices")\
            .select("invoice_number, total_amount, paid_amount, issue_date, payment_status")\
            .lte("issue_date", as_of_date)\
            .execute()
        
        print(f"Found {len(invoices.data)} invoices")
        for invoice in invoices.data:
            print(f"  {invoice['invoice_number']}: Total={invoice['total_amount']}, Paid={invoice['paid_amount']}, Status={invoice['payment_status']}")
        
        # Calculate accounts receivable
        accounts_receivable = sum(
            float(invoice["total_amount"] or 0) - float(invoice["paid_amount"] or 0) 
            for invoice in invoices.data
        )
        print(f"Accounts Receivable: {accounts_receivable:,.0f} VND")
        
        # Step 2: Check cash from invoices
        print("\n=== STEP 2: CASH FROM INVOICES ===")
        all_invoices = supabase.table("invoices")\
            .select("paid_amount, issue_date")\
            .lte("issue_date", as_of_date)\
            .execute()
        
        print(f"All invoices (paid amounts): {len(all_invoices.data)}")
        total_cash_in = 0
        for invoice in all_invoices.data:
            paid_amount = float(invoice["paid_amount"] or 0)
            total_cash_in += paid_amount
            print(f"  Paid amount: {paid_amount:,.0f} VND")
        
        print(f"Total cash in: {total_cash_in:,.0f} VND")
        
        # Step 3: Check expenses
        print("\n=== STEP 3: EXPENSES ===")
        all_expenses = supabase.table("expenses")\
            .select("expense_code, amount, expense_date, status")\
            .lte("expense_date", as_of_date)\
            .execute()
        
        print(f"Found {len(all_expenses.data)} expenses")
        total_cash_out = 0
        for expense in all_expenses.data:
            amount = float(expense["amount"] or 0)
            total_cash_out += amount
            print(f"  {expense['expense_code']}: {amount:,.0f} VND, Status: {expense['status']}")
        
        print(f"Total cash out: {total_cash_out:,.0f} VND")
        
        # Calculate net cash
        cash_balance = max(0, total_cash_in - total_cash_out)
        print(f"Net cash balance: {cash_balance:,.0f} VND")
        
        # Step 4: Check projects
        print("\n=== STEP 4: PROJECTS ===")
        projects = supabase.table("projects")\
            .select("project_code, budget, actual_cost, created_at")\
            .lte("created_at", as_of_date)\
            .execute()
        
        print(f"Found {len(projects.data)} projects")
        for project in projects.data:
            budget = float(project["budget"] or 0)
            actual_cost = float(project["actual_cost"] or 0)
            print(f"  {project['project_code']}: Budget={budget:,.0f}, Actual={actual_cost:,.0f}")
        
        # Calculate inventory and fixed assets
        inventory = sum(
            float(project["budget"] or 0) * 0.1
            for project in projects.data
        )
        print(f"Inventory (10% of budgets): {inventory:,.0f} VND")
        
        fixed_assets = sum(
            float(project["budget"] or 0) * 0.2
            for project in projects.data
        )
        print(f"Fixed assets (20% of budgets): {fixed_assets:,.0f} VND")
        
        # Step 5: Check bills
        print("\n=== STEP 5: BILLS ===")
        bills = supabase.table("bills")\
            .select("bill_number, amount, paid_amount, issue_date, status")\
            .lte("issue_date", as_of_date)\
            .execute()
        
        print(f"Found {len(bills.data)} bills")
        for bill in bills.data:
            print(f"  {bill['bill_number']}: Amount={bill['amount']}, Paid={bill['paid_amount']}, Status={bill['status']}")
        
        # Calculate accounts payable
        accounts_payable = sum(
            float(bill["amount"] or 0) - float(bill["paid_amount"] or 0)
            for bill in bills.data
        )
        print(f"Accounts Payable: {accounts_payable:,.0f} VND")
        
        # Step 6: Calculate totals
        print("\n=== STEP 6: TOTALS ===")
        current_assets = cash_balance + accounts_receivable + inventory
        total_assets = current_assets + fixed_assets
        
        long_term_liabilities = sum(
            float(project["budget"] or 0) * 0.3
            for project in projects.data
        )
        total_liabilities = accounts_payable + long_term_liabilities
        total_equity = total_assets - total_liabilities
        
        print(f"Current Assets: {current_assets:,.0f} VND")
        print(f"Fixed Assets: {fixed_assets:,.0f} VND")
        print(f"Total Assets: {total_assets:,.0f} VND")
        print(f"Accounts Payable: {accounts_payable:,.0f} VND")
        print(f"Long-term Liabilities: {long_term_liabilities:,.0f} VND")
        print(f"Total Liabilities: {total_liabilities:,.0f} VND")
        print(f"Total Equity: {total_equity:,.0f} VND")
        print(f"Balance Check: {total_assets == (total_liabilities + total_equity)}")
        
        return True
        
    except Exception as e:
        print(f"Error in detailed debug: {e}")
        return False

def main():
    """Main function"""
    print("Detailed Balance Sheet Debug...")
    
    if not debug_balance_sheet_step_by_step():
        print("Debug failed!")
        return
    
    print("\nDebug completed!")

if __name__ == "__main__":
    main()
