"""
Script tạo tài khoản auth trong Supabase
Chạy script này để tạo tài khoản đăng nhập cho các nhân viên
"""

import os
import asyncio
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()

# Cấu hình Supabase
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

def create_auth_accounts():
    """Tạo tài khoản auth cho các nhân viên"""
    
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        print("❌ Thiếu cấu hình Supabase. Vui lòng kiểm tra SUPABASE_URL và SUPABASE_SERVICE_KEY")
        return
    
    supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    
    # Danh sách tài khoản cần tạo
    accounts = [
        # ADMIN
        {
            "email": "admin@company.com",
            "password": "123456",
            "full_name": "Nguyễn Văn Admin",
            "role": "admin"
        },
        
        # ACCOUNTANT
        {
            "email": "ketoan.truong@company.com", 
            "password": "123456",
            "full_name": "Trần Thị Kế Toán",
            "role": "accountant"
        },
        {
            "email": "ketoan.vien@company.com",
            "password": "123456", 
            "full_name": "Lê Văn Kế Toán",
            "role": "accountant"
        },
        
        # SALES
        {
            "email": "kinhdoanh.truong@company.com",
            "password": "123456",
            "full_name": "Phạm Văn Kinh Doanh", 
            "role": "sales"
        },
        {
            "email": "kinhdoanh.vien@company.com",
            "password": "123456",
            "full_name": "Hoàng Thị Kinh Doanh",
            "role": "sales"
        },
        
        # WORKSHOP_EMPLOYEE
        {
            "email": "xuong.quandoc@company.com",
            "password": "123456",
            "full_name": "Võ Văn Quản Đốc",
            "role": "workshop_employee"
        },
        {
            "email": "xuong.congnhan@company.com",
            "password": "123456",
            "full_name": "Đặng Thị Công Nhân",
            "role": "workshop_employee"
        },
        
        # EMPLOYEE
        {
            "email": "nhanvien.it@company.com",
            "password": "123456",
            "full_name": "Bùi Văn IT",
            "role": "employee"
        },
        {
            "email": "nhanvien.vanhanh@company.com",
            "password": "123456",
            "full_name": "Ngô Thị Vận Hành",
            "role": "employee"
        },
        
        # WORKER
        {
            "email": "congnhan.001@company.com",
            "password": "123456",
            "full_name": "Lý Văn Công Nhân",
            "role": "worker"
        },
        {
            "email": "congnhan.002@company.com",
            "password": "123456",
            "full_name": "Vũ Thị Công Nhân",
            "role": "worker"
        },
        
        # TRANSPORT
        {
            "email": "taixe.001@company.com",
            "password": "123456",
            "full_name": "Trịnh Văn Tài Xế",
            "role": "transport"
        },
        {
            "email": "taixe.002@company.com",
            "password": "123456",
            "full_name": "Phan Thị Tài Xế",
            "role": "transport"
        },
        
        # CUSTOMER
        {
            "email": "khachhang.001@company.com",
            "password": "123456",
            "full_name": "Công ty ABC",
            "role": "customer"
        },
        {
            "email": "khachhang.002@company.com",
            "password": "123456",
            "full_name": "Công ty XYZ",
            "role": "customer"
        }
    ]
    
    print("🚀 Bắt đầu tạo tài khoản auth...")
    
    success_count = 0
    error_count = 0
    
    for account in accounts:
        try:
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
                print(f"✅ Tạo thành công: {account['email']} ({account['role']})")
                success_count += 1
            else:
                print(f"❌ Lỗi tạo tài khoản: {account['email']}")
                error_count += 1
                
        except Exception as e:
            print(f"❌ Lỗi tạo tài khoản {account['email']}: {str(e)}")
            error_count += 1
    
    print(f"\n📊 Kết quả:")
    print(f"✅ Thành công: {success_count}")
    print(f"❌ Lỗi: {error_count}")
    print(f"📧 Tổng cộng: {len(accounts)}")
    
    print(f"\n🔐 Thông tin đăng nhập:")
    print(f"📧 Email: admin@company.com")
    print(f"🔑 Mật khẩu: 123456")
    print(f"👤 Role: admin")
    
    print(f"\n⚠️ Lưu ý:")
    print(f"- Tất cả tài khoản có mật khẩu mặc định: 123456")
    print(f"- Vui lòng thay đổi mật khẩu sau khi đăng nhập lần đầu")
    print(f"- Chạy script SQL trước để tạo dữ liệu users và employees")

if __name__ == "__main__":
    create_auth_accounts()
