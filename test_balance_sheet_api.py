#!/usr/bin/env python3
"""
Test script for Balance Sheet API endpoints
Tests the Balance Sheet report functionality
"""

import requests
import json
from datetime import datetime, date, timedelta
import sys

# Configuration
BASE_URL = "http://localhost:8000"
API_BASE = f"{BASE_URL}/api/reports/financial"

def test_balance_sheet_api():
    """Test Balance Sheet API endpoints"""
    print("🧪 Testing Balance Sheet API Endpoints")
    print("=" * 50)
    
    # Test data
    as_of_date = date.today()
    
    print(f"📅 Testing as of date: {as_of_date}")
    
    # Test 1: Get Balance Sheet Report
    print("\n1️⃣ Testing GET /balance-sheet")
    try:
        url = f"{API_BASE}/balance-sheet"
        params = {
            "as_of_date": as_of_date.isoformat()
        }
        
        print(f"   URL: {url}")
        print(f"   Params: {params}")
        
        response = requests.get(url, params=params)
        print(f"   Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("   ✅ Success!")
            print(f"   📊 Report Date: {data.get('report_date', 'N/A')}")
            print(f"   🏢 Total Assets: {data.get('total_assets', 0):,.2f}")
            print(f"   💳 Total Liabilities: {data.get('total_liabilities', 0):,.2f}")
            print(f"   💰 Total Equity: {data.get('total_equity', 0):,.2f}")
            print(f"   ⚖️  Is Balanced: {data.get('is_balanced', False)}")
            print(f"   📋 Total Accounts: {data.get('total_accounts', 0)}")
            print(f"   📝 Journal Entries: {data.get('total_journal_entries', 0)}")
            print(f"   🔄 Total Transactions: {data.get('total_transactions', 0)}")
            
            # Check sections
            if 'current_assets' in data:
                current_assets = data['current_assets']
                print(f"   💵 Current Assets: {len(current_assets.get('accounts', []))} accounts, {current_assets.get('total_amount', 0):,.2f} total")
            
            if 'fixed_assets' in data:
                fixed_assets = data['fixed_assets']
                print(f"   🏗️  Fixed Assets: {len(fixed_assets.get('accounts', []))} accounts, {fixed_assets.get('total_amount', 0):,.2f} total")
            
            if 'current_liabilities' in data:
                current_liabilities = data['current_liabilities']
                print(f"   📊 Current Liabilities: {len(current_liabilities.get('accounts', []))} accounts, {current_liabilities.get('total_amount', 0):,.2f} total")
            
            if 'long_term_liabilities' in data:
                long_term_liabilities = data['long_term_liabilities']
                print(f"   📈 Long-term Liabilities: {len(long_term_liabilities.get('accounts', []))} accounts, {long_term_liabilities.get('total_amount', 0):,.2f} total")
            
            if 'owner_equity' in data:
                owner_equity = data['owner_equity']
                print(f"   👑 Owner Equity: {len(owner_equity.get('accounts', []))} accounts, {owner_equity.get('total_amount', 0):,.2f} total")
            
            # Validate balance equation
            total_assets = data.get('total_assets', 0)
            total_liabilities = data.get('total_liabilities', 0)
            total_equity = data.get('total_equity', 0)
            total_liabilities_and_equity = data.get('total_liabilities_and_equity', 0)
            
            print(f"   🔍 Balance Validation:")
            print(f"      Assets: {total_assets:,.2f}")
            print(f"      Liabilities + Equity: {total_liabilities_and_equity:,.2f}")
            print(f"      Difference: {abs(total_assets - total_liabilities_and_equity):,.2f}")
            print(f"      Balanced: {'✅' if data.get('is_balanced', False) else '❌'}")
                
        else:
            print(f"   ❌ Error: {response.status_code}")
            print(f"   Response: {response.text}")
            
    except Exception as e:
        print(f"   ❌ Exception: {str(e)}")
    
    # Test 2: Get Balance Sheet Summary
    print("\n2️⃣ Testing GET /balance-sheet/summary")
    try:
        url = f"{API_BASE}/balance-sheet/summary"
        params = {
            "as_of_date": as_of_date.isoformat()
        }
        
        print(f"   URL: {url}")
        print(f"   Params: {params}")
        
        response = requests.get(url, params=params)
        print(f"   Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("   ✅ Success!")
            print(f"   📊 As of Date: {data.get('as_of_date', 'N/A')}")
            print(f"   🏢 Total Assets: {data.get('total_assets', 0):,.2f}")
            print(f"   💳 Total Liabilities: {data.get('total_liabilities', 0):,.2f}")
            print(f"   💰 Total Equity: {data.get('total_equity', 0):,.2f}")
            print(f"   ⚖️  Is Balanced: {data.get('is_balanced', False)}")
            print(f"   📈 Current Ratio: {data.get('current_ratio', 'N/A')}")
            print(f"   📊 Debt-to-Equity Ratio: {data.get('debt_to_equity_ratio', 'N/A')}")
            print(f"   💱 Currency: {data.get('currency', 'N/A')}")
            
        else:
            print(f"   ❌ Error: {response.status_code}")
            print(f"   Response: {response.text}")
            
    except Exception as e:
        print(f"   ❌ Exception: {str(e)}")
    
    # Test 3: Test with different dates
    print("\n3️⃣ Testing different dates")
    
    test_dates = [
        ("Today", date.today()),
        ("Last month", date.today() - timedelta(days=30)),
        ("Last year", date.today() - timedelta(days=365)),
        ("Beginning of year", date(date.today().year, 1, 1))
    ]
    
    for date_name, test_date in test_dates:
        try:
            url = f"{API_BASE}/balance-sheet/summary"
            params = {
                "as_of_date": test_date.isoformat()
            }
            
            response = requests.get(url, params=params)
            print(f"   📅 {date_name} ({test_date}): {response.status_code} - Assets: {response.json().get('total_assets', 0):,.2f}")
            
        except Exception as e:
            print(f"   📅 {date_name} ({test_date}): ❌ Error - {str(e)}")
    
    print("\n" + "=" * 50)
    print("🏁 Balance Sheet API Testing Complete!")

def test_authentication():
    """Test if authentication is working"""
    print("\n🔐 Testing Authentication")
    print("-" * 30)
    
    try:
        # Test health endpoint (no auth required)
        response = requests.get(f"{BASE_URL}/health")
        print(f"   Health Check: {response.status_code}")
        
        # Test Balance Sheet endpoint without auth (should fail)
        response = requests.get(f"{API_BASE}/balance-sheet?as_of_date=2024-01-01")
        print(f"   Balance Sheet without auth: {response.status_code}")
        
        if response.status_code == 401:
            print("   ✅ Authentication is properly required")
        else:
            print("   ⚠️  Authentication might not be working properly")
            
    except Exception as e:
        print(f"   ❌ Authentication test failed: {str(e)}")

if __name__ == "__main__":
    print("🚀 Starting Balance Sheet API Tests")
    print("=" * 50)
    
    # Test authentication first
    test_authentication()
    
    # Test Balance Sheet API
    test_balance_sheet_api()
    
    print("\n💡 Note: These tests require:")
    print("   1. Backend server running on http://localhost:8000")
    print("   2. Database with journal entries data")
    print("   3. Proper authentication setup")
    print("\n🔧 To run backend server:")
    print("   cd backend && python main.py")
