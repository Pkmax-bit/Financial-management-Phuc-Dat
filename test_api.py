#!/usr/bin/env python3
"""
Test API directly
"""
import requests

def test_api():
    try:
        url = "http://localhost:8000/api/custom-products/columns?active_only=true"
        response = requests.get(url)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_api()

