"""
Script để test tạo tasks mẫu cho project
"""
import sys
import os
import io
if sys.stdout.encoding != 'utf-8':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))

from services.supabase_client import get_supabase_client
from services.project_default_tasks_service import create_default_tasks_for_project

def test_create_tasks():
    """Test tạo tasks cho project"""
    print("=" * 100)
    print("TEST TẠO TASKS MẪU CHO PROJECT")
    print("=" * 100)
    print()
    
    # Lấy project mới nhất
    supabase = get_supabase_client()
    
    # Lấy project mới nhất không có tasks
    projects_result = supabase.table("projects").select("id, name, project_code").order("created_at", desc=True).limit(1).execute()
    
    if not projects_result.data:
        print("❌ Không tìm thấy project nào")
        return
    
    project = projects_result.data[0]
    project_id = project['id']
    project_name = project['name']
    
    print(f"Project: {project_name} (ID: {project_id})")
    print()
    
    # Kiểm tra tasks hiện tại
    tasks_result = supabase.table("tasks").select("id, title").eq("project_id", project_id).execute()
    existing_tasks = tasks_result.data if tasks_result.data else []
    
    print(f"Tasks hiện tại: {len(existing_tasks)}")
    if existing_tasks:
        for task in existing_tasks[:5]:
            print(f"  - {task.get('title', 'N/A')}")
    print()
    
    # Test tạo tasks
    print("Bước 1: Tạo tasks mẫu...")
    try:
        # Sử dụng một user_id mẫu (có thể lấy từ users table)
        users_result = supabase.table("users").select("id").limit(1).execute()
        created_by = users_result.data[0]['id'] if users_result.data else None
        
        if not created_by:
            print("❌ Không tìm thấy user để dùng làm created_by")
            return
        
        print(f"   Using created_by: {created_by}")
        
        task_ids = create_default_tasks_for_project(
            supabase=supabase,
            project_id=project_id,
            created_by=created_by,
            default_responsibles=None
        )
        
        print(f"   ✅ Created {len(task_ids)} task IDs")
        print()
        
        # Verify tasks
        print("Bước 2: Verify tasks đã được tạo...")
        final_tasks = supabase.table("tasks").select("id, title, parent_id").eq("project_id", project_id).execute()
        final_task_count = len(final_tasks.data) if final_tasks.data else 0
        
        print(f"   Total tasks: {final_task_count}")
        
        if final_tasks.data:
            parent_tasks = [t for t in final_tasks.data if t.get('parent_id') is None]
            sub_tasks = [t for t in final_tasks.data if t.get('parent_id') is not None]
            
            print(f"   Parent tasks: {len(parent_tasks)}")
            print(f"   Sub tasks: {len(sub_tasks)}")
            print()
            
            print("Sample tasks:")
            for task in final_tasks.data[:10]:
                parent_info = f" (parent: {task.get('parent_id', 'N/A')[:8]}...)" if task.get('parent_id') else " [PARENT]"
                print(f"   - {task.get('title', 'N/A')}{parent_info}")
        else:
            print("   ⚠️  Không có tasks nào được tạo!")
            
    except Exception as e:
        print(f"   ❌ Error: {e}")
        import traceback
        traceback.print_exc()
    
    print()
    print("=" * 100)

if __name__ == "__main__":
    test_create_tasks()
