"""
Script test cac tai khoan moi
"""

import requests
import json

API_BASE_URL = "http://localhost:8000"

def test_new_accounts():
    """Test cac tai khoan moi"""
    print("TEST CAC TAI KHOAN MOI")
    print("=" * 50)
    
    # Test accounts
    test_accounts = [
        {
            "email": "workshop@test.com",
            "password": "123456",
            "role": "WORKSHOP_EMPLOYEE",
            "description": "Nhân viên xưởng"
        },
        {
            "email": "transport@test.com",
            "password": "123456", 
            "role": "TRANSPORT",
            "description": "Nhân viên vận chuyển"
        },
        {
            "email": "customer@test.com",
            "password": "123456",
            "role": "CUSTOMER", 
            "description": "Khách hàng"
        },
        {
            "email": "worker@test.com",
            "password": "123456",
            "role": "WORKER",
            "description": "Công nhân"
        }
    ]
    
    successful_logins = []
    
    for i, account in enumerate(test_accounts, 1):
        print(f"\n{i}. Test login voi: {account['email']} ({account['role']})")
        
        try:
            response = requests.post(f"{API_BASE_URL}/api/auth/login", json={
                "email": account["email"],
                "password": account["password"]
            })
            
            print(f"   Status code: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                token = data.get('access_token')
                print("   Login thanh cong")
                print(f"   Token: {token[:20]}...")
                successful_logins.append(account)
                
                # Test voi token
                print("   Test voi token...")
                headers = {"Authorization": f"Bearer {token}"}
                
                # Test employees endpoint
                emp_response = requests.get(f"{API_BASE_URL}/api/employees/", headers=headers)
                if emp_response.status_code == 200:
                    employees = emp_response.json()
                    print(f"   Employees endpoint: {len(employees)} employees")
                else:
                    print(f"   Employees endpoint: {emp_response.status_code}")
                
            else:
                print("   Login that bai")
                try:
                    error_data = response.json()
                    print(f"   Error: {error_data.get('detail', 'Unknown error')}")
                except:
                    print(f"   Response: {response.text}")
                    
        except Exception as e:
            print(f"   Loi: {str(e)}")
    
    # Tong ket
    print(f"\nTONG KET:")
    print(f"- So tai khoan test: {len(test_accounts)}")
    print(f"- Login thanh cong: {len(successful_logins)}")
    print(f"- Ty le thanh cong: {len(successful_logins)/len(test_accounts)*100:.1f}%")
    
    if successful_logins:
        print(f"\nCAC TAI KHOAN HOAT DONG:")
        for account in successful_logins:
            print(f"   - {account['email']} - {account['role']}")

if __name__ == "__main__":
    test_new_accounts()
