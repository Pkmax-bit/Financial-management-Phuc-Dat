"""
Script để hiển thị bảng thông tin đầy đủ 8 nhân viên đã tạo
"""
import sys
import io
if sys.stdout.encoding != 'utf-8':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

import os
import requests
from typing import List, Dict

# Load .env
def load_env_file():
    env_file = os.path.join(os.path.dirname(__file__), "..", "backend", ".env")
    if os.path.exists(env_file):
        with open(env_file, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, value = line.split('=', 1)
                    os.environ[key.strip()] = value.strip().strip('"').strip("'")

load_env_file()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_SERVICE_KEY")

# Mapping email với thông tin
EMPLOYEE_MAPPING = {
    "kdtutien@gmail.com": {"stt": 1, "bo_phan": "KD", "ten": "Tủ Tiển", "user_role": "sales", "project_role": "member", "chuc_vu": "Thành viên"},
    "kdtuvu@gmail.com": {"stt": 2, "bo_phan": "KD", "ten": "Tủ Vũ", "user_role": "sales", "project_role": "member", "chuc_vu": "Thành viên"},
    "kdtudanh@gmail.com": {"stt": 3, "bo_phan": "KD", "ten": "Tủ Danh", "user_role": "sales", "project_role": "member", "chuc_vu": "Thành viên"},
    "kdtunhien@gmail.com": {"stt": 4, "bo_phan": "KD", "ten": "Tủ Nhiên", "user_role": "sales", "project_role": "member", "chuc_vu": "Thành viên"},
    "kdtutoai@gmail.com": {"stt": 5, "bo_phan": "KD", "ten": "Tủ Toại", "user_role": "sales", "project_role": "member", "chuc_vu": "Thành viên"},
    "ketoanvan@gmail.com": {"stt": 6, "bo_phan": "Kế toán", "ten": "Vân", "user_role": "accountant", "project_role": "lead", "chuc_vu": "Trưởng nhóm"},
    "ketoanvy@gmail.com": {"stt": 7, "bo_phan": "Kế toán", "ten": "Vy", "user_role": "accountant", "project_role": "member", "chuc_vu": "Thành viên"},
    "nhansulien@gmail.com": {"stt": 8, "bo_phan": "Nhân sự", "ten": "Liên", "user_role": "hr_manager", "project_role": "admin", "chuc_vu": "Quản lý nhân sự"}
}

def get_all_employees_info():
    """Lấy tất cả thông tin và hiển thị bảng"""
    print("=" * 160)
    print("BẢNG THÔNG TIN 8 TÀI KHOẢN NHÂN VIÊN ĐÃ TẠO")
    print("=" * 160)
    print()
    
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        print("⚠️  DEMO MODE: Hiển thị preview (chưa có Supabase credentials)")
        print()
        # Hiển thị preview
        print(f"{'STT':<5} {'Bộ Phận':<15} {'Họ Tên':<20} {'Email':<35} {'Mật Khẩu':<10} {'User Role':<15} {'Project Role':<15} {'Chức Vụ':<20}")
        print("-" * 160)
        for email, info in EMPLOYEE_MAPPING.items():
            print(f"{info['stt']:<5} {info['bo_phan']:<15} {info['ten']:<20} {email:<35} {'123456':<10} "
                  f"{info['user_role']:<15} {info['project_role']:<15} {info['chuc_vu']:<20}")
        return
    
    headers = {
        "apikey": SUPABASE_SERVICE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}"
    }
    
    results = []
    
    # Lấy tất cả users từ auth
    auth_url = f"{SUPABASE_URL}/auth/v1/admin/users"
    auth_users_map = {}
    try:
        response = requests.get(auth_url, headers=headers)
        if response.status_code == 200:
            users = response.json().get("users", [])
            for user in users:
                email = user.get("email", "").lower()
                auth_users_map[email] = user
    except:
        pass
    
    # Lấy tất cả employees
    employees_url = f"{SUPABASE_URL}/rest/v1/employees?select=*"
    employees_map = {}
    try:
        response = requests.get(employees_url, headers=headers)
        if response.status_code == 200:
            employees = response.json()
            for emp in employees:
                email = emp.get("email", "").lower()
                employees_map[email] = emp
    except:
        pass
    
    # Lấy tất cả users từ public.users
    public_users_url = f"{SUPABASE_URL}/rest/v1/users?select=*"
    public_users_map = {}
    try:
        response = requests.get(public_users_url, headers=headers)
        if response.status_code == 200:
            users = response.json()
            for user in users:
                user_id = user.get("id")
                public_users_map[user_id] = user
    except:
        pass
    
    # Tổng hợp thông tin
    for email, info in EMPLOYEE_MAPPING.items():
        auth_user = auth_users_map.get(email.lower())
        employee = employees_map.get(email.lower())
        public_user = None
        
        if auth_user:
            user_id = auth_user.get("id")
            public_user = public_users_map.get(user_id)
        
        results.append({
            "stt": info["stt"],
            "bo_phan": info["bo_phan"],
            "ten": info["ten"],
            "email": email,
            "password": "123456",
            "user_id": auth_user.get("id") if auth_user else None,
            "employee_id": employee.get("id") if employee else None,
            "employee_code": employee.get("employee_code") if employee else None,
            "first_name": employee.get("first_name", "") if employee else "",
            "last_name": employee.get("last_name", "") if employee else "",
            "user_role": info["user_role"],
            "project_role": info["project_role"],
            "chuc_vu": info["chuc_vu"],
            "auth_user": "✅" if auth_user else "❌",
            "public_user": "✅" if public_user else "❌",
            "employee": "✅" if employee else "❌"
        })
    
    # Sắp xếp theo STT
    results.sort(key=lambda x: x["stt"])
    
    # Hiển thị bảng chính
    print(f"{'STT':<5} {'Bộ Phận':<15} {'Họ Tên':<20} {'Email':<35} {'Mật Khẩu':<10} {'User Role':<15} {'Project Role':<15} {'Chức Vụ':<20} {'Status':<15}")
    print("-" * 160)
    
    for result in results:
        status = "✅" if (result["auth_user"] == "✅" and result["public_user"] == "✅" and result["employee"] == "✅") else "⚠️"
        
        print(f"{result['stt']:<5} {result['bo_phan']:<15} {result['ten']:<20} {result['email']:<35} "
              f"{result['password']:<10} {result['user_role']:<15} {result['project_role']:<15} "
              f"{result['chuc_vu']:<20} {status:<15}")
    
    print()
    print("=" * 160)
    print("CHI TIẾT TỪNG TÀI KHOẢN:")
    print("=" * 160)
    print()
    
    for result in results:
        print(f"STT {result['stt']}: {result['ten']}")
        print(f"  - Bộ phận: {result['bo_phan']}")
        print(f"  - Email: {result['email']}")
        print(f"  - Mật khẩu: {result['password']}")
        if result.get('user_id'):
            print(f"  - User ID: {result['user_id']}")
        if result.get('employee_id'):
            print(f"  - Employee ID: {result['employee_id']}")
        if result.get('employee_code'):
            print(f"  - Employee Code: {result['employee_code']}")
        print(f"  - User Role: {result['user_role']}")
        print(f"  - Project Role: {result['project_role']}")
        print(f"  - Chức vụ: {result['chuc_vu']}")
        print(f"  - Auth User: {result['auth_user']}")
        print(f"  - Public User: {result['public_user']}")
        print(f"  - Employee: {result['employee']}")
        print()
    
    # Thống kê
    complete = sum(1 for r in results if r["auth_user"] == "✅" and r["public_user"] == "✅" and r["employee"] == "✅")
    
    print("=" * 160)
    print(f"THỐNG KÊ: {complete}/8 tài khoản hoàn chỉnh")
    print("=" * 160)

if __name__ == "__main__":
    get_all_employees_info()
