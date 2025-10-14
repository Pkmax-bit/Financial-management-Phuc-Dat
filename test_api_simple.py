#!/usr/bin/env python3
"""
Simple API test
"""

import requests
import json

def test_api():
    """Test API endpoints"""
    base_url = "http://localhost:8000"
    
    print("Testing API endpoints...")
    
    # Test emotion types
    print("\n1. Testing emotion types...")
    try:
        response = requests.get(f"{base_url}/api/emotions-comments/emotion-types")
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"Found {len(data)} emotion types")
        else:
            print(f"Error: {response.text}")
    except Exception as e:
        print(f"Error: {e}")
    
    # Test public reactions
    print("\n2. Testing public reactions...")
    try:
        response = requests.get(f"{base_url}/api/emotions-comments/reactions/public?entity_type=attachment&entity_id=test")
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"Found {len(data)} reactions")
        else:
            print(f"Error: {response.text}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_api()

