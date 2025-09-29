#!/usr/bin/env python3
"""
Test script for P&L API endpoints
Tests the Profit and Loss report functionality
"""

import requests
import json
from datetime import datetime, date, timedelta
import sys

# Configuration
BASE_URL = "http://localhost:8000"
API_BASE = f"{BASE_URL}/api/reports/financial"

def test_pl_api():
    """Test P&L API endpoints"""
    print("🧪 Testing P&L API Endpoints")
    print("=" * 50)
    
    # Test data
    end_date = date.today()
    start_date = end_date - timedelta(days=30)
    
    print(f"📅 Testing date range: {start_date} to {end_date}")
    
    # Test 1: Get P&L Report
    print("\n1️⃣ Testing GET /profit-and-loss")
    try:
        url = f"{API_BASE}/profit-and-loss"
        params = {
            "start_date": start_date.isoformat(),
            "end_date": end_date.isoformat()
        }
        
        print(f"   URL: {url}")
        print(f"   Params: {params}")
        
        response = requests.get(url, params=params)
        print(f"   Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("   ✅ Success!")
            print(f"   📊 Report Period: {data.get('report_period', 'N/A')}")
            print(f"   💰 Total Revenue: {data.get('total_revenue', 0):,.2f}")
            print(f"   📈 Gross Profit: {data.get('gross_profit', 0):,.2f}")
            print(f"   💵 Net Income: {data.get('net_income', 0):,.2f}")
            print(f"   📋 Total Transactions: {data.get('total_transactions', 0)}")
            print(f"   📝 Journal Entries: {data.get('total_journal_entries', 0)}")
            
            # Check sections
            if 'revenue_section' in data:
                revenue = data['revenue_section']
                print(f"   📈 Revenue Accounts: {len(revenue.get('accounts', []))}")
                print(f"   💰 Revenue Total: {revenue.get('total_amount', 0):,.2f}")
            
            if 'cogs_section' in data:
                cogs = data['cogs_section']
                print(f"   📉 COGS Accounts: {len(cogs.get('accounts', []))}")
                print(f"   💸 COGS Total: {cogs.get('total_amount', 0):,.2f}")
            
            if 'operating_expenses_section' in data:
                expenses = data['operating_expenses_section']
                print(f"   📊 Operating Expense Accounts: {len(expenses.get('accounts', []))}")
                print(f"   💸 Operating Expenses Total: {expenses.get('total_amount', 0):,.2f}")
                
        else:
            print(f"   ❌ Error: {response.status_code}")
            print(f"   Response: {response.text}")
            
    except Exception as e:
        print(f"   ❌ Exception: {str(e)}")
    
    # Test 2: Get P&L Summary
    print("\n2️⃣ Testing GET /profit-and-loss/summary")
    try:
        url = f"{API_BASE}/profit-and-loss/summary"
        params = {
            "start_date": start_date.isoformat(),
            "end_date": end_date.isoformat()
        }
        
        print(f"   URL: {url}")
        print(f"   Params: {params}")
        
        response = requests.get(url, params=params)
        print(f"   Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("   ✅ Success!")
            print(f"   📊 Period: {data.get('period', 'N/A')}")
            print(f"   💰 Total Revenue: {data.get('total_revenue', 0):,.2f}")
            print(f"   💸 Total Expenses: {data.get('total_expenses', 0):,.2f}")
            print(f"   💵 Net Income: {data.get('net_income', 0):,.2f}")
            print(f"   📈 Gross Profit Margin: {data.get('gross_profit_margin', 0):.2f}%")
            print(f"   📊 Net Income Margin: {data.get('net_income_margin', 0):.2f}%")
            print(f"   💱 Currency: {data.get('currency', 'N/A')}")
            
        else:
            print(f"   ❌ Error: {response.status_code}")
            print(f"   Response: {response.text}")
            
    except Exception as e:
        print(f"   ❌ Exception: {str(e)}")
    
    # Test 3: Test with different date ranges
    print("\n3️⃣ Testing different date ranges")
    
    test_ranges = [
        ("Last 7 days", end_date - timedelta(days=7), end_date),
        ("Last 90 days", end_date - timedelta(days=90), end_date),
        ("This year", date(end_date.year, 1, 1), end_date)
    ]
    
    for range_name, start, end in test_ranges:
        try:
            url = f"{API_BASE}/profit-and-loss/summary"
            params = {
                "start_date": start.isoformat(),
                "end_date": end.isoformat()
            }
            
            response = requests.get(url, params=params)
            print(f"   📅 {range_name}: {response.status_code} - {response.json().get('net_income', 0):,.2f} net income")
            
        except Exception as e:
            print(f"   📅 {range_name}: ❌ Error - {str(e)}")
    
    print("\n" + "=" * 50)
    print("🏁 P&L API Testing Complete!")

def test_authentication():
    """Test if authentication is working"""
    print("\n🔐 Testing Authentication")
    print("-" * 30)
    
    try:
        # Test health endpoint (no auth required)
        response = requests.get(f"{BASE_URL}/health")
        print(f"   Health Check: {response.status_code}")
        
        # Test P&L endpoint without auth (should fail)
        response = requests.get(f"{API_BASE}/profit-and-loss?start_date=2024-01-01&end_date=2024-01-31")
        print(f"   P&L without auth: {response.status_code}")
        
        if response.status_code == 401:
            print("   ✅ Authentication is properly required")
        else:
            print("   ⚠️  Authentication might not be working properly")
            
    except Exception as e:
        print(f"   ❌ Authentication test failed: {str(e)}")

if __name__ == "__main__":
    print("🚀 Starting P&L API Tests")
    print("=" * 50)
    
    # Test authentication first
    test_authentication()
    
    # Test P&L API
    test_pl_api()
    
    print("\n💡 Note: These tests require:")
    print("   1. Backend server running on http://localhost:8000")
    print("   2. Database with journal entries data")
    print("   3. Proper authentication setup")
    print("\n🔧 To run backend server:")
    print("   cd backend && python main.py")
