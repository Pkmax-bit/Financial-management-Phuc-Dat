"""
Script để lấy và hiển thị thông tin đầy đủ của 8 nhân viên từ database
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

EMPLOYEE_EMAILS = [
    "kdtutien@gmail.com",
    "kdtuvu@gmail.com",
    "kdtudanh@gmail.com",
    "kdtunhien@gmail.com",
    "kdtutoai@gmail.com",
    "ketoanvan@gmail.com",
    "ketoanvy@gmail.com",
    "nhansulien@gmail.com"
]

def get_all_info():
    """Lấy tất cả thông tin từ database"""
    print("=" * 150)
    print("BẢNG THÔNG TIN ĐẦY ĐỦ 8 TÀI KHOẢN NHÂN VIÊN")
    print("=" * 150)
    print()
    
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        print("❌ Chưa cấu hình Supabase credentials!")
        return
    
    results = []
    
    for email in EMPLOYEE_EMAILS:
        # Lấy từ auth.users
        auth_url = f"{SUPABASE_URL}/auth/v1/admin/users"
        headers = {
            "apikey": SUPABASE_SERVICE_KEY,
            "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}"
        }
        
        auth_user = None
        try:
            response = requests.get(auth_url, headers=headers)
            if response.status_code == 200:
                users = response.json().get("users", [])
                for user in users:
                    if user.get("email", "").lower() == email.lower():
                        auth_user = user
                        break
        except:
            pass
        
        # Lấy từ bảng users (public)
        public_user = None
        if auth_user:
            try:
                user_id = auth_user.get("id")
                url = f"{SUPABASE_URL}/rest/v1/users?id=eq.{user_id}&select=*"
                response = requests.get(url, headers=headers)
                if response.status_code == 200:
                    users = response.json()
                    if users and len(users) > 0:
                        public_user = users[0]
            except:
                pass
        
        # Lấy employee
        employee = None
        if auth_user:
            try:
                user_id = auth_user.get("id")
                url = f"{SUPABASE_URL}/rest/v1/employees?user_id=eq.{user_id}&select=*"
                response = requests.get(url, headers=headers)
                if response.status_code == 200:
                    employees = response.json()
                    if employees and len(employees) > 0:
                        employee = employees[0]
            except:
                pass
        
        # Tìm employee theo email nếu không tìm thấy theo user_id
        if not employee and auth_user:
            try:
                url = f"{SUPABASE_URL}/rest/v1/employees?email=eq.{email}&select=*"
                response = requests.get(url, headers=headers)
                if response.status_code == 200:
                    employees = response.json()
                    if employees and len(employees) > 0:
                        employee = employees[0]
            except:
                pass
        
        # Tổng hợp thông tin
        if auth_user:
            user_id = auth_user.get("id")
            user_metadata = auth_user.get("user_metadata", {})
            full_name = user_metadata.get("full_name", public_user.get("full_name", "") if public_user else "")
            
            results.append({
                "email": email,
                "password": "123456",
                "user_id": user_id,
                "full_name": full_name,
                "auth_user": "✅",
                "public_user": "✅" if public_user else "❌",
                "employee": "✅" if employee else "❌",
                "employee_id": employee.get("id") if employee else None,
                "employee_code": employee.get("employee_code") if employee else None,
                "first_name": employee.get("first_name", "") if employee else "",
                "last_name": employee.get("last_name", "") if employee else "",
                "department": employee.get("department_id") if employee else None,
                "position": employee.get("position_id") if employee else None,
                "user_role": public_user.get("role") if public_user else user_metadata.get("role", "N/A"),
                "status": "✅ Hoàn chỉnh" if (public_user and employee) else ("⚠️  Thiếu một phần" if public_user or employee else "❌ Chưa đầy đủ")
            })
        else:
            results.append({
                "email": email,
                "password": "123456",
                "user_id": None,
                "full_name": "N/A",
                "auth_user": "❌",
                "public_user": "❌",
                "employee": "❌",
                "employee_id": None,
                "employee_code": None,
                "first_name": "",
                "last_name": "",
                "department": None,
                "position": None,
                "user_role": "N/A",
                "status": "❌ Chưa tạo"
            })
    
    # Hiển thị bảng
    print(f"{'STT':<5} {'Email':<35} {'Mật Khẩu':<10} {'Họ Tên':<20} {'User ID':<40} {'Employee Code':<15} {'Status':<30}")
    print("-" * 150)
    
    for idx, result in enumerate(results, 1):
        user_id_display = result.get("user_id", "N/A")
        if user_id_display and len(str(user_id_display)) > 35:
            user_id_display = str(user_id_display)[:32] + "..."
        
        full_name_display = result.get("full_name", "N/A")
        if len(full_name_display) > 18:
            full_name_display = full_name_display[:15] + "..."
        
        print(f"{idx:<5} {result['email']:<35} {result['password']:<10} {full_name_display:<20} "
              f"{str(user_id_display):<40} {str(result.get('employee_code', 'N/A')):<15} {result['status']:<30}")
    
    print()
    print("=" * 150)
    print("CHI TIẾT TỪNG TÀI KHOẢN:")
    print("=" * 150)
    print()
    
    for idx, result in enumerate(results, 1):
        print(f"STT {idx}: {result['email']}")
        print(f"  - Mật khẩu: {result['password']}")
        print(f"  - Họ tên: {result['full_name']}")
        print(f"  - User ID: {result.get('user_id', 'N/A')}")
        print(f"  - Auth User: {result['auth_user']}")
        print(f"  - Public User: {result['public_user']}")
        print(f"  - Employee: {result['employee']}")
        if result.get('employee_id'):
            print(f"  - Employee ID: {result['employee_id']}")
        if result.get('employee_code'):
            print(f"  - Employee Code: {result['employee_code']}")
        if result.get('first_name') or result.get('last_name'):
            print(f"  - Tên: {result.get('first_name', '')} {result.get('last_name', '')}".strip())
        print(f"  - User Role: {result.get('user_role', 'N/A')}")
        print(f"  - Status: {result['status']}")
        print()
    
    # Thống kê
    complete = sum(1 for r in results if r["status"] == "✅ Hoàn chỉnh")
    partial = sum(1 for r in results if "⚠️" in r["status"])
    missing = sum(1 for r in results if "❌" in r["status"])
    
    print("=" * 150)
    print("THỐNG KÊ:")
    print(f"  ✅ Hoàn chỉnh: {complete}/8")
    print(f"  ⚠️  Thiếu một phần: {partial}/8")
    print(f"  ❌ Chưa đầy đủ: {missing}/8")
    print("=" * 150)

if __name__ == "__main__":
    get_all_info()
