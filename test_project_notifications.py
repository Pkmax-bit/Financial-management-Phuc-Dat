"""
Test script để kiểm tra thông báo khi tạo dự án và thêm thành viên
"""
import os
import sys
import requests
import json
from datetime import datetime
import io

# Fix encoding for Windows console
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

# Thêm backend vào path
backend_path = os.path.join(os.path.dirname(__file__), 'backend')
sys.path.insert(0, backend_path)

# Load environment variables from .env file if exists
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

def get_supabase_client():
    """Lấy Supabase client từ backend service"""
    try:
        from services.supabase_client import get_supabase_client as backend_get_client
        return backend_get_client()
    except Exception as e:
        print(f"ERROR: Cannot get Supabase client: {e}")
        print("Make sure backend environment variables are set correctly")
        sys.exit(1)

def test_notifications():
    """Test thông báo khi tạo dự án và thêm thành viên"""
    print("=" * 80)
    print("TEST THÔNG BÁO DỰ ÁN")
    print("=" * 80)
    
    supabase = get_supabase_client()
    
    # 1. Tìm user "Dương" hoặc tạo test user
    print("\n1. Tìm nhân viên Dương...")
    # Tìm theo first_name hoặc last_name chứa "Dương"
    employees_result = supabase.table("employees").select("id, first_name, last_name, email, user_id").ilike("first_name", "%Dương%").limit(5).execute()
    
    if not employees_result.data:
        # Thử tìm theo last_name
        employees_result = supabase.table("employees").select("id, first_name, last_name, email, user_id").ilike("last_name", "%Dương%").limit(5).execute()
    
    if not employees_result.data:
        print("❌ Không tìm thấy nhân viên Dương")
        print("   Vui lòng tạo nhân viên Dương trước khi test")
        return
    
    duong_employee = employees_result.data[0]
    duong_user_id = duong_employee.get("user_id")
    duong_name = f"{duong_employee.get('first_name', '')} {duong_employee.get('last_name', '')}".strip()
    
    print(f"✅ Tìm thấy: {duong_name} (ID: {duong_employee.get('id')}, User ID: {duong_user_id})")
    
    if not duong_user_id:
        print("⚠️  Nhân viên Dương chưa có user_id, cần liên kết với user account")
        return
    
    # 2. Tìm một user khác để tạo dự án (hoặc dùng Dương)
    print("\n2. Tìm user để tạo dự án...")
    users_result = supabase.table("users").select("id, email, full_name").eq("is_active", True).limit(5).execute()
    
    if not users_result.data:
        print("❌ Không tìm thấy user nào")
        return
    
    creator_user = users_result.data[0]
    creator_user_id = creator_user.get("id")
    creator_name = creator_user.get("full_name") or creator_user.get("email")
    
    print(f"✅ Sử dụng user: {creator_name} (ID: {creator_user_id})")
    
    # 3. Tạo dự án test
    print("\n3. Tạo dự án test...")
    project_data = {
        "name": f"Test Project - {datetime.now().strftime('%Y%m%d_%H%M%S')}",
        "project_code": f"TEST{datetime.now().strftime('%Y%m%d%H%M%S')}",
        "description": "Dự án test thông báo",
        "status": "planning",
        "priority": "medium",
        "start_date": datetime.now().date().isoformat(),
        "budget": 1000000,
        "actual_cost": 0
    }
    
    project_result = supabase.table("projects").insert(project_data).execute()
    
    if not project_result.data:
        print("❌ Không thể tạo dự án")
        return
    
    project = project_result.data[0]
    project_id = project.get("id")
    project_name = project.get("name")
    
    print(f"✅ Đã tạo dự án: {project_name} (ID: {project_id})")
    
    # 4. Kiểm tra thông báo sau khi tạo dự án
    print("\n4. Kiểm tra thông báo sau khi tạo dự án...")
    import time
    time.sleep(3)  # Đợi thông báo được tạo (background task)
    
    # Lấy thông báo của Dương (nếu Dương là thành viên đội ngũ)
    notifications_after_create = supabase.table("notifications")\
        .select("*")\
        .eq("user_id", duong_user_id)\
        .eq("type", "project_created")\
        .eq("entity_id", project_id)\
        .order("created_at", desc=True)\
        .limit(5)\
        .execute()
    
    if notifications_after_create.data:
        print(f"✅ Tìm thấy {len(notifications_after_create.data)} thông báo 'project_created' cho Dương:")
        for notif in notifications_after_create.data:
            print(f"   - {notif.get('title')}")
            print(f"     {notif.get('message')}")
    else:
        print("⚠️  Chưa có thông báo 'project_created' cho Dương")
        print("   (Có thể Dương chưa được thêm vào đội ngũ dự án)")
    
    # 5. Thêm Dương vào đội ngũ dự án
    print("\n5. Thêm Dương vào đội ngũ dự án...")
    
    # Lấy email của Dương
    duong_email = duong_employee.get("email")
    
    team_member_data = {
        "project_id": project_id,
        "name": duong_name,
        "role": "member",
        "email": duong_email,
        "user_id": duong_user_id,
        "start_date": datetime.now().date().isoformat(),
        "status": "active"
    }
    
    team_result = supabase.table("project_team").insert(team_member_data).execute()
    
    if not team_result.data:
        print("❌ Không thể thêm Dương vào đội ngũ")
        return
    
    print(f"✅ Đã thêm Dương vào đội ngũ dự án")
    
    # 6. Kiểm tra thông báo sau khi thêm thành viên
    print("\n6. Kiểm tra thông báo sau khi thêm thành viên...")
    time.sleep(3)  # Đợi thông báo được tạo (background task)
    
    # Lấy thông báo của tất cả thành viên (trừ người thêm)
    all_team_members = supabase.table("project_team")\
        .select("user_id")\
        .eq("project_id", project_id)\
        .eq("status", "active")\
        .not_.is_("user_id", "null")\
        .execute()
    
    team_user_ids = [m.get("user_id") for m in (all_team_members.data or []) if m.get("user_id")]
    
    print(f"   Đội ngũ dự án có {len(team_user_ids)} thành viên có user_id")
    
    notifications_after_add = supabase.table("notifications")\
        .select("*")\
        .in_("user_id", team_user_ids)\
        .eq("type", "team_member_added")\
        .eq("entity_id", project_id)\
        .order("created_at", desc=True)\
        .limit(10)\
        .execute()
    
    if notifications_after_add.data:
        print(f"✅ Tìm thấy {len(notifications_after_add.data)} thông báo 'team_member_added':")
        for notif in notifications_after_add.data[:5]:
            user_info = supabase.table("users").select("full_name, email").eq("id", notif.get("user_id")).limit(1).execute()
            user_name = user_info.data[0].get("full_name") or user_info.data[0].get("email") if user_info.data else "Unknown"
            print(f"   - Cho {user_name}: {notif.get('title')}")
            print(f"     {notif.get('message')}")
    else:
        print("⚠️  Chưa có thông báo 'team_member_added'")
    
    # 7. Tổng kết
    print("\n" + "=" * 80)
    print("TỔNG KẾT")
    print("=" * 80)
    print(f"✅ Dự án đã tạo: {project_name}")
    print(f"✅ Dương đã được thêm vào đội ngũ")
    print(f"\n📋 Kiểm tra trên web:")
    print(f"   1. Vào trang dự án: /projects/{project_id}")
    print(f"   2. Kiểm tra thông báo của các thành viên đội ngũ")
    print(f"   3. Xem trong bảng notifications của database")
    
    # 8. Hiển thị tất cả thông báo liên quan đến dự án
    print("\n8. Tất cả thông báo liên quan đến dự án:")
    all_project_notifications = supabase.table("notifications")\
        .select("*")\
        .eq("entity_id", project_id)\
        .order("created_at", desc=True)\
        .execute()
    
    if all_project_notifications.data:
        print(f"   Tổng cộng: {len(all_project_notifications.data)} thông báo")
        for notif in all_project_notifications.data:
            user_name = notif.get("users", {}).get("full_name") or notif.get("users", {}).get("email", "Unknown")
            print(f"\n   - Type: {notif.get('type')}")
            print(f"     User: {user_name}")
            print(f"     Title: {notif.get('title')}")
            print(f"     Message: {notif.get('message')}")
            print(f"     Created: {notif.get('created_at')}")
    else:
        print("   ⚠️  Không có thông báo nào")
    
    print("\n" + "=" * 80)

if __name__ == "__main__":
    test_notifications()
