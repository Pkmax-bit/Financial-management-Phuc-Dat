#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import requests
import json
import time

def check_all_reports():
    """Check all report types for data availability"""
    print("=== CHECKING ALL REPORT TYPES ===")
    
    # Supabase configuration
    SUPABASE_URL = "https://mfmijckzlhevduwfigkl.supabase.co"
    SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1mbWlqY2t6bGhldmR1d2ZpZ2tsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1MzkxMTIsImV4cCI6MjA3MjExNTExMn0.VPFmvLghhO32JybxDzq-CGVQedgI-LN7Q07rwDhxU4E"
    
    # Get authentication token
    try:
        auth_url = f"{SUPABASE_URL}/auth/v1/token?grant_type=password"
        headers = {
            "apikey": SUPABASE_ANON_KEY,
            "Content-Type": "application/json"
        }
        auth_data = {
            "email": "admin@example.com",
            "password": "admin123"
        }
        
        response = requests.post(auth_url, headers=headers, json=auth_data)
        if response.status_code != 200:
            print(f"Authentication failed: {response.text}")
            return
        
        auth_result = response.json()
        access_token = auth_result.get("access_token")
        print("Authentication successful!")
        
    except Exception as e:
        print(f"Authentication error: {e}")
        return
    
    # Prepare headers for API calls
    api_headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json"
    }
    
    # Test all report APIs
    reports_to_test = [
        {
            "name": "Dashboard Stats",
            "url": "http://localhost:8000/api/dashboard/stats",
            "description": "Tong quan tai chinh"
        },
        {
            "name": "Cash Flow Report",
            "url": "http://localhost:8000/api/reports/financial/cash-flow?start_date=2025-01-01&end_date=2025-01-31",
            "description": "Bao cao luu chuyen tien te"
        },
        {
            "name": "P&L Report",
            "url": "http://localhost:8000/api/reports/financial/pl?start_date=2024-01-01&end_date=2024-12-31",
            "description": "Bao cao ket qua kinh doanh"
        },
        {
            "name": "Balance Sheet",
            "url": "http://localhost:8000/api/reports/financial/balance-sheet?as_of_date=2024-12-31",
            "description": "Bao cao can doi ke toan"
        },
        {
            "name": "Sales by Customer",
            "url": "http://localhost:8000/api/reports/sales/by-customer?start_date=2024-01-01&end_date=2024-12-31",
            "description": "Bao cao doanh thu theo khach hang"
        },
        {
            "name": "Expenses by Vendor",
            "url": "http://localhost:8000/api/reports/expenses/by-vendor?start_date=2024-01-01&end_date=2024-12-31",
            "description": "Bao cao chi phi theo nha cung cap"
        },
        {
            "name": "General Ledger",
            "url": "http://localhost:8000/api/reports/accountant/general-ledger?start_date=2024-01-01&end_date=2024-12-31",
            "description": "So cai tong hop"
        }
    ]
    
    print("\n=== TESTING ALL REPORT APIS ===")
    
    for report in reports_to_test:
        print(f"\n--- {report['name']} ---")
        print(f"Description: {report['description']}")
        
        try:
            response = requests.get(report['url'], headers=api_headers)
            print(f"Status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print("SUCCESS - Data available")
                
                # Show key metrics for each report type
                if report['name'] == "Dashboard Stats":
                    print(f"  Total Revenue: {data.get('totalRevenue', 0)}")
                    print(f"  Total Expenses: {data.get('totalExpenses', 0)}")
                    print(f"  Profit/Loss: {data.get('profitLoss', 0)}")
                    print(f"  Open Invoices: {data.get('openInvoices', 0)}")
                    print(f"  Overdue Invoices: {data.get('overdueInvoices', 0)}")
                
                elif report['name'] == "Cash Flow Report":
                    print(f"  Net Cash Flow: {data.get('net_cash_flow', 0)}")
                    print(f"  Operating Activities: {data.get('operating_activities', {}).get('net_cash_flow', 0)}")
                    print(f"  Total Transactions: {data.get('total_transactions', 0)}")
                
                elif report['name'] == "P&L Report":
                    print(f"  Total Revenue: {data.get('total_revenue', 0)}")
                    print(f"  Total Expenses: {data.get('total_expenses', 0)}")
                    print(f"  Net Income: {data.get('net_income', 0)}")
                
                elif report['name'] == "Balance Sheet":
                    print(f"  Total Assets: {data.get('total_assets', 0)}")
                    print(f"  Total Liabilities: {data.get('total_liabilities', 0)}")
                    print(f"  Total Equity: {data.get('total_equity', 0)}")
                
                elif report['name'] == "Sales by Customer":
                    print(f"  Total Customers: {data.get('total_customers', 0)}")
                    print(f"  Total Sales: {data.get('total_sales', 0)}")
                    print(f"  Customer Rankings: {len(data.get('customer_rankings', []))}")
                
                elif report['name'] == "Expenses by Vendor":
                    print(f"  Total Vendors: {data.get('total_vendors', 0)}")
                    print(f"  Total Expenses: {data.get('total_expenses', 0)}")
                    print(f"  Vendor Rankings: {len(data.get('vendor_rankings', []))}")
                
                elif report['name'] == "General Ledger":
                    print(f"  Total Entries: {data.get('total_entries', 0)}")
                    print(f"  Account Balances: {len(data.get('account_balances', []))}")
                
            else:
                print(f"ERROR - {response.text}")
                
        except Exception as e:
            print(f"ERROR - {e}")
    
    print("\n=== SUMMARY ===")
    print("All report APIs have been tested.")
    print("If any report shows 0 values, it means:")
    print("1. No data exists for the date range")
    print("2. Data exists but not in the specified date range")
    print("3. API needs to be fixed to handle the data correctly")

if __name__ == "__main__":
    check_all_reports()
