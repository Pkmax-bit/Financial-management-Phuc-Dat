#!/usr/bin/env python3
"""
Tạo tài khoản nhân viên xưởng với phân quyền phù hợp
"""

import os
import sys
from supabase import create_client, Client

# Cấu hình Supabase
SUPABASE_URL = os.getenv('SUPABASE_URL', 'https://your-project.supabase.co')
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY', 'your-service-role-key')

if not SUPABASE_URL or not SUPABASE_KEY or 'your-project' in SUPABASE_URL:
    print("ERROR: Vui long cau hinh SUPABASE_URL va SUPABASE_SERVICE_ROLE_KEY")
    print("   Tao file .env voi:")
    print("   SUPABASE_URL=https://your-project.supabase.co")
    print("   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key")
    sys.exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def create_workshop_accounts():
    """Tạo tài khoản nhân viên xưởng"""
    
    # Danh sách tài khoản nhân viên xưởng
    workshop_accounts = [
        {
            "email": "xuong.quandoc@company.com",
            "password": "123456",
            "full_name": "Nguyễn Văn Quản Đốc",
            "role": "workshop_employee",
            "employee_code": "EMP-WORKSHOP-001",
            "position": "Quản đốc xưởng"
        },
        {
            "email": "xuong.congnhan1@company.com", 
            "password": "123456",
            "full_name": "Trần Thị Công Nhân 1",
            "role": "workshop_employee",
            "employee_code": "EMP-WORKSHOP-002",
            "position": "Công nhân xưởng"
        },
        {
            "email": "xuong.congnhan2@company.com",
            "password": "123456", 
            "full_name": "Lê Văn Công Nhân 2",
            "role": "workshop_employee",
            "employee_code": "EMP-WORKSHOP-003",
            "position": "Công nhân xưởng"
        }
    ]
    
    # Danh sách tài khoản nhân công
    worker_accounts = [
        {
            "email": "nhan.cong1@company.com",
            "password": "123456",
            "full_name": "Phạm Thị Nhân Công 1", 
            "role": "worker",
            "employee_code": "EMP-WORKER-001",
            "position": "Nhân công"
        },
        {
            "email": "nhan.cong2@company.com",
            "password": "123456",
            "full_name": "Hoàng Văn Nhân Công 2",
            "role": "worker", 
            "employee_code": "EMP-WORKER-002",
            "position": "Nhân công"
        }
    ]
    
    all_accounts = workshop_accounts + worker_accounts
    
    print("TAO TAI KHOAN NHAN VIEN XUONG VA NHAN CONG...")
    print("=" * 60)
    
    success_count = 0
    error_count = 0
    
    for account in all_accounts:
        try:
            print(f"\nTAO TAI KHOAN: {account['email']}")
            print(f"TEN: {account['full_name']}")
            print(f"ROLE: {account['role']}")
            
            # Tạo tài khoản auth
            auth_response = supabase.auth.admin.create_user({
                "email": account["email"],
                "password": account["password"],
                "email_confirm": True,
                "user_metadata": {
                    "full_name": account["full_name"],
                    "role": account["role"]
                }
            })
            
            if auth_response.user:
                user_id = auth_response.user.id
                print(f"SUCCESS: Auth user created: {user_id}")
                
                # Tạo user record
                user_record = {
                    "id": user_id,
                    "email": account["email"],
                    "full_name": account["full_name"],
                    "role": account["role"],
                    "is_active": True
                }
                
                user_result = supabase.table("users").insert(user_record).execute()
                print(f"SUCCESS: User record created")
                
                # Tạo employee record
                employee_record = {
                    "id": user_id,  # Sử dụng cùng ID với user
                    "user_id": user_id,
                    "employee_code": account["employee_code"],
                    "first_name": account["full_name"].split()[-1],  # Tên cuối
                    "last_name": " ".join(account["full_name"].split()[:-1]),  # Họ và tên đệm
                    "email": account["email"],
                    "phone": "0123456789",
                    "hire_date": "2024-01-01",
                    "status": "active"
                }
                
                employee_result = supabase.table("employees").insert(employee_record).execute()
                print(f"SUCCESS: Employee record created")
                
                success_count += 1
                
            else:
                print(f"ERROR: Loi tao auth user")
                error_count += 1
                
        except Exception as e:
            if "already been registered" in str(e):
                print(f"WARNING: Tai khoan da ton tai: {account['email']}")
                success_count += 1
            else:
                print(f"ERROR: {str(e)}")
                error_count += 1
    
    print("\n" + "=" * 60)
    print(f"KET QUA:")
    print(f"SUCCESS: {success_count}")
    print(f"ERROR: {error_count}")
    print(f"TONG CONG: {len(all_accounts)}")
    
    print(f"\nTHONG TIN DANG NHAP:")
    print(f"Email: xuong.quandoc@company.com")
    print(f"Mat khau: 123456")
    print(f"Role: workshop_employee")
    print(f"Email: nhan.cong1@company.com")
    print(f"Mat khau: 123456")
    print(f"Role: worker")
    
    print(f"\nLUU Y:")
    print(f"- Tat ca tai khoan co mat khau mac dinh: 123456")
    print(f"- Vui long thay doi mat khau sau khi dang nhap lan dau")
    print(f"- Nhan vien xuong chi thay doi tuong chi phi xuong")
    print(f"- Nhan cong chi thay doi tuong chi phi nhan cong")

if __name__ == "__main__":
    create_workshop_accounts()
