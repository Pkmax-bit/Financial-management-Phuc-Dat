#!/usr/bin/env python3
"""
Test script for Drill-Down API endpoints
Tests the drill-down functionality for financial reports
"""

import requests
import json
from datetime import datetime, date, timedelta
import sys

# Configuration
BASE_URL = "http://localhost:8000"
API_BASE = f"{BASE_URL}/api/reports/financial"

def test_drill_down_api():
    """Test Drill-Down API endpoints"""
    print("🧪 Testing Drill-Down API Endpoints")
    print("=" * 50)
    
    # Test data
    end_date = date.today()
    start_date = end_date - timedelta(days=30)
    as_of_date = date.today()
    
    print(f"📅 Testing date range: {start_date} to {end_date}")
    print(f"📅 Testing as of date: {as_of_date}")
    
    # Test 1: P&L Drill-Down
    print("\n1️⃣ Testing P&L Drill-Down")
    test_accounts = ["511", "512", "632", "641", "642"]  # Common P&L accounts
    
    for account_id in test_accounts:
        try:
            url = f"{API_BASE}/report-details"
            params = {
                "report_type": "pnl",
                "account_id": account_id,
                "start_date": start_date.isoformat(),
                "end_date": end_date.isoformat(),
                "limit": 10
            }
            
            print(f"   📊 Account {account_id}:")
            print(f"   URL: {url}")
            print(f"   Params: {params}")
            
            response = requests.get(url, params=params)
            print(f"   Status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success") and data.get("data"):
                    report = data["data"]
                    print(f"   ✅ Success!")
                    print(f"   📋 Account: {report.get('account_name', 'N/A')} ({report.get('account_code', 'N/A')})")
                    print(f"   📊 Total Transactions: {report.get('summary', {}).get('total_transactions', 0)}")
                    print(f"   💰 Total Amount: {report.get('summary', {}).get('total_amount', 0):,.2f}")
                    print(f"   📈 Total Debit: {report.get('summary', {}).get('total_debit', 0):,.2f}")
                    print(f"   📉 Total Credit: {report.get('summary', {}).get('total_credit', 0):,.2f}")
                    print(f"   📅 Date Range: {report.get('summary', {}).get('date_range', 'N/A')}")
                    
                    transactions = report.get('transactions', [])
                    if transactions:
                        print(f"   📝 Sample Transactions:")
                        for i, tx in enumerate(transactions[:3]):  # Show first 3 transactions
                            print(f"      {i+1}. {tx.get('transaction_number', 'N/A')} - {tx.get('description', 'N/A')} - {tx.get('amount', 0):,.2f}")
                else:
                    print(f"   ⚠️  No data returned for account {account_id}")
            else:
                print(f"   ❌ Error: {response.status_code}")
                print(f"   Response: {response.text}")
                
        except Exception as e:
            print(f"   ❌ Exception: {str(e)}")
    
    # Test 2: Balance Sheet Drill-Down
    print("\n2️⃣ Testing Balance Sheet Drill-Down")
    balance_sheet_accounts = ["101", "102", "131", "331", "411"]  # Common Balance Sheet accounts
    
    for account_id in balance_sheet_accounts:
        try:
            url = f"{API_BASE}/report-details"
            params = {
                "report_type": "balance-sheet",
                "account_id": account_id,
                "as_of_date": as_of_date.isoformat(),
                "limit": 10
            }
            
            print(f"   🏢 Account {account_id}:")
            print(f"   URL: {url}")
            print(f"   Params: {params}")
            
            response = requests.get(url, params=params)
            print(f"   Status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success") and data.get("data"):
                    report = data["data"]
                    print(f"   ✅ Success!")
                    print(f"   📋 Account: {report.get('account_name', 'N/A')} ({report.get('account_code', 'N/A')})")
                    print(f"   📊 Total Transactions: {report.get('summary', {}).get('total_transactions', 0)}")
                    print(f"   💰 Total Amount: {report.get('summary', {}).get('total_amount', 0):,.2f}")
                    print(f"   📅 As of Date: {report.get('as_of_date', 'N/A')}")
                    
                    transactions = report.get('transactions', [])
                    if transactions:
                        print(f"   📝 Sample Transactions:")
                        for i, tx in enumerate(transactions[:3]):  # Show first 3 transactions
                            print(f"      {i+1}. {tx.get('transaction_number', 'N/A')} - {tx.get('description', 'N/A')} - {tx.get('amount', 0):,.2f}")
                else:
                    print(f"   ⚠️  No data returned for account {account_id}")
            else:
                print(f"   ❌ Error: {response.status_code}")
                print(f"   Response: {response.text}")
                
        except Exception as e:
            print(f"   ❌ Exception: {str(e)}")
    
    # Test 3: Test with different parameters
    print("\n3️⃣ Testing different parameters")
    
    test_cases = [
        {
            "name": "P&L with pagination",
            "params": {
                "report_type": "pnl",
                "account_id": "511",
                "start_date": start_date.isoformat(),
                "end_date": end_date.isoformat(),
                "limit": 5,
                "offset": 0
            }
        },
        {
            "name": "Balance Sheet with different date",
            "params": {
                "report_type": "balance-sheet",
                "account_id": "101",
                "as_of_date": (as_of_date - timedelta(days=7)).isoformat(),
                "limit": 10
            }
        },
        {
            "name": "Invalid report type",
            "params": {
                "report_type": "invalid-type",
                "account_id": "511",
                "start_date": start_date.isoformat(),
                "end_date": end_date.isoformat()
            }
        }
    ]
    
    for test_case in test_cases:
        try:
            url = f"{API_BASE}/report-details"
            params = test_case["params"]
            
            print(f"   🧪 {test_case['name']}:")
            print(f"   Params: {params}")
            
            response = requests.get(url, params=params)
            print(f"   Status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success"):
                    print(f"   ✅ Success!")
                else:
                    print(f"   ⚠️  API returned success=false: {data.get('error', 'Unknown error')}")
            else:
                print(f"   ❌ Error: {response.status_code}")
                if response.status_code == 400:
                    print(f"   📝 Expected error for invalid parameters")
                
        except Exception as e:
            print(f"   ❌ Exception: {str(e)}")
    
    print("\n" + "=" * 50)
    print("🏁 Drill-Down API Testing Complete!")

def test_authentication():
    """Test if authentication is working"""
    print("\n🔐 Testing Authentication")
    print("-" * 30)
    
    try:
        # Test health endpoint (no auth required)
        response = requests.get(f"{BASE_URL}/health")
        print(f"   Health Check: {response.status_code}")
        
        # Test Drill-Down endpoint without auth (should fail)
        response = requests.get(f"{API_BASE}/report-details?report_type=pnl&account_id=511")
        print(f"   Drill-Down without auth: {response.status_code}")
        
        if response.status_code == 401:
            print("   ✅ Authentication is properly required")
        else:
            print("   ⚠️  Authentication might not be working properly")
            
    except Exception as e:
        print(f"   ❌ Authentication test failed: {str(e)}")

if __name__ == "__main__":
    print("🚀 Starting Drill-Down API Tests")
    print("=" * 50)
    
    # Test authentication first
    test_authentication()
    
    # Test Drill-Down API
    test_drill_down_api()
    
    print("\n💡 Note: These tests require:")
    print("   1. Backend server running on http://localhost:8000")
    print("   2. Database with journal entries data")
    print("   3. Proper authentication setup")
    print("\n🔧 To run backend server:")
    print("   cd backend && python main.py")
