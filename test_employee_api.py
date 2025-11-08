#!/usr/bin/env python3
"""
Test script for Employee API endpoints
"""

import requests
import json
from datetime import datetime

# API base URL
BASE_URL = "http://localhost:8000"

def test_endpoint(method, endpoint, data=None, headers=None):
    """Test an API endpoint"""
    url = f"{BASE_URL}{endpoint}"
    
    try:
        if method.upper() == "GET":
            response = requests.get(url, headers=headers)
        elif method.upper() == "POST":
            response = requests.post(url, json=data, headers=headers)
        elif method.upper() == "PUT":
            response = requests.put(url, json=data, headers=headers)
        elif method.upper() == "DELETE":
            response = requests.delete(url, headers=headers)
        
        print(f"\n{method} {endpoint}")
        print(f"Status: {response.status_code}")
        
        if response.status_code < 400:
            try:
                result = response.json()
                print(f"Response: {json.dumps(result, indent=2, ensure_ascii=False)}")
            except:
                print(f"Response: {response.text}")
        else:
            print(f"Error: {response.text}")
            
        return response
        
    except Exception as e:
        print(f"Exception: {e}")
        return None

def main():
    print("=== Employee API Test ===")
    print(f"Testing against: {BASE_URL}")
    print(f"Time: {datetime.now()}")
    
    # Test basic endpoints
    print("\n1. Testing basic endpoints...")
    test_endpoint("GET", "/api/employees/test")
    test_endpoint("GET", "/api/employees/public-list")
    
    # Test public endpoints
    print("\n2. Testing public endpoints...")
    test_endpoint("GET", "/api/employees/public-departments")
    test_endpoint("GET", "/api/employees/public-positions")
    
    # Test sample data creation
    print("\n3. Testing sample data creation...")
    test_endpoint("POST", "/api/employees/create-sample")
    
    # Test creating employee
    print("\n4. Testing employee creation...")
    employee_data = {
        "first_name": "Test",
        "last_name": "User",
        "email": f"test{datetime.now().strftime('%Y%m%d%H%M%S')}@example.com",
        "phone": "0123456789",
        "hire_date": "2024-01-01",
        "salary": 10000000,
        "employee_code": f"TEST{datetime.now().strftime('%Y%m%d%H%M%S')}"
    }
    
    response = test_endpoint("POST", "/api/employees", employee_data)
    
    if response and response.status_code == 200:
        print("✅ Employee creation successful!")
    else:
        print("❌ Employee creation failed!")
    
    print("\n=== Test Complete ===")

if __name__ == "__main__":
    main()
