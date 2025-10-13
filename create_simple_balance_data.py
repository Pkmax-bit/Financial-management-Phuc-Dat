#!/usr/bin/env python3
"""
Create Simple Balance Sheet Data
Creates minimal data directly in the database for balance sheet testing
"""

import os
import sys
import uuid
from datetime import datetime, date
from dotenv import load_dotenv
from supabase import create_client, Client

def create_simple_data():
    """Create simple data for balance sheet testing"""
    try:
        load_dotenv()
        
        url = os.getenv('SUPABASE_URL')
        key = os.getenv('SUPABASE_ANON_KEY')
        
        if not url or not key:
            print("Missing Supabase credentials")
            return False
            
        supabase: Client = create_client(url, key)
        
        # Create simple invoices with minimal required fields
        invoice_data = {
            "invoice_number": "INV-SIMPLE-001",
            "customer_id": str(uuid.uuid4()),  # Random UUID
            "issue_date": "2024-12-01",
            "due_date": "2024-12-31",
            "subtotal": 5000000,
            "tax_rate": 0.0,
            "tax_amount": 0.0,
            "total_amount": 5000000,
            "payment_status": "partial",
            "paid_amount": 3000000
        }
        
        try:
            supabase.table('invoices').upsert(invoice_data).execute()
            print("Created simple invoice")
        except Exception as e:
            print(f"Warning creating invoice: {e}")
        
        # Create simple bills
        bill_data = {
            "bill_number": "BILL-SIMPLE-001",
            "vendor_id": str(uuid.uuid4()),  # Random UUID
            "issue_date": "2024-12-05",
            "due_date": "2024-12-25",
            "amount": 2000000,
            "status": "partial",
            "paid_amount": 1000000
        }
        
        try:
            supabase.table('bills').upsert(bill_data).execute()
            print("Created simple bill")
        except Exception as e:
            print(f"Warning creating bill: {e}")
        
        # Create simple projects
        project_data = {
            "project_code": "PROJ-SIMPLE-001",
            "name": "Simple Test Project",
            "customer_id": str(uuid.uuid4()),  # Random UUID
            "start_date": "2024-01-01",
            "budget": 10000000
        }
        
        try:
            supabase.table('projects').upsert(project_data).execute()
            print("Created simple project")
        except Exception as e:
            print(f"Warning creating project: {e}")
        
        # Create simple expenses
        expense_data = {
            "expense_code": "EXP-SIMPLE-001",
            "description": "Simple test expense",
            "amount": 500000,
            "expense_date": "2024-12-10",
            "status": "paid"
        }
        
        try:
            supabase.table('expenses').upsert(expense_data).execute()
            print("Created simple expense")
        except Exception as e:
            print(f"Warning creating expense: {e}")
        
        print("Simple data creation completed!")
        return True
        
    except Exception as e:
        print(f"Error creating simple data: {e}")
        return False

def test_balance_sheet():
    """Test the balance sheet with simple data"""
    try:
        import requests
        
        url = "http://localhost:8000/api/reports/financial/balance-sheet"
        params = {"as_of_date": "2024-12-31"}
        
        response = requests.get(url, params=params)
        
        if response.status_code == 200:
            data = response.json()
            print("\nBalance Sheet Results:")
            print(f"Total Assets: {data['assets']['total_assets']:,.0f} VND")
            print(f"Total Liabilities: {data['liabilities']['total_liabilities']:,.0f} VND")
            print(f"Total Equity: {data['equity']['total_equity']:,.0f} VND")
            print(f"Balance Check: {data['summary']['balance_check']}")
            
            # Show breakdown
            print("\nAsset Breakdown:")
            for asset in data['assets']['asset_breakdown']:
                if asset['amount'] > 0:
                    print(f"  {asset['category']}: {asset['amount']:,.0f} VND ({asset['percentage']:.1f}%)")
            
            print("\nLiability Breakdown:")
            for liability in data['liabilities']['liability_breakdown']:
                if liability['amount'] > 0:
                    print(f"  {liability['category']}: {liability['amount']:,.0f} VND ({liability['percentage']:.1f}%)")
            
            return True
        else:
            print(f"API Error: {response.status_code} - {response.text}")
            return False
            
    except Exception as e:
        print(f"Error testing balance sheet: {e}")
        return False

def main():
    """Main function"""
    print("Creating simple data for Balance Sheet testing...")
    
    # Create simple data
    if not create_simple_data():
        print("Failed to create simple data")
        return
    
    # Test balance sheet
    print("\nTesting Balance Sheet...")
    if test_balance_sheet():
        print("\nBalance Sheet test completed successfully!")
        print("\nYou can now:")
        print("1. Open http://localhost:3000/reports/balance-sheet in your browser")
        print("2. View the balance sheet with real data")
        print("3. Verify the financial position")
    else:
        print("Balance Sheet test failed!")

if __name__ == "__main__":
    main()
