#!/usr/bin/env python3
"""
Test script for Customer View API endpoints
"""

import requests
import json
import sys
from datetime import datetime

# API base URL
BASE_URL = "http://localhost:8000/api"

def test_api_endpoint(method, endpoint, data=None, headers=None):
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
        else:
            print(f"❌ Unsupported method: {method}")
            return None
        
        print(f"{method} {endpoint} - Status: {response.status_code}")
        
        if response.status_code == 200:
            try:
                data = response.json()
                print(f"SUCCESS: {len(data) if isinstance(data, list) else 'Object'} items returned")
                return data
            except:
                print(f"SUCCESS: {response.text[:100]}...")
                return response.text
        else:
            print(f"ERROR: {response.text}")
            return None
            
    except requests.exceptions.ConnectionError:
        print(f"Connection Error: Cannot connect to {url}")
        return None
    except Exception as e:
        print(f"ERROR: {e}")
        return None

def test_customer_view_apis():
    """Test all customer view API endpoints"""
    print("Testing Customer View API Endpoints")
    print("=" * 60)
    
    # Test 1: Get all customers
    print("\n1. Testing GET /customers")
    customers = test_api_endpoint("GET", "/customers")
    
    if customers and len(customers) > 0:
        customer_id = customers[0].get('id')
        print(f"   Found customer ID: {customer_id}")
        
        # Test 2: Get customer details
        print(f"\n2. Testing GET /customers/{customer_id}")
        customer_details = test_api_endpoint("GET", f"/customers/{customer_id}")
        
        # Test 3: Get customer projects
        print(f"\n3. Testing GET /customers/{customer_id}/projects")
        customer_projects = test_api_endpoint("GET", f"/customers/{customer_id}/projects")
        
        # Test 4: Get customer timeline
        print(f"\n4. Testing GET /customers/{customer_id}/timeline")
        customer_timeline = test_api_endpoint("GET", f"/customers/{customer_id}/timeline")
        
        # Test 5: Get customer timeline images
        print(f"\n5. Testing GET /customers/{customer_id}/timeline/images")
        customer_images = test_api_endpoint("GET", f"/customers/{customer_id}/timeline/images")
        
        # Test 6: Get customer statistics
        print(f"\n6. Testing GET /customers/{customer_id}/statistics")
        customer_stats = test_api_endpoint("GET", f"/customers/{customer_id}/statistics")
        
        return {
            "customers": customers,
            "customer_details": customer_details,
            "customer_projects": customer_projects,
            "customer_timeline": customer_timeline,
            "customer_images": customer_images,
            "customer_stats": customer_stats
        }
    else:
        print("No customers found, cannot test other endpoints")
        return None

def test_frontend_access():
    """Test if frontend can access the customer view page"""
    print("\nTesting Frontend Access")
    print("=" * 60)
    
    try:
        # Test frontend URL
        response = requests.get("http://localhost:3001/customer-view", timeout=5)
        if response.status_code == 200:
            print("Frontend customer-view page accessible")
            return True
        else:
            print(f"Frontend error: {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print("Frontend not running on localhost:3001")
        return False
    except Exception as e:
        print(f"Frontend error: {e}")
        return False

def test_database_connection():
    """Test database connection through API"""
    print("\nTesting Database Connection")
    print("=" * 60)
    
    # Test a simple endpoint that requires database access
    try:
        response = requests.get(f"{BASE_URL}/customers", timeout=10)
        if response.status_code == 200:
            print("Database connection working")
            return True
        elif response.status_code == 401:
            print("Authentication required - this is expected")
            return True
        else:
            print(f"Database error: {response.status_code} - {response.text}")
            return False
    except requests.exceptions.ConnectionError:
        print("Cannot connect to backend API")
        return False
    except Exception as e:
        print(f"Database test error: {e}")
        return False

def main():
    """Main test function"""
    print("Customer View Feature Test")
    print("=" * 60)
    print(f"Test started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Test 1: Database connection
    db_ok = test_database_connection()
    
    # Test 2: API endpoints
    api_results = test_customer_view_apis()
    
    # Test 3: Frontend access
    frontend_ok = test_frontend_access()
    
    # Summary
    print("\n" + "=" * 60)
    print("TEST SUMMARY")
    print("=" * 60)
    
    print(f"Database Connection: {'OK' if db_ok else 'FAILED'}")
    print(f"API Endpoints: {'OK' if api_results else 'FAILED'}")
    print(f"Frontend Access: {'OK' if frontend_ok else 'FAILED'}")
    
    if api_results:
        print(f"\nAPI Results:")
        print(f"  - Customers found: {len(api_results.get('customers', []))}")
        print(f"  - Customer details: {'OK' if api_results.get('customer_details') else 'FAILED'}")
        print(f"  - Customer projects: {'OK' if api_results.get('customer_projects') else 'FAILED'}")
        print(f"  - Customer timeline: {'OK' if api_results.get('customer_timeline') else 'FAILED'}")
        print(f"  - Customer images: {'OK' if api_results.get('customer_images') else 'FAILED'}")
        print(f"  - Customer statistics: {'OK' if api_results.get('customer_stats') else 'FAILED'}")
    
    # Overall status
    if db_ok and api_results and frontend_ok:
        print("\nAll tests passed! Customer View feature is working correctly.")
    elif db_ok and api_results:
        print("\nBackend working, but frontend may have issues.")
    elif db_ok:
        print("\nDatabase working, but API endpoints may have issues.")
    else:
        print("\nMultiple issues detected. Check backend server and database.")
    
    print(f"\nTest completed at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

if __name__ == "__main__":
    main()
