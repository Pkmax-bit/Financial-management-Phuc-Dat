"""
Script đơn giản tạo auth accounts cho test đăng nhập
Chạy script này sau khi chạy create_simple_test_accounts.sql
"""

import os
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()

# Cấu hình Supabase
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

def create_simple_auth_accounts():
    """Tạo auth accounts đơn giản cho test"""
    
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        print("❌ Thiếu cấu hình Supabase. Vui lòng kiểm tra SUPABASE_URL và SUPABASE_SERVICE_KEY")
        return
    
    supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    
    # Danh sách tài khoản test đơn giản
    test_accounts = [
        {"email": "admin@test.com", "password": "123456", "role": "admin"},
        {"email": "accountant@test.com", "password": "123456", "role": "accountant"},
        {"email": "sales@test.com", "password": "123456", "role": "sales"},
        {"email": "workshop@test.com", "password": "123456", "role": "workshop_employee"},
        {"email": "employee@test.com", "password": "123456", "role": "employee"},
        {"email": "worker@test.com", "password": "123456", "role": "worker"},
        {"email": "transport@test.com", "password": "123456", "role": "transport"},
        {"email": "customer@test.com", "password": "123456", "role": "customer"}
    ]
    
    print("🚀 Tạo auth accounts cho test đăng nhập...")
    
    success_count = 0
    error_count = 0
    
    for account in test_accounts:
        try:
            # Tạo auth account
            auth_response = supabase.auth.admin.create_user({
                "email": account["email"],
                "password": account["password"],
                "email_confirm": True,
                "user_metadata": {
                    "full_name": f"{account['role'].title()} Test",
                    "role": account["role"]
                }
            })
            
            if auth_response.user:
                print(f"✅ Tạo thành công: {account['email']} ({account['role']})")
                success_count += 1
            else:
                print(f"❌ Lỗi tạo: {account['email']}")
                error_count += 1
                
        except Exception as e:
            print(f"❌ Lỗi tạo {account['email']}: {str(e)}")
            error_count += 1
    
    print(f"\n📊 Kết quả:")
    print(f"✅ Thành công: {success_count}")
    print(f"❌ Lỗi: {error_count}")
    
    print(f"\n🔐 Thông tin đăng nhập:")
    print(f"📧 Email: admin@test.com")
    print(f"🔑 Mật khẩu: 123456")
    print(f"👤 Role: admin")
    
    print(f"\n📋 Tất cả tài khoản test:")
    for account in test_accounts:
        print(f"📧 {account['email']} | 🔑 {account['password']} | 👤 {account['role']}")

if __name__ == "__main__":
    create_simple_auth_accounts()
