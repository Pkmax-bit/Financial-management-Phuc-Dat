"""
Script để test endpoints customers và employees
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

def get_auth_token():
    """Lấy auth token từ user Liên"""
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        return None
    
    email = "nhansulien@gmail.com"
    password = "123456"
    
    try:
        auth_url = f"{SUPABASE_URL}/auth/v1/token?grant_type=password"
        headers = {
            "apikey": SUPABASE_SERVICE_KEY,
            "Content-Type": "application/json"
        }
        
        data = {
            "email": email,
            "password": password
        }
        
        response = requests.post(auth_url, headers=headers, json=data)
        if response.status_code == 200:
            result = response.json()
            return result.get("access_token")
    except Exception as e:
        print(f"Lỗi khi lấy token: {e}")
    
    return None

def test_endpoints():
    """Test các endpoints customers và employees"""
    print("=" * 100)
    print("TEST ENDPOINTS CUSTOMERS VÀ EMPLOYEES")
    print("=" * 100)
    print()
    
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        print("❌ Chưa cấu hình Supabase credentials!")
        return
    
    # Lấy token
    print("Bước 1: Lấy auth token...")
    token = get_auth_token()
    if not token:
        print("❌ Không thể lấy token")
        return
    
    print(f"✅ Đã lấy token")
    print()
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    # Test endpoints
    endpoints_to_test = [
        ("/api/customers", "GET customers (main endpoint)"),
        ("/api/customers/", "GET customers/ (with trailing slash)"),
        ("/api/customers/dropdown", "GET customers/dropdown (new dropdown endpoint)"),
        ("/api/employees", "GET employees (main endpoint)"),
        ("/api/employees/", "GET employees/ (with trailing slash)"),
        ("/api/employees/dropdown", "GET employees/dropdown (new dropdown endpoint)"),
    ]
    
    base_url = "http://localhost:8000"
    
    print("Bước 2: Test các endpoints...")
    print()
    
    for endpoint, description in endpoints_to_test:
        url = f"{base_url}{endpoint}"
        print(f"Testing: {description}")
        print(f"  URL: {url}")
        try:
            response = requests.get(url, headers=headers, timeout=5)
            print(f"  Status: {response.status_code}")
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    print(f"  ✅ Success: {len(data)} items")
                elif isinstance(data, dict):
                    print(f"  ✅ Success: {list(data.keys())}")
                else:
                    print(f"  ✅ Success: {type(data)}")
            elif response.status_code == 307:
                print(f"  ⚠️  Redirect: {response.headers.get('Location', 'N/A')}")
            elif response.status_code == 403:
                error_text = response.text[:200]
                print(f"  ❌ Forbidden: {error_text}")
            else:
                print(f"  ⚠️  Error: {response.text[:200]}")
        except requests.exceptions.ConnectionError:
            print(f"  ❌ Connection Error: Backend không chạy tại {base_url}")
        except Exception as e:
            print(f"  ❌ Exception: {e}")
        print()
    
    print("=" * 100)

if __name__ == "__main__":
    test_endpoints()
