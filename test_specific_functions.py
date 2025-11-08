"""
Script kiểm tra các chức năng cụ thể
Test từng module và chức năng riêng biệt
"""

import os
import requests
import json
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()

# Cấu hình
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")
API_BASE_URL = "http://localhost:8000"

def test_employee_creation():
    """Test tạo nhân viên mới"""
    print("🔍 Test tạo nhân viên mới...")
    
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
        employee_data = {
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
        
        # Tạo nhân viên
        response = requests.post(f"{API_BASE_URL}/api/employees/", 
                               headers=headers, 
                               json=employee_data)
        
        if response.status_code == 200:
            print("✅ Tạo nhân viên thành công")
            employee = response.json()
            print(f"   - Employee Code: {employee.get('employee_code')}")
            print(f"   - Email: {employee.get('email')}")
            print(f"   - Role: {employee.get('user_role')}")
            return True
        else:
            print(f"❌ Lỗi tạo nhân viên: {response.status_code}")
            print(f"   - Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Lỗi test tạo nhân viên: {str(e)}")
        return False

def test_employee_update():
    """Test cập nhật nhân viên"""
    print("\n🔍 Test cập nhật nhân viên...")
    
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
        
        # Lấy danh sách employees
        response = requests.get(f"{API_BASE_URL}/api/employees/", headers=headers)
        
        if response.status_code == 200:
            employees = response.json()
            if employees:
                employee_id = employees[0]["id"]
                
                # Update data
                update_data = {
                    "first_name": "Updated",
                    "last_name": "Employee",
                    "phone": "0901000098",
                    "salary": 25000000
                }
                
                # Update employee
                update_response = requests.put(f"{API_BASE_URL}/api/employees/{employee_id}", 
                                             headers=headers, 
                                             json=update_data)
                
                if update_response.status_code == 200:
                    print("✅ Cập nhật nhân viên thành công")
                    return True
                else:
                    print(f"❌ Lỗi cập nhật nhân viên: {update_response.status_code}")
                    return False
            else:
                print("❌ Không có nhân viên nào để test")
                return False
        else:
            print(f"❌ Lỗi lấy danh sách nhân viên: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Lỗi test cập nhật nhân viên: {str(e)}")
        return False

def test_department_management():
    """Test quản lý phòng ban"""
    print("\n🔍 Test quản lý phòng ban...")
    
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
        
        # Test tạo phòng ban mới
        department_data = {
            "name": "Phòng Test",
            "code": "TEST",
            "description": "Phòng ban test"
        }
        
        response = requests.post(f"{API_BASE_URL}/api/employees/departments", 
                               headers=headers, 
                               json=department_data)
        
        if response.status_code == 200:
            print("✅ Tạo phòng ban thành công")
            return True
        else:
            print(f"❌ Lỗi tạo phòng ban: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Lỗi test phòng ban: {str(e)}")
        return False

def test_position_management():
    """Test quản lý chức vụ"""
    print("\n🔍 Test quản lý chức vụ...")
    
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
        
        # Test tạo chức vụ mới
        position_data = {
            "name": "Chức vụ Test",
            "code": "POS-TEST-001",
            "description": "Chức vụ test",
            "department_id": "dept-004",
            "salary_range_min": 15000000,
            "salary_range_max": 25000000
        }
        
        response = requests.post(f"{API_BASE_URL}/api/employees/positions", 
                               headers=headers, 
                               json=position_data)
        
        if response.status_code == 200:
            print("✅ Tạo chức vụ thành công")
            return True
        else:
            print(f"❌ Lỗi tạo chức vụ: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Lỗi test chức vụ: {str(e)}")
        return False

def test_role_permissions():
    """Test phân quyền theo role"""
    print("\n🔍 Test phân quyền theo role...")
    
    test_roles = [
        ("admin@test.com", "123456", "admin"),
        ("accountant@test.com", "123456", "accountant"),
        ("sales@test.com", "123456", "sales"),
        ("employee@test.com", "123456", "employee")
    ]
    
    for email, password, role in test_roles:
        try:
            print(f"   Testing role: {role}")
            
            # Login
            login_response = requests.post(f"{API_BASE_URL}/api/auth/login", json={
                "email": email,
                "password": password
            })
            
            if login_response.status_code == 200:
                token = login_response.json().get("access_token")
                headers = {"Authorization": f"Bearer {token}"}
                
                # Test access to employees
                response = requests.get(f"{API_BASE_URL}/api/employees/", headers=headers)
                
                if response.status_code == 200:
                    print(f"   ✅ {role}: Có quyền truy cập employees")
                elif response.status_code == 403:
                    print(f"   ❌ {role}: Không có quyền truy cập employees")
                else:
                    print(f"   ⚠️ {role}: Lỗi không xác định - {response.status_code}")
            else:
                print(f"   ❌ {role}: Không thể đăng nhập")
                
        except Exception as e:
            print(f"   ❌ Lỗi test role {role}: {str(e)}")

def test_database_operations():
    """Test các thao tác database"""
    print("\n🔍 Test các thao tác database...")
    
    try:
        supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
        
        # Test đếm records
        users_count = supabase.table("users").select("id", count="exact").execute()
        employees_count = supabase.table("employees").select("id", count="exact").execute()
        departments_count = supabase.table("departments").select("id", count="exact").execute()
        positions_count = supabase.table("positions").select("id", count="exact").execute()
        
        print(f"   📊 Users: {users_count.count}")
        print(f"   📊 Employees: {employees_count.count}")
        print(f"   📊 Departments: {departments_count.count}")
        print(f"   📊 Positions: {positions_count.count}")
        
        # Test join queries
        employees_with_details = supabase.table("employees")\
            .select("""
                *,
                departments(name, code),
                positions(name, code),
                users(role, is_active)
            """)\
            .limit(5)\
            .execute()
        
        if employees_with_details.data:
            print(f"   ✅ Join queries hoạt động - {len(employees_with_details.data)} records")
        else:
            print("   ❌ Join queries không hoạt động")
        
        return True
        
    except Exception as e:
        print(f"❌ Lỗi test database: {str(e)}")
        return False

def test_api_error_handling():
    """Test xử lý lỗi API"""
    print("\n🔍 Test xử lý lỗi API...")
    
    try:
        # Test invalid login
        response = requests.post(f"{API_BASE_URL}/api/auth/login", json={
            "email": "invalid@test.com",
            "password": "wrongpassword"
        })
        
        if response.status_code == 401:
            print("✅ Xử lý lỗi login không hợp lệ")
        else:
            print(f"❌ Không xử lý đúng lỗi login - {response.status_code}")
        
        # Test invalid token
        headers = {"Authorization": "Bearer invalid_token"}
        response = requests.get(f"{API_BASE_URL}/api/employees/", headers=headers)
        
        if response.status_code == 401:
            print("✅ Xử lý lỗi token không hợp lệ")
        else:
            print(f"❌ Không xử lý đúng lỗi token - {response.status_code}")
        
        return True
        
    except Exception as e:
        print(f"❌ Lỗi test error handling: {str(e)}")
        return False

def run_specific_tests():
    """Chạy các test cụ thể"""
    print("🚀 BẮT ĐẦU KIỂM TRA CÁC CHỨC NĂNG CỤ THỂ")
    print("=" * 60)
    
    # Test tạo nhân viên
    test_employee_creation()
    
    # Test cập nhật nhân viên
    test_employee_update()
    
    # Test quản lý phòng ban
    test_department_management()
    
    # Test quản lý chức vụ
    test_position_management()
    
    # Test phân quyền
    test_role_permissions()
    
    # Test database operations
    test_database_operations()
    
    # Test error handling
    test_api_error_handling()
    
    print("\n" + "=" * 60)
    print("🎉 HOÀN THÀNH KIỂM TRA CÁC CHỨC NĂNG CỤ THỂ")
    print("=" * 60)

if __name__ == "__main__":
    run_specific_tests()
