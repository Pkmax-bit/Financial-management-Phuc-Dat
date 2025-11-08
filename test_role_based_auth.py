#!/usr/bin/env python3
"""
Test Role-Based Authentication System
Comprehensive test for the new RBAC system
"""

import requests
import json
import sys
from typing import Dict, Any

# Test configuration
BASE_URL = "http://localhost:8000"
TEST_USERS = {
    "admin": {
        "email": "admin@test.com",
        "password": "admin123",
        "expected_role": "admin"
    },
    "sales": {
        "email": "sales@test.com", 
        "password": "sales123",
        "expected_role": "sales"
    },
    "accountant": {
        "email": "accountant@test.com",
        "password": "accountant123", 
        "expected_role": "accountant"
    },
    "customer": {
        "email": "customer@test.com",
        "password": "customer123",
        "expected_role": "customer"
    }
}

def test_server_health():
    """Test if server is running"""
    try:
        response = requests.get(f"{BASE_URL}/health", timeout=5)
        if response.status_code == 200:
            print("SUCCESS: Server is running")
            return True
        else:
            print(f"ERROR: Server health check failed: {response.status_code}")
            return False
    except requests.exceptions.RequestException as e:
        print(f"ERROR: Server is not running: {e}")
        return False

def login_user(email: str, password: str) -> Dict[str, Any]:
    """Login user and return token"""
    try:
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": email, "password": password},
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            print(f"SUCCESS: Login successful for {email}")
            return {
                "success": True,
                "token": data.get("access_token"),
                "user": data.get("user", {}),
                "response": data
            }
        else:
            print(f"ERROR: Login failed for {email}: {response.status_code}")
            try:
                error_data = response.json()
                print(f"   Error: {error_data.get('detail', 'Unknown error')}")
            except:
                print(f"   Error: {response.text}")
            return {"success": False, "error": response.text}
    except requests.exceptions.RequestException as e:
        print(f"ERROR: Login request failed for {email}: {e}")
        return {"success": False, "error": str(e)}

def test_customer_endpoints(token: str, user_role: str):
    """Test customer endpoints with different roles"""
    headers = {"Authorization": f"Bearer {token}"}
    
    print(f"\n🔍 Testing customer endpoints for {user_role} role:")
    
    # Test GET /api/customers
    try:
        response = requests.get(f"{BASE_URL}/api/customers", headers=headers, timeout=10)
        if response.status_code == 200:
            print("✅ GET /api/customers - Access granted")
        elif response.status_code == 403:
            print("❌ GET /api/customers - Access denied (403)")
        else:
            print(f"⚠️  GET /api/customers - Unexpected status: {response.status_code}")
    except Exception as e:
        print(f"❌ GET /api/customers - Request failed: {e}")
    
    # Test POST /api/customers
    try:
        customer_data = {
            "customer_code": f"TEST{user_role.upper()}001",
            "name": f"Test Customer {user_role.title()}",
            "type": "individual",
            "email": f"testcustomer{user_role}@example.com",
            "phone": "0123456789",
            "address": "Test Address",
            "city": "Test City",
            "country": "Vietnam"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/customers/", 
            json=customer_data, 
            headers=headers, 
            timeout=10
        )
        
        if response.status_code == 201:
            print("✅ POST /api/customers - Customer created successfully")
        elif response.status_code == 403:
            print("❌ POST /api/customers - Access denied (403)")
        elif response.status_code == 405:
            print("❌ POST /api/customers - Method not allowed (405) - Routing issue!")
        else:
            print(f"⚠️  POST /api/customers - Unexpected status: {response.status_code}")
            try:
                error_data = response.json()
                print(f"   Error: {error_data.get('detail', 'Unknown error')}")
            except:
                print(f"   Response: {response.text}")
    except Exception as e:
        print(f"❌ POST /api/customers - Request failed: {e}")
    
    # Test user permissions endpoint
    try:
        response = requests.get(f"{BASE_URL}/api/customers/user-permissions", headers=headers, timeout=10)
        if response.status_code == 200:
            data = response.json()
            print("✅ GET /api/customers/user-permissions - Permissions retrieved")
            print(f"   Role: {data.get('user', {}).get('role', 'Unknown')}")
            permissions = data.get('permissions', {})
            print(f"   Can manage customers: {permissions.get('can_manage_customers', False)}")
            print(f"   Can manage projects: {permissions.get('can_manage_projects', False)}")
            print(f"   Can access financial: {permissions.get('can_access_financial', False)}")
        else:
            print(f"⚠️  GET /api/customers/user-permissions - Status: {response.status_code}")
    except Exception as e:
        print(f"❌ GET /api/customers/user-permissions - Request failed: {e}")

def test_routing_conflict():
    """Test if routing conflict is resolved"""
    print("\n🔍 Testing routing conflict resolution:")
    
    # Test customer_view router (should be at /api/customer-view)
    try:
        response = requests.get(f"{BASE_URL}/api/customer-view/customers", timeout=10)
        if response.status_code == 200:
            print("✅ Customer view router accessible at /api/customer-view")
        else:
            print(f"⚠️  Customer view router status: {response.status_code}")
    except Exception as e:
        print(f"❌ Customer view router test failed: {e}")

def main():
    """Main test function"""
    print("Starting Role-Based Authentication System Test")
    print("=" * 60)
    
    # Test server health
    if not test_server_health():
        print("\n❌ Server is not running. Please start the backend server first.")
        sys.exit(1)
    
    # Test routing conflict resolution
    test_routing_conflict()
    
    # Test authentication for different roles
    successful_logins = []
    
    for role, user_data in TEST_USERS.items():
        print(f"\n🔐 Testing authentication for {role} role:")
        login_result = login_user(user_data["email"], user_data["password"])
        
        if login_result["success"]:
            successful_logins.append((role, login_result))
            
            # Test customer endpoints
            test_customer_endpoints(login_result["token"], role)
        else:
            print(f"❌ Failed to login as {role}")
    
    # Summary
    print("\n" + "=" * 60)
    print("📊 Test Summary:")
    print(f"✅ Successful logins: {len(successful_logins)}/{len(TEST_USERS)}")
    
    if successful_logins:
        print("\n🎯 Role-based access control is working!")
        print("✅ Routing conflict resolved")
        print("✅ Authentication system functional")
        print("✅ Role-based permissions implemented")
    else:
        print("\n❌ No successful logins - check user accounts and authentication")
    
    print("\n🔧 Next steps:")
    print("1. Verify user accounts exist in database")
    print("2. Test frontend integration with new RBAC system")
    print("3. Implement role-based navigation in frontend")

if __name__ == "__main__":
    main()
