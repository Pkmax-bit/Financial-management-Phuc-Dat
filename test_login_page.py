"""
Script test trang login voi cac tai khoan da cap nhat
"""

import requests
import json

API_BASE_URL = "http://localhost:8000"

def test_login_accounts():
    """Test login voi cac tai khoan da cap nhat"""
    print("TEST LOGIN VOI CAC TAI KHOAN DA CAP NHAT")
    print("=" * 60)
    
    # Cac tai khoan da cap nhat trong trang login
    test_accounts = [
        {
            "name": "Admin Test",
            "email": "admin@test.com",
            "password": "123456",
            "role": "ADMIN"
        },
        {
            "name": "Admin Example",
            "email": "admin@example.com",
            "password": "123456",
            "role": "ADMIN"
        },
        {
            "name": "Sales Manager",
            "email": "sales@example.com",
            "password": "123456",
            "role": "SALES"
        },
        {
            "name": "Test Employee",
            "email": "test.employee.new@company.com",
            "password": "123456",
            "role": "EMPLOYEE"
        },
        {
            "name": "Test Employee Auth",
            "email": "test.employee.auth@company.com",
            "password": "123456",
            "role": "EMPLOYEE"
        }
    ]
    
    successful_logins = []
    failed_logins = []
    
    for i, account in enumerate(test_accounts, 1):
        print(f"\n{i}. Test login voi: {account['name']} ({account['email']})")
        
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
                failed_logins.append(account)
                
        except Exception as e:
            print(f"   Loi: {str(e)}")
            failed_logins.append(account)
    
    # Tong ket
    print(f"\n" + "=" * 60)
    print("TONG KET")
    print("=" * 60)
    print(f"Tong so tai khoan test: {len(test_accounts)}")
    print(f"Login thanh cong: {len(successful_logins)}")
    print(f"Login that bai: {len(failed_logins)}")
    print(f"Ty le thanh cong: {len(successful_logins)/len(test_accounts)*100:.1f}%")
    
    if successful_logins:
        print(f"\nCAC TAI KHOAN HOAT DONG:")
        for account in successful_logins:
            print(f"   - {account['name']} ({account['email']}) - {account['role']}")
    
    if failed_logins:
        print(f"\nCAC TAI KHOAN CO VAN DE:")
        for account in failed_logins:
            print(f"   - {account['name']} ({account['email']}) - {account['role']}")
    
    return successful_logins, failed_logins

def test_frontend_login():
    """Test frontend login page"""
    print(f"\nTEST FRONTEND LOGIN PAGE")
    print("=" * 60)
    
    try:
        # Test truy cap trang login
        response = requests.get("http://localhost:3000/login", timeout=10)
        print(f"Frontend login page: {response.status_code}")
        
        if response.status_code == 200:
            print("Trang login hoat dong")
            print("   Cac tai khoan test da duoc cap nhat:")
            print("   - admin@test.com / 123456 (ADMIN)")
            print("   - admin@example.com / 123456 (ADMIN)")
            print("   - sales@example.com / 123456 (SALES)")
            print("   - test.employee.new@company.com / 123456 (EMPLOYEE)")
            print("   - test.employee.auth@company.com / 123456 (EMPLOYEE)")
        else:
            print("Trang login khong hoat dong")
            
    except Exception as e:
        print(f"Loi truy cap frontend: {str(e)}")
        print("   Kiem tra xem frontend co dang chay khong (npm run dev)")

if __name__ == "__main__":
    # Test API login
    successful, failed = test_login_accounts()
    
    # Test frontend
    test_frontend_login()
    
    print(f"\n" + "=" * 60)
    print("HOAN THANH TEST LOGIN PAGE")
    print("=" * 60)
