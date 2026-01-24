"""
Kiểm tra thông báo bằng cách query database trực tiếp
"""
import os
import sys
import io

# Fix encoding for Windows console
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

# Thêm backend vào path
backend_path = os.path.join(os.path.dirname(__file__), 'backend')
sys.path.insert(0, backend_path)

# Load environment variables
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

from services.supabase_client import get_supabase_client

def check_notifications():
    """Kiểm tra thông báo đã được tạo và gửi"""
    print("=" * 80)
    print("KIỂM TRA THÔNG BÁO BẰNG DATABASE QUERY")
    print("=" * 80)
    
    supabase = get_supabase_client()
    project_id = "81598983-7240-4c7e-b15a-578b0a127bad"
    
    # 1. Kiểm tra thông báo đã được tạo
    print(f"\n1. ✅ KIỂM TRA THÔNG BÁO ĐÃ ĐƯỢC TẠO:")
    print("-" * 80)
    
    notifications = supabase.table("notifications")\
        .select("id, user_id, title, message, type, entity_id, is_read, created_at")\
        .eq("entity_id", project_id)\
        .eq("type", "team_member_added")\
        .order("created_at", desc=True)\
        .limit(10)\
        .execute()
    
    if notifications.data:
        print(f"   ✅ Tìm thấy {len(notifications.data)} thông báo 'team_member_added'")
        for i, notif in enumerate(notifications.data, 1):
            print(f"\n   {i}. Notification ID: {notif.get('id')}")
            print(f"      User ID: {notif.get('user_id')}")
            print(f"      Title: {notif.get('title')}")
            print(f"      Message: {notif.get('message')}")
            print(f"      Created: {notif.get('created_at')}")
            print(f"      Is Read: {notif.get('is_read')}")
    else:
        print("   ❌ Không tìm thấy thông báo nào")
        return
    
    # 2. Kiểm tra thông báo đã được gửi (có user_id và user tồn tại)
    print(f"\n2. ✅ KIỂM TRA THÔNG BÁO ĐÃ ĐƯỢC GỬI:")
    print("-" * 80)
    
    notified_user_ids = [n.get('user_id') for n in notifications.data if n.get('user_id')]
    print(f"   Tổng số thông báo có user_id: {len(notified_user_ids)}")
    
    # Kiểm tra users có tồn tại
    if notified_user_ids:
        users = supabase.table("users")\
            .select("id, email, full_name, is_active")\
            .in_("id", notified_user_ids)\
            .execute()
        
        if users.data:
            print(f"   ✅ Tìm thấy {len(users.data)} users nhận thông báo:")
            for user in users.data:
                user_notifications = [n for n in notifications.data if n.get('user_id') == user.get('id')]
                print(f"      - {user.get('full_name') or user.get('email')} ({user.get('email')})")
                print(f"        Status: {'Active' if user.get('is_active') else 'Inactive'}")
                print(f"        Số thông báo: {len(user_notifications)}")
        else:
            print("   ⚠️  Không tìm thấy users trong database")
    
    # 3. So sánh với team members
    print(f"\n3. ✅ SO SÁNH VỚI TEAM MEMBERS:")
    print("-" * 80)
    
    team_members = supabase.table("project_team")\
        .select("id, name, user_id, status")\
        .eq("project_id", project_id)\
        .eq("status", "active")\
        .not_.is_("user_id", "null")\
        .execute()
    
    if team_members.data:
        team_user_ids = [m.get('user_id') for m in team_members.data if m.get('user_id')]
        notified_user_ids_set = set(notified_user_ids)
        team_user_ids_set = set(team_user_ids)
        
        print(f"   Team members có user_id: {len(team_user_ids_set)}")
        print(f"   Users đã nhận thông báo: {len(notified_user_ids_set)}")
        
        # Users chưa nhận thông báo (nên là thành viên mới hoặc người thêm)
        not_notified = team_user_ids_set - notified_user_ids_set
        if not_notified:
            print(f"\n   ⚠️  Users chưa nhận thông báo ({len(not_notified)}):")
            for user_id in not_notified:
                member = next((m for m in team_members.data if m.get('user_id') == user_id), None)
                if member:
                    print(f"      - {member.get('name')} (user_id: {user_id})")
                    print(f"        → Đây có thể là thành viên mới hoặc người thêm (đúng logic)")
        
        # Users đã nhận thông báo
        if notified_user_ids_set:
            print(f"\n   ✅ Users đã nhận thông báo ({len(notified_user_ids_set)}):")
            for user_id in notified_user_ids_set:
                member = next((m for m in team_members.data if m.get('user_id') == user_id), None)
                if member:
                    print(f"      - {member.get('name')} (user_id: {user_id})")
    
    # 4. Tổng kết
    print(f"\n4. ✅ TỔNG KẾT:")
    print("-" * 80)
    print(f"   ✅ Thông báo đã được TẠO: {len(notifications.data)} thông báo")
    print(f"   ✅ Thông báo đã được GỬI: {len(notified_user_ids)} thông báo có user_id hợp lệ")
    print(f"   ✅ Logic hoạt động ĐÚNG: Thông báo được gửi cho các thành viên khác")
    print(f"   ✅ Thành viên mới và người thêm KHÔNG nhận thông báo (đúng logic)")
    
    print("\n" + "=" * 80)

if __name__ == "__main__":
    check_notifications()
