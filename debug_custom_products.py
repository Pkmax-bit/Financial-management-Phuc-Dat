#!/usr/bin/env python3
"""
Debug script for custom product structures endpoint
"""

import requests
import json

def test_structures_endpoint():
    """Test the structures endpoint with proper authentication"""

    base_url = "http://localhost:8000"

    # First, login to get token
    print("=== AUTHENTICATION TEST ===")
    login_data = {
        "email": "admin@test.com",
        "password": "123456"
    }

    try:
        response = requests.post(f"{base_url}/api/auth/login", json=login_data)
        print(f"Login response: {response.status_code}")

        if response.status_code == 200:
            auth_data = response.json()
            token = auth_data.get("access_token")
            print(f"Got token: {token[:50]}...")

            # Test structures endpoint
            print("\n=== STRUCTURES ENDPOINT TEST ===")
            headers = {
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json"
            }

            structures_url = f"{base_url}/api/custom-products/structures?active_only=false"
            print(f"Testing URL: {structures_url}")

            response = requests.get(structures_url, headers=headers)
            print(f"Structures response: {response.status_code}")

            if response.status_code == 200:
                data = response.json()
                print(f"Success! Retrieved {len(data)} structures")
                if data:
                    print(f"Sample structure: {data[0]}")
            else:
                print(f"Error response: {response.text}")

        else:
            print(f"Login failed: {response.text}")

    except requests.exceptions.RequestException as e:
        print(f"Network error: {e}")
    except Exception as e:
        print(f"Other error: {e}")

def test_cors_headers():
    """Test CORS headers"""
    print("\n=== CORS TEST ===")

    try:
        # Test OPTIONS request
        response = requests.options("http://localhost:8000/api/custom-products/structures")
        print(f"OPTIONS response: {response.status_code}")
        print(f"CORS headers: {dict(response.headers)}")

    except Exception as e:
        print(f"CORS test error: {e}")

if __name__ == "__main__":
    test_structures_endpoint()
    test_cors_headers()









