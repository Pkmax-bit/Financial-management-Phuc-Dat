#!/usr/bin/env python3
"""
Test Balance Sheet Report
Creates sample data and tests the balance sheet functionality
"""

import os
import sys
import requests
from datetime import datetime, date
from dotenv import load_dotenv
from supabase import create_client, Client

def test_balance_sheet_api():
    """Test the balance sheet API endpoint"""
    try:
        # Test API endpoint
        url = "http://localhost:8000/api/reports/financial/balance-sheet"
        params = {"as_of_date": "2024-12-31"}
        
        response = requests.get(url, params=params)
        
        if response.status_code == 200:
            data = response.json()
            print("Balance Sheet API working!")
            print(f"Total Assets: {data['assets']['total_assets']:,.0f} VND")
            print(f"Total Liabilities: {data['liabilities']['total_liabilities']:,.0f} VND")
            print(f"Total Equity: {data['equity']['total_equity']:,.0f} VND")
            print(f"Balance Check: {data['summary']['balance_check']}")
            return True
        else:
            print(f"API Error: {response.status_code} - {response.text}")
            return False
            
    except Exception as e:
        print(f"Error testing API: {e}")
        return False

def create_sample_data():
    """Create sample data for testing balance sheet"""
    try:
        load_dotenv()
        
        url = os.getenv('SUPABASE_URL')
        key = os.getenv('SUPABASE_ANON_KEY')
        
        if not url or not key:
            print("Missing Supabase credentials")
            return False
            
        supabase: Client = create_client(url, key)
        
        # Create sample invoices
        sample_invoices = [
            {
                "invoice_number": "INV-001",
                "customer_id": "test-customer-1",
                "total_amount": 5000000,
                "paid_amount": 3000000,
                "payment_status": "partial",
                "issue_date": "2024-12-01"
            },
            {
                "invoice_number": "INV-002", 
                "customer_id": "test-customer-2",
                "total_amount": 3000000,
                "paid_amount": 3000000,
                "payment_status": "paid",
                "issue_date": "2024-12-15"
            }
        ]
        
        for invoice in sample_invoices:
            try:
                supabase.table('invoices').upsert(invoice).execute()
            except Exception as e:
                print(f"Warning creating invoice {invoice['invoice_number']}: {e}")
        
        # Create sample bills
        sample_bills = [
            {
                "bill_number": "BILL-001",
                "vendor_id": "test-vendor-1", 
                "amount": 2000000,
                "paid_amount": 1000000,
                "status": "partial",
                "issue_date": "2024-12-05"
            },
            {
                "bill_number": "BILL-002",
                "vendor_id": "test-vendor-2",
                "amount": 1500000,
                "paid_amount": 0,
                "status": "pending",
                "issue_date": "2024-12-20"
            }
        ]
        
        for bill in sample_bills:
            try:
                supabase.table('bills').upsert(bill).execute()
            except Exception as e:
                print(f"Warning creating bill {bill['bill_number']}: {e}")
        
        # Create sample projects
        sample_projects = [
            {
                "project_name": "Website Development",
                "budget": 10000000,
                "actual_cost": 8000000,
                "status": "active",
                "created_at": "2024-11-01"
            },
            {
                "project_name": "Mobile App",
                "budget": 15000000,
                "actual_cost": 12000000,
                "status": "active", 
                "created_at": "2024-10-15"
            }
        ]
        
        for project in sample_projects:
            try:
                supabase.table('projects').upsert(project).execute()
            except Exception as e:
                print(f"Warning creating project {project['project_name']}: {e}")
        
        # Create sample expenses
        sample_expenses = [
            {
                "description": "Office supplies",
                "amount": 500000,
                "status": "paid",
                "expense_date": "2024-12-10"
            },
            {
                "description": "Travel expenses",
                "amount": 1200000,
                "status": "approved",
                "expense_date": "2024-12-18"
            }
        ]
        
        for expense in sample_expenses:
            try:
                supabase.table('expenses').upsert(expense).execute()
            except Exception as e:
                print(f"Warning creating expense: {e}")
        
        print("Sample data created successfully!")
        return True
        
    except Exception as e:
        print(f"Error creating sample data: {e}")
        return False

def main():
    """Main test function"""
    print("Testing Balance Sheet Report...")
    
    # Create sample data
    print("\n1. Creating sample data...")
    if not create_sample_data():
        print("Failed to create sample data")
        return
    
    # Test API
    print("\n2. Testing Balance Sheet API...")
    if test_balance_sheet_api():
        print("\nBalance Sheet test completed successfully!")
        print("\nNext steps:")
        print("1. Open http://localhost:3000/reports/balance-sheet in your browser")
        print("2. Check the balance sheet report with real data")
        print("3. Verify that Assets = Liabilities + Equity")
    else:
        print("Balance Sheet test failed!")

if __name__ == "__main__":
    main()
