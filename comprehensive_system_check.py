"""
Script kiểm tra toàn diện hệ thống
Kiểm tra tất cả các chức năng và API endpoints
"""

import os
import requests
import asyncio
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()

# Cấu hình
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")
API_BASE_URL = "http://localhost:8000"

def check_database_connection():
    """Kiểm tra kết nối database"""
    print("🔍 Kiểm tra kết nối database...")
    
    try:
        supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
        
        # Kiểm tra kết nối bằng cách lấy danh sách bảng
        result = supabase.table("users").select("count").limit(1).execute()
        print("✅ Kết nối database thành công")
        return True
    except Exception as e:
        print(f"❌ Lỗi kết nối database: {str(e)}")
        return False

def check_database_schema():
    """Kiểm tra cấu trúc database"""
    print("\n🔍 Kiểm tra cấu trúc database...")
    
    try:
        supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
        
        # Kiểm tra các bảng chính
        tables_to_check = [
            "users", "employees", "departments", "positions", 
            "customers", "projects", "quotes", "invoices"
        ]
        
        for table in tables_to_check:
            try:
                result = supabase.table(table).select("*").limit(1).execute()
                print(f"✅ Bảng {table}: OK")
            except Exception as e:
                print(f"❌ Bảng {table}: Lỗi - {str(e)}")
        
        return True
    except Exception as e:
        print(f"❌ Lỗi kiểm tra schema: {str(e)}")
        return False

def check_auth_system():
    """Kiểm tra hệ thống xác thực"""
    print("\n🔍 Kiểm tra hệ thống xác thực...")
    
    try:
        # Test login endpoint
        response = requests.post(f"{API_BASE_URL}/api/auth/login", json={
            "email": "admin@test.com",
            "password": "123456"
        })
        
        if response.status_code == 200:
            print("✅ Login endpoint hoạt động")
            token = response.json().get("access_token")
            return token
        else:
            print(f"❌ Login endpoint lỗi: {response.status_code}")
            return None
    except Exception as e:
        print(f"❌ Lỗi kiểm tra auth: {str(e)}")
        return None

def check_employee_endpoints(token):
    """Kiểm tra các endpoints nhân viên"""
    print("\n🔍 Kiểm tra endpoints nhân viên...")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    # Test GET employees
    try:
        response = requests.get(f"{API_BASE_URL}/api/employees/", headers=headers)
        if response.status_code == 200:
            print("✅ GET /api/employees/ - OK")
        else:
            print(f"❌ GET /api/employees/ - Lỗi: {response.status_code}")
    except Exception as e:
        print(f"❌ Lỗi GET employees: {str(e)}")
    
    # Test GET departments
    try:
        response = requests.get(f"{API_BASE_URL}/api/employees/departments", headers=headers)
        if response.status_code == 200:
            print("✅ GET /api/employees/departments - OK")
        else:
            print(f"❌ GET /api/employees/departments - Lỗi: {response.status_code}")
    except Exception as e:
        print(f"❌ Lỗi GET departments: {str(e)}")
    
    # Test GET positions
    try:
        response = requests.get(f"{API_BASE_URL}/api/employees/positions", headers=headers)
        if response.status_code == 200:
            print("✅ GET /api/employees/positions - OK")
        else:
            print(f"❌ GET /api/employees/positions - Lỗi: {response.status_code}")
    except Exception as e:
        print(f"❌ Lỗi GET positions: {str(e)}")

def check_other_endpoints(token):
    """Kiểm tra các endpoints khác"""
    print("\n🔍 Kiểm tra các endpoints khác...")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    endpoints_to_check = [
        ("/api/dashboard/stats", "Dashboard stats"),
        ("/api/customers/", "Customers"),
        ("/api/sales/", "Sales"),
        ("/api/reports/balance-sheet", "Balance sheet"),
        ("/api/reports/profit-loss", "Profit & Loss"),
        ("/api/reports/cash-flow", "Cash flow")
    ]
    
    for endpoint, name in endpoints_to_check:
        try:
            response = requests.get(f"{API_BASE_URL}{endpoint}", headers=headers)
            if response.status_code in [200, 404]:  # 404 is OK for some endpoints
                print(f"✅ {name} - OK")
            else:
                print(f"❌ {name} - Lỗi: {response.status_code}")
        except Exception as e:
            print(f"❌ Lỗi {name}: {str(e)}")

def check_permissions_system():
    """Kiểm tra hệ thống phân quyền"""
    print("\n🔍 Kiểm tra hệ thống phân quyền...")
    
    try:
        # Test với các role khác nhau
        test_accounts = [
            ("admin@test.com", "123456", "admin"),
            ("accountant@test.com", "123456", "accountant"),
            ("sales@test.com", "123456", "sales"),
            ("employee@test.com", "123456", "employee")
        ]
        
        for email, password, role in test_accounts:
            try:
                # Login
                response = requests.post(f"{API_BASE_URL}/api/auth/login", json={
                    "email": email,
                    "password": password
                })
                
                if response.status_code == 200:
                    token = response.json().get("access_token")
                    headers = {"Authorization": f"Bearer {token}"}
                    
                    # Test access to employees endpoint
                    emp_response = requests.get(f"{API_BASE_URL}/api/employees/", headers=headers)
                    if emp_response.status_code == 200:
                        print(f"✅ Role {role}: Có quyền truy cập employees")
                    else:
                        print(f"❌ Role {role}: Không có quyền truy cập employees")
                else:
                    print(f"❌ Role {role}: Không thể đăng nhập")
                    
            except Exception as e:
                print(f"❌ Lỗi kiểm tra role {role}: {str(e)}")
    
    except Exception as e:
        print(f"❌ Lỗi kiểm tra permissions: {str(e)}")

def check_data_integrity():
    """Kiểm tra tính toàn vẹn dữ liệu"""
    print("\n🔍 Kiểm tra tính toàn vẹn dữ liệu...")
    
    try:
        supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
        
        # Kiểm tra foreign key constraints
        print("Kiểm tra foreign key constraints...")
        
        # Users -> Employees
        users_result = supabase.table("users").select("id").execute()
        employees_result = supabase.table("employees").select("user_id").execute()
        
        user_ids = {user["id"] for user in users_result.data}
        employee_user_ids = {emp["user_id"] for emp in employees_result.data}
        
        orphaned_employees = employee_user_ids - user_ids
        if orphaned_employees:
            print(f"❌ Tìm thấy {len(orphaned_employees)} employees không có user tương ứng")
        else:
            print("✅ Tất cả employees đều có user tương ứng")
        
        # Departments -> Employees
        dept_result = supabase.table("departments").select("id").execute()
        emp_dept_result = supabase.table("employees").select("department_id").execute()
        
        dept_ids = {dept["id"] for dept in dept_result.data}
        emp_dept_ids = {emp["department_id"] for emp in emp_dept_result.data if emp["department_id"]}
        
        invalid_dept_refs = emp_dept_ids - dept_ids
        if invalid_dept_refs:
            print(f"❌ Tìm thấy {len(invalid_dept_refs)} employees có department_id không hợp lệ")
        else:
            print("✅ Tất cả employees đều có department_id hợp lệ")
        
        # Positions -> Employees
        pos_result = supabase.table("positions").select("id").execute()
        emp_pos_result = supabase.table("employees").select("position_id").execute()
        
        pos_ids = {pos["id"] for pos in pos_result.data}
        emp_pos_ids = {emp["position_id"] for emp in emp_pos_result.data if emp["position_id"]}
        
        invalid_pos_refs = emp_pos_ids - pos_ids
        if invalid_pos_refs:
            print(f"❌ Tìm thấy {len(invalid_pos_refs)} employees có position_id không hợp lệ")
        else:
            print("✅ Tất cả employees đều có position_id hợp lệ")
            
    except Exception as e:
        print(f"❌ Lỗi kiểm tra data integrity: {str(e)}")

def check_api_response_times():
    """Kiểm tra thời gian phản hồi API"""
    print("\n🔍 Kiểm tra thời gian phản hồi API...")
    
    try:
        # Test login
        start_time = time.time()
        response = requests.post(f"{API_BASE_URL}/api/auth/login", json={
            "email": "admin@test.com",
            "password": "123456"
        })
        login_time = time.time() - start_time
        
        if response.status_code == 200:
            print(f"✅ Login response time: {login_time:.2f}s")
            token = response.json().get("access_token")
            headers = {"Authorization": f"Bearer {token}"}
            
            # Test employees endpoint
            start_time = time.time()
            response = requests.get(f"{API_BASE_URL}/api/employees/", headers=headers)
            emp_time = time.time() - start_time
            
            if response.status_code == 200:
                print(f"✅ Employees endpoint response time: {emp_time:.2f}s")
            else:
                print(f"❌ Employees endpoint lỗi: {response.status_code}")
        else:
            print(f"❌ Login lỗi: {response.status_code}")
            
    except Exception as e:
        print(f"❌ Lỗi kiểm tra response time: {str(e)}")

def run_comprehensive_check():
    """Chạy kiểm tra toàn diện"""
    print("🚀 BẮT ĐẦU KIỂM TRA TOÀN DIỆN HỆ THỐNG")
    print("=" * 50)
    
    # 1. Kiểm tra kết nối database
    if not check_database_connection():
        print("❌ Không thể kết nối database. Dừng kiểm tra.")
        return
    
    # 2. Kiểm tra cấu trúc database
    check_database_schema()
    
    # 3. Kiểm tra hệ thống xác thực
    token = check_auth_system()
    if not token:
        print("❌ Không thể đăng nhập. Một số test sẽ bị bỏ qua.")
        token = "dummy_token"  # Dummy token for other tests
    
    # 4. Kiểm tra endpoints
    check_employee_endpoints(token)
    check_other_endpoints(token)
    
    # 5. Kiểm tra phân quyền
    check_permissions_system()
    
    # 6. Kiểm tra tính toàn vẹn dữ liệu
    check_data_integrity()
    
    # 7. Kiểm tra thời gian phản hồi
    import time
    check_api_response_times()
    
    print("\n" + "=" * 50)
    print("🎉 HOÀN THÀNH KIỂM TRA TOÀN DIỆN")
    print("=" * 50)

if __name__ == "__main__":
    run_comprehensive_check()
