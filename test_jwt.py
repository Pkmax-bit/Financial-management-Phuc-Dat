#!/usr/bin/env python3
"""
Test JWT token verification
"""

import requests
import json

def test_login_and_jwt():
    # Test login
    login_url = "http://localhost:8000/api/auth/login"
    login_data = {
        "email": "admin@example.com",
        "password": "admin123"
    }
    
    print("🔍 Testing login...")
    response = requests.post(login_url, json=login_data)
    
    if response.status_code == 200:
        token_data = response.json()
        token = token_data['access_token']
        print(f"✅ Login successful")
        print(f"🔍 Token length: {len(token)}")
        print(f"🔍 Token preview: {token[:50]}...")
        
        # Test debug endpoint
        debug_url = "http://localhost:8000/api/auth/debug-token"
        headers = {"Authorization": f"Bearer {token}"}
        
        print("\n🔍 Testing debug endpoint...")
        debug_response = requests.get(debug_url, headers=headers)
        
        if debug_response.status_code == 200:
            debug_data = debug_response.json()
            print(f"✅ Debug response: {debug_data}")
        else:
            print(f"❌ Debug failed: {debug_response.status_code} - {debug_response.text}")
        
        # Test employees endpoint
        employees_url = "http://localhost:8000/api/employees"
        
        print("\n🔍 Testing employees endpoint...")
        employees_response = requests.get(employees_url, headers=headers)
        
        if employees_response.status_code == 200:
            employees_data = employees_response.json()
            print(f"✅ Employees endpoint successful: {len(employees_data)} employees")
        else:
            print(f"❌ Employees endpoint failed: {employees_response.status_code} - {employees_response.text}")
            
    else:
        print(f"❌ Login failed: {response.status_code} - {response.text}")

if __name__ == "__main__":
    test_login_and_jwt()
