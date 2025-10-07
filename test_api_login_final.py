"""
Script test API login cuoi cung
"""

import requests
import json

API_BASE_URL = "http://localhost:8000"

def test_api_login():
    """Test API login"""
    print("TEST API LOGIN")
    print("=" * 40)
    
    # Danh sach users de test
    test_users = [
        {
            "email": "admin@test.com",
            "password": "123456",
            "description": "Admin Test"
        },
        {
            "email": "admin@example.com", 
            "password": "123456",
            "description": "Admin Example"
        },
        {
            "email": "sales@example.com",
            "password": "123456",
            "description": "Sales"
        },
        {
            "email": "test.employee.new@company.com",
            "password": "123456",
            "description": "Employee"
        }
    ]
    
    successful_logins = []
    
    for i, user in enumerate(test_users, 1):
        print(f"\n{i}. Test login voi: {user['description']} ({user['email']})")
        
        try:
            response = requests.post(f"{API_BASE_URL}/api/auth/login", json={
                "email": user["email"],
                "password": user["password"]
            })
            
            print(f"   Status code: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                token = data.get('access_token')
                print("   Login thanh cong")
                print(f"   Token: {token[:20]}...")
                successful_logins.append({
                    'email': user['email'],
                    'token': token,
                    'description': user['description']
                })
            else:
                print("   Login that bai")
                try:
                    error_data = response.json()
                    print(f"   Error: {error_data.get('detail', 'Unknown error')}")
                except:
                    print(f"   Response: {response.text}")
                    
        except Exception as e:
            print(f"   Loi: {str(e)}")
    
    # Test voi token thanh cong
    if successful_logins:
        print(f"\nTEST VOI TOKEN")
        print("=" * 40)
        
        # Su dung token dau tien
        test_user = successful_logins[0]
        print(f"Su dung token cua: {test_user['description']}")
        
        headers = {"Authorization": f"Bearer {test_user['token']}"}
        
        # Test employees endpoint
        try:
            response = requests.get(f"{API_BASE_URL}/api/employees/", headers=headers)
            print(f"Employees endpoint: {response.status_code}")
            
            if response.status_code == 200:
                employees = response.json()
                print(f"  Found {len(employees)} employees")
            else:
                print(f"  Error: {response.text}")
        except Exception as e:
            print(f"  Loi: {str(e)}")
        
        # Test departments endpoint
        try:
            response = requests.get(f"{API_BASE_URL}/api/employees/departments", headers=headers)
            print(f"Departments endpoint: {response.status_code}")
        except Exception as e:
            print(f"  Loi: {str(e)}")
        
        # Test positions endpoint
        try:
            response = requests.get(f"{API_BASE_URL}/api/employees/positions", headers=headers)
            print(f"Positions endpoint: {response.status_code}")
        except Exception as e:
            print(f"  Loi: {str(e)}")
    
    print(f"\nTONG KET:")
    print(f"- So users test: {len(test_users)}")
    print(f"- Login thanh cong: {len(successful_logins)}")
    print(f"- Ty le thanh cong: {len(successful_logins)/len(test_users)*100:.1f}%")

if __name__ == "__main__":
    test_api_login()
