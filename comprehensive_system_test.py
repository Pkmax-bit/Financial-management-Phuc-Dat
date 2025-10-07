"""
Script kiem tra toan bo he thong
"""

import requests
import json
import time

API_BASE_URL = "http://localhost:8000"

def test_server_status():
    """Kiem tra server co chay khong"""
    print("Kiem tra server status...")
    
    try:
        response = requests.get(f"{API_BASE_URL}/docs", timeout=5)
        if response.status_code == 200:
            print("Server dang chay")
            return True
        else:
            print(f"Server loi: {response.status_code}")
            return False
    except Exception as e:
        print(f"Khong the ket noi server: {str(e)}")
        return False

def test_auth_system():
    """Kiem tra he thong xac thuc"""
    print("\nKiem tra he thong xac thuc...")
    
    # Test login
    try:
        response = requests.post(f"{API_BASE_URL}/api/auth/login", json={
            "email": "admin@test.com",
            "password": "123456"
        })
        
        if response.status_code == 200:
            data = response.json()
            token = data.get('access_token')
            print("Login thanh cong")
            print(f"   - Token: {token[:20]}...")
            return token
        else:
            print(f"Login that bai: {response.status_code}")
            try:
                error_data = response.json()
                print(f"   - Error: {error_data.get('detail', 'Unknown')}")
            except:
                print(f"   - Response: {response.text}")
            return None
            
    except Exception as e:
        print(f"Loi login: {str(e)}")
        return None

def test_employee_endpoints(token):
    """Kiem tra employee endpoints"""
    print("\nKiem tra employee endpoints...")
    
    if not token:
        print("Khong co token")
        return False
    
    headers = {"Authorization": f"Bearer {token}"}
    
    # Test GET employees
    try:
        response = requests.get(f"{API_BASE_URL}/api/employees/", headers=headers)
        if response.status_code == 200:
            employees = response.json()
            print(f"GET /api/employees/ - {len(employees)} employees")
            
            if employees:
                emp = employees[0]
                print(f"   - Employee: {emp.get('first_name')} {emp.get('last_name')}")
                print(f"   - Code: {emp.get('employee_code')}")
                print(f"   - Role: {emp.get('users', {}).get('role', 'N/A')}")
        else:
            print(f"GET /api/employees/ - {response.status_code}")
    except Exception as e:
        print(f"Loi GET employees: {str(e)}")
    
    # Test GET departments
    try:
        response = requests.get(f"{API_BASE_URL}/api/employees/departments", headers=headers)
        if response.status_code == 200:
            departments = response.json()
            print(f"GET /api/employees/departments - {len(departments)} departments")
        else:
            print(f"GET /api/employees/departments - {response.status_code}")
    except Exception as e:
        print(f"Loi GET departments: {str(e)}")
    
    # Test GET positions
    try:
        response = requests.get(f"{API_BASE_URL}/api/employees/positions", headers=headers)
        if response.status_code == 200:
            positions = response.json()
            print(f"GET /api/employees/positions - {len(positions)} positions")
        else:
            print(f"GET /api/employees/positions - {response.status_code}")
    except Exception as e:
        print(f"Loi GET positions: {str(e)}")

def test_create_employee(token):
    """Test tao nhan vien"""
    print("\nTest tao nhan vien...")
    
    if not token:
        print("Khong co token")
        return False
    
    headers = {"Authorization": f"Bearer {token}"}
    
    # Su dung timestamp de tao email unique
    timestamp = int(time.time())
    
    employee_data = {
        "first_name": "Test",
        "last_name": f"Employee{timestamp}",
        "email": f"test.employee.{timestamp}@company.com",
        "phone": "0901000099",
        "department_id": "2a839aa7-4ef4-4a47-a20a-26afd66ad2c3",  # SALES
        "position_id": "7f61f3ec-f5fe-4875-bd20-11920c6fcbe0",  # POS-MGMT-002
        "hire_date": "2024-01-01",
        "salary": 20000000,
        "user_role": "employee"
    }
    
    try:
        response = requests.post(f"{API_BASE_URL}/api/employees/", 
                               headers=headers, 
                               json=employee_data)
        
        if response.status_code == 200:
            employee = response.json()
            print("Tao nhan vien thanh cong")
            print(f"   - Code: {employee.get('employee_code')}")
            print(f"   - Name: {employee.get('first_name')} {employee.get('last_name')}")
            print(f"   - Email: {employee.get('email')}")
            print(f"   - Role: {employee.get('user_role')}")
            return True
        else:
            print(f"Tao nhan vien that bai: {response.status_code}")
            try:
                error_data = response.json()
                print(f"   - Error: {error_data.get('detail', 'Unknown error')}")
            except:
                print(f"   - Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"Loi tao nhan vien: {str(e)}")
        return False

def test_other_endpoints(token):
    """Test cac endpoints khac"""
    print("\nTest cac endpoints khac...")
    
    if not token:
        print("Khong co token")
        return
    
    headers = {"Authorization": f"Bearer {token}"}
    
    endpoints = [
        ("/api/dashboard/stats", "Dashboard stats"),
        ("/api/customers/", "Customers"),
        ("/api/sales/", "Sales")
    ]
    
    for endpoint, name in endpoints:
        try:
            response = requests.get(f"{API_BASE_URL}{endpoint}", headers=headers)
            if response.status_code == 200:
                print(f"{name} - OK")
            elif response.status_code == 404:
                print(f"{name} - Not implemented")
            else:
                print(f"{name} - {response.status_code}")
        except Exception as e:
            print(f"Loi {name}: {str(e)}")

def run_comprehensive_test():
    """Chay kiem tra toan bo"""
    print("KIEM TRA TOAN BO HE THONG")
    print("=" * 60)
    
    # 1. Kiem tra server
    if not test_server_status():
        print("Server khong chay. Dung kiem tra.")
        return
    
    # 2. Kiem tra auth
    token = test_auth_system()
    if not token:
        print("Khong the dang nhap. Dung kiem tra.")
        return
    
    # 3. Kiem tra employee endpoints
    test_employee_endpoints(token)
    
    # 4. Test tao nhan vien
    test_create_employee(token)
    
    # 5. Test cac endpoints khac
    test_other_endpoints(token)
    
    print("\n" + "=" * 60)
    print("HOAN THANH KIEM TRA TOAN BO")
    print("=" * 60)

if __name__ == "__main__":
    run_comprehensive_test()
