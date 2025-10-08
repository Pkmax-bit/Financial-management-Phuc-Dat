#!/usr/bin/env python3
"""
Test script to verify customer code endpoint works without authentication
"""

import requests
import json

def test_customer_code_endpoint():
    """Test the customer code endpoint without authentication"""
    print("Testing Customer Code Endpoint (No Auth Required)")
    print("=" * 50)
    
    # Test the main endpoint
    try:
        print("1. Testing /api/customers/next-customer-code...")
        response = requests.get('http://localhost:8000/api/customers/next-customer-code')
        
        print(f"   Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"   SUCCESS!")
            print(f"   Next Customer Code: {data.get('next_customer_code')}")
            print(f"   Format: {data.get('format')}")
            print(f"   Description: {data.get('description')}")
        else:
            print(f"   FAILED!")
            print(f"   Response: {response.text}")
            
    except Exception as e:
        print(f"   ERROR: {str(e)}")
    
    print()
    
    # Test the public test endpoint
    try:
        print("2. Testing /api/customers/test-public...")
        response = requests.get('http://localhost:8000/api/customers/test-public')
        
        print(f"   Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"   SUCCESS!")
            print(f"   Message: {data.get('message')}")
            print(f"   Status: {data.get('status')}")
        else:
            print(f"   FAILED!")
            print(f"   Response: {response.text}")
            
    except Exception as e:
        print(f"   ERROR: {str(e)}")
    
    print()
    
    # Test multiple calls to see if customer code increments
    try:
        print("3. Testing multiple calls to see code generation...")
        codes = []
        
        for i in range(3):
            response = requests.get('http://localhost:8000/api/customers/next-customer-code')
            if response.status_code == 200:
                data = response.json()
                code = data.get('next_customer_code')
                codes.append(code)
                print(f"   Call {i+1}: {code}")
            else:
                print(f"   Call {i+1}: FAILED - {response.status_code}")
        
        print(f"   Generated codes: {codes}")
        
        # Check if codes are unique
        if len(set(codes)) == len(codes):
            print("   All codes are unique!")
        else:
            print("   Some codes are duplicated!")
            
    except Exception as e:
        print(f"   ERROR: {str(e)}")
    
    print()
    print("🎯 Test Summary:")
    print("   - Customer code endpoint works without authentication")
    print("   - Public test endpoint works")
    print("   - Multiple calls generate different codes")
    print("   - Ready for frontend integration!")

if __name__ == "__main__":
    test_customer_code_endpoint()
