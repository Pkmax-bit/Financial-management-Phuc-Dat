#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import os
import sys
from supabase import create_client, Client
from datetime import datetime, timedelta
import json

# Load environment variables
from dotenv import load_dotenv
load_dotenv()

# Supabase configuration
SUPABASE_URL = "https://mfmijckzlhevduwfigkl.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1mbWlqY2t6bGhldmR1d2ZpZ2tsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjUzOTExMiwiZXhwIjoyMDcyMTE1MTEyfQ.rlFwoXK_Yls7kRxL_lYqYWe3huJhs0V60Wa4Ddd7Ero"

# Create Supabase client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def check_data_availability():
    """Check data availability for reports"""
    print("=== CHECKING REPORT DATA ===\n")
    
    # Check invoices
    try:
        invoices_result = supabase.table("invoices").select("*").limit(5).execute()
        print(f"📊 Invoices: {len(invoices_result.data)} records")
        if invoices_result.data:
            print(f"   - Sample: {invoices_result.data[0]}")
        else:
            print("   - No invoices found")
    except Exception as e:
        print(f"   - Error: {e}")
    
    # Check expenses
    try:
        expenses_result = supabase.table("expenses").select("*").limit(5).execute()
        print(f"💰 Expenses: {len(expenses_result.data)} records")
        if expenses_result.data:
            print(f"   - Sample: {expenses_result.data[0]}")
        else:
            print("   - No expenses found")
    except Exception as e:
        print(f"   - Error: {e}")
    
    # Check bills
    try:
        bills_result = supabase.table("bills").select("*").limit(5).execute()
        print(f"🧾 Bills: {len(bills_result.data)} records")
        if bills_result.data:
            print(f"   - Sample: {bills_result.data[0]}")
        else:
            print("   - No bills found")
    except Exception as e:
        print(f"   - Error: {e}")
    
    # Check customers
    try:
        customers_result = supabase.table("customers").select("*").limit(5).execute()
        print(f"👥 Customers: {len(customers_result.data)} records")
        if customers_result.data:
            print(f"   - Sample: {customers_result.data[0]}")
        else:
            print("   - No customers found")
    except Exception as e:
        print(f"   - Error: {e}")
    
    # Check vendors
    try:
        vendors_result = supabase.table("vendors").select("*").limit(5).execute()
        print(f"🏢 Vendors: {len(vendors_result.data)} records")
        if vendors_result.data:
            print(f"   - Sample: {vendors_result.data[0]}")
        else:
            print("   - No vendors found")
    except Exception as e:
        print(f"   - Error: {e}")
    
    # Check projects
    try:
        projects_result = supabase.table("projects").select("*").limit(5).execute()
        print(f"📋 Projects: {len(projects_result.data)} records")
        if projects_result.data:
            print(f"   - Sample: {projects_result.data[0]}")
        else:
            print("   - No projects found")
    except Exception as e:
        print(f"   - Error: {e}")

def check_recent_data():
    """Check for recent data (last 30 days)"""
    print("\n=== CHECKING RECENT DATA (30 DAYS) ===\n")
    
    # Get date 30 days ago
    thirty_days_ago = (datetime.now() - timedelta(days=30)).strftime('%Y-%m-%d')
    print(f"Checking data from {thirty_days_ago} to now")
    
    # Check recent invoices
    try:
        recent_invoices = supabase.table("invoices").select("*").gte("issue_date", thirty_days_ago).execute()
        print(f"📊 Recent Invoices: {len(recent_invoices.data)} records")
        if recent_invoices.data:
            for invoice in recent_invoices.data[:3]:
                print(f"   - Invoice {invoice.get('invoice_number', 'N/A')}: {invoice.get('total_amount', 0)} VND on {invoice.get('issue_date', 'N/A')}")
    except Exception as e:
        print(f"   - Error: {e}")
    
    # Check recent expenses
    try:
        recent_expenses = supabase.table("expenses").select("*").gte("expense_date", thirty_days_ago).execute()
        print(f"💰 Recent Expenses: {len(recent_expenses.data)} records")
        if recent_expenses.data:
            for expense in recent_expenses.data[:3]:
                print(f"   - Expense: {expense.get('amount', 0)} VND on {expense.get('expense_date', 'N/A')}")
    except Exception as e:
        print(f"   - Error: {e}")
    
    # Check recent bills
    try:
        recent_bills = supabase.table("bills").select("*").gte("due_date", thirty_days_ago).execute()
        print(f"🧾 Recent Bills: {len(recent_bills.data)} records")
        if recent_bills.data:
            for bill in recent_bills.data[:3]:
                print(f"   - Bill: {bill.get('amount', 0)} VND due {bill.get('due_date', 'N/A')}")
    except Exception as e:
        print(f"   - Error: {e}")

def check_dashboard_api():
    """Test dashboard API"""
    print("\n=== CHECKING DASHBOARD API ===\n")
    
    try:
        import requests
        
        # Test dashboard API
        response = requests.get("http://localhost:8000/api/dashboard/stats")
        print(f"Dashboard API Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("Dashboard Data:")
            print(f"  - Total Revenue: {data.get('totalRevenue', 0)}")
            print(f"  - Total Expenses: {data.get('totalExpenses', 0)}")
            print(f"  - Profit/Loss: {data.get('profitLoss', 0)}")
            print(f"  - Cash Balance: {data.get('cashBalance', 0)}")
            print(f"  - Open Invoices: {data.get('openInvoices', 0)}")
            print(f"  - Overdue Invoices: {data.get('overdueInvoices', 0)}")
        else:
            print(f"  - Error: {response.text}")
            
    except Exception as e:
        print(f"Dashboard API Error: {e}")

def check_reports_api():
    """Test reports API"""
    print("\n=== CHECKING REPORTS API ===\n")
    
    try:
        import requests
        
        # Test cash flow API
        response = requests.get("http://localhost:8000/api/reports/financial/cash-flow?start_date=2025-01-01&end_date=2025-01-31")
        print(f"Cash Flow API Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("Cash Flow Data:")
            print(f"  - Net Cash Flow: {data.get('net_cash_flow', 0)}")
            print(f"  - Operating Activities: {data.get('operating_activities', {}).get('net_cash_flow', 0)}")
            print(f"  - Total Transactions: {data.get('total_transactions', 0)}")
        else:
            print(f"  - Error: {response.text}")
            
    except Exception as e:
        print(f"Reports API Error: {e}")

if __name__ == "__main__":
    check_data_availability()
    check_recent_data()
    check_dashboard_api()
    check_reports_api()
