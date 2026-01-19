"""
Script để tạo tasks mẫu cho project mới nhất
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

def create_tasks_for_latest_project():
    """Tạo tasks mẫu cho project mới nhất"""
    print("=" * 100)
    print("TẠO TASKS MẪU CHO PROJECT MỚI NHẤT")
    print("=" * 100)
    print()
    
    supabase = get_supabase_client()
    
    # Lấy project mới nhất
    projects_result = supabase.table("projects").select("id, name, project_code, created_at").order("created_at", desc=True).limit(1).execute()
    
    if not projects_result.data:
        print("❌ Không tìm thấy project nào")
        return
    
    project = projects_result.data[0]
    project_id = project['id']
    project_name = project['name']
    project_code = project['project_code']
    
    print(f"📋 Project: {project_name}")
    print(f"   Code: {project_code}")
    print(f"   ID: {project_id}")
    print()
    
    # Kiểm tra tasks hiện tại
    tasks_result = supabase.table("tasks").select("id").eq("project_id", project_id).execute()
    existing_count = len(tasks_result.data) if tasks_result.data else 0
    
    print(f"📊 Tasks hiện tại: {existing_count}")
    
    if existing_count > 0:
        print(f"⚠️  Project đã có {existing_count} tasks. Bạn có muốn tạo thêm không?")
        print("   (Script sẽ tạo tasks mẫu bất kể đã có tasks hay chưa)")
    print()
    
    # Lấy user_id để dùng làm created_by
    users_result = supabase.table("users").select("id, email, role").order("created_at").limit(1).execute()
    created_by = users_result.data[0]['id'] if users_result.data else None
    
    if not created_by:
        print("❌ Không tìm thấy user để dùng làm created_by")
        return
    
    print(f"👤 Using created_by: {created_by}")
    print()
    
    # Tạo tasks mẫu
    print("🔄 Đang tạo tasks mẫu...")
    try:
        task_ids = create_default_tasks_for_project(
            supabase=supabase,
            project_id=project_id,
            created_by=created_by,
            default_responsibles=None
        )
        
        print(f"✅ Function returned {len(task_ids)} task IDs")
        print()
        
        # Verify tasks
        import time
        time.sleep(1)  # Đợi database commit
        
        final_tasks = supabase.table("tasks").select("id, title, parent_id").eq("project_id", project_id).execute()
        final_task_count = len(final_tasks.data) if final_tasks.data else 0
        
        print(f"📊 Kết quả:")
        print(f"   Total tasks trong database: {final_task_count}")
        
        if final_task_count == 0:
            print("   ❌ ERROR: Tasks không được tạo trong database!")
        else:
            parent_tasks = [t for t in final_tasks.data if t.get('parent_id') is None]
            sub_tasks = [t for t in final_tasks.data if t.get('parent_id') is not None]
            
            print(f"   ✅ Parent tasks: {len(parent_tasks)}")
            print(f"   ✅ Sub tasks: {len(sub_tasks)}")
            print()
            
            print("📝 Danh sách tasks:")
            current_parent = None
            for task in final_tasks.data:
                if task.get('parent_id') is None:
                    # Parent task
                    current_parent = task.get('title')
                    print(f"   📌 {task.get('title', 'N/A')} [PARENT]")
                else:
                    # Sub task
                    print(f"      └─ {task.get('title', 'N/A')}")
            
            if final_task_count >= 19:
                print()
                print("✅ Hoàn thành! Đã tạo đủ 19 tasks mẫu (4 parent + 15 sub)")
            else:
                print()
                print(f"⚠️  Chỉ có {final_task_count} tasks, mong đợi ít nhất 19 tasks")
            
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
    
    print()
    print("=" * 100)

if __name__ == "__main__":
    create_tasks_for_latest_project()
