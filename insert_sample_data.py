#!/usr/bin/env python3
"""
Script to insert sample data into the Financial Management System database
This script will populate the database with comprehensive sample data for testing reports
"""

import os
import sys
import asyncio
from datetime import datetime, date
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def get_supabase_client() -> Client:
    """Initialize Supabase client"""
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_ANON_KEY")
    
    if not url or not key:
        print("❌ Error: SUPABASE_URL and SUPABASE_ANON_KEY must be set in .env file")
        sys.exit(1)
    
    return create_client(url, key)

def read_sql_file(file_path: str) -> str:
    """Read SQL file content"""
    try:
        with open(file_path, 'r', encoding='utf-8') as file:
            return file.read()
    except FileNotFoundError:
        print(f"❌ Error: SQL file not found: {file_path}")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Error reading SQL file: {e}")
        sys.exit(1)

def execute_sql_script(supabase: Client, sql_content: str) -> bool:
    """Execute SQL script using Supabase RPC"""
    try:
        # Split SQL content into individual statements
        statements = [stmt.strip() for stmt in sql_content.split(';') if stmt.strip()]
        
        success_count = 0
        total_count = len(statements)
        
        print(f"📊 Executing {total_count} SQL statements...")
        
        for i, statement in enumerate(statements, 1):
            if not statement:
                continue
                
            try:
                # Execute each statement
                result = supabase.rpc('exec_sql', {'sql_query': statement}).execute()
                
                if hasattr(result, 'data') and result.data is not None:
                    success_count += 1
                    print(f"✅ Statement {i}/{total_count} executed successfully")
                else:
                    print(f"⚠️  Statement {i}/{total_count} executed with warnings")
                    success_count += 1
                    
            except Exception as e:
                print(f"❌ Error executing statement {i}/{total_count}: {e}")
                print(f"Statement: {statement[:100]}...")
                # Continue with other statements
                continue
        
        print(f"📈 Summary: {success_count}/{total_count} statements executed successfully")
        return success_count == total_count
        
    except Exception as e:
        print(f"❌ Error executing SQL script: {e}")
        return False

def test_sample_data(supabase: Client) -> bool:
    """Test that sample data was inserted correctly"""
    print("\n🧪 Testing sample data...")
    
    try:
        # Test customers
        customers_result = supabase.table('customers').select('id, name').limit(5).execute()
        if customers_result.data:
            print(f"✅ Found {len(customers_result.data)} customers")
            for customer in customers_result.data:
                print(f"   - {customer['name']}")
        else:
            print("❌ No customers found")
            return False
        
        # Test invoices
        invoices_result = supabase.table('invoices').select('invoice_number, total_amount').limit(5).execute()
        if invoices_result.data:
            print(f"✅ Found {len(invoices_result.data)} invoices")
            total_invoice_amount = sum(float(inv['total_amount']) for inv in invoices_result.data)
            print(f"   Total invoice amount: {total_invoice_amount:,.0f} VND")
        else:
            print("❌ No invoices found")
            return False
        
        # Test sales receipts
        sales_receipts_result = supabase.table('sales_receipts').select('receipt_number, total_amount').limit(5).execute()
        if sales_receipts_result.data:
            print(f"✅ Found {len(sales_receipts_result.data)} sales receipts")
            total_receipt_amount = sum(float(receipt['total_amount']) for receipt in sales_receipts_result.data)
            print(f"   Total sales receipt amount: {total_receipt_amount:,.0f} VND")
        else:
            print("❌ No sales receipts found")
            return False
        
        # Test bills
        bills_result = supabase.table('bills').select('bill_number, amount').limit(5).execute()
        if bills_result.data:
            print(f"✅ Found {len(bills_result.data)} bills")
            total_bill_amount = sum(float(bill['amount']) for bill in bills_result.data)
            print(f"   Total bill amount: {total_bill_amount:,.0f} VND")
        else:
            print("❌ No bills found")
            return False
        
        # Test expenses
        expenses_result = supabase.table('expenses').select('expense_code, amount').limit(5).execute()
        if expenses_result.data:
            print(f"✅ Found {len(expenses_result.data)} expenses")
            total_expense_amount = sum(float(expense['amount']) for expense in expenses_result.data)
            print(f"   Total expense amount: {total_expense_amount:,.0f} VND")
        else:
            print("❌ No expenses found")
            return False
        
        # Test journal entries
        journal_entries_result = supabase.table('journal_entries').select('entry_number, total_debit').limit(5).execute()
        if journal_entries_result.data:
            print(f"✅ Found {len(journal_entries_result.data)} journal entries")
            total_debit = sum(float(entry['total_debit']) for entry in journal_entries_result.data)
            print(f"   Total debit amount: {total_debit:,.0f} VND")
        else:
            print("❌ No journal entries found")
            return False
        
        # Test vendors
        vendors_result = supabase.table('vendors').select('name').limit(5).execute()
        if vendors_result.data:
            print(f"✅ Found {len(vendors_result.data)} vendors")
        else:
            print("❌ No vendors found")
            return False
        
        # Test projects
        projects_result = supabase.table('projects').select('name, budget').limit(5).execute()
        if projects_result.data:
            print(f"✅ Found {len(projects_result.data)} projects")
            total_budget = sum(float(proj['budget']) for proj in projects_result.data if proj['budget'])
            print(f"   Total project budget: {total_budget:,.0f} VND")
        else:
            print("❌ No projects found")
            return False
        
        print("\n🎉 All sample data tests passed!")
        return True
        
    except Exception as e:
        print(f"❌ Error testing sample data: {e}")
        return False

def generate_report_summary(supabase: Client):
    """Generate a summary of the sample data for reports"""
    print("\n📊 Sample Data Summary for Reports:")
    print("=" * 50)
    
    try:
        # Sales Summary
        invoices_result = supabase.table('invoices').select('total_amount, status').execute()
        sales_receipts_result = supabase.table('sales_receipts').select('total_amount').execute()
        
        total_invoice_amount = sum(float(inv['total_amount']) for inv in invoices_result.data)
        total_receipt_amount = sum(float(receipt['total_amount']) for receipt in sales_receipts_result.data)
        total_sales = total_invoice_amount + total_receipt_amount
        
        print(f"💰 Total Sales Revenue: {total_sales:,.0f} VND")
        print(f"   - Invoices: {total_invoice_amount:,.0f} VND")
        print(f"   - Sales Receipts: {total_receipt_amount:,.0f} VND")
        
        # Expenses Summary
        bills_result = supabase.table('bills').select('amount').execute()
        expenses_result = supabase.table('expenses').select('amount').execute()
        
        total_bill_amount = sum(float(bill['amount']) for bill in bills_result.data)
        total_expense_amount = sum(float(expense['amount']) for expense in expenses_result.data)
        total_expenses = total_bill_amount + total_expense_amount
        
        print(f"💸 Total Expenses: {total_expenses:,.0f} VND")
        print(f"   - Bills: {total_bill_amount:,.0f} VND")
        print(f"   - Expenses: {total_expense_amount:,.0f} VND")
        
        # Net Profit
        net_profit = total_sales - total_expenses
        print(f"📈 Net Profit: {net_profit:,.0f} VND")
        
        # Customer Summary
        customers_result = supabase.table('customers').select('name, customer_type').execute()
        print(f"\n👥 Customers: {len(customers_result.data)}")
        for customer in customers_result.data:
            print(f"   - {customer['name']} ({customer['customer_type']})")
        
        # Vendor Summary
        vendors_result = supabase.table('vendors').select('name').execute()
        print(f"\n🏢 Vendors: {len(vendors_result.data)}")
        for vendor in vendors_result.data:
            print(f"   - {vendor['name']}")
        
        # Project Summary
        projects_result = supabase.table('projects').select('name, budget, status').execute()
        print(f"\n📋 Projects: {len(projects_result.data)}")
        for project in projects_result.data:
            budget = project['budget'] if project['budget'] else 0
            print(f"   - {project['name']} (Budget: {budget:,.0f} VND, Status: {project['status']})")
        
        print("\n" + "=" * 50)
        print("✅ Sample data is ready for testing all reports!")
        
    except Exception as e:
        print(f"❌ Error generating summary: {e}")

def main():
    """Main function"""
    print("🚀 Financial Management System - Sample Data Insertion")
    print("=" * 60)
    
    # Initialize Supabase client
    supabase = get_supabase_client()
    print("✅ Connected to Supabase")
    
    # Read SQL file
    sql_file_path = "create_sample_data.sql"
    print(f"📖 Reading SQL file: {sql_file_path}")
    sql_content = read_sql_file(sql_file_path)
    
    # Execute SQL script
    print("⚡ Executing SQL script...")
    success = execute_sql_script(supabase, sql_content)
    
    if success:
        print("✅ SQL script executed successfully!")
        
        # Test sample data
        if test_sample_data(supabase):
            # Generate summary
            generate_report_summary(supabase)
            
            print("\n🎯 Next Steps:")
            print("1. Go to the Reports page in your application")
            print("2. Test the following reports:")
            print("   - Profit & Loss Report")
            print("   - Balance Sheet Report")
            print("   - Cash Flow Statement")
            print("   - Sales by Customer Report")
            print("   - Expenses by Vendor Report")
            print("   - General Ledger Report")
            print("3. Use the drill-down functionality to see transaction details")
            
        else:
            print("❌ Sample data test failed!")
            sys.exit(1)
    else:
        print("❌ SQL script execution failed!")
        sys.exit(1)

if __name__ == "__main__":
    main()
