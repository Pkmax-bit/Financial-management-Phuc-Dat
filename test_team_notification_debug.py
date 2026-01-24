"""
Test script để debug thông báo khi thêm thành viên vào đội ngũ
"""
import os
import sys
import asyncio
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
from services.notification_service import notification_service

async def test_notification():
    """Test notification creation"""
    print("=" * 80)
    print("TEST NOTIFICATION CREATION")
    print("=" * 80)
    
    supabase = get_supabase_client()
    
    # 1. Lấy một project_id bất kỳ
    print("\n1. Lấy project_id...")
    projects_result = supabase.table("projects").select("id, name").limit(1).execute()
    if not projects_result.data:
        print("❌ Không tìm thấy dự án nào")
        return
    
    project_id = projects_result.data[0]["id"]
    project_name = projects_result.data[0]["name"]
    print(f"✅ Project: {project_name} (ID: {project_id})")
    
    # 2. Lấy team members của project
    print("\n2. Lấy team members...")
    team_result = supabase.table("project_team")\
        .select("id, name, user_id, status")\
        .eq("project_id", project_id)\
        .eq("status", "active")\
        .execute()
    
    print(f"   Tìm thấy {len(team_result.data) if team_result.data else 0} thành viên")
    if team_result.data:
        for member in team_result.data:
            print(f"   - {member.get('name')} (user_id: {member.get('user_id')})")
    
    # 3. Test get_project_team_user_ids
    print("\n3. Test get_project_team_user_ids...")
    try:
        user_ids = await notification_service.get_project_team_user_ids(project_id)
        print(f"✅ get_project_team_user_ids returned: {user_ids}")
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return
    
    # 4. Test tạo notification
    print("\n4. Test tạo notification...")
    if user_ids:
        test_user_id = user_ids[0]
        print(f"   Sẽ tạo notification cho user_id: {test_user_id}")
        
        notification_payload = {
            "user_id": test_user_id,
            "title": "Test: Thành viên mới",
            "message": f"Test notification cho dự án {project_name}",
            "type": "team_member_added",
            "entity_type": "project",
            "entity_id": project_id,
            "is_read": False,
            "action_url": f"/projects/{project_id}"
        }
        
        try:
            result = supabase.table("notifications").insert(notification_payload).execute()
            if result.data:
                print(f"✅ Notification created: {result.data[0].get('id')}")
            else:
                print(f"❌ Failed to create notification: {result}")
        except Exception as e:
            print(f"❌ Error creating notification: {e}")
            import traceback
            traceback.print_exc()
    else:
        print("⚠️  Không có user_ids để test")
    
    print("\n" + "=" * 80)

if __name__ == "__main__":
    asyncio.run(test_notification())
