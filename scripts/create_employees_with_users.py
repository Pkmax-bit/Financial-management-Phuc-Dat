"""
Script để tạo 8 nhân viên với tài khoản user trong Supabase
Mật khẩu mặc định: 123456
"""
import sys
import io
# Fix encoding cho Windows
if sys.stdout.encoding != 'utf-8':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

import os
import requests
import json
from typing import List, Dict
from datetime import datetime
import unicodedata
import re

# Định nghĩa lại các hàm và data từ preview script
EMPLOYEES_DATA = [
    {
        "stt": 1,
        "bo_phan": "KD",
        "ten_nhan_vien": "Tủ Tiển",
        "user_role": "sales",
        "project_role": "member",
        "chuc_vu": "Thành viên"
    },
    {
        "stt": 2,
        "bo_phan": "KD",
        "ten_nhan_vien": "Tủ Vũ",
        "user_role": "sales",
        "project_role": "member",
        "chuc_vu": "Thành viên"
    },
    {
        "stt": 3,
        "bo_phan": "KD",
        "ten_nhan_vien": "Tủ Danh",
        "user_role": "sales",
        "project_role": "member",
        "chuc_vu": "Thành viên"
    },
    {
        "stt": 4,
        "bo_phan": "KD",
        "ten_nhan_vien": "Tủ Nhiên",
        "user_role": "sales",
        "project_role": "member",
        "chuc_vu": "Thành viên"
    },
    {
        "stt": 5,
        "bo_phan": "KD",
        "ten_nhan_vien": "Tủ Toại",
        "user_role": "sales",
        "project_role": "member",
        "chuc_vu": "Thành viên"
    },
    {
        "stt": 6,
        "bo_phan": "Kế toán",
        "ten_nhan_vien": "Vân",
        "user_role": "accountant",
        "project_role": "lead",
        "chuc_vu": "Trưởng nhóm"
    },
    {
        "stt": 7,
        "bo_phan": "Kế toán",
        "ten_nhan_vien": "Vy",
        "user_role": "accountant",
        "project_role": "member",
        "chuc_vu": "Thành viên"
    },
    {
        "stt": 8,
        "bo_phan": "Nhân sự",
        "ten_nhan_vien": "Liên",
        "user_role": "admin",
        "project_role": "admin",
        "chuc_vu": "Quản trị viên"
    }
]


def normalize_name(name: str) -> str:
    """Chuẩn hóa tên để tạo email"""
    name = unicodedata.normalize('NFD', name)
    name = ''.join(c for c in name if unicodedata.category(c) != 'Mn')
    name = name.lower().strip()
    name = re.sub(r'\s+', '', name)
    return name


def normalize_department(dept: str) -> str:
    """Chuẩn hóa tên bộ phận để tạo email"""
    dept = unicodedata.normalize('NFD', dept)
    dept = ''.join(c for c in dept if unicodedata.category(c) != 'Mn')
    dept = dept.lower().strip()
    dept = re.sub(r'\s+', '', dept)
    return dept


def generate_email(bo_phan: str, ten_nhan_vien: str) -> str:
    """Tạo email theo format: Bộ phận + tên nhân viên + @gmail.com"""
    dept_normalized = normalize_department(bo_phan)
    name_normalized = normalize_name(ten_nhan_vien)
    email = f"{dept_normalized}{name_normalized}@gmail.com"
    return email


def split_name(full_name: str) -> tuple:
    """Tách tên thành first_name và last_name"""
    parts = full_name.strip().split()
    if len(parts) == 1:
        return "", parts[0]
    elif len(parts) == 2:
        return parts[0], parts[1]
    else:
        return " ".join(parts[:-1]), parts[-1]

# Lấy thông tin Supabase từ environment variables hoặc .env file
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

# Load .env file nếu có
load_env_file()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_SERVICE_KEY")

# Demo mode nếu không có credentials
DEMO_MODE = not (SUPABASE_URL and SUPABASE_SERVICE_KEY)

if DEMO_MODE:
    print("⚠️  DEMO MODE: Chưa có Supabase credentials")
    print("   Script sẽ hiển thị preview bảng thông tin")
    print("   Để tạo thực tế, vui lòng set:")
    print("   - SUPABASE_URL")
    print("   - SUPABASE_SERVICE_ROLE_KEY")
    print()


def get_user_by_email(email: str) -> Dict:
    """Lấy user theo email nếu đã tồn tại"""
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        return None
    
    try:
        admin_url = f"{SUPABASE_URL}/auth/v1/admin/users"
        headers = {
            "apikey": SUPABASE_SERVICE_KEY,
            "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}"
        }
        
        # List tất cả users và tìm theo email (vì filter query có thể không hoạt động)
        response = requests.get(admin_url, headers=headers)
        if response.status_code == 200:
            users_data = response.json()
            users = users_data.get("users", [])
            
            # Tìm user có email khớp chính xác
            for user in users:
                user_email = user.get("email", "").lower().strip()
                if user_email == email.lower().strip():
                    return {
                        "success": True,
                        "user_id": user.get("id"),
                        "email": user.get("email"),
                        "exists": True
                    }
        return None
    except Exception as e:
        print(f"  ⚠️  Error getting user by email: {e}")
        return None


def create_user_in_supabase(email: str, password: str, full_name: str, role: str) -> Dict:
    """Tạo user trong Supabase Auth hoặc lấy user đã tồn tại"""
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        return {"error": "Supabase credentials not configured"}
    
    # Kiểm tra xem user đã tồn tại chưa
    existing_user = get_user_by_email(email)
    if existing_user:
        return {
            "success": True,
            "user_id": existing_user["user_id"],
            "email": existing_user["email"],
            "exists": True,
            "message": "User already exists"
        }
    
    try:
        admin_url = f"{SUPABASE_URL}/auth/v1/admin/users"
        headers = {
            "apikey": SUPABASE_SERVICE_KEY,
            "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
            "Content-Type": "application/json"
        }
        
        user_data = {
            "email": email,
            "password": password,
            "email_confirm": True,  # Tự động confirm email
            "user_metadata": {
                "full_name": full_name,
                "role": role
            }
        }
        
        response = requests.post(admin_url, headers=headers, json=user_data)
        
        if response.status_code in [200, 201]:
            user = response.json()
            return {
                "success": True,
                "user_id": user.get("id"),
                "email": user.get("email"),
                "created_at": user.get("created_at"),
                "exists": False
            }
        else:
            error_text = response.text
            # Nếu user đã tồn tại, thử lấy lại
            if "already registered" in error_text.lower() or "already exists" in error_text.lower() or "email_exists" in error_text.lower():
                existing_user = get_user_by_email(email)
                if existing_user:
                    return {
                        "success": True,
                        "user_id": existing_user["user_id"],
                        "email": existing_user["email"],
                        "exists": True,
                        "message": "User already exists, retrieved existing user"
                    }
            return {
                "success": False,
                "error": error_text,
                "status_code": response.status_code
            }
            
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }


def get_or_create_department(department_name: str) -> str:
    """Lấy hoặc tạo department và trả về department_id"""
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        return None
    
    try:
        # Tìm department theo tên
        supabase_url = f"{SUPABASE_URL}/rest/v1/departments?name=eq.{department_name}&select=id"
        headers = {
            "apikey": SUPABASE_SERVICE_KEY,
            "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}"
        }
        
        response = requests.get(supabase_url, headers=headers)
        if response.status_code == 200:
            departments = response.json()
            if departments and len(departments) > 0:
                return departments[0]["id"]
        
        # Nếu không tìm thấy, tạo mới
        supabase_url = f"{SUPABASE_URL}/rest/v1/departments"
        headers = {
            "apikey": SUPABASE_SERVICE_KEY,
            "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
            "Content-Type": "application/json",
            "Prefer": "return=representation"
        }
        
        dept_data = {
            "name": department_name,
            "description": f"Bộ phận {department_name}"
        }
        
        response = requests.post(supabase_url, headers=headers, json=dept_data)
        if response.status_code in [200, 201]:
            dept = response.json()
            if isinstance(dept, list) and len(dept) > 0:
                return dept[0]["id"]
            return dept.get("id")
        
        return None
    except Exception as e:
        print(f"  ⚠️  Error getting/creating department: {e}")
        return None


def get_or_create_position(position_name: str) -> str:
    """Lấy hoặc tạo position và trả về position_id"""
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        return None
    
    try:
        # Tìm position theo tên
        supabase_url = f"{SUPABASE_URL}/rest/v1/positions?name=eq.{position_name}&select=id"
        headers = {
            "apikey": SUPABASE_SERVICE_KEY,
            "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}"
        }
        
        response = requests.get(supabase_url, headers=headers)
        if response.status_code == 200:
            positions = response.json()
            if positions and len(positions) > 0:
                return positions[0]["id"]
        
        # Nếu không tìm thấy, tạo mới
        supabase_url = f"{SUPABASE_URL}/rest/v1/positions"
        headers = {
            "apikey": SUPABASE_SERVICE_KEY,
            "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
            "Content-Type": "application/json",
            "Prefer": "return=representation"
        }
        
        pos_data = {
            "name": position_name,
            "description": f"Chức vụ {position_name}"
        }
        
        response = requests.post(supabase_url, headers=headers, json=pos_data)
        if response.status_code in [200, 201]:
            pos = response.json()
            if isinstance(pos, list) and len(pos) > 0:
                return pos[0]["id"]
            return pos.get("id")
        
        return None
    except Exception as e:
        print(f"  ⚠️  Error getting/creating position: {e}")
        return None


def generate_employee_code(first_name: str, last_name: str, stt: int) -> str:
    """Tạo employee code"""
    import random
    import string
    
    # Lấy 2 chữ cái đầu của tên
    name_initials = ""
    if last_name:
        name_initials = last_name[:2].upper()
    elif first_name:
        name_initials = first_name[:2].upper()
    
    # Thêm số thứ tự
    code = f"EMP{stt:03d}{name_initials}"
    return code


def create_user_in_public_table(user_id: str, email: str, full_name: str, role: str) -> Dict:
    """Tạo record trong bảng users (public schema)"""
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        return {"error": "Supabase credentials not configured"}
    
    try:
        supabase_url = f"{SUPABASE_URL}/rest/v1/users"
        headers = {
            "apikey": SUPABASE_SERVICE_KEY,
            "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
            "Content-Type": "application/json",
            "Prefer": "return=representation"
        }
        
        user_data = {
            "id": user_id,  # Same ID as auth.users
            "email": email,
            "full_name": full_name,
            "role": role,
            "is_active": True
        }
        
        response = requests.post(supabase_url, headers=headers, json=user_data)
        
        if response.status_code in [200, 201]:
            user = response.json()
            if isinstance(user, list) and len(user) > 0:
                user = user[0]
            return {
                "success": True,
                "data": user
            }
        else:
            error_text = response.text
            # Nếu đã tồn tại, coi như thành công
            if "duplicate" in error_text.lower() or "already exists" in error_text.lower() or "23505" in error_text:
                return {
                    "success": True,
                    "message": "User already exists in public.users"
                }
            return {
                "success": False,
                "error": error_text,
                "status_code": response.status_code
            }
            
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }


def get_employee_by_user_id(user_id: str) -> Dict:
    """Lấy employee theo user_id nếu đã tồn tại"""
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


def create_employee_in_database(user_id: str, first_name: str, last_name: str, email: str, 
                                department_name: str, position_name: str, stt: int) -> Dict:
    """Tạo employee record trong database"""
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        return {"error": "Supabase credentials not configured"}
    
    try:
        # Lấy hoặc tạo department và position
        department_id = get_or_create_department(department_name)
        position_id = get_or_create_position(position_name)
        
        # Tạo employee code
        employee_code = generate_employee_code(first_name, last_name, stt)
        
        # Sử dụng Supabase REST API
        supabase_url = f"{SUPABASE_URL}/rest/v1/employees"
        headers = {
            "apikey": SUPABASE_SERVICE_KEY,
            "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
            "Content-Type": "application/json",
            "Prefer": "return=representation"
        }
        
        from datetime import date
        employee_data = {
            "user_id": user_id,
            "employee_code": employee_code,
            "first_name": first_name,
            "last_name": last_name,
            "email": email,
            "hire_date": date.today().isoformat(),
            "status": "active"
        }
        
        # Thêm department_id và position_id nếu có
        if department_id:
            employee_data["department_id"] = department_id
        if position_id:
            employee_data["position_id"] = position_id
        
        response = requests.post(supabase_url, headers=headers, json=employee_data)
        
        if response.status_code in [200, 201]:
            employee = response.json()
            # Nếu là list, lấy phần tử đầu
            if isinstance(employee, list) and len(employee) > 0:
                employee = employee[0]
            return {
                "success": True,
                "employee_id": employee.get("id"),
                "employee_code": employee_code,
                "data": employee
            }
        else:
            return {
                "success": False,
                "error": response.text,
                "status_code": response.status_code
            }
            
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }


def create_all_employees():
    """Tạo tất cả nhân viên và tài khoản"""
    print("=" * 120)
    if DEMO_MODE:
        print("PREVIEW: BẢNG THÔNG TIN 8 TÀI KHOẢN SẼ ĐƯỢC TẠO")
    else:
        print("TẠO 8 TÀI KHOẢN NHÂN VIÊN TRONG SUPABASE")
    print("=" * 120)
    print()
    
    password = "123456"
    results = []
    
    # Nếu demo mode, chỉ tạo preview data
    if DEMO_MODE:
        import uuid
        for emp in EMPLOYEES_DATA:
            first_name, last_name = split_name(emp["ten_nhan_vien"])
            email = generate_email(emp["bo_phan"], emp["ten_nhan_vien"])
            full_name = emp["ten_nhan_vien"]
            
            # Generate fake IDs for preview
            fake_user_id = str(uuid.uuid4())
            fake_employee_id = str(uuid.uuid4())
            
            results.append({
                "stt": emp["stt"],
                "bo_phan": emp["bo_phan"],
                "full_name": full_name,
                "first_name": first_name,
                "last_name": last_name,
                "email": email,
                "password": password,
                "user_id": fake_user_id,
                "employee_id": fake_employee_id,
                "user_role": emp["user_role"],
                "project_role": emp["project_role"],
                "chuc_vu": emp["chuc_vu"],
                "status": "✅ Preview (chưa tạo thực tế)"
            })
        return results
    
    # Real mode - tạo thực tế
    
    for emp in EMPLOYEES_DATA:
        first_name, last_name = split_name(emp["ten_nhan_vien"])
        email = generate_email(emp["bo_phan"], emp["ten_nhan_vien"])
        full_name = emp["ten_nhan_vien"]
        
        print(f"Đang tạo tài khoản {emp['stt']}: {full_name} ({email})...")
        
        # Tạo user trong Supabase Auth
        user_result = create_user_in_supabase(
            email=email,
            password=password,
            full_name=full_name,
            role=emp["user_role"]
        )
        
        if user_result.get("success"):
            user_id = user_result["user_id"]
            if user_result.get("exists"):
                print(f"  ✅ User đã tồn tại trong auth.users: {user_id}")
            else:
                print(f"  ✅ User created trong auth.users: {user_id}")
            
            # Tạo record trong bảng users (public schema) - kiểm tra trước
            # Kiểm tra xem đã có chưa
            existing_public_user = None
            try:
                url = f"{SUPABASE_URL}/rest/v1/users?id=eq.{user_id}&select=*"
                response = requests.get(url, headers={
                    "apikey": SUPABASE_SERVICE_KEY,
                    "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}"
                })
                if response.status_code == 200:
                    users = response.json()
                    if users and len(users) > 0:
                        existing_public_user = users[0]
            except:
                pass
            
            if not existing_public_user:
                public_user_result = create_user_in_public_table(
                    user_id=user_id,
                    email=email,
                    full_name=full_name,
                    role=emp["user_role"]
                )
                
                if public_user_result.get("success"):
                    print(f"  ✅ User record trong bảng users: Created")
                else:
                    print(f"  ⚠️  User record trong bảng users failed: {public_user_result.get('error', 'Unknown')}")
            else:
                print(f"  ✅ User record trong bảng users: Already exists")
            
            # Tạo employee record
            employee_result = create_employee_in_database(
                user_id=user_id,
                first_name=first_name,
                last_name=last_name,
                email=email,
                department_name=emp["bo_phan"],
                position_name=emp["chuc_vu"],
                stt=emp["stt"]
            )
            
            if employee_result.get("success"):
                print(f"  ✅ Employee created: {employee_result.get('employee_id')}")
                results.append({
                    "stt": emp["stt"],
                    "bo_phan": emp["bo_phan"],
                    "full_name": full_name,
                    "first_name": first_name,
                    "last_name": last_name,
                    "email": email,
                    "password": password,
                    "user_id": user_id,
                    "employee_id": employee_result.get("employee_id"),
                    "employee_code": employee_result.get("employee_code"),
                    "user_role": emp["user_role"],
                    "project_role": emp["project_role"],
                    "chuc_vu": emp["chuc_vu"],
                    "status": "✅ Thành công"
                })
            else:
                error_msg = employee_result.get('error', 'Unknown error')
                # Kiểm tra xem employee đã tồn tại chưa - thử lấy employee hiện có
                existing_employee = get_employee_by_user_id(user_id)
                if existing_employee:
                    print(f"  ✅ Employee đã tồn tại: {existing_employee.get('employee_code', 'N/A')}")
                    results.append({
                        "stt": emp["stt"],
                        "bo_phan": emp["bo_phan"],
                        "full_name": full_name,
                        "first_name": first_name,
                        "last_name": last_name,
                        "email": email,
                        "password": password,
                        "user_id": user_id,
                        "employee_id": existing_employee.get("id"),
                        "employee_code": existing_employee.get("employee_code"),
                        "user_role": emp["user_role"],
                        "project_role": emp["project_role"],
                        "chuc_vu": emp["chuc_vu"],
                        "status": "✅ Hoàn chỉnh (đã tồn tại)"
                    })
                elif "already exists" in str(error_msg).lower() or "duplicate" in str(error_msg).lower() or "23505" in str(error_msg):
                    print(f"  ⚠️  Employee đã tồn tại (duplicate key)")
                    # Thử lấy lại
                    existing_employee = get_employee_by_user_id(user_id)
                    if existing_employee:
                        results.append({
                            "stt": emp["stt"],
                            "bo_phan": emp["bo_phan"],
                            "full_name": full_name,
                            "first_name": first_name,
                            "last_name": last_name,
                            "email": email,
                            "password": password,
                            "user_id": user_id,
                            "employee_id": existing_employee.get("id"),
                            "employee_code": existing_employee.get("employee_code"),
                            "user_role": emp["user_role"],
                            "project_role": emp["project_role"],
                            "chuc_vu": emp["chuc_vu"],
                            "status": "✅ Hoàn chỉnh"
                        })
                    else:
                        results.append({
                            "stt": emp["stt"],
                            "bo_phan": emp["bo_phan"],
                            "full_name": full_name,
                            "email": email,
                            "password": password,
                            "user_id": user_id,
                            "employee_id": None,
                            "employee_code": None,
                            "user_role": emp["user_role"],
                            "project_role": emp["project_role"],
                            "chuc_vu": emp["chuc_vu"],
                            "status": "⚠️  Employee đã tồn tại nhưng không lấy được"
                        })
                else:
                    print(f"  ⚠️  Employee creation failed: {error_msg}")
                    results.append({
                        "stt": emp["stt"],
                        "bo_phan": emp["bo_phan"],
                        "full_name": full_name,
                        "email": email,
                        "password": password,
                        "user_id": user_id,
                        "employee_id": None,
                        "employee_code": None,
                        "user_role": emp["user_role"],
                        "project_role": emp["project_role"],
                        "chuc_vu": emp["chuc_vu"],
                        "status": f"⚠️  User OK nhưng Employee failed: {error_msg[:50]}"
                    })
        else:
            print(f"  ❌ User creation failed: {user_result.get('error')}")
            results.append({
                "stt": emp["stt"],
                "bo_phan": emp["bo_phan"],
                "full_name": full_name,
                "email": email,
                "password": password,
                "user_id": None,
                "employee_id": None,
                "status": f"❌ Failed: {user_result.get('error')}"
            })
        
        print()
    
    return results


def display_results_table(results: List[Dict]):
    """Hiển thị bảng kết quả"""
    print("=" * 140)
    print("BẢNG THÔNG TIN TÀI KHOẢN ĐÃ TẠO")
    print("=" * 140)
    print()
    
    # Header
    print(f"{'STT':<5} {'Bộ Phận':<15} {'Họ Tên':<20} {'Email':<35} {'Mật Khẩu':<10} {'Employee Code':<15} {'Status':<30}")
    print("-" * 140)
    
    for result in results:
        employee_code = result.get("employee_code", "N/A")
        
        print(f"{result['stt']:<5} {result['bo_phan']:<15} {result['full_name']:<20} "
              f"{result['email']:<35} {result['password']:<10} {str(employee_code):<15} {result['status']:<30}")
    
    print()
    print("=" * 140)
    print("CHI TIẾT TỪNG TÀI KHOẢN:")
    print("=" * 140)
    print()
    
    for result in results:
        print(f"STT {result['stt']}: {result['full_name']}")
        print(f"  - Bộ phận: {result['bo_phan']}")
        print(f"  - Email: {result['email']}")
        print(f"  - Mật khẩu: {result['password']}")
        print(f"  - User ID: {result.get('user_id', 'N/A')}")
        print(f"  - Employee ID: {result.get('employee_id', 'N/A')}")
        print(f"  - Employee Code: {result.get('employee_code', 'N/A')}")
        print(f"  - User Role: {result.get('user_role', 'N/A')}")
        print(f"  - Project Role: {result.get('project_role', 'N/A')}")
        print(f"  - Chức vụ: {result.get('chuc_vu', 'N/A')}")
        print(f"  - Status: {result['status']}")
        print()
    
    # Thống kê
    success_count = sum(1 for r in results if "✅" in r.get("status", ""))
    warning_count = sum(1 for r in results if "⚠️" in r.get("status", ""))
    error_count = sum(1 for r in results if "❌" in r.get("status", ""))
    
    print("=" * 140)
    print("THỐNG KÊ:")
    print(f"  ✅ Thành công: {success_count}/8")
    print(f"  ⚠️  Cảnh báo: {warning_count}/8")
    print(f"  ❌ Lỗi: {error_count}/8")
    print("=" * 140)


if __name__ == "__main__":
    results = create_all_employees()
    if results:
        display_results_table(results)
    else:
        print("Không thể tạo tài khoản. Vui lòng kiểm tra cấu hình Supabase.")
