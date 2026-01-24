"""
Test thông báo qua API thực sự (giống như trên web)
"""
import os
import sys
import requests
import json
import time
from datetime import datetime
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

def test_via_api():
    """Test thông báo qua API"""
    print("=" * 80)
    print("TEST THÔNG BÁO QUA API")
    print("=" * 80)
    
    # Lấy access token (cần đăng nhập trước)
    print("\n⚠️  LƯU Ý: Script này cần access token để gọi API")
    print("   Vui lòng:")
    print("   1. Đăng nhập trên web để lấy access token")
    print("   2. Hoặc test trực tiếp trên web interface")
    print("\n   Hoặc chạy script này với access token:")
    print("   ACCESS_TOKEN=your_token python test_notifications_via_api.py")
    
    access_token = os.getenv("ACCESS_TOKEN")
    
    if not access_token:
        print("\n❌ Không có ACCESS_TOKEN")
        print("\n📋 HƯỚNG DẪN TEST TRÊN WEB:")
        print("=" * 80)
        print("1. Mở trình duyệt và đăng nhập vào web app")
        print("2. Tạo một dự án mới:")
        print("   - Vào trang Projects")
        print("   - Click 'Tạo dự án mới'")
        print("   - Điền thông tin và tạo")
        print("3. Thêm nhân viên Dương vào dự án:")
        print("   - Vào trang chi tiết dự án")
        print("   - Tab 'Đội ngũ'")
        print("   - Click 'Thêm thành viên'")
        print("   - Chọn Dương và thêm")
        print("4. Kiểm tra thông báo:")
        print("   - Vào trang Notifications hoặc kiểm tra database")
        print("   - Query: SELECT * FROM notifications WHERE entity_id = 'project_id'")
        print("=" * 80)
        return
    
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json"
    }
    
    supabase = get_supabase_client()
    
    # 1. Tìm nhân viên Dương
    print("\n1. Tìm nhân viên Dương...")
    employees_result = supabase.table("employees").select("id, first_name, last_name, email, user_id").ilike("first_name", "%Dương%").limit(5).execute()
    
    if not employees_result.data:
        employees_result = supabase.table("employees").select("id, first_name, last_name, email, user_id").ilike("last_name", "%Dương%").limit(5).execute()
    
    if not employees_result.data:
        print("❌ Không tìm thấy nhân viên Dương")
        return
    
    duong_employee = employees_result.data[0]
    duong_user_id = duong_employee.get("user_id")
    duong_name = f"{duong_employee.get('first_name', '')} {duong_employee.get('last_name', '')}".strip()
    duong_email = duong_employee.get("email")
    
    print(f"✅ Tìm thấy: {duong_name} (User ID: {duong_user_id})")
    
    # 2. Tạo dự án qua API
    print("\n2. Tạo dự án qua API...")
    project_data = {
        "name": f"Test Project API - {datetime.now().strftime('%Y%m%d_%H%M%S')}",
        "project_code": f"TESTAPI{datetime.now().strftime('%Y%m%d%H%M%S')}",
        "description": "Dự án test thông báo qua API",
        "status": "planning",
        "priority": "medium",
        "start_date": datetime.now().date().isoformat(),
        "budget": 1000000
    }
    
    response = requests.post(
        f"{BASE_URL}/api/projects",
        headers=headers,
        json=project_data
    )
    
    if response.status_code != 200:
        print(f"❌ Lỗi tạo dự án: {response.status_code}")
        print(f"   {response.text}")
        return
    
    project = response.json()
    project_id = project.get("id")
    project_name = project.get("name")
    
    print(f"✅ Đã tạo dự án: {project_name} (ID: {project_id})")
    
    # 3. Đợi thông báo được tạo
    print("\n3. Đợi thông báo được tạo (3 giây)...")
    time.sleep(3)
    
    # 4. Kiểm tra thông báo
    print("\n4. Kiểm tra thông báo 'project_created'...")
    notifications = supabase.table("notifications")\
        .select("*")\
        .eq("entity_id", project_id)\
        .eq("type", "project_created")\
        .order("created_at", desc=True)\
        .execute()
    
    if notifications.data:
        print(f"✅ Tìm thấy {len(notifications.data)} thông báo 'project_created':")
        for notif in notifications.data:
            print(f"   - User: {notif.get('user_id')}")
            print(f"     Title: {notif.get('title')}")
            print(f"     Message: {notif.get('message')}")
    else:
        print("⚠️  Chưa có thông báo 'project_created'")
        print("   (Có thể đội ngũ dự án chưa có thành viên nào)")
    
    # 5. Thêm Dương vào đội ngũ qua API
    print("\n5. Thêm Dương vào đội ngũ qua API...")
    team_member_data = {
        "name": duong_name,
        "role": "member",
        "email": duong_email,
        "user_id": duong_user_id,
        "start_date": datetime.now().date().isoformat(),
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
    
    print(f"✅ Đã thêm Dương vào đội ngũ")
    
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
        .execute()
    
    if notifications.data:
        print(f"✅ Tìm thấy {len(notifications.data)} thông báo 'team_member_added':")
        for notif in notifications.data:
            print(f"   - User: {notif.get('user_id')}")
            print(f"     Title: {notif.get('title')}")
            print(f"     Message: {notif.get('message')}")
    else:
        print("⚠️  Chưa có thông báo 'team_member_added'")
    
    # 8. Tổng kết
    print("\n" + "=" * 80)
    print("TỔNG KẾT")
    print("=" * 80)
    
    all_notifications = supabase.table("notifications")\
        .select("*")\
        .eq("entity_id", project_id)\
        .order("created_at", desc=True)\
        .execute()
    
    print(f"✅ Dự án: {project_name} (ID: {project_id})")
    print(f"✅ Tổng số thông báo: {len(all_notifications.data) if all_notifications.data else 0}")
    
    if all_notifications.data:
        print("\n📋 Chi tiết thông báo:")
        for notif in all_notifications.data:
            print(f"\n   Type: {notif.get('type')}")
            print(f"   User ID: {notif.get('user_id')}")
            print(f"   Title: {notif.get('title')}")
            print(f"   Message: {notif.get('message')}")
            print(f"   Created: {notif.get('created_at')}")
    
    print("\n" + "=" * 80)

if __name__ == "__main__":
    test_via_api()
