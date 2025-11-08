#!/usr/bin/env python3
"""
Test script for Employee CRUD operations
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

def test_employee_crud():
    """Test complete CRUD operations for employees"""
    
    print("=== Employee CRUD Test ===")
    print(f"Testing against: {BASE_URL}")
    print(f"Time: {datetime.now()}")
    
    # Test 1: Get all employees (READ)
    print("\n1. Testing READ - Get all employees...")
    response = test_endpoint("GET", "/api/employees/public-list")
    
    if response and response.status_code == 200:
        employees = response.json().get('employees', [])
        print(f"✅ Found {len(employees)} employees")
        
        if employees:
            test_employee_id = employees[0]['id']
            print(f"Using employee ID for testing: {test_employee_id}")
            
            # Test 2: Get specific employee (READ by ID)
            print(f"\n2. Testing READ - Get employee by ID...")
            test_endpoint("GET", f"/api/employees/{test_employee_id}")
            
            # Test 3: Update employee (UPDATE)
            print(f"\n3. Testing UPDATE - Update employee...")
            update_data = {
                "first_name": "Updated",
                "last_name": "Test User",
                "email": f"updated{datetime.now().strftime('%Y%m%d%H%M%S')}@example.com",
                "phone": "0987654321",
                "hire_date": "2024-01-01",
                "salary": 15000000,
                "status": "active"
            }
            test_endpoint("PUT", f"/api/employees/{test_employee_id}", update_data)
            
            # Test 4: Delete employee (DELETE)
            print(f"\n4. Testing DELETE - Delete employee...")
            test_endpoint("DELETE", f"/api/employees/{test_employee_id}")
            
        else:
            print("⚠️  No employees found for testing")
    else:
        print("❌ Failed to get employees list")
    
    # Test 5: Create new employee (CREATE)
    print(f"\n5. Testing CREATE - Create new employee...")
    new_employee_data = {
        "first_name": "Test",
        "last_name": "CRUD User",
        "email": f"crudtest{datetime.now().strftime('%Y%m%d%H%M%S')}@example.com",
        "phone": "0123456789",
        "hire_date": "2024-01-01",
        "salary": 12000000,
        "employee_code": f"CRUD{datetime.now().strftime('%Y%m%d%H%M%S')}"
    }
    
    create_response = test_endpoint("POST", "/api/employees", new_employee_data)
    
    if create_response and create_response.status_code == 200:
        print("✅ Employee creation successful!")
        created_employee = create_response.json()
        print(f"Created employee ID: {created_employee.get('id', 'Unknown')}")
    else:
        print("❌ Employee creation failed!")
    
    print("\n=== CRUD Test Complete ===")

def test_departments_and_positions():
    """Test departments and positions endpoints"""
    
    print("\n=== Departments & Positions Test ===")
    
    # Test departments
    print("\n1. Testing departments...")
    test_endpoint("GET", "/api/employees/public-departments")
    
    # Test positions
    print("\n2. Testing positions...")
    test_endpoint("GET", "/api/employees/public-positions")
    
    print("\n=== Departments & Positions Test Complete ===")

def main():
    """Main function"""
    
    print("Employee CRUD Operations Test")
    print("=" * 50)
    
    # Test CRUD operations
    test_employee_crud()
    
    # Test related endpoints
    test_departments_and_positions()
    
    print("\n✅ All tests completed!")

if __name__ == "__main__":
    main()
