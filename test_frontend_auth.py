#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import requests
import json

def test_frontend_auth():
    """Test frontend authentication"""
    print("=== TESTING FRONTEND AUTHENTICATION ===")
    
    # Test 1: Check if frontend is running
    try:
        response = requests.get("http://localhost:3000")
        print(f"Frontend Status: {response.status_code}")
        if response.status_code == 200:
            print("  Frontend is running")
        else:
            print("  Frontend is not responding")
            return
    except Exception as e:
        print(f"  Frontend connection error: {e}")
        return
    
    # Test 2: Check reports page
    try:
        response = requests.get("http://localhost:3000/reports")
        print(f"Reports Page Status: {response.status_code}")
        if response.status_code == 200:
            print("  Reports page is accessible")
        else:
            print(f"  Reports page error: {response.text[:200]}")
    except Exception as e:
        print(f"  Reports page error: {e}")
    
    # Test 3: Check login page
    try:
        response = requests.get("http://localhost:3000/login")
        print(f"Login Page Status: {response.status_code}")
        if response.status_code == 200:
            print("  Login page is accessible")
        else:
            print(f"  Login page error: {response.text[:200]}")
    except Exception as e:
        print(f"  Login page error: {e}")

if __name__ == "__main__":
    test_frontend_auth()
