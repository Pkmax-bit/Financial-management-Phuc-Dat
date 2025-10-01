#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import requests
import json

def test_auth_flow():
    """Test the authentication flow"""
    
    print("=" * 60)
    print("TESTING AUTHENTICATION FLOW")
    print("=" * 60)
    
    base_url = "http://localhost:8000"
    
    # Test 1: Try to login
    print("\n1. Testing login...")
    login_data = {
        "email": "admin@example.com",
        "password": "admin123"
    }
    
    try:
        response = requests.post(f"{base_url}/api/auth/login", json=login_data, timeout=10)
        print(f"   Status Code: {response.status_code}")
        
        if response.status_code == 200:
            print("OK - Login successful")
            token_data = response.json()
            print(f"   Token type: {token_data.get('token_type')}")
            print(f"   Token preview: {token_data.get('access_token', '')[:50]}...")
            
            # Test 2: Use token to access protected endpoint
            print("\n2. Testing protected endpoint with token...")
            headers = {
                "Authorization": f"Bearer {token_data.get('access_token')}",
                "Content-Type": "application/json"
            }
            
            protected_response = requests.get(f"{base_url}/api/sales/dashboard/stats", headers=headers, timeout=10)
            print(f"   Status Code: {protected_response.status_code}")
            
            if protected_response.status_code == 200:
                print("OK - Protected endpoint accessible")
                print(f"   Response: {protected_response.json()}")
            else:
                print(f"ERROR - Protected endpoint failed: {protected_response.status_code}")
                print(f"   Response: {protected_response.text}")
                
        else:
            print(f"ERROR - Login failed: {response.status_code}")
            print(f"   Response: {response.text}")
            
    except Exception as e:
        print(f"ERROR - Authentication test failed: {e}")
    
    print("\n" + "=" * 60)
    print("TROUBLESHOOTING STEPS:")
    print("=" * 60)
    print("1. Check if user exists in database")
    print("2. Verify Supabase configuration")
    print("3. Check backend logs for detailed errors")
    print("4. Ensure sample data has been inserted")
    print("=" * 60)

if __name__ == "__main__":
    test_auth_flow()


