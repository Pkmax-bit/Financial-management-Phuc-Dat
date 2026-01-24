"""
Test thêm thành viên vào đội ngũ qua API và kiểm tra thông báo
"""
import os
import sys
import requests
import time
import io

# Fix encoding for Windows console
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

# Load environment
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

BASE_URL = os.getenv("BACKEND_URL", "http://localhost:8000")
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

def get_supabase_client():
    """Lấy Supabase client để kiểm tra thông báo"""
    from supabase import create_client
    return create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

def test_add_team_member():
    """Test thêm thành viên và kiểm tra thông báo"""
    print("=" * 80)
    print("TEST THÊM THÀNH VIÊN VÀ KIỂM TRA THÔNG BÁO")
    print("=" * 80)
    
    # Lấy access token
    access_token = os.getenv("ACCESS_TOKEN")
    if not access_token:
        print("\n⚠️  Cần ACCESS_TOKEN để test")
        print("   Vui lòng đăng nhập trên web và lấy token từ browser console:")
        print("   localStorage.getItem('access_token')")
        return
    
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json"
    }
    
    supabase = get_supabase_client()
    
    # 1. Lấy một project có sẵn
    print("\n1. Lấy project...")
    projects_result = supabase.table("projects").select("id, name").limit(1).execute()
    if not projects_result.data:
        print("❌ Không tìm thấy dự án nào")
        return
    
    project_id = projects_result.data[0]["id"]
    project_name = projects_result.data[0]["name"]
    print(f"✅ Project: {project_name} (ID: {project_id})")
    
    # 2. Lấy một employee có user_id
    print("\n2. Lấy employee có user_id...")
    employees_result = supabase.table("employees")\
        .select("id, first_name, last_name, email, user_id")\
        .not_.is_("user_id", "null")\
        .limit(5)\
        .execute()
    
    if not employees_result.data:
        print("❌ Không tìm thấy employee nào có user_id")
        return
    
    employee = employees_result.data[0]
    employee_name = f"{employee.get('first_name', '')} {employee.get('last_name', '')}".strip()
    employee_email = employee.get("email")
    employee_user_id = employee.get("user_id")
    
    print(f"✅ Employee: {employee_name} (user_id: {employee_user_id})")
    
    # 3. Kiểm tra xem employee đã có trong team chưa
    print("\n3. Kiểm tra employee trong team...")
    existing_team = supabase.table("project_team")\
        .select("id")\
        .eq("project_id", project_id)\
        .eq("user_id", employee_user_id)\
        .eq("status", "active")\
        .execute()
    
    if existing_team.data:
        print(f"⚠️  Employee đã có trong team. Sẽ xóa và thêm lại...")
        # Xóa thành viên cũ
        supabase.table("project_team")\
            .update({"status": "inactive"})\
            .eq("id", existing_team.data[0]["id"])\
            .execute()
        time.sleep(1)
    
    # 4. Lấy danh sách team members hiện tại
    print("\n4. Lấy danh sách team members hiện tại...")
    current_team = supabase.table("project_team")\
        .select("id, name, user_id")\
        .eq("project_id", project_id)\
        .eq("status", "active")\
        .not_.is_("user_id", "null")\
        .execute()
    
    current_user_ids = [m.get("user_id") for m in (current_team.data or []) if m.get("user_id")]
    print(f"   Team hiện tại có {len(current_user_ids)} thành viên: {current_user_ids}")
    
    # 5. Thêm thành viên qua API
    print("\n5. Thêm thành viên qua API...")
    team_member_data = {
        "name": employee_name,
        "role": "member",
        "email": employee_email,
        "user_id": employee_user_id,
        "start_date": "2025-01-01",
        "status": "active"
    }
    
    response = requests.post(
        f"{BASE_URL}/api/projects/{project_id}/team",
        headers=headers,
        json=team_member_data
    )
    
    if response.status_code not in [200, 201]:
        print(f"❌ Lỗi thêm thành viên: {response.status_code}")
        print(f"   {response.text}")
        return
    
    print(f"✅ Đã thêm thành viên thành công")
    result_data = response.json()
    print(f"   Response: {result_data}")
    
    # 6. Đợi thông báo được tạo
    print("\n6. Đợi thông báo được tạo (3 giây)...")
    time.sleep(3)
    
    # 7. Kiểm tra thông báo
    print("\n7. Kiểm tra thông báo 'team_member_added'...")
    notifications = supabase.table("notifications")\
        .select("*")\
        .eq("entity_id", project_id)\
        .eq("type", "team_member_added")\
        .order("created_at", desc=True)\
        .limit(10)\
        .execute()
    
    if notifications.data:
        print(f"✅ Tìm thấy {len(notifications.data)} thông báo 'team_member_added':")
        for notif in notifications.data[:5]:
            print(f"\n   - ID: {notif.get('id')}")
            print(f"     User ID: {notif.get('user_id')}")
            print(f"     Title: {notif.get('title')}")
            print(f"     Message: {notif.get('message')}")
            print(f"     Created: {notif.get('created_at')}")
    else:
        print("⚠️  Chưa có thông báo 'team_member_added'")
        print("\n   Kiểm tra:")
        print(f"   - Team members hiện tại: {current_user_ids}")
        print(f"   - Employee user_id: {employee_user_id}")
        print(f"   - Nếu employee là thành viên duy nhất hoặc đã có trong team, sẽ không có thông báo")
    
    # 8. Tổng kết
    print("\n" + "=" * 80)
    print("TỔNG KẾT")
    print("=" * 80)
    print(f"✅ Project: {project_name}")
    print(f"✅ Employee: {employee_name}")
    print(f"✅ Thông báo tìm thấy: {len(notifications.data) if notifications.data else 0}")
    print("\n📋 Lưu ý:")
    print("   - Nếu đây là thành viên đầu tiên hoặc duy nhất trong team, sẽ không có thông báo")
    print("   - Thông báo chỉ được gửi cho các thành viên KHÁC (không phải người thêm và thành viên mới)")
    print("=" * 80)

if __name__ == "__main__":
    test_add_team_member()
