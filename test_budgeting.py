#!/usr/bin/env python3
"""
Test script for Budgeting API endpoints
"""

import requests
import json
from datetime import datetime, date, timedelta

# Configuration
BASE_URL = "http://localhost:8000"
LOGIN_EMAIL = "admin@example.com"
LOGIN_PASSWORD = "admin123"

def login():
    """Login and get access token"""
    print("🔐 Logging in...")
    
    login_data = {
        "email": LOGIN_EMAIL,
        "password": LOGIN_PASSWORD
    }
    
    response = requests.post(f"{BASE_URL}/api/auth/login", json=login_data)
    
    if response.status_code == 200:
        data = response.json()
        print(f"✅ Login successful: {data.get('user', {}).get('email', 'Unknown')}")
        return data.get('access_token')
    else:
        print(f"❌ Login failed: {response.status_code} - {response.text}")
        return None

def test_create_budget(token):
    """Test creating a budget"""
    print("\n📊 Testing create budget...")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    # Create budget data
    budget_data = {
        "budget_name": f"Test Budget {datetime.now().strftime('%Y%m%d%H%M%S')}",
        "period": "monthly",
        "start_date": date.today().isoformat(),
        "end_date": (date.today() + timedelta(days=30)).isoformat(),
        "budget_lines": [
            {
                "expense_category": "travel",
                "expense_category_name": "Chi phí đi lại",
                "budgeted_amount": 1000000,
                "notes": "Ngân sách đi lại tháng này"
            },
            {
                "expense_category": "meals",
                "expense_category_name": "Chi phí ăn uống",
                "budgeted_amount": 500000,
                "notes": "Ngân sách ăn uống"
            }
        ],
        "total_budget_amount": 1500000,
        "currency": "VND",
        "description": "Ngân sách test cho tháng này"
    }
    
    response = requests.post(f"{BASE_URL}/api/expenses/budgets", json=budget_data, headers=headers)
    
    if response.status_code == 201:
        data = response.json()
        print(f"✅ Budget created: {data.get('budget_name')} (ID: {data.get('id')})")
        return data.get('id')
    else:
        print(f"❌ Create budget failed: {response.status_code} - {response.text}")
        return None

def test_get_budgets(token):
    """Test getting budgets"""
    print("\n📋 Testing get budgets...")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    response = requests.get(f"{BASE_URL}/api/expenses/budgets", headers=headers)
    
    if response.status_code == 200:
        data = response.json()
        print(f"✅ Found {len(data)} budgets")
        for budget in data[:3]:  # Show first 3
            print(f"  - {budget.get('budget_name')} ({budget.get('status')})")
        return data
    else:
        print(f"❌ Get budgets failed: {response.status_code} - {response.text}")
        return []

def test_get_budget(token, budget_id):
    """Test getting a specific budget"""
    print(f"\n🔍 Testing get budget {budget_id}...")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    response = requests.get(f"{BASE_URL}/api/expenses/budgets/{budget_id}", headers=headers)
    
    if response.status_code == 200:
        data = response.json()
        print(f"✅ Budget found: {data.get('budget_name')}")
        print(f"  - Period: {data.get('period')}")
        print(f"  - Total: {data.get('total_budget_amount')} {data.get('currency')}")
        print(f"  - Lines: {len(data.get('lines', []))}")
        return data
    else:
        print(f"❌ Get budget failed: {response.status_code} - {response.text}")
        return None

def test_approve_budget(token, budget_id):
    """Test approving a budget"""
    print(f"\n✅ Testing approve budget {budget_id}...")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    approval_data = {
        "action": "approve",
        "notes": "Approved for testing"
    }
    
    response = requests.post(f"{BASE_URL}/api/expenses/budgets/{budget_id}/approve", json=approval_data, headers=headers)
    
    if response.status_code == 200:
        data = response.json()
        print(f"✅ Budget approved: {data.get('message')}")
        return True
    else:
        print(f"❌ Approve budget failed: {response.status_code} - {response.text}")
        return False

def test_get_budget_report(token, budget_id):
    """Test getting budget report"""
    print(f"\n📊 Testing get budget report {budget_id}...")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    response = requests.get(f"{BASE_URL}/api/expenses/budgets/{budget_id}/report", headers=headers)
    
    if response.status_code == 200:
        data = response.json()
        print(f"✅ Budget report generated:")
        print(f"  - Budget: {data.get('budget_name')}")
        print(f"  - Total Budgeted: {data.get('total_budgeted')} {data.get('currency')}")
        print(f"  - Total Actual: {data.get('total_actual')} {data.get('currency')}")
        print(f"  - Total Variance: {data.get('total_variance')} {data.get('currency')}")
        print(f"  - Variance %: {data.get('total_variance_percentage')}%")
        print(f"  - Categories: {len(data.get('variances', []))}")
        return data
    else:
        print(f"❌ Get budget report failed: {response.status_code} - {response.text}")
        return None

def test_get_budget_stats(token):
    """Test getting budget statistics"""
    print("\n📈 Testing get budget stats...")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    response = requests.get(f"{BASE_URL}/api/expenses/budgets/stats", headers=headers)
    
    if response.status_code == 200:
        data = response.json()
        print(f"✅ Budget stats:")
        print(f"  - Total Budgets: {data.get('total_budgets')}")
        print(f"  - Total Budgeted: {data.get('total_budgeted_amount')}")
        print(f"  - Total Actual: {data.get('total_actual_amount')}")
        print(f"  - Active: {data.get('active_budgets')}")
        print(f"  - Draft: {data.get('draft_budgets')}")
        print(f"  - Closed: {data.get('closed_budgets')}")
        return data
    else:
        print(f"❌ Get budget stats failed: {response.status_code} - {response.text}")
        return None

def test_add_budget_line(token, budget_id):
    """Test adding a budget line"""
    print(f"\n➕ Testing add budget line to {budget_id}...")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    line_data = {
        "expense_category": "office_supplies",
        "expense_category_name": "Văn phòng phẩm",
        "budgeted_amount": 300000,
        "notes": "Ngân sách văn phòng phẩm"
    }
    
    response = requests.post(f"{BASE_URL}/api/expenses/budgets/{budget_id}/lines", json=line_data, headers=headers)
    
    if response.status_code == 200:
        data = response.json()
        print(f"✅ Budget line added: {data.get('message')}")
        return True
    else:
        print(f"❌ Add budget line failed: {response.status_code} - {response.text}")
        return False

def main():
    print("🧪 Testing Budgeting API")
    print("=" * 50)
    
    # Login
    token = login()
    if not token:
        print("❌ Cannot proceed without authentication")
        return
    
    try:
        # Test create budget
        budget_id = test_create_budget(token)
        if not budget_id:
            print("❌ Cannot proceed without a budget")
            return
        
        # Test get budgets
        test_get_budgets(token)
        
        # Test get specific budget
        test_get_budget(token, budget_id)
        
        # Test add budget line
        test_add_budget_line(token, budget_id)
        
        # Test approve budget
        test_approve_budget(token, budget_id)
        
        # Test get budget report
        test_get_budget_report(token, budget_id)
        
        # Test get budget stats
        test_get_budget_stats(token)
        
        print("\n✅ All tests completed!")
        
    except Exception as e:
        print(f"❌ Test failed with error: {e}")

if __name__ == "__main__":
    main()
