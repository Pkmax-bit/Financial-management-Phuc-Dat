#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import requests
import json

def test_auth_flow():
    """Test authentication flow"""
    print("=== TESTING AUTHENTICATION FLOW ===")
    
    # Test 1: Check if backend is running
    try:
        response = requests.get("http://localhost:8000/health")
        print(f"Backend Health: {response.status_code}")
        if response.status_code == 200:
            print("  Backend is running")
        else:
            print("  Backend is not responding")
            return
    except Exception as e:
        print(f"  Backend connection error: {e}")
        return
    
    # Test 2: Test dashboard API without auth
    try:
        response = requests.get("http://localhost:8000/api/dashboard/stats")
        print(f"Dashboard API (no auth): {response.status_code}")
        if response.status_code == 403:
            print("  Expected: Authentication required")
        else:
            print(f"  Unexpected response: {response.text}")
    except Exception as e:
        print(f"  Dashboard API error: {e}")
    
    # Test 3: Test with fake token
    try:
        headers = {"Authorization": "Bearer fake-token"}
        response = requests.get("http://localhost:8000/api/dashboard/stats", headers=headers)
        print(f"Dashboard API (fake token): {response.status_code}")
        if response.status_code == 401:
            print("  Expected: Invalid token")
        else:
            print(f"  Response: {response.text}")
    except Exception as e:
        print(f"  Dashboard API error: {e}")
    
    # Test 4: Test reports API
    try:
        response = requests.get("http://localhost:8000/api/reports/financial/cash-flow?start_date=2025-01-01&end_date=2025-01-31")
        print(f"Cash Flow API (no auth): {response.status_code}")
        if response.status_code == 403:
            print("  Expected: Authentication required")
        else:
            print(f"  Unexpected response: {response.text}")
    except Exception as e:
        print(f"  Cash Flow API error: {e}")

if __name__ == "__main__":
    test_auth_flow()
