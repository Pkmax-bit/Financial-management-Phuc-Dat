#!/usr/bin/env python3
"""
Simple script to show instructions for inserting sample data
"""

def main():
    """Main function"""
    print("Financial Management System - Sample Data Instructions")
    print("=" * 60)
    
    print("\nSTEP 1: Access Supabase Dashboard")
    print("1. Go to your Supabase project dashboard")
    print("2. Navigate to 'SQL Editor' in the left sidebar")
    print("3. Click 'New Query' to create a new SQL script")
    
    print("\nSTEP 2: Insert Sample Data")
    print("1. Open the file 'create_sample_data.sql' in this directory")
    print("2. Copy ALL the content from the file")
    print("3. Paste it into the Supabase SQL Editor")
    print("4. Click 'Run' to execute the script")
    
    print("\nSTEP 3: Verify Data Insertion")
    print("After running the script, you should see:")
    print("- 5 customers inserted")
    print("- 5 vendors inserted")
    print("- 5 projects inserted")
    print("- 5 invoices inserted")
    print("- 3 sales receipts inserted")
    print("- 5 bills inserted")
    print("- 5 expenses inserted")
    print("- 5 journal entries with lines inserted")
    print("- 2 credit memos inserted")
    print("- 3 expense claims inserted")
    print("- 3 budgets with lines inserted")
    
    print("\nSTEP 4: Test Reports")
    print("Go to your application and test these reports:")
    print("1. Profit & Loss Report")
    print("   - Should show revenue ~230M VND")
    print("   - Should show expenses ~92.5M VND")
    print("   - Should show net profit ~137.5M VND")
    
    print("\n2. Balance Sheet Report")
    print("   - Should show assets, liabilities, and equity")
    print("   - Should balance: Assets = Liabilities + Equity")
    
    print("\n3. Cash Flow Statement")
    print("   - Should show operating, investing, and financing activities")
    print("   - Should reconcile with cash account changes")
    
    print("\n4. Sales by Customer Report")
    print("   - Should rank customers by total revenue")
    print("   - Top customer should be GHI Group (~88M VND)")
    
    print("\n5. Expenses by Vendor Report")
    print("   - Should rank vendors by total expenses")
    print("   - Top vendor should be STU Group (~30M VND)")
    
    print("\n6. General Ledger Report")
    print("   - Should show all journal entries chronologically")
    print("   - Should include running balances")
    print("   - Should allow drill-down to transaction details")
    
    print("\nSAMPLE DATA SUMMARY:")
    print("- Total Sales Revenue: ~230M VND")
    print("- Total Expenses: ~92.5M VND")
    print("- Net Profit: ~137.5M VND")
    print("- 5 Customers (mix of companies and individuals)")
    print("- 5 Vendors (various supplier types)")
    print("- 5 Projects (different priorities and statuses)")
    print("- Complete double-entry accounting records")
    print("- Various transaction statuses for testing")
    
    print("\nTROUBLESHOOTING:")
    print("If you encounter errors:")
    print("1. Make sure all required tables exist in your database")
    print("2. Check for foreign key constraint violations")
    print("3. Verify your Supabase RLS policies allow inserts")
    print("4. Clear existing data if you get duplicate key errors")
    
    print("\nCLEAN UP (if needed):")
    print("To remove all sample data, run this SQL:")
    print("DELETE FROM budget_lines;")
    print("DELETE FROM budgets;")
    print("DELETE FROM expense_claims;")
    print("DELETE FROM credit_memos;")
    print("DELETE FROM journal_entry_lines;")
    print("DELETE FROM journal_entries;")
    print("DELETE FROM expenses;")
    print("DELETE FROM bills;")
    print("DELETE FROM sales_receipts;")
    print("DELETE FROM invoices;")
    print("DELETE FROM projects;")
    print("DELETE FROM vendors;")
    print("DELETE FROM customers;")
    
    print("\n" + "=" * 60)
    print("Ready to test all reporting functionality!")

if __name__ == "__main__":
    main()
