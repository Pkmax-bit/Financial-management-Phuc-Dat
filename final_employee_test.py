"""
Script test cuoi cung chuc nang nhan vien
"""

import requests
import json

API_BASE_URL = "http://localhost:8000"

def test_login():
    """Test login"""
    print("Test login...")
    
    try:
        response = requests.post(f"{API_BASE_URL}/api/auth/login", json={
            "email": "admin@test.com",
            "password": "123456"
        })
        
        if response.status_code == 200:
            token = response.json().get("access_token")
            print("Login thanh cong")
            return token
        else:
            print(f"Login that bai: {response.status_code}")
            return None
            
    except Exception as e:
        print(f"Loi login: {str(e)}")
        return None

def test_get_employees(token):
    """Test lay danh sach nhan vien"""
    print("\nTest lay danh sach nhan vien...")
    
    try:
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get(f"{API_BASE_URL}/api/employees/", headers=headers)
        
        if response.status_code == 200:
            employees = response.json()
            print(f"Thanh cong: {len(employees)} nhan vien")
            
            for i, emp in enumerate(employees[:3]):  # Hien thi 3 nhan vien dau
                print(f"  {i+1}. {emp.get('first_name')} {emp.get('last_name')} ({emp.get('employee_code')})")
                print(f"     Email: {emp.get('email')}")
                print(f"     Role: {emp.get('users', {}).get('role', 'N/A')}")
            return True
        else:
            print(f"That bai: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"Loi: {str(e)}")
        return False

def test_get_departments(token):
    """Test lay danh sach phong ban"""
    print("\nTest lay danh sach phong ban...")
    
    try:
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get(f"{API_BASE_URL}/api/employees/departments", headers=headers)
        
        if response.status_code == 200:
            departments = response.json()
            print(f"Thanh cong: {len(departments)} phong ban")
            
            for i, dept in enumerate(departments[:3]):  # Hien thi 3 phong ban dau
                print(f"  {i+1}. {dept.get('code')} - {dept.get('name', 'N/A')}")
            return True
        else:
            print(f"That bai: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"Loi: {str(e)}")
        return False

def test_get_positions(token):
    """Test lay danh sach chuc vu"""
    print("\nTest lay danh sach chuc vu...")
    
    try:
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get(f"{API_BASE_URL}/api/employees/positions", headers=headers)
        
        if response.status_code == 200:
            positions = response.json()
            print(f"Thanh cong: {len(positions)} chuc vu")
            
            for i, pos in enumerate(positions[:3]):  # Hien thi 3 chuc vu dau
                print(f"  {i+1}. {pos.get('code')} - {pos.get('name', 'N/A')}")
            return True
        else:
            print(f"That bai: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"Loi: {str(e)}")
        return False

def test_create_employee_new_email(token):
    """Test tao nhan vien voi email moi"""
    print("\nTest tao nhan vien voi email moi...")
    
    try:
        headers = {"Authorization": f"Bearer {token}"}
        
        # Su dung timestamp de tao email unique
        import time
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
        
        response = requests.post(f"{API_BASE_URL}/api/employees/", 
                               headers=headers, 
                               json=employee_data)
        
        if response.status_code == 200:
            employee = response.json()
            print("Tao nhan vien thanh cong")
            print(f"  - Code: {employee.get('employee_code')}")
            print(f"  - Name: {employee.get('first_name')} {employee.get('last_name')}")
            print(f"  - Email: {employee.get('email')}")
            print(f"  - Role: {employee.get('user_role')}")
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

def run_final_test():
    """Chay test cuoi cung"""
    print("KIEM TRA CUOI CUNG CHUC NANG NHAN VIEN")
    print("=" * 60)
    
    # Test login
    token = test_login()
    if not token:
        print("Khong the dang nhap. Dung test.")
        return
    
    # Test lay danh sach nhan vien
    test_get_employees(token)
    
    # Test lay danh sach phong ban
    test_get_departments(token)
    
    # Test lay danh sach chuc vu
    test_get_positions(token)
    
    # Test tao nhan vien moi
    test_create_employee_new_email(token)
    
    print("\n" + "=" * 60)
    print("HOAN THANH KIEM TRA CUOI CUNG")
    print("=" * 60)

if __name__ == "__main__":
    run_final_test()
