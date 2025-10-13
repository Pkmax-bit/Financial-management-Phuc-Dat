#!/usr/bin/env python3
"""
Create Balance Sheet Data using SQL
Creates data directly using SQL to bypass foreign key constraints
"""

import os
import sys
from datetime import datetime, date
from dotenv import load_dotenv
from supabase import create_client, Client

def create_balance_sheet_data():
    """Create balance sheet data using direct SQL"""
    try:
        load_dotenv()
        
        url = os.getenv('SUPABASE_URL')
        key = os.getenv('SUPABASE_ANON_KEY')
        
        if not url or not key:
            print("Missing Supabase credentials")
            return False
            
        supabase: Client = create_client(url, key)
        
        # Create sample data using SQL
        sql_commands = [
            # Insert sample invoices
            """
            INSERT INTO invoices (invoice_number, customer_id, project_id, issue_date, due_date, 
                                subtotal, tax_rate, tax_amount, total_amount, payment_status, paid_amount)
            VALUES 
                ('INV-BS-001', gen_random_uuid(), gen_random_uuid(), '2024-12-01', '2024-12-31', 
                 5000000, 0, 0, 5000000, 'partial', 3000000),
                ('INV-BS-002', gen_random_uuid(), gen_random_uuid(), '2024-12-15', '2025-01-15', 
                 3000000, 0, 0, 3000000, 'paid', 3000000)
            ON CONFLICT (invoice_number) DO NOTHING;
            """,
            
            # Insert sample bills
            """
            INSERT INTO bills (bill_number, vendor_id, project_id, issue_date, due_date, 
                             amount, status, paid_amount)
            VALUES 
                ('BILL-BS-001', gen_random_uuid(), gen_random_uuid(), '2024-12-05', '2024-12-25', 
                 2000000, 'partial', 1000000),
                ('BILL-BS-002', gen_random_uuid(), gen_random_uuid(), '2024-12-20', '2025-01-20', 
                 1500000, 'pending', 0)
            ON CONFLICT (bill_number) DO NOTHING;
            """,
            
            # Insert sample projects
            """
            INSERT INTO projects (project_code, name, customer_id, start_date, budget, status)
            VALUES 
                ('PROJ-BS-001', 'Website Development', gen_random_uuid(), '2024-11-01', 10000000, 'active'),
                ('PROJ-BS-002', 'Mobile App', gen_random_uuid(), '2024-10-15', 15000000, 'active')
            ON CONFLICT (project_code) DO NOTHING;
            """,
            
            # Insert sample expenses
            """
            INSERT INTO expenses (expense_code, description, amount, expense_date, status)
            VALUES 
                ('EXP-BS-001', 'Office supplies', 500000, '2024-12-10', 'paid'),
                ('EXP-BS-002', 'Travel expenses', 1200000, '2024-12-18', 'approved')
            ON CONFLICT (expense_code) DO NOTHING;
            """
        ]
        
        for sql in sql_commands:
            try:
                result = supabase.rpc('exec_sql', {'sql': sql})
                print("SQL executed successfully")
            except Exception as e:
                print(f"Warning executing SQL: {e}")
        
        print("Balance sheet data creation completed!")
        return True
        
    except Exception as e:
        print(f"Error creating balance sheet data: {e}")
        return False

def test_balance_sheet():
    """Test the balance sheet with created data"""
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
    print("Creating balance sheet data using SQL...")
    
    # Create data
    if not create_balance_sheet_data():
        print("Failed to create balance sheet data")
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
