#!/usr/bin/env python3
"""
Test script for Expenses by Vendor API endpoints
Tests the expense reports grouped by vendor functionality
"""

import requests
import json
from datetime import datetime, date, timedelta
import sys

# Configuration
BASE_URL = "http://localhost:8000"
API_BASE = f"{BASE_URL}/api/reports/expenses"

def test_expenses_vendor_api():
    """Test Expenses by Vendor API endpoints"""
    print("🏢 Testing Expenses by Vendor API Endpoints")
    print("=" * 50)
    
    # Test data
    end_date = date.today()
    start_date = end_date - timedelta(days=30)
    
    print(f"📅 Testing period: {start_date} to {end_date}")
    
    # Test 1: Full Expenses by Vendor Report
    print("\n1️⃣ Testing Full Expenses by Vendor Report")
    try:
        url = f"{API_BASE}/by-vendor"
        params = {
            "start_date": start_date.isoformat(),
            "end_date": end_date.isoformat(),
            "limit": 50
        }
        
        print(f"   URL: {url}")
        print(f"   Params: {params}")
        
        response = requests.get(url, params=params)
        print(f"   Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"   ✅ Success!")
            print(f"   📊 Report Period: {data.get('report_period', 'N/A')}")
            print(f"   🏢 Total Vendors: {data.get('total_vendors', 0)}")
            print(f"   💰 Total Expenses: {data.get('total_expenses', 0):,.2f}")
            print(f"   📈 Average Expenses per Vendor: {data.get('average_expenses_per_vendor', 0):,.2f}")
            print(f"   🏆 Top Vendor Percentage: {data.get('top_vendor_percentage', 0):.1f}%")
            
            # Vendor rankings
            rankings = data.get('vendor_rankings', [])
            print(f"   📋 Vendor Rankings: {len(rankings)} vendors")
            
            if rankings:
                print(f"   🥇 Top 5 Vendors:")
                for i, vendor in enumerate(rankings[:5]):
                    print(f"      {i+1}. {vendor.get('vendor_name', 'N/A')}: {vendor.get('total_expenses', 0):,.2f} VND")
                    print(f"         - Bills: {vendor.get('total_bills', 0)}, Expenses: {vendor.get('total_expense_claims', 0)}")
                    print(f"         - Avg Transaction: {vendor.get('average_transaction_value', 0):,.2f} VND")
                    print(f"         - Largest Transaction: {vendor.get('largest_transaction', 0):,.2f} VND")
            
            # Additional insights
            print(f"   📊 Additional Insights:")
            print(f"      - New Vendors: {data.get('new_vendors', 0)}")
            print(f"      - Active Vendors: {data.get('active_vendors', 0)}")
            print(f"      - Total Transactions: {data.get('total_transactions', 0)}")
            print(f"      - Total Bills: {data.get('total_bills', 0)}")
            print(f"      - Total Expense Claims: {data.get('total_expense_claims', 0)}")
                    
        else:
            print(f"   ❌ Error: {response.status_code}")
            print(f"   Response: {response.text}")
            
    except Exception as e:
        print(f"   ❌ Exception: {str(e)}")
    
    # Test 2: Expenses by Vendor Summary
    print("\n2️⃣ Testing Expenses by Vendor Summary")
    try:
        url = f"{API_BASE}/by-vendor/summary"
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
            print(f"   🏢 Total Vendors: {data.get('total_vendors', 0)}")
            print(f"   💰 Total Expenses: {data.get('total_expenses', 0):,.2f}")
            print(f"   🏆 Top Vendor: {data.get('top_vendor_name', 'N/A')}")
            print(f"   💵 Top Vendor Expenses: {data.get('top_vendor_expenses', 0):,.2f}")
            print(f"   📈 Top Vendor Percentage: {data.get('top_vendor_percentage', 0):.1f}%")
            print(f"   📊 Average Expenses per Vendor: {data.get('average_expenses_per_vendor', 0):,.2f}")
            print(f"   ⭐ New Vendors: {data.get('new_vendors', 0)}")
            
        else:
            print(f"   ❌ Error: {response.status_code}")
            print(f"   Response: {response.text}")
            
    except Exception as e:
        print(f"   ❌ Exception: {str(e)}")
    
    # Test 3: Expenses by Vendor Analysis
    print("\n3️⃣ Testing Expenses by Vendor Analysis")
    try:
        url = f"{API_BASE}/by-vendor/analysis"
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
            
            # Vendor segmentation
            major_vendors = data.get('major_vendors', [])
            regular_vendors = data.get('regular_vendors', [])
            small_vendors = data.get('small_vendors', [])
            
            print(f"   🏆 Major Vendors (Top 10%): {len(major_vendors)}")
            print(f"   🏢 Regular Vendors (Middle 80%): {len(regular_vendors)}")
            print(f"   📉 Small Vendors (Bottom 10%): {len(small_vendors)}")
            
            # Expense concentration
            concentration_ratio = data.get('concentration_ratio', 0)
            gini_coefficient = data.get('gini_coefficient', 0)
            
            print(f"   📊 Expense Concentration (Top 5): {concentration_ratio:.1f}%")
            print(f"   📈 Gini Coefficient: {gini_coefficient:.3f}")
            
            # Vendor lifecycle
            lifecycle = data.get('vendor_lifecycle_stage', {})
            print(f"   🔄 Vendor Lifecycle:")
            for stage, count in lifecycle.items():
                print(f"      - {stage.title()}: {count}")
            
        else:
            print(f"   ❌ Error: {response.status_code}")
            print(f"   Response: {response.text}")
            
    except Exception as e:
        print(f"   ❌ Exception: {str(e)}")
    
    # Test 4: Different parameters
    print("\n4️⃣ Testing different parameters")
    
    test_cases = [
        {
            "name": "Last 7 days with limit 10",
            "params": {
                "start_date": (end_date - timedelta(days=7)).isoformat(),
                "end_date": end_date.isoformat(),
                "limit": 10
            }
        },
        {
            "name": "Last 90 days with include inactive",
            "params": {
                "start_date": (end_date - timedelta(days=90)).isoformat(),
                "end_date": end_date.isoformat(),
                "include_inactive": True
            }
        },
        {
            "name": "Current year",
            "params": {
                "start_date": date(end_date.year, 1, 1).isoformat(),
                "end_date": end_date.isoformat(),
                "limit": 100
            }
        }
    ]
    
    for test_case in test_cases:
        try:
            url = f"{API_BASE}/by-vendor"
            params = test_case["params"]
            
            print(f"   🧪 {test_case['name']}:")
            print(f"   Params: {params}")
            
            response = requests.get(url, params=params)
            print(f"   Status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print(f"   ✅ Success!")
                print(f"   Vendors: {data.get('total_vendors', 0)}")
                print(f"   Total Expenses: {data.get('total_expenses', 0):,.2f}")
            else:
                print(f"   ❌ Error: {response.status_code}")
                
        except Exception as e:
            print(f"   ❌ Exception: {str(e)}")
    
    # Test 5: Error cases
    print("\n5️⃣ Testing error cases")
    
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
        },
        {
            "name": "Invalid limit",
            "params": {
                "start_date": start_date.isoformat(),
                "end_date": end_date.isoformat(),
                "limit": 0
            }
        }
    ]
    
    for error_case in error_cases:
        try:
            url = f"{API_BASE}/by-vendor"
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
    print("🏁 Expenses by Vendor API Testing Complete!")

def test_authentication():
    """Test if authentication is working"""
    print("\n🔐 Testing Authentication")
    print("-" * 30)
    
    try:
        # Test health endpoint (no auth required)
        response = requests.get(f"{BASE_URL}/health")
        print(f"   Health Check: {response.status_code}")
        
        # Test Expenses by Vendor endpoint without auth (should fail)
        response = requests.get(f"{API_BASE}/by-vendor?start_date=2024-01-01&end_date=2024-01-31")
        print(f"   Expenses by Vendor without auth: {response.status_code}")
        
        if response.status_code == 401:
            print("   ✅ Authentication is properly required")
        else:
            print("   ⚠️  Authentication might not be working properly")
            
    except Exception as e:
        print(f"   ❌ Authentication test failed: {str(e)}")

def test_vendor_ranking_logic():
    """Test vendor ranking and calculation logic"""
    print("\n🔍 Testing Vendor Ranking Logic")
    print("-" * 40)
    
    try:
        # Test with a known period
        start_date = date.today() - timedelta(days=30)
        end_date = date.today()
        
        url = f"{API_BASE}/by-vendor"
        params = {
            "start_date": start_date.isoformat(),
            "end_date": end_date.isoformat(),
            "limit": 10
        }
        
        response = requests.get(url, params=params)
        
        if response.status_code == 200:
            data = response.json()
            rankings = data.get('vendor_rankings', [])
            
            print(f"   📊 Ranking Validation:")
            print(f"      - Total Rankings: {len(rankings)}")
            
            # Check if rankings are sorted correctly
            is_sorted = True
            for i in range(1, len(rankings)):
                if rankings[i-1]['total_expenses'] < rankings[i]['total_expenses']:
                    is_sorted = False
                    break
            
            print(f"      - Rankings Sorted: {'✅' if is_sorted else '❌'}")
            
            # Check ranking positions
            positions_correct = True
            for i, vendor in enumerate(rankings):
                if vendor.get('ranking') != i + 1:
                    positions_correct = False
                    break
            
            print(f"      - Ranking Positions: {'✅' if positions_correct else '❌'}")
            
            # Check calculations
            if rankings:
                top_vendor = rankings[0]
                total_expenses = data.get('total_expenses', 0)
                expected_percentage = (top_vendor['total_expenses'] / total_expenses * 100) if total_expenses > 0 else 0
                actual_percentage = data.get('top_vendor_percentage', 0)
                
                print(f"      - Top Vendor Percentage: {actual_percentage:.1f}% (Expected: {expected_percentage:.1f}%)")
                print(f"      - Calculation Accuracy: {'✅' if abs(actual_percentage - expected_percentage) < 0.1 else '❌'}")
                
        else:
            print(f"   ❌ Failed to get data: {response.status_code}")
            
    except Exception as e:
        print(f"   ❌ Ranking logic test failed: {str(e)}")

if __name__ == "__main__":
    print("🚀 Starting Expenses by Vendor API Tests")
    print("=" * 50)
    
    # Test authentication first
    test_authentication()
    
    # Test Expenses by Vendor API
    test_expenses_vendor_api()
    
    # Test ranking logic
    test_vendor_ranking_logic()
    
    print("\n💡 Note: These tests require:")
    print("   1. Backend server running on http://localhost:8000")
    print("   2. Database with bills and expenses data")
    print("   3. Proper authentication setup")
    print("   4. Vendor data linked to transactions")
    print("\n🔧 To run backend server:")
    print("   cd backend && python main.py")
    print("\n📊 Expenses by Vendor Report includes:")
    print("   - Vendor ranking by total expenses")
    print("   - Transaction counts (bills + expenses)")
    print("   - Average transaction value calculations")
    print("   - Vendor segmentation (Major, Regular, Small)")
    print("   - Expense concentration analysis")
    print("   - Vendor lifecycle stages")
    print("   - Gini coefficient for expense inequality")
