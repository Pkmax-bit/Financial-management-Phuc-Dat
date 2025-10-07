"""
Script test tao nhan vien sau khi fix
"""

import requests
import json

API_BASE_URL = "http://localhost:8000"

def test_create_employee():
    """Test tao nhan vien"""
    print("Test tao nhan vien...")
    
    try:
        # Login
        login_response = requests.post(f"{API_BASE_URL}/api/auth/login", json={
            "email": "admin@test.com",
            "password": "123456"
        })
        
        if login_response.status_code != 200:
            print("Loi: Khong the dang nhap")
            print(f"Response: {login_response.text}")
            return False
        
        token = login_response.json().get("access_token")
        headers = {"Authorization": f"Bearer {token}"}
        
        # Test data
        employee_data = {
            "first_name": "Test",
            "last_name": "Employee",
            "email": "test.employee.new@company.com",
            "phone": "0901000099",
            "department_id": "dept-004",
            "position_id": "pos-008",
            "hire_date": "2024-01-01",
            "salary": 20000000,
            "user_role": "employee"
        }
        
        # Create employee
        response = requests.post(f"{API_BASE_URL}/api/employees/", 
                               headers=headers, 
                               json=employee_data)
        
        print(f"Status code: {response.status_code}")
        
        if response.status_code == 200:
            employee = response.json()
            print("Thanh cong tao nhan vien")
            print(f"Employee Code: {employee.get('employee_code')}")
            print(f"Email: {employee.get('email')}")
            print(f"Role: {employee.get('user_role')}")
            return True
        else:
            print(f"That bai: {response.status_code}")
            try:
                error_data = response.json()
                print(f"Error: {error_data.get('detail', 'Unknown error')}")
            except:
                print(f"Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"Loi: {str(e)}")
        return False

def test_get_employees():
    """Test lay danh sach nhan vien"""
    print("\nTest lay danh sach nhan vien...")
    
    try:
        # Login
        login_response = requests.post(f"{API_BASE_URL}/api/auth/login", json={
            "email": "admin@test.com",
            "password": "123456"
        })
        
        if login_response.status_code != 200:
            print("Loi: Khong the dang nhap")
            return False
        
        token = login_response.json().get("access_token")
        headers = {"Authorization": f"Bearer {token}"}
        
        # Get employees
        response = requests.get(f"{API_BASE_URL}/api/employees/", headers=headers)
        
        if response.status_code == 200:
            employees = response.json()
            print(f"Thanh cong lay danh sach: {len(employees)} nhan vien")
            
            if employees:
                emp = employees[0]
                print(f"Nhan vien dau tien:")
                print(f"  - Code: {emp.get('employee_code')}")
                print(f"  - Name: {emp.get('first_name')} {emp.get('last_name')}")
                print(f"  - Email: {emp.get('email')}")
                print(f"  - Role: {emp.get('users', {}).get('role', 'N/A')}")
            return True
        else:
            print(f"That bai: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"Loi: {str(e)}")
        return False

if __name__ == "__main__":
    print("KIEM TRA CHUC NANG NHAN VIEN SAU KHI FIX")
    print("=" * 60)
    
    # Test tao nhan vien
    test_create_employee()
    
    # Test lay danh sach
    test_get_employees()
    
    print("\n" + "=" * 60)
    print("HOAN THANH KIEM TRA")
    print("=" * 60)
