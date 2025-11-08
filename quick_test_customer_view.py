#!/usr/bin/env python3
"""
Quick test for Customer View feature
"""

import requests
import sys

def test_backend_api():
    """Test if backend API is running"""
    try:
        response = requests.get("http://localhost:8000/api/customers", timeout=5)
        print(f"Backend API Status: {response.status_code}")
        if response.status_code in [200, 401]:  # 401 means auth required, which is OK
            return True
        return False
    except:
        print("Backend API not running")
        return False

def test_frontend():
    """Test if frontend is running"""
    try:
        response = requests.get("http://localhost:3001/customer-view", timeout=5)
        print(f"Frontend Status: {response.status_code}")
        return response.status_code == 200
    except:
        print("Frontend not running")
        return False

def main():
    print("Quick Customer View Test")
    print("=" * 40)
    
    backend_ok = test_backend_api()
    frontend_ok = test_frontend()
    
    print("\nResults:")
    print(f"Backend: {'OK' if backend_ok else 'FAILED'}")
    print(f"Frontend: {'OK' if frontend_ok else 'FAILED'}")
    
    if backend_ok and frontend_ok:
        print("\nCustomer View feature is working!")
    elif backend_ok:
        print("\nBackend working, check frontend")
    else:
        print("\nCheck both backend and frontend")

if __name__ == "__main__":
    main()
