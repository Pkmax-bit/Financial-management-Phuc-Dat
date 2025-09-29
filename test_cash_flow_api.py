#!/usr/bin/env python3
"""
Test script for Cash Flow Statement API endpoints
Tests the comprehensive Cash Flow statement generation
"""

import requests
import json
from datetime import datetime, date, timedelta
import sys

# Configuration
BASE_URL = "http://localhost:8000"
API_BASE = f"{BASE_URL}/api/reports/financial"

def test_cash_flow_api():
    """Test Cash Flow Statement API endpoints"""
    print("💰 Testing Cash Flow Statement API Endpoints")
    print("=" * 50)
    
    # Test data
    end_date = date.today()
    start_date = end_date - timedelta(days=30)
    
    print(f"📅 Testing period: {start_date} to {end_date}")
    
    # Test 1: Full Cash Flow Statement
    print("\n1️⃣ Testing Full Cash Flow Statement")
    try:
        url = f"{API_BASE}/cash-flow"
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
            print(f"   ✅ Success!")
            print(f"   📊 Report Period: {data.get('report_period', 'N/A')}")
            print(f"   💰 Net Income: {data.get('net_income', 0):,.2f}")
            print(f"   💵 Beginning Cash: {data.get('beginning_cash', 0):,.2f}")
            print(f"   💵 Ending Cash: {data.get('ending_cash', 0):,.2f}")
            print(f"   📈 Net Change in Cash: {data.get('net_change_in_cash', 0):,.2f}")
            
            # Operating Activities
            operating = data.get('operating_activities', {})
            print(f"   🔄 Operating Activities:")
            print(f"      - Net Cash Flow: {operating.get('net_cash_flow', 0):,.2f}")
            print(f"      - Items Count: {len(operating.get('items', []))}")
            
            # Investing Activities
            investing = data.get('investing_activities', {})
            print(f"   🎯 Investing Activities:")
            print(f"      - Net Cash Flow: {investing.get('net_cash_flow', 0):,.2f}")
            print(f"      - Items Count: {len(investing.get('items', []))}")
            
            # Financing Activities
            financing = data.get('financing_activities', {})
            print(f"   💳 Financing Activities:")
            print(f"      - Net Cash Flow: {financing.get('net_cash_flow', 0):,.2f}")
            print(f"      - Items Count: {len(financing.get('items', []))}")
            
            # Summary
            print(f"   📋 Summary:")
            print(f"      - Total Operating CF: {data.get('total_operating_cash_flow', 0):,.2f}")
            print(f"      - Total Investing CF: {data.get('total_investing_cash_flow', 0):,.2f}")
            print(f"      - Total Financing CF: {data.get('total_financing_cash_flow', 0):,.2f}")
            print(f"      - Net Cash Flow: {data.get('net_cash_flow', 0):,.2f}")
            print(f"      - Validation: {'✅' if data.get('cash_flow_validation') else '❌'}")
            
            # Show sample items
            if operating.get('items'):
                print(f"   📝 Sample Operating Items:")
                for i, item in enumerate(operating['items'][:3]):
                    print(f"      {i+1}. {item.get('item_name', 'N/A')}: {item.get('amount', 0):,.2f} ({'Inflow' if item.get('is_inflow') else 'Outflow'})")
                    
        else:
            print(f"   ❌ Error: {response.status_code}")
            print(f"   Response: {response.text}")
            
    except Exception as e:
        print(f"   ❌ Exception: {str(e)}")
    
    # Test 2: Cash Flow Summary
    print("\n2️⃣ Testing Cash Flow Summary")
    try:
        url = f"{API_BASE}/cash-flow/summary"
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
            print(f"   ✅ Success!")
            print(f"   📊 Period: {data.get('period', 'N/A')}")
            print(f"   💰 Net Income: {data.get('net_income', 0):,.2f}")
            print(f"   🔄 Operating CF: {data.get('operating_cash_flow', 0):,.2f}")
            print(f"   🎯 Investing CF: {data.get('investing_cash_flow', 0):,.2f}")
            print(f"   💳 Financing CF: {data.get('financing_cash_flow', 0):,.2f}")
            print(f"   📈 Net Cash Flow: {data.get('net_cash_flow', 0):,.2f}")
            print(f"   💵 Beginning Cash: {data.get('beginning_cash', 0):,.2f}")
            print(f"   💵 Ending Cash: {data.get('ending_cash', 0):,.2f}")
            
        else:
            print(f"   ❌ Error: {response.status_code}")
            print(f"   Response: {response.text}")
            
    except Exception as e:
        print(f"   ❌ Exception: {str(e)}")
    
    # Test 3: Different date ranges
    print("\n3️⃣ Testing different date ranges")
    
    test_cases = [
        {
            "name": "Last 7 days",
            "start_date": (end_date - timedelta(days=7)).isoformat(),
            "end_date": end_date.isoformat()
        },
        {
            "name": "Last 90 days",
            "start_date": (end_date - timedelta(days=90)).isoformat(),
            "end_date": end_date.isoformat()
        },
        {
            "name": "Current year",
            "start_date": date(end_date.year, 1, 1).isoformat(),
            "end_date": end_date.isoformat()
        }
    ]
    
    for test_case in test_cases:
        try:
            url = f"{API_BASE}/cash-flow/summary"
            params = {
                "start_date": test_case["start_date"],
                "end_date": test_case["end_date"]
            }
            
            print(f"   🧪 {test_case['name']}:")
            print(f"   Period: {test_case['start_date']} to {test_case['end_date']}")
            
            response = requests.get(url, params=params)
            print(f"   Status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print(f"   ✅ Success!")
                print(f"   Net Cash Flow: {data.get('net_cash_flow', 0):,.2f}")
            else:
                print(f"   ❌ Error: {response.status_code}")
                
        except Exception as e:
            print(f"   ❌ Exception: {str(e)}")
    
    # Test 4: Error cases
    print("\n4️⃣ Testing error cases")
    
    error_cases = [
        {
            "name": "Invalid date format",
            "params": {
                "start_date": "invalid-date",
                "end_date": end_date.isoformat()
            }
        },
        {
            "name": "Missing end_date",
            "params": {
                "start_date": start_date.isoformat()
            }
        },
        {
            "name": "Start date after end date",
            "params": {
                "start_date": end_date.isoformat(),
                "end_date": start_date.isoformat()
            }
        }
    ]
    
    for error_case in error_cases:
        try:
            url = f"{API_BASE}/cash-flow"
            params = error_case["params"]
            
            print(f"   🧪 {error_case['name']}:")
            print(f"   Params: {params}")
            
            response = requests.get(url, params=params)
            print(f"   Status: {response.status_code}")
            
            if response.status_code == 400:
                print(f"   ✅ Expected error (400)")
            elif response.status_code == 422:
                print(f"   ✅ Expected validation error (422)")
            else:
                print(f"   ⚠️  Unexpected status: {response.status_code}")
                
        except Exception as e:
            print(f"   ❌ Exception: {str(e)}")
    
    print("\n" + "=" * 50)
    print("🏁 Cash Flow Statement API Testing Complete!")

def test_authentication():
    """Test if authentication is working"""
    print("\n🔐 Testing Authentication")
    print("-" * 30)
    
    try:
        # Test health endpoint (no auth required)
        response = requests.get(f"{BASE_URL}/health")
        print(f"   Health Check: {response.status_code}")
        
        # Test Cash Flow endpoint without auth (should fail)
        response = requests.get(f"{API_BASE}/cash-flow?start_date=2024-01-01&end_date=2024-01-31")
        print(f"   Cash Flow without auth: {response.status_code}")
        
        if response.status_code == 401:
            print("   ✅ Authentication is properly required")
        else:
            print("   ⚠️  Authentication might not be working properly")
            
    except Exception as e:
        print(f"   ❌ Authentication test failed: {str(e)}")

def test_cash_flow_validation():
    """Test Cash Flow validation logic"""
    print("\n🔍 Testing Cash Flow Validation Logic")
    print("-" * 40)
    
    try:
        # Test with a known period
        start_date = date.today() - timedelta(days=30)
        end_date = date.today()
        
        url = f"{API_BASE}/cash-flow"
        params = {
            "start_date": start_date.isoformat(),
            "end_date": end_date.isoformat()
        }
        
        response = requests.get(url, params=params)
        
        if response.status_code == 200:
            data = response.json()
            
            # Check validation
            validation = data.get('cash_flow_validation', False)
            net_cash_flow = data.get('net_cash_flow', 0)
            net_change_in_cash = data.get('net_change_in_cash', 0)
            
            print(f"   📊 Validation Results:")
            print(f"      - Cash Flow Validation: {'✅' if validation else '❌'}")
            print(f"      - Net Cash Flow: {net_cash_flow:,.2f}")
            print(f"      - Net Change in Cash: {net_change_in_cash:,.2f}")
            print(f"      - Difference: {abs(net_cash_flow - net_change_in_cash):,.2f}")
            
            if validation:
                print("   ✅ Cash flow reconciliation is accurate")
            else:
                print("   ⚠️  Cash flow reconciliation needs attention")
                
        else:
            print(f"   ❌ Failed to get data: {response.status_code}")
            
    except Exception as e:
        print(f"   ❌ Validation test failed: {str(e)}")

if __name__ == "__main__":
    print("🚀 Starting Cash Flow Statement API Tests")
    print("=" * 50)
    
    # Test authentication first
    test_authentication()
    
    # Test Cash Flow API
    test_cash_flow_api()
    
    # Test validation logic
    test_cash_flow_validation()
    
    print("\n💡 Note: These tests require:")
    print("   1. Backend server running on http://localhost:8000")
    print("   2. Database with journal entries data")
    print("   3. Proper authentication setup")
    print("   4. Cash and bank account transactions")
    print("\n🔧 To run backend server:")
    print("   cd backend && python main.py")
    print("\n📊 Cash Flow Statement includes:")
    print("   - Operating Activities (from P&L + working capital changes)")
    print("   - Investing Activities (fixed asset transactions)")
    print("   - Financing Activities (equity and debt transactions)")
    print("   - Cash reconciliation validation")
