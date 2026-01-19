"""
Script để kiểm tra các tài khoản nhân viên đã được tạo trong Supabase
"""
import sys
import io
# Fix encoding cho Windows
if sys.stdout.encoding != 'utf-8':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

import os
import requests
from typing import List, Dict

# Load .env file
def load_env_file():
    """Load environment variables từ .env file"""
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

# Danh sách emails cần kiểm tra
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

def get_user_by_email(email: str) -> Dict:
    """Lấy user từ Supabase Auth theo email"""
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        return None
    
    try:
        admin_url = f"{SUPABASE_URL}/auth/v1/admin/users"
        headers = {
            "apikey": SUPABASE_SERVICE_KEY,
            "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}"
        }
        
        # List users và filter theo email
        response = requests.get(f"{admin_url}", headers=headers)
        if response.status_code == 200:
            users_data = response.json()
            users = users_data.get("users", [])
            
            # Tìm user có email khớp
            for user in users:
                if user.get("email", "").lower() == email.lower():
                    return {
                        "id": user.get("id"),
                        "email": user.get("email"),
                        "created_at": user.get("created_at"),
                        "user_metadata": user.get("user_metadata", {})
                    }
        return None
    except Exception as e:
        print(f"Error getting user {email}: {e}")
        return None


def get_user_from_users_table(user_id: str) -> Dict:
    """Lấy user từ bảng users (public schema)"""
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        return None
    
    try:
        supabase_url = f"{SUPABASE_URL}/rest/v1/users?id=eq.{user_id}&select=*"
        headers = {
            "apikey": SUPABASE_SERVICE_KEY,
            "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}"
        }
        
        response = requests.get(supabase_url, headers=headers)
        if response.status_code == 200:
            users = response.json()
            if users and len(users) > 0:
                return users[0]
        return None
    except Exception as e:
        return None


def get_employee_by_user_id(user_id: str) -> Dict:
    """Lấy employee từ bảng employees theo user_id"""
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        return None
    
    try:
        supabase_url = f"{SUPABASE_URL}/rest/v1/employees?user_id=eq.{user_id}&select=*"
        headers = {
            "apikey": SUPABASE_SERVICE_KEY,
            "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}"
        }
        
        response = requests.get(supabase_url, headers=headers)
        if response.status_code == 200:
            employees = response.json()
            if employees and len(employees) > 0:
                return employees[0]
        return None
    except Exception as e:
        return None


def check_all_employees():
    """Kiểm tra tất cả nhân viên"""
    print("=" * 140)
    print("KIỂM TRA TÀI KHOẢN NHÂN VIÊN ĐÃ TẠO")
    print("=" * 140)
    print()
    
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        print("❌ Lỗi: Chưa cấu hình Supabase credentials!")
        return
    
    results = []
    
    for email in EMPLOYEE_EMAILS:
        print(f"Đang kiểm tra: {email}...")
        
        # Lấy user từ auth.users
        auth_user = get_user_by_email(email)
        
        if auth_user:
            user_id = auth_user["id"]
            print(f"  ✅ User trong auth.users: {user_id}")
            
            # Kiểm tra trong bảng users (public)
            public_user = get_user_from_users_table(user_id)
            if public_user:
                print(f"  ✅ User trong bảng users: {public_user.get('full_name', 'N/A')}")
            else:
                print(f"  ⚠️  Chưa có trong bảng users")
            
            # Kiểm tra employee - thử theo user_id trước, sau đó theo email
            employee = get_employee_by_user_id(user_id)
            if not employee:
                # Thử tìm theo email
                try:
                    url = f"{SUPABASE_URL}/rest/v1/employees?email=eq.{email}&select=*"
                    headers = {
                        "apikey": SUPABASE_SERVICE_KEY,
                        "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}"
                    }
                    response = requests.get(url, headers=headers)
                    if response.status_code == 200:
                        employees = response.json()
                        if employees and len(employees) > 0:
                            employee = employees[0]
                except:
                    pass
            
            if employee:
                print(f"  ✅ Employee: {employee.get('employee_code', 'N/A')} - {employee.get('first_name', '')} {employee.get('last_name', '')}")
                results.append({
                    "email": email,
                    "user_id": user_id,
                    "auth_user": "✅",
                    "public_user": "✅" if public_user else "❌",
                    "employee": "✅",
                    "employee_code": employee.get("employee_code"),
                    "full_name": f"{employee.get('first_name', '')} {employee.get('last_name', '')}".strip(),
                    "status": "✅ Hoàn chỉnh" if public_user else "⚠️  Thiếu trong bảng users"
                })
            else:
                print(f"  ❌ Chưa có employee record")
                results.append({
                    "email": email,
                    "user_id": user_id,
                    "auth_user": "✅",
                    "public_user": "✅" if public_user else "❌",
                    "employee": "❌",
                    "employee_code": None,
                    "full_name": public_user.get("full_name", "N/A") if public_user else "N/A",
                    "status": "❌ Thiếu employee"
                })
        else:
            print(f"  ❌ Chưa có user trong auth.users")
            results.append({
                "email": email,
                "user_id": None,
                "auth_user": "❌",
                "public_user": "❌",
                "employee": "❌",
                "employee_code": None,
                "full_name": "N/A",
                "status": "❌ Chưa tạo"
            })
        print()
    
    # Hiển thị bảng tổng hợp
    print("=" * 140)
    print("BẢNG TỔNG HỢP TÀI KHOẢN")
    print("=" * 140)
    print()
    
    print(f"{'Email':<35} {'Auth User':<12} {'Public User':<13} {'Employee':<10} {'Employee Code':<15} {'Họ Tên':<20} {'Status':<30}")
    print("-" * 140)
    
    for result in results:
        user_id_display = result.get("user_id", "N/A")
        if user_id_display and len(str(user_id_display)) > 10:
            user_id_display = str(user_id_display)[:8] + "..."
        
        print(f"{result['email']:<35} {result['auth_user']:<12} {result['public_user']:<13} "
              f"{result['employee']:<10} {str(result.get('employee_code', 'N/A')):<15} "
              f"{result['full_name']:<20} {result['status']:<30}")
    
    print()
    print("=" * 140)
    
    # Thống kê
    complete = sum(1 for r in results if r["status"] == "✅ Hoàn chỉnh")
    partial = sum(1 for r in results if "⚠️" in r["status"])
    missing = sum(1 for r in results if "❌" in r["status"])
    
    print("THỐNG KÊ:")
    print(f"  ✅ Hoàn chỉnh (có đầy đủ): {complete}/8")
    print(f"  ⚠️  Thiếu một phần: {partial}/8")
    print(f"  ❌ Chưa tạo/Thiếu: {missing}/8")
    print("=" * 140)


if __name__ == "__main__":
    check_all_employees()
