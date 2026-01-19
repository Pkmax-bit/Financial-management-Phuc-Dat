"""
Script để fix user_id mismatch cho kdtutien@gmail.com
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

def fix_user_id():
    """Fix user_id mismatch"""
    print("=" * 100)
    print("FIX USER_ID MISMATCH CHO kdtutien@gmail.com")
    print("=" * 100)
    print()
    
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        print("❌ Chưa cấu hình Supabase credentials!")
        return
    
    email = "kdtutien@gmail.com"
    correct_user_id = "30a7d7df-14b4-4098-950f-cd901e79e026"  # Từ auth.users
    wrong_user_id = "19684002-2aba-4cba-a722-e33ce387855c"  # Từ public.users
    
    headers = {
        "apikey": SUPABASE_SERVICE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
        "Content-Type": "application/json"
    }
    
    print(f"Email: {email}")
    print(f"User ID đúng (từ auth.users): {correct_user_id}")
    print(f"User ID sai (từ public.users): {wrong_user_id}")
    print()
    
    # Option 1: Xóa user cũ và tạo lại với user_id đúng
    print("Bước 1: Xóa user cũ với user_id sai...")
    try:
        url = f"{SUPABASE_URL}/rest/v1/users?id=eq.{wrong_user_id}"
        response = requests.delete(url, headers=headers)
        print(f"   Status: {response.status_code}")
        if response.status_code in [200, 204]:
            print(f"   ✅ Đã xóa user cũ")
        else:
            print(f"   Response: {response.text[:500]}")
    except Exception as e:
        print(f"   ⚠️  Lỗi: {e}")
    
    print()
    
    # Bước 2: Tạo user mới với user_id đúng
    print("Bước 2: Tạo user mới với user_id đúng...")
    try:
        url = f"{SUPABASE_URL}/rest/v1/users"
        user_data = {
            "id": correct_user_id,
            "email": email,
            "full_name": "Tủ Tiển",
            "role": "sales",
            "is_active": True
        }
        response = requests.post(
            url,
            headers={
                **headers,
                "Prefer": "return=representation"
            },
            json=user_data
        )
        print(f"   Status: {response.status_code}")
        if response.status_code in [200, 201]:
            result = response.json()
            if isinstance(result, list) and len(result) > 0:
                user = result[0]
                print(f"   ✅ Đã tạo user mới:")
                print(f"      ID: {user.get('id')}")
                print(f"      Email: {user.get('email')}")
                print(f"      Full name: {user.get('full_name')}")
                print(f"      Role: {user.get('role')}")
            else:
                print(f"   ✅ Response: {result}")
        else:
            print(f"   ❌ Lỗi: {response.text[:500]}")
    except Exception as e:
        print(f"   ❌ Lỗi: {e}")
    
    print()
    
    # Bước 3: Kiểm tra lại
    print("Bước 3: Kiểm tra lại...")
    try:
        url = f"{SUPABASE_URL}/rest/v1/users?id=eq.{correct_user_id}&select=*"
        response = requests.get(url, headers=headers)
        if response.status_code == 200:
            users = response.json()
            if users and len(users) > 0:
                user = users[0]
                print(f"   ✅ Xác nhận: User đã có với user_id đúng!")
                print(f"      ID: {user.get('id')}")
                print(f"      Email: {user.get('email')}")
                print(f"      Full name: {user.get('full_name')}")
            else:
                print(f"   ⚠️  Chưa tìm thấy user")
    except Exception as e:
        print(f"   ⚠️  Lỗi: {e}")
    
    print()
    print("=" * 100)

if __name__ == "__main__":
    fix_user_id()
