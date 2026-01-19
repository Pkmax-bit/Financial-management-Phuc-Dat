"""
Script để xem trước danh sách nhân viên trước khi tạo trong database
"""
import sys
import io
# Fix encoding cho Windows
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

from typing import List, Dict
from datetime import datetime

# Định nghĩa danh sách nhân viên
EMPLOYEES_DATA = [
    {
        "stt": 1,
        "bo_phan": "KD",
        "ten_nhan_vien": "Tủ Tiển",
        "user_role": "sales",  # Sale KT -> sales
        "project_role": "member",  # MEMBER
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
    """Chuẩn hóa tên để tạo email (loại bỏ dấu, chuyển thành chữ thường)"""
    import unicodedata
    import re
    
    # Loại bỏ dấu
    name = unicodedata.normalize('NFD', name)
    name = ''.join(c for c in name if unicodedata.category(c) != 'Mn')
    
    # Chuyển thành chữ thường và thay thế khoảng trắng
    name = name.lower().strip()
    name = re.sub(r'\s+', '', name)  # Loại bỏ khoảng trắng
    
    return name


def normalize_department(dept: str) -> str:
    """Chuẩn hóa tên bộ phận để tạo email"""
    import unicodedata
    import re
    
    # Loại bỏ dấu
    dept = unicodedata.normalize('NFD', dept)
    dept = ''.join(c for c in dept if unicodedata.category(c) != 'Mn')
    
    # Chuyển thành chữ thường và thay thế khoảng trắng
    dept = dept.lower().strip()
    dept = re.sub(r'\s+', '', dept)  # Loại bỏ khoảng trắng
    
    return dept


def generate_email(bo_phan: str, ten_nhan_vien: str) -> str:
    """Tạo email theo format: Bộ phận + tên nhân viên + @gmail.com"""
    dept_normalized = normalize_department(bo_phan)
    name_normalized = normalize_name(ten_nhan_vien)
    
    email = f"{dept_normalized}{name_normalized}@gmail.com"
    return email


def split_name(full_name: str) -> tuple:
    """Tách tên thành first_name và last_name
    
    Với tên đơn (1 từ): coi là last_name (tên), first_name để trống
    Với tên đôi (2 từ): từ đầu là first_name (họ), từ cuối là last_name (tên)
    Với tên nhiều từ: từ cuối là last_name (tên), còn lại là first_name (họ)
    """
    parts = full_name.strip().split()
    if len(parts) == 1:
        # Tên đơn: coi là last_name (tên), first_name (họ) để trống
        return "", parts[0]
    elif len(parts) == 2:
        # Tên đôi: từ đầu là first_name (họ), từ cuối là last_name (tên)
        return parts[0], parts[1]
    else:
        # Nếu có nhiều từ, lấy từ cuối làm last_name (tên), còn lại làm first_name (họ)
        return " ".join(parts[:-1]), parts[-1]


def preview_employees():
    """Hiển thị preview danh sách nhân viên"""
    print("=" * 120)
    print("PREVIEW DANH SÁCH NHÂN VIÊN TRƯỚC KHI TẠO TRONG DATABASE")
    print("=" * 120)
    print()
    
    employees_preview = []
    
    for emp in EMPLOYEES_DATA:
        first_name, last_name = split_name(emp["ten_nhan_vien"])
        email = generate_email(emp["bo_phan"], emp["ten_nhan_vien"])
        
        employee_data = {
            "stt": emp["stt"],
            "bo_phan": emp["bo_phan"],
            "first_name": first_name,
            "last_name": last_name,
            "full_name": emp["ten_nhan_vien"],
            "email": email,
            "user_role": emp["user_role"],
            "project_role": emp["project_role"],
            "chuc_vu": emp["chuc_vu"]
        }
        
        employees_preview.append(employee_data)
    
    # Hiển thị bảng
    print(f"{'STT':<5} {'Bộ Phận':<15} {'Họ':<15} {'Tên':<15} {'Email':<40} {'User Role':<15} {'Project Role':<15} {'Chức Vụ':<20}")
    print("-" * 120)
    
    for emp in employees_preview:
        print(f"{emp['stt']:<5} {emp['bo_phan']:<15} {emp['first_name']:<15} {emp['last_name']:<15} "
              f"{emp['email']:<40} {emp['user_role']:<15} {emp['project_role']:<15} {emp['chuc_vu']:<20}")
    
    print()
    print("=" * 120)
    print("CHI TIẾT TỪNG NHÂN VIÊN:")
    print("=" * 120)
    print()
    
    for emp in employees_preview:
        print(f"STT {emp['stt']}: {emp['full_name']}")
        print(f"  - Bộ phận: {emp['bo_phan']}")
        print(f"  - Họ: {emp['first_name']}")
        print(f"  - Tên: {emp['last_name']}")
        print(f"  - Email: {emp['email']}")
        print(f"  - User Role: {emp['user_role']} ({get_role_description(emp['user_role'])})")
        print(f"  - Project Role: {emp['project_role']} ({emp['chuc_vu']})")
        print()
    
    print("=" * 120)
    print("JSON FORMAT (để import vào database):")
    print("=" * 120)
    print()
    
    import json
    json_data = []
    for emp in employees_preview:
        json_data.append({
            "first_name": emp["first_name"],
            "last_name": emp["last_name"],
            "email": emp["email"],
            "user_role": emp["user_role"],
            "project_role": emp["project_role"],
            "department": emp["bo_phan"],
            "position": emp["chuc_vu"]
        })
    
    print(json.dumps(json_data, indent=2, ensure_ascii=False))
    
    return employees_preview


def get_role_description(role: str) -> str:
    """Lấy mô tả của role"""
    descriptions = {
        "admin": "Quản trị viên hệ thống",
        "accountant": "Kế toán",
        "sales": "Nhân viên bán hàng",
        "employee": "Nhân viên",
        "worker": "Công nhân",
        "workshop_employee": "Nhân viên xưởng",
        "transport": "Nhân viên vận chuyển",
        "customer": "Khách hàng"
    }
    return descriptions.get(role, role)


if __name__ == "__main__":
    preview_employees()
