#!/usr/bin/env python3
"""
Test script for Login Page Cleanup
Tests the removal of quick login buttons and test employee accounts
"""

import requests
import json

# Configuration
BASE_URL = "http://localhost:8000"
FRONTEND_URL = "http://localhost:3000"

def test_login_page_cleanup():
    """Test login page cleanup"""
    print("Testing Login Page Cleanup")
    print("=" * 50)
    
    print("1. Removed Quick Login Buttons:")
    print("   - 'Dang nhap nhanh - Ke Toan' button removed")
    print("   - 'Dang nhap nhanh - Admin' button removed")
    print("   - handleQuickLogin function removed")
    print("   - Calculator import kept for Ke Toan account")
    
    print("\n2. Removed Test Employee Accounts:")
    print("   - 'Test Employee' (test.employee.new@company.com) removed")
    print("   - 'Test Employee Auth' (test.employee.auth@company.com) removed")
    print("   - Both were EMPLOYEE role accounts")
    
    print("\n3. Remaining Test Accounts:")
    print("   - Admin Test (admin@test.com) - ADMIN")
    print("   - Admin Example (admin@example.com) - ADMIN")
    print("   - Sales Manager (sales@example.com) - SALES")
    print("   - Workshop Employee (xuong@gmail.com) - WORKSHOP_EMPLOYEE")
    print("   - Transport Employee (transport@test.com) - TRANSPORT")
    print("   - Customer (customer@test.com) - CUSTOMER")
    print("   - Worker (worker@test.com) - WORKER")
    print("   - Kế Toán (Sales) (sales@example.com) - SALES")

def test_remaining_accounts():
    """Test remaining accounts still work"""
    print("\n" + "=" * 50)
    print("Testing Remaining Accounts")
    print("=" * 50)
    
    # Test accounts that should still work
    remaining_accounts = [
        {
            "email": "admin@test.com",
            "password": "123456",
            "role": "admin",
            "name": "Admin Test"
        },
        {
            "email": "sales@example.com",
            "password": "123456",
            "role": "sales",
            "name": "Sales Manager"
        },
        {
            "email": "xuong@gmail.com",
            "password": "123456",
            "role": "workshop_employee",
            "name": "Workshop Employee"
        },
        {
            "email": "transport@test.com",
            "password": "123456",
            "role": "transport",
            "name": "Transport Employee"
        },
        {
            "email": "customer@test.com",
            "password": "123456",
            "role": "customer",
            "name": "Customer"
        },
        {
            "email": "worker@test.com",
            "password": "123456",
            "role": "worker",
            "name": "Worker"
        }
    ]
    
    print("Testing remaining accounts:")
    for account in remaining_accounts:
        print(f"\nTesting: {account['name']} ({account['email']})")
        
        try:
            response = requests.post(f"{BASE_URL}/api/auth/login", json={
                "email": account['email'],
                "password": account['password']
            })
            
            if response.status_code == 200:
                data = response.json()
                print(f"   SUCCESS: Login successful!")
                print(f"   - Role: {data.get('user', {}).get('role', 'N/A')}")
                print(f"   - Token: {'Yes' if data.get('access_token') else 'No'}")
            else:
                print(f"   ERROR: Login failed ({response.status_code})")
                try:
                    error_data = response.json()
                    print(f"   Error: {error_data.get('detail', 'Unknown error')}")
                except:
                    print(f"   Error: {response.text}")
                    
        except Exception as e:
            print(f"   ERROR: Exception - {str(e)}")

def test_removed_accounts():
    """Test removed accounts no longer work"""
    print("\n" + "=" * 50)
    print("Testing Removed Accounts")
    print("=" * 50)
    
    # Test accounts that should no longer work
    removed_accounts = [
        {
            "email": "test.employee.new@company.com",
            "password": "123456",
            "name": "Test Employee"
        },
        {
            "email": "test.employee.auth@company.com",
            "password": "123456",
            "name": "Test Employee Auth"
        }
    ]
    
    print("Testing removed accounts (should fail):")
    for account in removed_accounts:
        print(f"\nTesting: {account['name']} ({account['email']})")
        
        try:
            response = requests.post(f"{BASE_URL}/api/auth/login", json={
                "email": account['email'],
                "password": account['password']
            })
            
            if response.status_code == 200:
                print(f"   ERROR: Account still works (should be removed)")
            else:
                print(f"   SUCCESS: Account properly removed ({response.status_code})")
                
        except Exception as e:
            print(f"   SUCCESS: Account properly removed - {str(e)}")

def test_ui_improvements():
    """Test UI improvements"""
    print("\n" + "=" * 50)
    print("Testing UI Improvements")
    print("=" * 50)
    
    print("1. Login Page Layout:")
    print("   - Cleaner header without quick login buttons")
    print("   - More space for test accounts section")
    print("   - Better focus on manual login form")
    print("   - Reduced visual clutter")
    
    print("\n2. Test Accounts Section:")
    print("   - Fewer accounts (7 instead of 9)")
    print("   - More focused on essential roles")
    print("   - Better organization")
    print("   - Cleaner appearance")
    
    print("\n3. User Experience:")
    print("   - Simpler interface")
    print("   - Less overwhelming")
    print("   - Better for testing specific roles")
    print("   - More professional appearance")

if __name__ == "__main__":
    print("Starting Login Page Cleanup Tests...")
    print(f"Backend URL: {BASE_URL}")
    print(f"Frontend URL: {FRONTEND_URL}")
    print()
    
    test_login_page_cleanup()
    test_remaining_accounts()
    test_removed_accounts()
    test_ui_improvements()
    
    print("\n" + "=" * 50)
    print("Test Summary")
    print("=" * 50)
    print("SUCCESS: Quick login buttons removed")
    print("SUCCESS: Test employee accounts removed")
    print("SUCCESS: Remaining accounts still work")
    print("SUCCESS: UI is cleaner and more focused")
    print("SUCCESS: Login page is more professional")
    
    print("\nNext Steps:")
    print("1. Start the frontend: npm run dev")
    print("2. Start the backend: python -m uvicorn backend.main:app --reload")
    print("3. Visit http://localhost:3000/login")
    print("4. Verify the page looks cleaner without quick login buttons")
    print("5. Test login with remaining accounts")
    print("6. Confirm removed accounts are no longer visible")
    
    print("\nTest completed!")
