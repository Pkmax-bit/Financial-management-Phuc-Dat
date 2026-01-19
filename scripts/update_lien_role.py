"""
Script để cập nhật role cho nhân viên Liên thành HR_MANAGER
"""
import sys
import io
if sys.stdout.encoding != 'utf-8':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

import os
import requests

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

def update_lien_role():
    """Cập nhật role cho nhân viên Liên thành HR_MANAGER"""
    print("=" * 100)
    print("CẬP NHẬT ROLE CHO NHÂN VIÊN LIÊN THÀNH HR_MANAGER")
    print("=" * 100)
    print()
    
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        print("❌ Chưa cấu hình Supabase credentials!")
        return
    
    email = "nhansulien@gmail.com"
    new_role = "hr_manager"
    
    headers = {
        "apikey": SUPABASE_SERVICE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=representation"
    }
    
    # 1. Lấy user từ auth.users
    print(f"Đang tìm user: {email}...")
    auth_url = f"{SUPABASE_URL}/auth/v1/admin/users"
    auth_user = None
    
    try:
        response = requests.get(auth_url, headers=headers)
        if response.status_code == 200:
            users = response.json().get("users", [])
            for user in users:
                if user.get("email", "").lower() == email.lower():
                    auth_user = user
                    break
    except Exception as e:
        print(f"❌ Lỗi khi lấy user từ auth: {e}")
        return
    
    if not auth_user:
        print(f"❌ Không tìm thấy user {email} trong auth.users")
        return
    
    user_id = auth_user.get("id")
    print(f"✅ Tìm thấy user trong auth.users: {user_id}")
    print(f"   Role hiện tại: {auth_user.get('app_metadata', {}).get('role', 'N/A')}")
    
    # 2. Cập nhật role trong auth.users (app_metadata)
    print()
    print("Bước 1: Cập nhật role trong auth.users...")
    try:
        update_url = f"{SUPABASE_URL}/auth/v1/admin/users/{user_id}"
        update_data = {
            "app_metadata": {
                **auth_user.get("app_metadata", {}),
                "role": new_role
            }
        }
        response = requests.put(update_url, headers=headers, json=update_data)
        if response.status_code == 200:
            updated_user = response.json()
            print(f"   ✅ Đã cập nhật role trong auth.users")
            print(f"      Role mới: {updated_user.get('app_metadata', {}).get('role', 'N/A')}")
        else:
            print(f"   ⚠️  Lỗi: {response.status_code} - {response.text[:500]}")
    except Exception as e:
        print(f"   ⚠️  Lỗi: {e}")
    
    # 3. Cập nhật role trong bảng users (public schema)
    print()
    print("Bước 2: Cập nhật role trong bảng users...")
    try:
        # Kiểm tra xem user có trong bảng users không
        check_url = f"{SUPABASE_URL}/rest/v1/users?id=eq.{user_id}&select=*"
        response = requests.get(check_url, headers=headers)
        if response.status_code == 200:
            users = response.json()
            if users and len(users) > 0:
                # Cập nhật role
                update_url = f"{SUPABASE_URL}/rest/v1/users?id=eq.{user_id}"
                update_data = {
                    "role": new_role
                }
                response = requests.patch(update_url, headers=headers, json=update_data)
                if response.status_code in [200, 204]:
                    print(f"   ✅ Đã cập nhật role trong bảng users")
                else:
                    print(f"   ⚠️  Lỗi: {response.status_code} - {response.text[:500]}")
            else:
                print(f"   ⚠️  User chưa có trong bảng users, đang tạo...")
                # Tạo user trong bảng users
                create_url = f"{SUPABASE_URL}/rest/v1/users"
                user_data = {
                    "id": user_id,
                    "email": email,
                    "full_name": "Liên",
                    "role": new_role,
                    "is_active": True
                }
                response = requests.post(create_url, headers=headers, json=user_data)
                if response.status_code in [200, 201]:
                    print(f"   ✅ Đã tạo user trong bảng users với role {new_role}")
                else:
                    print(f"   ⚠️  Lỗi khi tạo: {response.status_code} - {response.text[:500]}")
    except Exception as e:
        print(f"   ⚠️  Lỗi: {e}")
    
    # 4. Kiểm tra lại
    print()
    print("Bước 3: Kiểm tra lại...")
    try:
        # Kiểm tra auth.users
        response = requests.get(f"{auth_url}?email={email}", headers=headers)
        if response.status_code == 200:
            users = response.json().get("users", [])
            if users:
                auth_role = users[0].get("app_metadata", {}).get("role", "N/A")
                print(f"   Auth users role: {auth_role}")
        
        # Kiểm tra public.users
        check_url = f"{SUPABASE_URL}/rest/v1/users?id=eq.{user_id}&select=role"
        response = requests.get(check_url, headers=headers)
        if response.status_code == 200:
            users = response.json()
            if users and len(users) > 0:
                public_role = users[0].get("role", "N/A")
                print(f"   Public users role: {public_role}")
                
                if auth_role == new_role and public_role == new_role:
                    print()
                    print("✅ Thành công! Role đã được cập nhật thành HR_MANAGER")
                else:
                    print()
                    print("⚠️  Có sự không nhất quán giữa auth.users và public.users")
    except Exception as e:
        print(f"   ⚠️  Lỗi khi kiểm tra: {e}")
    
    print()
    print("=" * 100)

if __name__ == "__main__":
    update_lien_role()
