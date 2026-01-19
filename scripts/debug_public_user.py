"""
Script để debug vấn đề public user cho kdtutien@gmail.com
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

def debug_user():
    """Debug user kdtutien@gmail.com"""
    print("=" * 100)
    print("DEBUG PUBLIC USER CHO kdtutien@gmail.com")
    print("=" * 100)
    print()
    
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        print("❌ Chưa cấu hình Supabase credentials!")
        return
    
    email = "kdtutien@gmail.com"
    user_id = "30a7d7df-14b4-4098-950f-cd901e79e026"
    
    headers = {
        "apikey": SUPABASE_SERVICE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}"
    }
    
    # 1. Kiểm tra theo user_id
    print("1. Kiểm tra theo user_id:")
    try:
        url = f"{SUPABASE_URL}/rest/v1/users?id=eq.{user_id}&select=*"
        response = requests.get(url, headers=headers)
        print(f"   Status: {response.status_code}")
        print(f"   Response: {response.text[:500]}")
        if response.status_code == 200:
            users = response.json()
            print(f"   Số lượng users: {len(users)}")
            if users:
                print(f"   User: {users[0]}")
    except Exception as e:
        print(f"   Lỗi: {e}")
    
    print()
    
    # 2. Kiểm tra theo email
    print("2. Kiểm tra theo email:")
    try:
        url = f"{SUPABASE_URL}/rest/v1/users?email=eq.{email}&select=*"
        response = requests.get(url, headers=headers)
        print(f"   Status: {response.status_code}")
        print(f"   Response: {response.text[:500]}")
        if response.status_code == 200:
            users = response.json()
            print(f"   Số lượng users: {len(users)}")
            if users:
                for user in users:
                    print(f"   User ID: {user.get('id')}")
                    print(f"   Email: {user.get('email')}")
                    print(f"   Full name: {user.get('full_name')}")
    except Exception as e:
        print(f"   Lỗi: {e}")
    
    print()
    
    # 3. Lấy tất cả users (giới hạn 10)
    print("3. Lấy tất cả users (giới hạn 10):")
    try:
        url = f"{SUPABASE_URL}/rest/v1/users?select=*&limit=10"
        response = requests.get(url, headers=headers)
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            users = response.json()
            print(f"   Tổng số users: {len(users)}")
            for user in users:
                print(f"   - {user.get('email')} (ID: {user.get('id')})")
    except Exception as e:
        print(f"   Lỗi: {e}")
    
    print()
    
    # 4. Thử tạo lại với verbose output
    print("4. Thử tạo lại user:")
    try:
        url = f"{SUPABASE_URL}/rest/v1/users"
        user_data = {
            "id": user_id,
            "email": email,
            "full_name": "Tủ Tiển",
            "role": "sales",
            "is_active": True
        }
        response = requests.post(
            url,
            headers={
                **headers,
                "Content-Type": "application/json",
                "Prefer": "return=representation"
            },
            json=user_data
        )
        print(f"   Status: {response.status_code}")
        print(f"   Response headers: {dict(response.headers)}")
        print(f"   Response body: {response.text[:1000]}")
        
        if response.status_code in [200, 201]:
            result = response.json()
            if isinstance(result, list) and len(result) > 0:
                print(f"   ✅ Tạo thành công: {result[0]}")
            else:
                print(f"   ✅ Response: {result}")
        else:
            print(f"   ❌ Lỗi khi tạo")
    except Exception as e:
        print(f"   Lỗi: {e}")
    
    print()
    print("=" * 100)

if __name__ == "__main__":
    debug_user()
