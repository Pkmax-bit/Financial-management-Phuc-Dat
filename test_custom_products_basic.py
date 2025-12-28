#!/usr/bin/env python3
"""
Basic Custom Product Test - Check API availability
"""

import requests
import json

def test_basic_api():
    """Test basic API endpoints without authentication"""
    print("BASIC CUSTOM PRODUCT API TEST")
    print("=" * 40)

    base_url = "http://localhost:8000"

    # Test 1: Health check
    try:
        response = requests.get(f"{base_url}/")
        print(f"Health Check: {response.status_code}")
        if response.status_code == 200:
            print("[PASS] Server is running")
        else:
            print("[FAIL] Server not responding properly")
    except Exception as e:
        print(f"[FAIL] Cannot connect to server: {e}")
        return

    # Test 2: Check authentication requirement
    try:
        response = requests.get(f"{base_url}/api/custom-products/categories")
        print(f"Categories endpoint: {response.status_code}")
        if response.status_code == 403:
            print("[PASS] Authentication required (expected)")
        elif response.status_code == 200:
            print("[INFO] No authentication required")
        else:
            print(f"[INFO] Unexpected status: {response.status_code}")
    except Exception as e:
        print(f"[FAIL] Categories endpoint error: {e}")

    # Test 3: Try login
    try:
        login_data = {
            "email": "admin@test.com",
            "password": "123456"
        }
        response = requests.post(f"{base_url}/api/auth/login", json=login_data)
        print(f"Login attempt: {response.status_code}")

        if response.status_code == 200:
            data = response.json()
            token = data.get("access_token")
            print("[PASS] Login successful")
            print(f"Token received: {token[:50]}...")

            # Test authenticated request
            headers = {"Authorization": f"Bearer {token}"}
            response = requests.get(f"{base_url}/api/custom-products/categories", headers=headers)
            print(f"Authenticated categories request: {response.status_code}")

            if response.status_code == 200:
                categories = response.json()
                print(f"[PASS] Retrieved {len(categories)} categories")
            else:
                print(f"[FAIL] Authenticated request failed: {response.text}")

        else:
            print(f"[FAIL] Login failed: {response.text}")
    except Exception as e:
        print(f"[FAIL] Login error: {e}")

if __name__ == "__main__":
    test_basic_api()



