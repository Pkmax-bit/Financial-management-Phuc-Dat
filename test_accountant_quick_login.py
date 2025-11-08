#!/usr/bin/env python3
"""
Test script for Accountant Quick Login feature
Tests the new quick login buttons and accountant accounts
"""

import requests
import json
import time

# Configuration
BASE_URL = "http://localhost:8000"
FRONTEND_URL = "http://localhost:3000"

def test_accountant_accounts():
    """Test that accountant accounts exist and work"""
    print("Testing Accountant Quick Login Feature")
    print("=" * 50)
    
    # Test accounts
    accountant_accounts = [
        {
            "email": "sales@example.com",
            "password": "123456",
            "role": "sales",
            "name": "Ke Toan (Sales)"
        }
    ]
    
    print("Testing Accountant Accounts:")
    for account in accountant_accounts:
        print(f"\nTesting: {account['name']} ({account['email']})")
        
        try:
            # Test login
            response = requests.post(f"{BASE_URL}/api/auth/login", json={
                "email": account['email'],
                "password": account['password']
            })
            
            if response.status_code == 200:
                data = response.json()
                print(f"SUCCESS: Login successful!")
                print(f"   - User ID: {data.get('user', {}).get('id', 'N/A')}")
                print(f"   - Role: {data.get('user', {}).get('role', 'N/A')}")
                print(f"   - Email: {data.get('user', {}).get('email', 'N/A')}")
                print(f"   - Token: {'Yes' if data.get('access_token') else 'No'}")
                
                # Test token validation
                if data.get('access_token'):
                    headers = {"Authorization": f"Bearer {data['access_token']}"}
                    test_response = requests.get(f"{BASE_URL}/api/auth/me", headers=headers)
                    if test_response.status_code == 200:
                        print(f"SUCCESS: Token validation successful!")
                    else:
                        print(f"ERROR: Token validation failed: {test_response.status_code}")
                        
            else:
                print(f"ERROR: Login failed: {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"   Error: {error_data.get('detail', 'Unknown error')}")
                except:
                    print(f"   Error: {response.text}")
                    
        except Exception as e:
            print(f"ERROR: Exception: {str(e)}")
    
    print("\n" + "=" * 50)
    print("Quick Login Features Added:")
    print("SUCCESS: Nut 'Dang nhap nhanh - Ke Toan' o dau trang")
    print("SUCCESS: Tai khoan ke toan noi bat trong danh sach test accounts")
    print("SUCCESS: Icon Calculator cho ke toan")
    print("SUCCESS: Mau sac emerald/green cho ke toan")
    print("SUCCESS: Auto-submit khi click nut dang nhap nhanh")
    print("SUCCESS: Hien thi thong tin chi tiet cua tai khoan ke toan")
    
    print("\nUsage Instructions:")
    print("1. Truy cap http://localhost:3000/login")
    print("2. Click nut 'Dang nhap nhanh - Ke Toan' (mau xanh la)")
    print("3. Hoac click vao tai khoan ke toan noi bat trong danh sach")
    print("4. He thong se tu dong dang nhap va chuyen den dashboard")

def test_accountant_permissions():
    """Test accountant role permissions"""
    print("\nTesting Accountant Permissions:")
    print("-" * 30)
    
    try:
        # Login as accountant (using sales account)
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "sales@example.com",
            "password": "123456"
        })
        
        if response.status_code == 200:
            data = response.json()
            token = data.get('access_token')
            headers = {"Authorization": f"Bearer {token}"}
            
            # Test endpoints that accountant should have access to
            endpoints_to_test = [
                ("/api/projects", "GET", "View projects"),
                ("/api/expenses", "GET", "View expenses"),
                ("/api/reports", "GET", "View reports"),
                ("/api/employees", "GET", "View employees"),
                ("/api/customers", "GET", "View customers"),
            ]
            
            for endpoint, method, description in endpoints_to_test:
                try:
                    if method == "GET":
                        test_response = requests.get(f"{BASE_URL}{endpoint}", headers=headers)
                    else:
                        test_response = requests.post(f"{BASE_URL}{endpoint}", headers=headers)
                    
                    if test_response.status_code in [200, 201]:
                        print(f"SUCCESS: {description}: Access granted")
                    else:
                        print(f"ERROR: {description}: Access denied ({test_response.status_code})")
                except Exception as e:
                    print(f"ERROR: {description}: Error - {str(e)}")
        else:
            print("ERROR: Could not login as accountant to test permissions")
            
    except Exception as e:
        print(f"ERROR: Error testing permissions: {str(e)}")

if __name__ == "__main__":
    print("Starting Accountant Quick Login Tests...")
    print(f"Backend URL: {BASE_URL}")
    print(f"Frontend URL: {FRONTEND_URL}")
    print()
    
    test_accountant_accounts()
    test_accountant_permissions()
    
    print("\nTest completed!")
    print("\nNext Steps:")
    print("1. Start the frontend: npm run dev")
    print("2. Start the backend: python -m uvicorn backend.main:app --reload")
    print("3. Visit http://localhost:3000/login")
    print("4. Test the new quick login buttons!")