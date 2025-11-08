#!/usr/bin/env python3
"""
Simple Role-Based Authentication Test
"""

import requests
import json

BASE_URL = "http://localhost:8000"

def test_server():
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

def test_customer_routes():
    """Test customer routes"""
    print("\nTesting customer routes:")
    
    # Test GET /api/customers (should work with auth)
    try:
        response = requests.get(f"{BASE_URL}/api/customers", timeout=5)
        print(f"GET /api/customers: {response.status_code}")
    except Exception as e:
        print(f"GET /api/customers failed: {e}")
    
    # Test POST /api/customers (should return 401 without auth)
    try:
        response = requests.post(f"{BASE_URL}/api/customers/", json={}, timeout=5)
        print(f"POST /api/customers: {response.status_code}")
    except Exception as e:
        print(f"POST /api/customers failed: {e}")
    
    # Test customer-view routes
    try:
        response = requests.get(f"{BASE_URL}/api/customer-view/customers", timeout=5)
        print(f"GET /api/customer-view/customers: {response.status_code}")
    except Exception as e:
        print(f"GET /api/customer-view/customers failed: {e}")

def test_auth_endpoints():
    """Test authentication endpoints"""
    print("\nTesting auth endpoints:")
    
    # Test login endpoint
    try:
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "test@example.com",
            "password": "test123"
        }, timeout=5)
        print(f"POST /api/auth/login: {response.status_code}")
    except Exception as e:
        print(f"POST /api/auth/login failed: {e}")

def main():
    print("Role-Based Authentication Test")
    print("=" * 40)
    
    if not test_server():
        print("Please start the backend server first")
        return
    
    test_customer_routes()
    test_auth_endpoints()
    
    print("\nTest completed!")

if __name__ == "__main__":
    main()
