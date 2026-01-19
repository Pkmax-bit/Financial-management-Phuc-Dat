"""
Script để test tạo project và verify tasks được tạo
"""
import sys
import os
import io
if sys.stdout.encoding != 'utf-8':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

import requests
from datetime import date, datetime

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

def get_sample_ids():
    """Lấy sample IDs từ database"""
    headers = {
        "apikey": SUPABASE_SERVICE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}"
    }
    
    try:
        # Get sample customer
        customer_url = f"{SUPABASE_URL}/rest/v1/customers?limit=1"
        customer_resp = requests.get(customer_url, headers=headers)
        customer_id = None
        if customer_resp.status_code == 200 and customer_resp.json():
            customer_id = customer_resp.json()[0].get('id')
        
        # Get sample employee
        employee_url = f"{SUPABASE_URL}/rest/v1/employees?limit=1"
        employee_resp = requests.get(employee_url, headers=headers)
        manager_id = None
        if employee_resp.status_code == 200 and employee_resp.json():
            manager_id = employee_resp.json()[0].get('id')
        
        # Get sample category
        category_url = f"{SUPABASE_URL}/rest/v1/project_categories?limit=1"
        category_resp = requests.get(category_url, headers=headers)
        category_id = None
        if category_resp.status_code == 200 and category_resp.json():
            category_id = category_resp.json()[0].get('id')
        
        # Get sample status
        status_url = f"{SUPABASE_URL}/rest/v1/project_statuses?limit=1"
        status_resp = requests.get(status_url, headers=headers)
        status_id = None
        if status_resp.status_code == 200 and status_resp.json():
            status_id = status_resp.json()[0].get('id')
        
        return {
            'customer_id': customer_id,
            'manager_id': manager_id,
            'category_id': category_id,
            'status_id': status_id
        }
    except Exception as e:
        print(f"Lỗi khi lấy sample IDs: {e}")
        return {}

def test_create_project():
    """Test tạo project và verify tasks"""
    print("=" * 100)
    print("TEST TẠO PROJECT VÀ VERIFY TASKS")
    print("=" * 100)
    print()
    
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        print("❌ Chưa cấu hình Supabase credentials!")
        return
    
    # Lấy auth token
    print("Bước 1: Lấy auth token...")
    token = get_auth_token()
    if not token:
        print("❌ Không thể lấy token")
        return
    print("✅ Đã lấy token")
    print()
    
    # Lấy sample IDs
    print("Bước 2: Lấy sample IDs...")
    sample_ids = get_sample_ids()
    print(f"   Customer ID: {sample_ids.get('customer_id', 'N/A')}")
    print(f"   Manager ID: {sample_ids.get('manager_id', 'N/A')}")
    print(f"   Category ID: {sample_ids.get('category_id', 'N/A')}")
    print(f"   Status ID: {sample_ids.get('status_id', 'N/A')}")
    print()
    
    # Generate project code
    print("Bước 3: Generate project code...")
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    try:
        code_resp = requests.get("http://localhost:8000/api/projects/generate-code", headers=headers, timeout=10)
        if code_resp.status_code == 200:
            code_data = code_resp.json()
            project_code = code_data.get('project_code', f"TEST-{datetime.now().strftime('%Y%m%d%H%M%S')}")
            print(f"   ✅ Generated code: {project_code}")
        else:
            project_code = f"TEST-{datetime.now().strftime('%Y%m%d%H%M%S')}"
            print(f"   ⚠️  Code generation failed, using fallback: {project_code}")
    except Exception as e:
        project_code = f"TEST-{datetime.now().strftime('%Y%m%d%H%M%S')}"
        print(f"   ⚠️  Code generation error: {e}, using fallback: {project_code}")
    print()
    
    # Tạo project data
    print("Bước 4: Tạo project...")
    project_data = {
        "project_code": project_code,
        "name": f"Test Auto Tasks - {datetime.now().strftime('%H%M%S')}",
        "description": "Test project để verify tasks tự động tạo",
        "start_date": date.today().isoformat(),
        "end_date": (date.today().replace(month=12, day=31)).isoformat(),
        "priority": "medium",
        "progress": 0,
        "billing_type": "fixed",
        "actual_cost": 0.0
    }
    
    # Thêm optional fields
    if sample_ids.get('customer_id'):
        project_data['customer_id'] = sample_ids['customer_id']
    if sample_ids.get('manager_id'):
        project_data['manager_id'] = sample_ids['manager_id']
    if sample_ids.get('category_id'):
        project_data['category_id'] = sample_ids['category_id']
    if sample_ids.get('status_id'):
        project_data['status_id'] = sample_ids['status_id']
    else:
        project_data['status'] = 'planning'
    
    print(f"   Project data keys: {list(project_data.keys())}")
    print()
    
    # Gọi API tạo project
    print("Bước 5: Gọi backend API để tạo project...")
    try:
        api_url = "http://localhost:8000/api/projects"
        response = requests.post(api_url, headers=headers, json=project_data, timeout=30)
        
        print(f"   Status: {response.status_code}")
        
        if response.status_code in [200, 201]:
            result = response.json()
            project_id = result.get("id")
            print(f"   ✅ Project created successfully!")
            print(f"   Project ID: {project_id}")
            print(f"   Project Code: {result.get('project_code', 'N/A')}")
            print(f"   Project Name: {result.get('name', 'N/A')}")
            print()
            
            # Kiểm tra tasks
            print("Bước 6: Kiểm tra tasks đã được tạo...")
            import time
            time.sleep(2)  # Đợi tasks được tạo
            
            task_headers = {
                "apikey": SUPABASE_SERVICE_KEY,
                "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}"
            }
            tasks_url = f"{SUPABASE_URL}/rest/v1/tasks?project_id=eq.{project_id}&select=id,title,parent_id&order=created_at"
            tasks_resp = requests.get(tasks_url, headers=task_headers)
            
            if tasks_resp.status_code == 200:
                tasks = tasks_resp.json()
                parent_tasks = [t for t in tasks if t.get('parent_id') is None]
                sub_tasks = [t for t in tasks if t.get('parent_id') is not None]
                
                print(f"   ✅ Tổng số tasks: {len(tasks)}")
                print(f"   ✅ Parent tasks: {len(parent_tasks)}")
                print(f"   ✅ Sub tasks: {len(sub_tasks)}")
                
                if len(tasks) == 0:
                    print("   ❌ CHƯA CÓ TASKS! Logic tạo tasks có thể không được gọi hoặc có lỗi.")
                    print("   Hãy kiểm tra logs backend để xem có lỗi gì không.")
                elif len(tasks) < 19:
                    print(f"   ⚠️  CHỈ CÓ {len(tasks)} TASKS! Mong đợi ít nhất 19 tasks (4 parent + 15 sub).")
                else:
                    print("   ✅ Tasks đã được tạo đầy đủ!")
                    print()
                    print("   Sample tasks:")
                    for task in tasks[:10]:
                        parent_info = " [PARENT]" if task.get('parent_id') is None else f" (parent: {task.get('parent_id', 'N/A')[:8]}...)"
                        print(f"      - {task.get('title', 'N/A')}{parent_info}")
            else:
                print(f"   ⚠️  Không thể kiểm tra tasks: {tasks_resp.status_code}")
            
        else:
            print(f"   ❌ Lỗi: {response.status_code}")
            try:
                error_data = response.json()
                print(f"   Error detail: {error_data.get('detail', 'N/A')}")
            except:
                print(f"   Response: {response.text[:500]}")
                
    except Exception as e:
        print(f"   ❌ Exception: {e}")
        import traceback
        traceback.print_exc()
    
    print()
    print("=" * 100)

if __name__ == "__main__":
    test_create_project()
