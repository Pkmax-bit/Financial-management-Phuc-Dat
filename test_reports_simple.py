#!/usr/bin/env python3
"""
Simple guide to test all reports
"""

def main():
    """Main function"""
    print("Report Testing Guide")
    print("=" * 30)
    
    print("\nSTEP 1: Clean and Insert Sample Data")
    print("1. Go to Supabase Dashboard > SQL Editor")
    print("2. Copy content from 'clean_and_insert_sample_data.sql'")
    print("3. Paste and run the script")
    print("4. Verify all records are inserted")
    
    print("\nExpected Results:")
    print("- customers: 5 records")
    print("- vendors: 5 records") 
    print("- projects: 5 records")
    print("- invoices: 5 records")
    print("- sales_receipts: 3 records")
    print("- bills: 5 records")
    print("- expenses: 5 records")
    print("- journal_entries: 5 records")
    print("- journal_entry_lines: 15 records")
    print("- credit_memos: 2 records")
    print("- expense_claims: 3 records")
    print("- budgets: 3 records")
    print("- budget_lines: 6 records")
    
    print("\nSTEP 2: Test All Reports")
    print("Go to your application and test:")
    
    print("\n1. PROFIT & LOSS REPORT")
    print("   - Navigate to Reports > P&L Report")
    print("   - Set date range: 2024-01-01 to 2024-03-31")
    print("   - Expected: Revenue ~230M VND, Expenses ~92.5M VND")
    print("   - Net Income: ~137.5M VND")
    print("   - Test drill-down functionality")
    
    print("\n2. BALANCE SHEET REPORT")
    print("   - Navigate to Reports > Balance Sheet")
    print("   - Set as of date: 2024-03-31")
    print("   - Expected: Assets = Liabilities + Equity")
    print("   - Test drill-down functionality")
    
    print("\n3. CASH FLOW STATEMENT")
    print("   - Navigate to Reports > Cash Flow")
    print("   - Set date range: 2024-01-01 to 2024-03-31")
    print("   - Expected: Operating, Investing, Financing activities")
    print("   - Net Cash Flow should reconcile")
    
    print("\n4. SALES BY CUSTOMER REPORT")
    print("   - Navigate to Reports > Sales by Customer")
    print("   - Set date range: 2024-01-01 to 2024-03-31")
    print("   - Expected ranking by revenue")
    print("   - Test search and filter")
    
    print("\n5. EXPENSES BY VENDOR REPORT")
    print("   - Navigate to Reports > Expenses by Vendor")
    print("   - Set date range: 2024-01-01 to 2024-03-31")
    print("   - Expected ranking by expenses")
    print("   - Test search and filter")
    
    print("\n6. GENERAL LEDGER REPORT")
    print("   - Navigate to Reports > General Ledger")
    print("   - Set date range: 2024-01-01 to 2024-03-31")
    print("   - Expected: 5 journal entries, 15 lines")
    print("   - Test drill-down and filters")
    
    print("\nSTEP 3: Test Features")
    print("For each report, test:")
    print("- Drill-down functionality")
    print("- Date range filters")
    print("- Search and filter features")
    print("- Pagination (if applicable)")
    print("- Export functionality (if available)")
    
    print("\nSAMPLE DATA SUMMARY:")
    print("Total Sales Revenue: ~230M VND")
    print("Total Expenses: ~92.5M VND")
    print("Net Profit: ~137.5M VND")
    
    print("\nSUCCESS CRITERIA:")
    print("- All 6 reports load without errors")
    print("- Data displays correctly")
    print("- Drill-down works")
    print("- Filters work")
    print("- Numbers are accurate")
    
    print("\nTROUBLESHOOTING:")
    print("If reports show no data:")
    print("1. Check date ranges")
    print("2. Verify sample data was inserted")
    print("3. Check API endpoints")
    print("4. Verify authentication")
    
    print("\nReady to test all reports!")

if __name__ == "__main__":
    main()

