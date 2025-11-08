#!/usr/bin/env python3
"""
Debug script to test employee creation and identify the 400 error
"""

import requests
import json
from datetime import datetime

# Test data for employee creation
test_employee_data = {
    "first_name": "Test",
    "last_name": "Employee",
    "email": "test.employee@example.com",
    "phone": "0123456789",
    "hire_date": "2024-01-01",
    "password": "testpassword123",
    "user_role": "employee"
}

# API endpoint
url = "http://localhost:8000/api/employees/"

# Headers (you might need to add authentication token)
headers = {
    "Content-Type": "application/json",
    # Add your auth token here if needed
    # "Authorization": "Bearer your_token_here"
}

def test_employee_creation():
    """Test employee creation and capture detailed error"""
    try:
        print("Testing employee creation...")
        print(f"Sending data: {json.dumps(test_employee_data, indent=2)}")
        
        response = requests.post(url, json=test_employee_data, headers=headers)
        
        print(f"Status Code: {response.status_code}")
        print(f"Response Headers: {dict(response.headers)}")
        
        if response.status_code == 200:
            print("SUCCESS: Employee created successfully!")
            print(f"Response: {json.dumps(response.json(), indent=2)}")
        else:
            print("ERROR: Employee creation failed!")
            print(f"Error Response: {response.text}")
            
            # Try to parse error details
            try:
                error_data = response.json()
                print(f"Parsed Error: {json.dumps(error_data, indent=2)}")
            except:
                print("Raw Error Text:", response.text)
                
    except requests.exceptions.ConnectionError:
        print("Connection Error: Make sure the backend server is running on localhost:8000")
    except Exception as e:
        print(f"Unexpected Error: {str(e)}")

def test_database_schema():
    """Test if password_hash column exists"""
    print("\nTesting database schema...")
    
    # This would require database connection
    # For now, just provide instructions
    print("To check if password_hash column exists, run this SQL:")
    print("""
    SELECT column_name, data_type, is_nullable 
    FROM information_schema.columns 
    WHERE table_name = 'users' 
    AND column_name = 'password_hash';
    """)
    
    print("\nIf the column doesn't exist, run:")
    print("ALTER TABLE users ADD COLUMN password_hash TEXT;")

if __name__ == "__main__":
    print("Employee Creation Debug Tool")
    print("=" * 50)
    
    test_employee_creation()
    test_database_schema()
    
    print("\nCommon 400 Error Causes:")
    print("1. Missing password_hash column in users table")
    print("2. Invalid user_role value")
    print("3. Email already exists")
    print("4. Authentication issues")
    print("5. Missing required fields")
    
    print("\nSolutions:")
    print("1. Run: add_password_hash_column.sql")
    print("2. Check user_role is one of: admin, accountant, sales, workshop_employee, employee, worker, transport, customer")
    print("3. Use unique email address")
    print("4. Ensure you're authenticated")
    print("5. Check all required fields are provided")