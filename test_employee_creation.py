"""
Script test tạo nhân viên
Kiểm tra chức năng tạo nhân viên với các trường hợp khác nhau
"""

import requests
import json

API_BASE_URL = "http://localhost:8000"

def test_employee_creation():
    """Test tạo nhân viên"""
    print("Test tao nhan vien...")
    
    try:
        # Login để lấy token
        login_response = requests.post(f"{API_BASE_URL}/api/auth/login", json={
            "email": "admin@test.com",
            "password": "123456"
        })
        
        if login_response.status_code != 200:
            print("❌ Không thể đăng nhập")
            return False
        
        token = login_response.json().get("access_token")
        headers = {"Authorization": f"Bearer {token}"}
        
        # Test data cho nhân viên mới
        test_cases = [
            {
                "name": "Tạo nhân viên mới",
                "data": {
                    "first_name": "Test",
                    "last_name": "Employee",
                    "email": "test.employee.new@company.com",
                    "phone": "0901000099",
                    "department_id": "dept-004",  # Công nghệ
                    "position_id": "pos-008",    # Lập trình viên
                    "hire_date": "2024-01-01",
                    "salary": 20000000,
                    "user_role": "employee"
                }
            },
            {
                "name": "Tạo nhân viên với email đã tồn tại",
                "data": {
                    "first_name": "Test",
                    "last_name": "Employee",
                    "email": "admin@test.com",  # Email đã tồn tại
                    "phone": "0901000098",
                    "department_id": "dept-001",
                    "position_id": "pos-001",
                    "hire_date": "2024-01-01",
                    "salary": 30000000,
                    "user_role": "admin"
                }
            },
            {
                "name": "Tạo nhân viên với role khác",
                "data": {
                    "first_name": "Test",
                    "last_name": "Sales",
                    "email": "test.sales.new@company.com",
                    "phone": "0901000097",
                    "department_id": "dept-003",  # Kinh doanh
                    "position_id": "pos-006",    # Nhân viên kinh doanh
                    "hire_date": "2024-01-01",
                    "salary": 15000000,
                    "user_role": "sales"
                }
            }
        ]
        
        for i, test_case in enumerate(test_cases, 1):
            print(f"\n📝 Test {i}: {test_case['name']}")
            
            try:
                response = requests.post(f"{API_BASE_URL}/api/employees/", 
                                       headers=headers, 
                                       json=test_case['data'])
                
                if response.status_code == 200:
                    employee = response.json()
                    print(f"Thanh cong")
                    print(f"   - Employee Code: {employee.get('employee_code')}")
                    print(f"   - Email: {employee.get('email')}")
                    print(f"   - Role: {employee.get('user_role')}")
                    print(f"   - Department: {employee.get('department', {}).get('name', 'N/A')}")
                    print(f"   - Position: {employee.get('position', {}).get('name', 'N/A')}")
                else:
                    print(f"That bai: {response.status_code}")
                    try:
                        error_data = response.json()
                        print(f"   - Error: {error_data.get('detail', 'Unknown error')}")
                    except:
                        print(f"   - Response: {response.text}")
                        
            except Exception as e:
                print(f"❌ Lỗi: {str(e)}")
        
        return True
        
    except Exception as e:
        print(f"❌ Lỗi test tạo nhân viên: {str(e)}")
        return False

def test_employee_validation():
    """Test validation khi tạo nhân viên"""
    print("\n🔍 Test validation tạo nhân viên...")
    
    try:
        # Login
        login_response = requests.post(f"{API_BASE_URL}/api/auth/login", json={
            "email": "admin@test.com",
            "password": "123456"
        })
        
        if login_response.status_code != 200:
            print("❌ Không thể đăng nhập")
            return False
        
        token = login_response.json().get("access_token")
        headers = {"Authorization": f"Bearer {token}"}
        
        # Test cases với dữ liệu không hợp lệ
        invalid_cases = [
            {
                "name": "Thiếu first_name",
                "data": {
                    "last_name": "Test",
                    "email": "test@company.com",
                    "hire_date": "2024-01-01",
                    "user_role": "employee"
                }
            },
            {
                "name": "Email không hợp lệ",
                "data": {
                    "first_name": "Test",
                    "last_name": "Test",
                    "email": "invalid-email",
                    "hire_date": "2024-01-01",
                    "user_role": "employee"
                }
            },
            {
                "name": "Role không hợp lệ",
                "data": {
                    "first_name": "Test",
                    "last_name": "Test",
                    "email": "test@company.com",
                    "hire_date": "2024-01-01",
                    "user_role": "invalid_role"
                }
            }
        ]
        
        for i, test_case in enumerate(invalid_cases, 1):
            print(f"\n📝 Test validation {i}: {test_case['name']}")
            
            try:
                response = requests.post(f"{API_BASE_URL}/api/employees/", 
                                       headers=headers, 
                                       json=test_case['data'])
                
                if response.status_code == 422:  # Validation error
                    print(f"✅ Validation hoạt động đúng")
                    try:
                        error_data = response.json()
                        print(f"   - Validation errors: {error_data.get('detail', 'Unknown')}")
                    except:
                        print(f"   - Response: {response.text}")
                else:
                    print(f"❌ Validation không hoạt động: {response.status_code}")
                    
            except Exception as e:
                print(f"❌ Lỗi: {str(e)}")
        
        return True
        
    except Exception as e:
        print(f"❌ Lỗi test validation: {str(e)}")
        return False

def test_employee_list():
    """Test lấy danh sách nhân viên"""
    print("\n🔍 Test lấy danh sách nhân viên...")
    
    try:
        # Login
        login_response = requests.post(f"{API_BASE_URL}/api/auth/login", json={
            "email": "admin@test.com",
            "password": "123456"
        })
        
        if login_response.status_code != 200:
            print("❌ Không thể đăng nhập")
            return False
        
        token = login_response.json().get("access_token")
        headers = {"Authorization": f"Bearer {token}"}
        
        # Test GET employees
        response = requests.get(f"{API_BASE_URL}/api/employees/", headers=headers)
        
        if response.status_code == 200:
            employees = response.json()
            print(f"✅ Lấy danh sách nhân viên thành công")
            print(f"   - Số lượng: {len(employees)}")
            
            if employees:
                employee = employees[0]
                print(f"   - Employee đầu tiên:")
                print(f"     + Code: {employee.get('employee_code')}")
                print(f"     + Name: {employee.get('first_name')} {employee.get('last_name')}")
                print(f"     + Email: {employee.get('email')}")
                print(f"     + Role: {employee.get('user_role')}")
        else:
            print(f"❌ Lỗi lấy danh sách: {response.status_code}")
            return False
        
        return True
        
    except Exception as e:
        print(f"❌ Lỗi test danh sách nhân viên: {str(e)}")
        return False

def run_employee_tests():
    """Chạy tất cả test nhân viên"""
    print("KIEM TRA CHUC NANG NHAN VIEN")
    print("=" * 50)
    
    # Test tạo nhân viên
    test_employee_creation()
    
    # Test validation
    test_employee_validation()
    
    # Test lấy danh sách
    test_employee_list()
    
    print("\n" + "=" * 50)
    print("HOAN THANH KIEM TRA CHUC NANG NHAN VIEN")
    print("=" * 50)

if __name__ == "__main__":
    run_employee_tests()
