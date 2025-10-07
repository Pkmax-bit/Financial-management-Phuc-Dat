"""
Script xóa auth users test
Chạy script này để xóa các tài khoản auth test cũ
"""

import os
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()

# Cấu hình Supabase
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

def delete_test_auth_users():
    """Xóa auth users test"""
    
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        print("❌ Thiếu cấu hình Supabase. Vui lòng kiểm tra SUPABASE_URL và SUPABASE_SERVICE_KEY")
        return
    
    supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    
    # Danh sách email test cần xóa
    test_emails = [
        "admin@test.com",
        "accountant@test.com", 
        "sales@test.com",
        "workshop@test.com",
        "employee@test.com",
        "worker@test.com",
        "transport@test.com",
        "customer@test.com"
    ]
    
    print("🗑️ Bắt đầu xóa auth users test...")
    
    success_count = 0
    error_count = 0
    
    for email in test_emails:
        try:
            # Tìm user theo email
            users = supabase.auth.admin.list_users()
            
            user_to_delete = None
            for user in users:
                if user.email == email:
                    user_to_delete = user
                    break
            
            if user_to_delete:
                # Xóa user
                supabase.auth.admin.delete_user(user_to_delete.id)
                print(f"✅ Đã xóa: {email}")
                success_count += 1
            else:
                print(f"ℹ️ Không tìm thấy: {email}")
                
        except Exception as e:
            print(f"❌ Lỗi xóa {email}: {str(e)}")
            error_count += 1
    
    print(f"\n📊 Kết quả:")
    print(f"✅ Thành công: {success_count}")
    print(f"❌ Lỗi: {error_count}")
    
    print(f"\n🎉 Hoàn thành xóa auth users test!")
    print(f"Bây giờ có thể tạo lại tài khoản test mới")

if __name__ == "__main__":
    delete_test_auth_users()
