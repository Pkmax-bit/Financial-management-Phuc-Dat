"""
Script to create default tasks for a specific project
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

def create_tasks_for_project(project_name_search="test8"):
    """Create default tasks for a project"""
    print("=" * 80)
    print(f"TẠO NHIỆM VỤ MẪU CHO DỰ ÁN: {project_name_search}")
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
        
        print(f"   ✅ Tìm thấy {len(projects_result.data)} dự án:")
        for i, project in enumerate(projects_result.data, 1):
            print(f"      {i}. {project.get('name')} (Code: {project.get('project_code')}, ID: {project.get('id')[:8]}...)")
        
        # Lấy dự án đầu tiên (mới nhất)
        project = projects_result.data[0]
        project_id = project.get('id')
        project_name = project.get('name')
        project_code = project.get('project_code')
        
        print()
        print(f"2. Kiểm tra nhiệm vụ hiện tại...")
        
        # Kiểm tra xem đã có tasks chưa
        existing_tasks = supabase.table("tasks").select("id").eq("project_id", project_id).execute()
        existing_count = len(existing_tasks.data) if existing_tasks.data else 0
        
        if existing_count > 0:
            print(f"   ⚠️  Dự án đã có {existing_count} nhiệm vụ")
            response = input("   Bạn có muốn xóa và tạo lại không? (y/n): ")
            if response.lower() == 'y':
                print("   Đang xóa nhiệm vụ cũ...")
                supabase.table("tasks").delete().eq("project_id", project_id).execute()
                print("   ✅ Đã xóa nhiệm vụ cũ")
            else:
                print("   ❌ Hủy bỏ. Không tạo nhiệm vụ mới.")
                return
        else:
            print("   ✅ Dự án chưa có nhiệm vụ")
        
        print()
        print(f"3. Tạo nhiệm vụ mẫu cho dự án: {project_name}")
        print(f"   Project ID: {project_id}")
        print(f"   Project Code: {project_code}")
        print()
        
        # Lấy user ID từ manager hoặc tìm admin user
        manager_id = project.get('manager_id')
        created_by = None
        
        if manager_id:
            # Lấy user_id từ employee
            employee_result = supabase.table("employees").select("user_id").eq("id", manager_id).single().execute()
            if employee_result.data and employee_result.data.get("user_id"):
                created_by = employee_result.data.get("user_id")
        
        if not created_by:
            # Tìm admin user
            admin_user = supabase.table("users").select("id").eq("role", "admin").limit(1).execute()
            if admin_user.data and len(admin_user.data) > 0:
                created_by = admin_user.data[0].get("id")
        
        if not created_by:
            print("   ❌ Không tìm thấy user để tạo nhiệm vụ")
            return
        
        print(f"   Created by user ID: {created_by[:8]}...")
        print()
        
        # Tạo tasks
        print("   Đang tạo nhiệm vụ mẫu...")
        task_ids = create_default_tasks_for_project(
            supabase=supabase,
            project_id=project_id,
            created_by=created_by,
            default_responsibles=None
        )
        
        print(f"   ✅ Đã tạo {len(task_ids)} nhiệm vụ")
        print()
        
        # Verify
        print("4. Kiểm tra lại...")
        final_tasks = supabase.table("tasks").select("id, title, parent_id").eq("project_id", project_id).execute()
        final_count = len(final_tasks.data) if final_tasks.data else 0
        
        print(f"   ✅ Tổng số nhiệm vụ trong database: {final_count}")
        
        if final_count > 0:
            parent_tasks = [t for t in final_tasks.data if t.get("parent_id") is None]
            sub_tasks = [t for t in final_tasks.data if t.get("parent_id") is not None]
            
            print(f"   - Parent tasks: {len(parent_tasks)}")
            print(f"   - Sub tasks: {len(sub_tasks)}")
            
            if len(parent_tasks) == 1:
                print("   ✅ Cấu trúc đúng: 1 parent task")
            else:
                print(f"   ⚠️  Có {len(parent_tasks)} parent tasks (mong đợi 1)")
        
        print()
        print("=" * 80)
        print("✅ HOÀN TẤT: Đã tạo nhiệm vụ mẫu cho dự án!")
        print("=" * 80)
        
    except Exception as e:
        print(f"❌ Lỗi: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    import sys
    project_name = sys.argv[1] if len(sys.argv) > 1 else "test8"
    create_tasks_for_project(project_name)
