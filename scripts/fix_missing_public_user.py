"""
Script để tạo public user record cho tài khoản còn thiếu
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

def create_user_in_public_table(user_id: str, email: str, full_name: str, role: str) -> dict:
    """Tạo record trong bảng users (public schema)"""
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        return {"error": "Supabase credentials not configured"}
    
    try:
        supabase_url = f"{SUPABASE_URL}/rest/v1/users"
        headers = {
            "apikey": SUPABASE_SERVICE_KEY,
            "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
            "Content-Type": "application/json",
            "Prefer": "return=representation"
        }
        
        user_data = {
            "id": user_id,  # Same ID as auth.users
            "email": email,
            "full_name": full_name,
            "role": role,
            "is_active": True
        }
        
        response = requests.post(supabase_url, headers=headers, json=user_data)
        
        if response.status_code in [200, 201]:
            user = response.json()
            if isinstance(user, list) and len(user) > 0:
                user = user[0]
            return {
                "success": True,
                "data": user
            }
        else:
            error_text = response.text
            # Nếu đã tồn tại, coi như thành công
            if "duplicate" in error_text.lower() or "already exists" in error_text.lower() or "23505" in error_text:
                return {
                    "success": True,
                    "message": "User already exists in public.users"
                }
            return {
                "success": False,
                "error": error_text,
                "status_code": response.status_code
            }
            
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

def fix_kdtutien():
    """Fix tài khoản kdtutien@gmail.com"""
    print("=" * 100)
    print("TẠO PUBLIC USER RECORD CHO TÀI KHOẢN CÒN THIẾU")
    print("=" * 100)
    print()
    
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        print("❌ Chưa cấu hình Supabase credentials!")
        return
    
    email = "kdtutien@gmail.com"
    headers = {
        "apikey": SUPABASE_SERVICE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}"
    }
    
    # Lấy user từ auth.users
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
    
    # Kiểm tra xem đã có trong public.users chưa
    print(f"Đang kiểm tra trong bảng users...")
    try:
        url = f"{SUPABASE_URL}/rest/v1/users?id=eq.{user_id}&select=*"
        response = requests.get(url, headers=headers)
        if response.status_code == 200:
            users = response.json()
            if users and len(users) > 0:
                print(f"✅ User đã tồn tại trong bảng users!")
                print(f"   Full name: {users[0].get('full_name', 'N/A')}")
                print(f"   Role: {users[0].get('role', 'N/A')}")
                return
    except Exception as e:
        print(f"⚠️  Lỗi khi kiểm tra: {e}")
    
    # Lấy thông tin từ employee để có full_name và role
    print(f"Đang lấy thông tin từ employee...")
    employee = None
    try:
        url = f"{SUPABASE_URL}/rest/v1/employees?email=eq.{email}&select=*"
        response = requests.get(url, headers=headers)
        if response.status_code == 200:
            employees = response.json()
            if employees and len(employees) > 0:
                employee = employees[0]
                print(f"✅ Tìm thấy employee: {employee.get('employee_code', 'N/A')}")
    except Exception as e:
        print(f"⚠️  Lỗi khi lấy employee: {e}")
    
    # Tạo full_name và role
    if employee:
        first_name = employee.get("first_name", "")
        last_name = employee.get("last_name", "")
        full_name = f"{first_name} {last_name}".strip() if first_name or last_name else "Tủ Tiển"
    else:
        full_name = "Tủ Tiển"
    
    # Role mặc định là sales cho tài khoản này
    role = "sales"
    
    print(f"Đang tạo public user record...")
    print(f"  - User ID: {user_id}")
    print(f"  - Email: {email}")
    print(f"  - Full Name: {full_name}")
    print(f"  - Role: {role}")
    
    result = create_user_in_public_table(
        user_id=user_id,
        email=email,
        full_name=full_name,
        role=role
    )
    
    if result.get("success"):
        print()
        print("✅ Thành công! Đã tạo public user record.")
        if result.get("data"):
            print(f"   Full name: {result['data'].get('full_name', 'N/A')}")
            print(f"   Role: {result['data'].get('role', 'N/A')}")
        elif result.get("message"):
            print(f"   {result['message']}")
        
        # Kiểm tra lại ngay sau khi tạo
        print()
        print("Đang kiểm tra lại...")
        try:
            url = f"{SUPABASE_URL}/rest/v1/users?id=eq.{user_id}&select=*"
            response = requests.get(url, headers=headers)
            if response.status_code == 200:
                users = response.json()
                if users and len(users) > 0:
                    print(f"✅ Xác nhận: User đã có trong bảng users!")
                    print(f"   Full name: {users[0].get('full_name', 'N/A')}")
                    print(f"   Role: {users[0].get('role', 'N/A')}")
                else:
                    print(f"⚠️  Không tìm thấy user sau khi tạo. Response: {response.text[:200]}")
        except Exception as e:
            print(f"⚠️  Lỗi khi kiểm tra lại: {e}")
    else:
        print()
        print(f"❌ Lỗi: {result.get('error', 'Unknown error')}")
        if result.get("status_code"):
            print(f"   Status code: {result['status_code']}")
        print(f"   Full error response: {result.get('error', '')[:500]}")
    
    print()
    print("=" * 100)

if __name__ == "__main__":
    fix_kdtutien()
