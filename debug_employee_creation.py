#!/usr/bin/env python3
"""
Debug script for employee creation issues
"""

import requests
import json
from datetime import datetime

def debug_employee_creation():
    """Debug employee creation with detailed error reporting"""
    
    BASE_URL = "http://localhost:8000"
    
    # Test data
    employee_data = {
        "first_name": "Debug",
        "last_name": "Test",
        "email": f"debug{datetime.now().strftime('%Y%m%d%H%M%S')}@example.com",
        "phone": "0123456789",
        "hire_date": "2024-01-01",
        "salary": 10000000,
        "employee_code": f"DEBUG{datetime.now().strftime('%Y%m%d%H%M%S')}"
    }
    
    print("=== Debug Employee Creation ===")
    print(f"Data: {json.dumps(employee_data, indent=2)}")
    
    try:
        response = requests.post(f"{BASE_URL}/api/employees", json=employee_data)
        
        print(f"\nStatus Code: {response.status_code}")
        print(f"Headers: {dict(response.headers)}")
        
        if response.status_code < 400:
            print("✅ Success!")
            print(f"Response: {response.json()}")
        else:
            print("❌ Error!")
            print(f"Response Text: {response.text}")
            
            # Try to parse error details
            try:
                error_data = response.json()
                print(f"Error Details: {json.dumps(error_data, indent=2)}")
            except:
                print("Could not parse error as JSON")
                
    except Exception as e:
        print(f"Exception: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    debug_employee_creation()
