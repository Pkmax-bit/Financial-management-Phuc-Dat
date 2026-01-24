"""
Script để verify thông báo đã được tạo
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

def verify_notifications():
    """Verify notifications were created"""
    print("=" * 80)
    print("VERIFY NOTIFICATIONS")
    print("=" * 80)
    
    supabase = get_supabase_client()
    
    # Project ID từ log
    project_id = "81598983-7240-4c7e-b15a-578b0a127bad"
    
    print(f"\n1. Kiểm tra thông báo cho project: {project_id}")
    
    # Lấy thông báo team_member_added
    notifications = supabase.table("notifications")\
        .select("*")\
        .eq("entity_id", project_id)\
        .eq("type", "team_member_added")\
        .order("created_at", desc=True)\
        .limit(10)\
        .execute()
    
    if notifications.data:
        print(f"\n✅ Tìm thấy {len(notifications.data)} thông báo 'team_member_added':")
        print("\n" + "-" * 80)
        for i, notif in enumerate(notifications.data, 1):
            print(f"\n{i}. Notification ID: {notif.get('id')}")
            print(f"   User ID: {notif.get('user_id')}")
            print(f"   Title: {notif.get('title')}")
            print(f"   Message: {notif.get('message')}")
            print(f"   Type: {notif.get('type')}")
            print(f"   Entity ID: {notif.get('entity_id')}")
            print(f"   Is Read: {notif.get('is_read')}")
            print(f"   Created At: {notif.get('created_at')}")
    else:
        print("\n❌ Không tìm thấy thông báo nào")
    
    # Lấy thông tin team members
    print(f"\n2. Kiểm tra team members của project:")
    team_members = supabase.table("project_team")\
        .select("id, name, user_id, status")\
        .eq("project_id", project_id)\
        .eq("status", "active")\
        .not_.is_("user_id", "null")\
        .execute()
    
    if team_members.data:
        print(f"   Tìm thấy {len(team_members.data)} thành viên có user_id:")
        for member in team_members.data:
            print(f"   - {member.get('name')} (user_id: {member.get('user_id')})")
    
    # So sánh
    print(f"\n3. So sánh:")
    if notifications.data and team_members.data:
        notified_user_ids = set([n.get('user_id') for n in notifications.data])
        team_user_ids = set([m.get('user_id') for m in team_members.data])
        
        print(f"   Team members có user_id: {len(team_user_ids)}")
        print(f"   Users đã nhận thông báo: {len(notified_user_ids)}")
        print(f"   Users chưa nhận thông báo: {team_user_ids - notified_user_ids}")
        print(f"   Users đã nhận thông báo: {notified_user_ids}")
    
    print("\n" + "=" * 80)

if __name__ == "__main__":
    verify_notifications()
