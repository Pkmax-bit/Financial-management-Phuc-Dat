"""
Script to test project creation and verify default tasks are created
"""
import os
import sys
import requests
import json
from datetime import datetime, timedelta

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Configuration
API_BASE_URL = os.getenv("API_BASE_URL", "http://localhost:8000")
SUPABASE_URL = os.getenv("SUPABASE_URL", "https://your-project.supabase.co")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")

def get_auth_token():
    """Get auth token by logging in"""
    # Try to login with a test user
    # You may need to adjust this based on your auth setup
    login_data = {
        "email": "nhansulien@gmail.com",  # Adjust to your test user
        "password": "123456"
    }
    
    response = requests.post(f"{API_BASE_URL}/api/auth/login", json=login_data)
    if response.status_code == 200:
        data = response.json()
        return data.get("access_token") or data.get("token")
    else:
        print(f"❌ Login failed: {response.status_code} - {response.text}")
        return None

def create_test_project(token):
    """Create a test project"""
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    # First, get project code
    code_response = requests.get(f"{API_BASE_URL}/api/projects/generate-code", headers=headers)
    if code_response.status_code != 200:
        print(f"❌ Failed to generate project code: {code_response.status_code} - {code_response.text}")
        return None
    
    project_code = code_response.json().get("project_code")
    print(f"✅ Generated project code: {project_code}")
    
    # Get a customer and manager
    customers_response = requests.get(f"{API_BASE_URL}/api/customers?limit=1", headers=headers)
    if customers_response.status_code != 200:
        print(f"❌ Failed to get customers: {customers_response.status_code}")
        return None
    
    customers = customers_response.json()
    if not customers:
        print("❌ No customers found. Please create a customer first.")
        return None
    
    customer_id = customers[0]["id"]
    print(f"✅ Using customer: {customers[0].get('name', 'N/A')}")
    
    # Get employees for manager
    employees_response = requests.get(f"{API_BASE_URL}/api/employees?limit=1", headers=headers)
    if employees_response.status_code != 200:
        print(f"❌ Failed to get employees: {employees_response.status_code}")
        return None
    
    employees = employees_response.json()
    if not employees:
        print("❌ No employees found. Please create an employee first.")
        return None
    
    manager_id = employees[0]["id"]
    print(f"✅ Using manager: {employees[0].get('first_name', '')} {employees[0].get('last_name', '')}")
    
    # Get project category
    categories_response = requests.get(f"{API_BASE_URL}/api/projects/categories", headers=headers)
    if categories_response.status_code != 200:
        print(f"❌ Failed to get categories: {categories_response.status_code}")
        return None
    
    categories = categories_response.json()
    category_id = categories[0]["id"] if categories else None
    if category_id:
        print(f"✅ Using category: {categories[0].get('name', 'N/A')}")
    
    # Get project status
    statuses_response = requests.get(f"{API_BASE_URL}/api/projects/statuses?limit=1", headers=headers)
    if statuses_response.status_code != 200:
        print(f"❌ Failed to get statuses: {statuses_response.status_code}")
        return None
    
    statuses = statuses_response.json()
    status_id = statuses[0]["id"] if statuses else None
    if status_id:
        print(f"✅ Using status: {statuses[0].get('name', 'N/A')}")
    
    # Create project
    project_data = {
        "project_code": project_code,
        "name": f"Test Project - {datetime.now().strftime('%Y%m%d-%H%M%S')}",
        "description": "Test project to verify default tasks creation",
        "customer_id": customer_id,
        "manager_id": manager_id,
        "category_id": category_id,
        "status_id": status_id,
        "start_date": datetime.now().date().isoformat(),
        "end_date": (datetime.now() + timedelta(days=30)).date().isoformat(),
        "priority": "medium",
        "billing_type": "fixed",
        "actual_cost": 0
    }
    
    print(f"\n📝 Creating project: {project_data['name']}")
    print(f"   Code: {project_code}")
    
    response = requests.post(f"{API_BASE_URL}/api/projects", headers=headers, json=project_data)
    
    if response.status_code == 200 or response.status_code == 201:
        project = response.json()
        project_id = project.get("id")
        print(f"✅ Project created successfully!")
        print(f"   Project ID: {project_id}")
        return project_id
    else:
        print(f"❌ Failed to create project: {response.status_code}")
        print(f"   Response: {response.text}")
        return None

def check_tasks(project_id, token):
    """Check if tasks were created for the project"""
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    # Wait a bit for tasks to be created
    import time
    time.sleep(2)
    
    # Get tasks for the project
    response = requests.get(
        f"{API_BASE_URL}/api/tasks?project_id={project_id}",
        headers=headers
    )
    
    if response.status_code == 200:
        tasks = response.json()
        task_count = len(tasks) if isinstance(tasks, list) else 0
        
        print(f"\n📋 Tasks found: {task_count}")
        
        if task_count == 0:
            print("❌ NO TASKS FOUND! This indicates a problem.")
            return False
        
        # Analyze task structure
        parent_tasks = [t for t in tasks if t.get("parent_id") is None]
        sub_tasks = [t for t in tasks if t.get("parent_id") is not None]
        
        print(f"   Parent tasks (no parent_id): {len(parent_tasks)}")
        print(f"   Sub tasks (has parent_id): {len(sub_tasks)}")
        
        # Show task hierarchy
        print(f"\n📊 Task Hierarchy:")
        
        # Find main parent (should be project name)
        main_parent = None
        for task in parent_tasks:
            print(f"   📌 {task.get('title', 'N/A')} (ID: {task.get('id', 'N/A')[:8]}...)")
            main_parent = task
        
        # Show sub-tasks
        if main_parent:
            main_parent_id = main_parent.get("id")
            second_level = [t for t in sub_tasks if t.get("parent_id") == main_parent_id]
            
            for task in second_level:
                print(f"      ├─ {task.get('title', 'N/A')} (ID: {task.get('id', 'N/A')[:8]}...)")
                
                # Show third level
                third_level = [t for t in sub_tasks if t.get("parent_id") == task.get("id")]
                for sub_task in third_level:
                    print(f"      │  ├─ {sub_task.get('title', 'N/A')}")
        
        # Expected structure:
        # 1 main parent task (project name)
        # 4 second-level tasks (Kế hoạch, Sản xuất, Vận chuyển/lắp đặt, Chăm sóc khách hàng)
        # ~15 third-level tasks (sub-tasks)
        expected_total = 1 + 4 + 15  # Approximately
        
        print(f"\n✅ Expected ~{expected_total} tasks, found {task_count}")
        
        if task_count >= expected_total - 2:  # Allow some variance
            print("✅ Task creation looks good!")
            return True
        else:
            print(f"⚠️ WARNING: Expected ~{expected_total} tasks but found {task_count}")
        return False
    else:
        print(f"❌ Failed to get tasks: {response.status_code} - {response.text}")
        return False

def main():
    print("=" * 60)
    print("TEST: Project Creation and Default Tasks Verification")
    print("=" * 60)
    
    # Get auth token
    print("\n1. Authenticating...")
    token = get_auth_token()
    if not token:
        print("❌ Authentication failed. Exiting.")
        return
    
    print("✅ Authenticated successfully")
    
    # Create project
    print("\n2. Creating test project...")
    project_id = create_test_project(token)
    if not project_id:
        print("❌ Project creation failed. Exiting.")
        return
    
    # Check tasks
    print("\n3. Checking tasks...")
    success = check_tasks(project_id, token)
    
    if success:
        print("\n" + "=" * 60)
        print("✅ TEST PASSED: Tasks were created successfully!")
        print("=" * 60)
    else:
        print("\n" + "=" * 60)
        print("❌ TEST FAILED: Tasks were not created or structure is incorrect")
        print("=" * 60)
        print("\n💡 Troubleshooting:")
        print("   1. Check backend logs for errors")
        print("   2. Verify RLS policies for tasks table")
        print("   3. Check if create_default_tasks_for_project is being called")
        print("   4. Verify supabase client is using service_role key")

if __name__ == "__main__":
    main()
