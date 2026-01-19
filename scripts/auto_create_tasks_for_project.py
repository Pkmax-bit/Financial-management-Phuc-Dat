"""
Script to automatically create default tasks for a project (no user input required)
"""
import os
import sys
import io
if sys.stdout.encoding != 'utf-8':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

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

# Add backend to path
backend_path = os.path.join(os.path.dirname(__file__), "..", "backend")
sys.path.insert(0, backend_path)

# Change to backend directory for imports
original_cwd = os.getcwd()
os.chdir(backend_path)

from services.supabase_client import get_supabase_client
from services.project_default_tasks_service import create_default_tasks_for_project

# Restore original directory
os.chdir(original_cwd)

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_SERVICE_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
    print("❌ Chưa cấu hình Supabase credentials!")
    sys.exit(1)

def auto_create_tasks_for_project(project_name_search="test9", force_recreate=False):
    """Automatically create default tasks for a project"""
    print("=" * 80)
    print(f"TỰ ĐỘNG TẠO NHIỆM VỤ MẪU CHO DỰ ÁN: {project_name_search}")
    print("=" * 80)
    print()
    
    try:
        supabase = get_supabase_client()
        
        # Tìm dự án
        print(f"1. Tìm dự án có tên chứa '{project_name_search}'...")
        projects_result = supabase.table("projects").select("id, project_code, name, manager_id").ilike("name", f"%{project_name_search}%").order("created_at", desc=True).limit(5).execute()
        
        if not projects_result.data or len(projects_result.data) == 0:
            print(f"   ❌ Không tìm thấy dự án nào có tên chứa '{project_name_search}'")
            return
        
        project = projects_result.data[0]
        project_id = project.get('id')
        project_name = project.get('name')
        project_code = project.get('project_code')
        
        print(f"   ✅ Dự án: {project_name} (Code: {project_code}, ID: {project_id[:8]}...)")
        print()
        
        # Kiểm tra tasks hiện tại
        print("2. Kiểm tra nhiệm vụ hiện tại...")
        existing_tasks = supabase.table("tasks").select("id").eq("project_id", project_id).execute()
        existing_count = len(existing_tasks.data) if existing_tasks.data else 0
        
        if existing_count > 0:
            print(f"   ⚠️  Dự án đã có {existing_count} nhiệm vụ")
            if force_recreate:
                print("   Đang xóa nhiệm vụ cũ...")
                supabase.table("tasks").delete().eq("project_id", project_id).execute()
                print("   ✅ Đã xóa nhiệm vụ cũ")
            else:
                print("   ⚠️  Bỏ qua. Dùng --force để xóa và tạo lại.")
                return
        else:
            print("   ✅ Dự án chưa có nhiệm vụ")
        
        print()
        print(f"3. Tạo nhiệm vụ mẫu cho dự án: {project_name}")
        print()
        
        # Lấy user ID từ manager hoặc tìm admin user
        manager_id = project.get('manager_id')
        created_by = None
        
        if manager_id:
            # Tìm user_id từ employee
            employee_result = supabase.table("employees").select("user_id").eq("id", manager_id).single().execute()
            if employee_result.data and employee_result.data.get('user_id'):
                created_by = employee_result.data['user_id']
        
        # Nếu không có, tìm admin user
        if not created_by:
            admin_result = supabase.table("users").select("id").eq("role", "admin").limit(1).execute()
            if admin_result.data:
                created_by = admin_result.data[0]['id']
        
        if not created_by:
            print("   ❌ Không tìm thấy user để tạo tasks")
            return
        
        print(f"   Created by user ID: {created_by[:8]}...")
        print()
        print("   Đang tạo nhiệm vụ mẫu...")
        
        task_ids = create_default_tasks_for_project(
            supabase=supabase,
            project_id=project_id,
            created_by=created_by,
            default_responsibles=None
        )
        
        print()
        print(f"✅ Đã tạo {len(task_ids)} task(s)")
        
        # Verify
        final_tasks = supabase.table("tasks").select("id, title, parent_id").eq("project_id", project_id).execute()
        final_count = len(final_tasks.data) if final_tasks.data else 0
        
        print(f"✅ Verified: {final_count} task(s) trong database")
        
        if final_count > 0:
            parent_tasks = [t for t in final_tasks.data if t.get('parent_id') is None]
            print(f"   - Parent tasks: {len(parent_tasks)}")
            
            # Check checklists
            total_checklists = 0
            total_items = 0
            for task in final_tasks.data:
                checklists_result = supabase.table("task_checklists").select("id").eq("task_id", task.get('id')).execute()
                checklists = checklists_result.data if checklists_result.data else []
                total_checklists += len(checklists)
                
                for checklist in checklists:
                    items_result = supabase.table("task_checklist_items").select("id").eq("checklist_id", checklist.get('id')).execute()
                    items = items_result.data if items_result.data else []
                    total_items += len(items)
            
            print(f"   - Checklists: {total_checklists}")
            print(f"   - Checklist items: {total_items}")
        
        print()
        print("=" * 80)
        
    except Exception as e:
        print(f"❌ Lỗi: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    import sys
    project_name = sys.argv[1] if len(sys.argv) > 1 else "test9"
    force = "--force" in sys.argv or "-f" in sys.argv
    auto_create_tasks_for_project(project_name, force_recreate=force)
