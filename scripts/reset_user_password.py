"""
Script to reset user password in Supabase Auth
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

def reset_password(email, new_password="123456"):
    """Reset password for a user"""
    print("=" * 60)
    print("RESET MẬT KHẨU NGƯỜI DÙNG")
    print("=" * 60)
    print(f"Email: {email}")
    print(f"New password: {new_password}")
    print()
    
    # Create Supabase client with service key
    supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)
    
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
        
        if not user_found:
            print(f"❌ Không tìm thấy user với email: {email}")
            return False
        
        user_id = user_found.id if hasattr(user_found, 'id') else user_found.get('id')
        print(f"✅ Tìm thấy user: {user_id}")
        
        # Update user password using admin API
        print(f"🔄 Đang reset mật khẩu...")
        update_response = supabase.auth.admin.update_user_by_id(
            user_id,
            {"password": new_password}
        )
        
        if update_response:
            print(f"✅ Đã reset mật khẩu thành công!")
            print(f"   Email: {email}")
            print(f"   Mật khẩu mới: {new_password}")
            print(f"   ⚠️  Vui lòng đăng nhập lại với mật khẩu mới")
            return True
        else:
            print(f"❌ Không thể reset mật khẩu")
            return False
            
    except Exception as e:
        print(f"❌ Lỗi khi reset mật khẩu: {str(e)}")
        print(f"   Error type: {type(e).__name__}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    emails = [
        "congnophucdat@gmail.com",
        "xuonggiacongnhomkinhffc@gmail.com"
    ]
    
    new_password = "123456"
    
    print("=" * 60)
    print("RESET MẬT KHẨU CHO NHIỀU USER")
    print("=" * 60)
    print(f"Mật khẩu mới sẽ được set: {new_password}")
    print()
    
    results = []
    for email in emails:
        print(f"\n{'='*60}")
        success = reset_password(email, new_password)
        results.append({"email": email, "success": success})
    
    # Summary
    print(f"\n{'='*60}")
    print("TÓM TẮT")
    print(f"{'='*60}")
    for result in results:
        if result["success"]:
            print(f"✅ {result['email']}: Đã reset mật khẩu thành công")
        else:
            print(f"❌ {result['email']}: Không thể reset mật khẩu")
    
    print(f"\n{'='*60}")
    print("LƯU Ý")
    print(f"{'='*60}")
    print("⚠️  Mật khẩu đã được reset. Vui lòng thử đăng nhập lại.")
    print("💡 Nếu vẫn không đăng nhập được, có thể:")
    print("   1. Kiểm tra xem email có đúng không")
    print("   2. Kiểm tra xem có bị chặn bởi Supabase Auth policies không")
    print("   3. Thử reset lại mật khẩu trong Supabase Dashboard")

