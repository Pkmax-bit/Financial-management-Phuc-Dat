#!/usr/bin/env python3
"""
Test script for Sales by Customer API endpoints
Tests the sales reports grouped by customer functionality
"""

import requests
import json
from datetime import datetime, date, timedelta
import sys

# Configuration
BASE_URL = "http://localhost:8000"
API_BASE = f"{BASE_URL}/api/reports/sales"

def test_sales_customer_api():
    """Test Sales by Customer API endpoints"""
    print("👥 Testing Sales by Customer API Endpoints")
    print("=" * 50)
    
    # Test data
    end_date = date.today()
    start_date = end_date - timedelta(days=30)
    
    print(f"📅 Testing period: {start_date} to {end_date}")
    
    # Test 1: Full Sales by Customer Report
    print("\n1️⃣ Testing Full Sales by Customer Report")
    try:
        url = f"{API_BASE}/by-customer"
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
            print(f"   👥 Total Customers: {data.get('total_customers', 0)}")
            print(f"   💰 Total Sales: {data.get('total_sales', 0):,.2f}")
            print(f"   📈 Average Sales per Customer: {data.get('average_sales_per_customer', 0):,.2f}")
            print(f"   🏆 Top Customer Percentage: {data.get('top_customer_percentage', 0):.1f}%")
            
            # Customer rankings
            rankings = data.get('customer_rankings', [])
            print(f"   📋 Customer Rankings: {len(rankings)} customers")
            
            if rankings:
                print(f"   🥇 Top 5 Customers:")
                for i, customer in enumerate(rankings[:5]):
                    print(f"      {i+1}. {customer.get('customer_name', 'N/A')}: {customer.get('total_sales', 0):,.2f} VND")
                    print(f"         - Invoices: {customer.get('total_invoices', 0)}, Receipts: {customer.get('total_sales_receipts', 0)}")
                    print(f"         - Avg Order: {customer.get('average_order_value', 0):,.2f} VND")
                    print(f"         - Largest Order: {customer.get('largest_order', 0):,.2f} VND")
            
            # Additional insights
            print(f"   📊 Additional Insights:")
            print(f"      - New Customers: {data.get('new_customers', 0)}")
            print(f"      - Returning Customers: {data.get('returning_customers', 0)}")
            print(f"      - Total Transactions: {data.get('total_transactions', 0)}")
            print(f"      - Total Invoices: {data.get('total_invoices', 0)}")
            print(f"      - Total Sales Receipts: {data.get('total_sales_receipts', 0)}")
                    
        else:
            print(f"   ❌ Error: {response.status_code}")
            print(f"   Response: {response.text}")
            
    except Exception as e:
        print(f"   ❌ Exception: {str(e)}")
    
    # Test 2: Sales by Customer Summary
    print("\n2️⃣ Testing Sales by Customer Summary")
    try:
        url = f"{API_BASE}/by-customer/summary"
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
            print(f"   👥 Total Customers: {data.get('total_customers', 0)}")
            print(f"   💰 Total Sales: {data.get('total_sales', 0):,.2f}")
            print(f"   🏆 Top Customer: {data.get('top_customer_name', 'N/A')}")
            print(f"   💵 Top Customer Sales: {data.get('top_customer_sales', 0):,.2f}")
            print(f"   📈 Top Customer Percentage: {data.get('top_customer_percentage', 0):.1f}%")
            print(f"   📊 Average Sales per Customer: {data.get('average_sales_per_customer', 0):,.2f}")
            print(f"   ⭐ New Customers: {data.get('new_customers', 0)}")
            
        else:
            print(f"   ❌ Error: {response.status_code}")
            print(f"   Response: {response.text}")
            
    except Exception as e:
        print(f"   ❌ Exception: {str(e)}")
    
    # Test 3: Sales by Customer Analysis
    print("\n3️⃣ Testing Sales by Customer Analysis")
    try:
        url = f"{API_BASE}/by-customer/analysis"
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
            
            # Customer segmentation
            vip_customers = data.get('vip_customers', [])
            regular_customers = data.get('regular_customers', [])
            small_customers = data.get('small_customers', [])
            
            print(f"   🏆 VIP Customers (Top 10%): {len(vip_customers)}")
            print(f"   👥 Regular Customers (Middle 80%): {len(regular_customers)}")
            print(f"   📉 Small Customers (Bottom 10%): {len(small_customers)}")
            
            # Market concentration
            concentration_ratio = data.get('concentration_ratio', 0)
            gini_coefficient = data.get('gini_coefficient', 0)
            
            print(f"   📊 Market Concentration (Top 5): {concentration_ratio:.1f}%")
            print(f"   📈 Gini Coefficient: {gini_coefficient:.3f}")
            
            # Customer lifecycle
            lifecycle = data.get('customer_lifecycle_stage', {})
            print(f"   🔄 Customer Lifecycle:")
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
            url = f"{API_BASE}/by-customer"
            params = test_case["params"]
            
            print(f"   🧪 {test_case['name']}:")
            print(f"   Params: {params}")
            
            response = requests.get(url, params=params)
            print(f"   Status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print(f"   ✅ Success!")
                print(f"   Customers: {data.get('total_customers', 0)}")
                print(f"   Total Sales: {data.get('total_sales', 0):,.2f}")
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
            url = f"{API_BASE}/by-customer"
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
    print("🏁 Sales by Customer API Testing Complete!")

def test_authentication():
    """Test if authentication is working"""
    print("\n🔐 Testing Authentication")
    print("-" * 30)
    
    try:
        # Test health endpoint (no auth required)
        response = requests.get(f"{BASE_URL}/health")
        print(f"   Health Check: {response.status_code}")
        
        # Test Sales by Customer endpoint without auth (should fail)
        response = requests.get(f"{API_BASE}/by-customer?start_date=2024-01-01&end_date=2024-01-31")
        print(f"   Sales by Customer without auth: {response.status_code}")
        
        if response.status_code == 401:
            print("   ✅ Authentication is properly required")
        else:
            print("   ⚠️  Authentication might not be working properly")
            
    except Exception as e:
        print(f"   ❌ Authentication test failed: {str(e)}")

def test_customer_ranking_logic():
    """Test customer ranking and calculation logic"""
    print("\n🔍 Testing Customer Ranking Logic")
    print("-" * 40)
    
    try:
        # Test with a known period
        start_date = date.today() - timedelta(days=30)
        end_date = date.today()
        
        url = f"{API_BASE}/by-customer"
        params = {
            "start_date": start_date.isoformat(),
            "end_date": end_date.isoformat(),
            "limit": 10
        }
        
        response = requests.get(url, params=params)
        
        if response.status_code == 200:
            data = response.json()
            rankings = data.get('customer_rankings', [])
            
            print(f"   📊 Ranking Validation:")
            print(f"      - Total Rankings: {len(rankings)}")
            
            # Check if rankings are sorted correctly
            is_sorted = True
            for i in range(1, len(rankings)):
                if rankings[i-1]['total_sales'] < rankings[i]['total_sales']:
                    is_sorted = False
                    break
            
            print(f"      - Rankings Sorted: {'✅' if is_sorted else '❌'}")
            
            # Check ranking positions
            positions_correct = True
            for i, customer in enumerate(rankings):
                if customer.get('ranking') != i + 1:
                    positions_correct = False
                    break
            
            print(f"      - Ranking Positions: {'✅' if positions_correct else '❌'}")
            
            # Check calculations
            if rankings:
                top_customer = rankings[0]
                total_sales = data.get('total_sales', 0)
                expected_percentage = (top_customer['total_sales'] / total_sales * 100) if total_sales > 0 else 0
                actual_percentage = data.get('top_customer_percentage', 0)
                
                print(f"      - Top Customer Percentage: {actual_percentage:.1f}% (Expected: {expected_percentage:.1f}%)")
                print(f"      - Calculation Accuracy: {'✅' if abs(actual_percentage - expected_percentage) < 0.1 else '❌'}")
                
        else:
            print(f"   ❌ Failed to get data: {response.status_code}")
            
    except Exception as e:
        print(f"   ❌ Ranking logic test failed: {str(e)}")

if __name__ == "__main__":
    print("🚀 Starting Sales by Customer API Tests")
    print("=" * 50)
    
    # Test authentication first
    test_authentication()
    
    # Test Sales by Customer API
    test_sales_customer_api()
    
    # Test ranking logic
    test_customer_ranking_logic()
    
    print("\n💡 Note: These tests require:")
    print("   1. Backend server running on http://localhost:8000")
    print("   2. Database with invoices and sales_receipts data")
    print("   3. Proper authentication setup")
    print("   4. Customer data linked to transactions")
    print("\n🔧 To run backend server:")
    print("   cd backend && python main.py")
    print("\n📊 Sales by Customer Report includes:")
    print("   - Customer ranking by total sales")
    print("   - Transaction counts (invoices + sales receipts)")
    print("   - Average order value calculations")
    print("   - Customer segmentation (VIP, Regular, Small)")
    print("   - Market concentration analysis")
    print("   - Customer lifecycle stages")
    print("   - Gini coefficient for sales inequality")
