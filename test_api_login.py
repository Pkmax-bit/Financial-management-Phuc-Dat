"""
Script test API login
"""

import requests
import json

API_BASE_URL = "http://localhost:8000"

def test_api_login():
    """Test API login"""
    print("Test API login...")
    
    # Test cases
    test_cases = [
        {
            "email": "admin@test.com",
            "password": "123456",
            "description": "Admin test account"
        },
        {
            "email": "admin@example.com", 
            "password": "123456",
            "description": "Admin example account"
        },
        {
            "email": "sales@example.com",
            "password": "123456", 
            "description": "Sales account"
        }
    ]
    
    for i, test_case in enumerate(test_cases, 1):
        print(f"\nTest {i}: {test_case['description']}")
        print(f"Email: {test_case['email']}")
        
        try:
            response = requests.post(f"{API_BASE_URL}/api/auth/login", json={
                "email": test_case["email"],
                "password": test_case["password"]
            })
            
            print(f"Status code: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print("Login thanh cong")
                print(f"  - Token type: {data.get('token_type')}")
                print(f"  - Expires in: {data.get('expires_in')}")
                print(f"  - Access token: {data.get('access_token')[:20]}...")
                return data.get('access_token')
            else:
                print("Login that bai")
                try:
                    error_data = response.json()
                    print(f"  - Error: {error_data.get('detail', 'Unknown error')}")
                except:
                    print(f"  - Response: {response.text}")
                    
        except Exception as e:
            print(f"Loi: {str(e)}")
    
    return None

def test_with_token(token):
    """Test voi token"""
    if not token:
        print("Khong co token de test")
        return
    
    print(f"\nTest voi token...")
    headers = {"Authorization": f"Bearer {token}"}
    
    try:
        # Test employees endpoint
        response = requests.get(f"{API_BASE_URL}/api/employees/", headers=headers)
        print(f"Employees endpoint: {response.status_code}")
        
        if response.status_code == 200:
            employees = response.json()
            print(f"  - Found {len(employees)} employees")
        else:
            print(f"  - Error: {response.text}")
            
    except Exception as e:
        print(f"Loi test voi token: {str(e)}")

if __name__ == "__main__":
    print("KIEM TRA API LOGIN")
    print("=" * 50)
    
    token = test_api_login()
    test_with_token(token)
    
    print("\n" + "=" * 50)
    print("HOAN THANH KIEM TRA")
    print("=" * 50)
