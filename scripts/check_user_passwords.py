"""
Script to check user information in Supabase Auth
Note: Passwords are hashed and cannot be retrieved, but we can check user existence and reset if needed
"""

import sys
import os
from pathlib import Path

# Fix encoding for Windows console
if sys.platform == 'win32':
    import codecs
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'strict')
    sys.stderr = codecs.getwriter('utf-8')(sys.stderr.buffer, 'strict')

# Add backend to path
backend_path = Path(__file__).parent.parent / "backend"
sys.path.insert(0, str(backend_path))

from config import settings
from supabase import create_client

def check_users(emails):
    """Check user information for given emails"""
    print("=" * 60)
    print("KIỂM TRA THÔNG TIN NGƯỜI DÙNG")
    print("=" * 60)
    print(f"Supabase URL: {settings.SUPABASE_URL}")
    print(f"Service Key configured: {bool(settings.SUPABASE_SERVICE_KEY)}")
    print()
    
    # Create Supabase client with service key
    supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)
    
    results = []
    
    for email in emails:
        print(f"\n{'='*60}")
        print(f"Email: {email}")
        print(f"{'='*60}")
        
        try:
            # List all users and find by email
            users_response = supabase.auth.admin.list_users()
            
            # Handle different response formats
            users_list = users_response.users if hasattr(users_response, 'users') else users_response
            
            user_found = None
            for user in users_list:
                user_email = user.email if hasattr(user, 'email') else user.get('email')
                if user_email == email:
                    user_found = user
                    break
            
            if user_found:
                print(f"✅ Tìm thấy user")
                user_id = user_found.id if hasattr(user_found, 'id') else user_found.get('id')
                user_email = user_found.email if hasattr(user_found, 'email') else user_found.get('email')
                email_confirmed = user_found.email_confirmed_at if hasattr(user_found, 'email_confirmed_at') else user_found.get('email_confirmed_at')
                created_at = user_found.created_at if hasattr(user_found, 'created_at') else user_found.get('created_at')
                last_sign_in = user_found.last_sign_in_at if hasattr(user_found, 'last_sign_in_at') else user_found.get('last_sign_in_at')
                user_metadata = user_found.user_metadata if hasattr(user_found, 'user_metadata') else user_found.get('user_metadata', {})
                app_metadata = user_found.app_metadata if hasattr(user_found, 'app_metadata') else user_found.get('app_metadata', {})
                
                print(f"   User ID: {user_id}")
                print(f"   Email: {user_email}")
                print(f"   Email confirmed: {email_confirmed is not None}")
                print(f"   Created at: {created_at}")
                print(f"   Last sign in: {last_sign_in}")
                print(f"   User metadata: {user_metadata}")
                print(f"   App metadata: {app_metadata}")
                
                # Check if user exists in users table
                user_record = supabase.table("users").select("*").eq("email", email).execute()
                if user_record.data:
                    print(f"   ✅ Có trong bảng users")
                    print(f"   Full name: {user_record.data[0].get('full_name', 'N/A')}")
                    print(f"   Role: {user_record.data[0].get('role', 'N/A')}")
                    print(f"   Is active: {user_record.data[0].get('is_active', 'N/A')}")
                else:
                    print(f"   ⚠️  Không có trong bảng users")
                
                # Check if user exists in employees table
                employee_record = supabase.table("employees").select("*").eq("email", email).execute()
                if employee_record.data:
                    print(f"   ✅ Có trong bảng employees")
                    print(f"   Employee code: {employee_record.data[0].get('employee_code', 'N/A')}")
                    print(f"   Name: {employee_record.data[0].get('first_name', '')} {employee_record.data[0].get('last_name', '')}")
                else:
                    print(f"   ⚠️  Không có trong bảng employees")
                
                user_id = user_found.id if hasattr(user_found, 'id') else user_found.get('id')
                email_confirmed = user_found.email_confirmed_at if hasattr(user_found, 'email_confirmed_at') else user_found.get('email_confirmed_at')
                
                results.append({
                    "email": email,
                    "found": True,
                    "user_id": user_id,
                    "email_confirmed": email_confirmed is not None,
                    "in_users_table": bool(user_record.data),
                    "in_employees_table": bool(employee_record.data)
                })
            else:
                print(f"❌ Không tìm thấy user với email này")
                results.append({
                    "email": email,
                    "found": False
                })
                
        except Exception as e:
            print(f"❌ Lỗi khi kiểm tra: {str(e)}")
            results.append({
                "email": email,
                "found": False,
                "error": str(e)
            })
    
    # Summary
    print(f"\n{'='*60}")
    print("TÓM TẮT")
    print(f"{'='*60}")
    for result in results:
        if result.get("found"):
            print(f"✅ {result['email']}: Tồn tại")
            if not result.get("email_confirmed"):
                print(f"   ⚠️  Email chưa được xác nhận")
            if not result.get("in_users_table"):
                print(f"   ⚠️  Chưa có trong bảng users")
            if not result.get("in_employees_table"):
                print(f"   ⚠️  Chưa có trong bảng employees")
        else:
            print(f"❌ {result['email']}: Không tồn tại")
    
    print(f"\n{'='*60}")
    print("LƯU Ý")
    print(f"{'='*60}")
    print("⚠️  Mật khẩu đã được hash và không thể xem được.")
    print("💡 Nếu cần reset mật khẩu, có thể:")
    print("   1. Dùng chức năng 'Quên mật khẩu' trên frontend")
    print("   2. Hoặc reset trực tiếp trong Supabase Dashboard > Authentication > Users")
    print("   3. Hoặc dùng script reset_password.py (nếu có)")

if __name__ == "__main__":
    emails = [
        "phucdatlapdat7@gmail.com",
        "congnophucdat@gmail.com",
        "xuonggiacongnhomkinhffc@gmail.com"
    ]
    
    check_users(emails)

