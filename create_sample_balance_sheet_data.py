#!/usr/bin/env python3
"""
Create Sample Data for Balance Sheet Testing
Creates minimal sample data to test balance sheet functionality
"""

import os
import sys
import uuid
from datetime import datetime, date
from dotenv import load_dotenv
from supabase import create_client, Client

def create_sample_data():
    """Create minimal sample data for balance sheet testing"""
    try:
        load_dotenv()
        
        url = os.getenv('SUPABASE_URL')
        key = os.getenv('SUPABASE_ANON_KEY')
        
        if not url or not key:
            print("Missing Supabase credentials")
            return False
            
        supabase: Client = create_client(url, key)
        
        # Create a test customer first
        customer_data = {
            "customer_code": "CUST-001",
            "name": "Test Customer",
            "email": "test@customer.com",
            "phone": "0123456789",
            "address": "Test Address",
            "customer_type": "company",
            "status": "active"
        }
        
        try:
            customer_result = supabase.table('customers').upsert(customer_data).execute()
            customer_id = customer_result.data[0]['id'] if customer_result.data else str(uuid.uuid4())
        except Exception as e:
            print(f"Warning creating customer: {e}")
            customer_id = str(uuid.uuid4())
        
        # Create a test vendor
        vendor_data = {
            "vendor_code": "VEND-001", 
            "name": "Test Vendor",
            "email": "test@vendor.com",
            "phone": "0987654321",
            "address": "Vendor Address"
        }
        
        try:
            vendor_result = supabase.table('vendors').upsert(vendor_data).execute()
            vendor_id = vendor_result.data[0]['id'] if vendor_result.data else str(uuid.uuid4())
        except Exception as e:
            print(f"Warning creating vendor: {e}")
            vendor_id = str(uuid.uuid4())
        
        # Create a test project
        project_data = {
            "project_code": "PROJ-001",
            "name": "Test Project",
            "description": "Test project for balance sheet",
            "customer_id": customer_id,
            "start_date": "2024-01-01",
            "budget": 10000000,
            "status": "active",
            "billing_type": "fixed"
        }
        
        try:
            project_result = supabase.table('projects').upsert(project_data).execute()
            project_id = project_result.data[0]['id'] if project_result.data else str(uuid.uuid4())
        except Exception as e:
            print(f"Warning creating project: {e}")
            project_id = str(uuid.uuid4())
        
        # Create sample invoices
        invoice_data = {
            "invoice_number": "INV-001",
            "customer_id": customer_id,
            "project_id": project_id,
            "issue_date": "2024-12-01",
            "due_date": "2024-12-31",
            "subtotal": 5000000,
            "tax_rate": 10.0,
            "tax_amount": 500000,
            "total_amount": 5500000,
            "payment_status": "partial",
            "paid_amount": 3000000
        }
        
        try:
            supabase.table('invoices').upsert(invoice_data).execute()
            print("Created sample invoice")
        except Exception as e:
            print(f"Warning creating invoice: {e}")
        
        # Create sample bills
        bill_data = {
            "bill_number": "BILL-001",
            "vendor_id": vendor_id,
            "project_id": project_id,
            "issue_date": "2024-12-05",
            "due_date": "2024-12-25",
            "amount": 2000000,
            "status": "partial",
            "paid_amount": 1000000
        }
        
        try:
            supabase.table('bills').upsert(bill_data).execute()
            print("Created sample bill")
        except Exception as e:
            print(f"Warning creating bill: {e}")
        
        # Create sample expenses (need expense_code)
        expense_data = {
            "expense_code": "EXP-001",
            "project_id": project_id,
            "category": "supplies",
            "description": "Office supplies",
            "amount": 500000,
            "expense_date": "2024-12-10",
            "status": "paid"
        }
        
        try:
            supabase.table('expenses').upsert(expense_data).execute()
            print("Created sample expense")
        except Exception as e:
            print(f"Warning creating expense: {e}")
        
        print("Sample data creation completed!")
        return True
        
    except Exception as e:
        print(f"Error creating sample data: {e}")
        return False

def test_balance_sheet():
    """Test the balance sheet with sample data"""
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
                print(f"  {asset['category']}: {asset['amount']:,.0f} VND ({asset['percentage']:.1f}%)")
            
            print("\nLiability Breakdown:")
            for liability in data['liabilities']['liability_breakdown']:
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
    print("Creating sample data for Balance Sheet testing...")
    
    # Create sample data
    if not create_sample_data():
        print("Failed to create sample data")
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
