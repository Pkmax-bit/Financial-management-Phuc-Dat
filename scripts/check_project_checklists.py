"""
Script to check checklists for a specific project
"""
import os
import sys
import io
if sys.stdout.encoding != 'utf-8':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

from supabase import create_client

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

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_SERVICE_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
    print("❌ Chưa cấu hình Supabase credentials!")
    sys.exit(1)

def check_project_checklists(project_name_search="Trang"):
    """Check checklists for a project"""
    print("=" * 80)
    print(f"KIỂM TRA CHECKLISTS CHO DỰ ÁN: {project_name_search}")
    print("=" * 80)
    print()
    
    try:
        supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
        
        # Tìm dự án
        print(f"1. Tìm dự án có tên chứa '{project_name_search}'...")
        projects_result = supabase.table("projects").select("id, project_code, name").ilike("name", f"%{project_name_search}%").order("created_at", desc=True).limit(5).execute()
        
        if not projects_result.data or len(projects_result.data) == 0:
            print(f"   ❌ Không tìm thấy dự án nào có tên chứa '{project_name_search}'")
            return
        
        project = projects_result.data[0]
        project_id = project.get('id')
        project_name = project.get('name')
        
        print(f"   ✅ Dự án: {project_name} (ID: {project_id[:8]}...)")
        print()
        
        # Lấy tasks của dự án
        print("2. Lấy tasks của dự án...")
        tasks_result = supabase.table("tasks").select("id, title, parent_id").eq("project_id", project_id).execute()
        tasks = tasks_result.data if tasks_result.data else []
        
        print(f"   ✅ Tìm thấy {len(tasks)} tasks")
        print()
        
        # Kiểm tra checklists cho mỗi task
        print("3. Kiểm tra checklists cho từng task:")
        print()
        
        for task in tasks:
            task_id = task.get('id')
            task_title = task.get('title')
            parent_id = task.get('parent_id')
            
            # Lấy checklists
            checklists_result = supabase.table("task_checklists").select("id, title, task_id").eq("task_id", task_id).execute()
            checklists = checklists_result.data if checklists_result.data else []
            
            if checklists:
                indent = "      " if parent_id else "   "
                print(f"{indent}📌 {task_title} (ID: {task_id[:8]}...)")
                print(f"{indent}   ✅ Có {len(checklists)} checklist(s):")
                
                for checklist in checklists:
                    checklist_id = checklist.get('id')
                    checklist_title = checklist.get('title')
                    
                    # Lấy checklist items
                    items_result = supabase.table("task_checklist_items").select("id, content, is_completed").eq("checklist_id", checklist_id).execute()
                    items = items_result.data if items_result.data else []
                    completed = len([i for i in items if i.get('is_completed')])
                    
                    print(f"{indent}      - {checklist_title}: {completed}/{len(items)} hoàn thành")
                    
                    # Hiển thị một vài items
                    for item in items[:3]:
                        status = "✅" if item.get('is_completed') else "⏳"
                        content = item.get('content', '')[:50]
                        print(f"{indent}         {status} {content}")
                    if len(items) > 3:
                        print(f"{indent}         ... và {len(items) - 3} items khác")
                print()
        
        # Tổng kết
        total_checklists = 0
        total_items = 0
        for task in tasks:
            task_id = task.get('id')
            checklists_result = supabase.table("task_checklists").select("id").eq("task_id", task_id).execute()
            checklists = checklists_result.data if checklists_result.data else []
            total_checklists += len(checklists)
            
            for checklist in checklists:
                items_result = supabase.table("task_checklist_items").select("id").eq("checklist_id", checklist.get('id')).execute()
                items = items_result.data if items_result.data else []
                total_items += len(items)
        
        print("=" * 80)
        print(f"TỔNG KẾT:")
        print(f"   - Tasks: {len(tasks)}")
        print(f"   - Checklists: {total_checklists}")
        print(f"   - Checklist items: {total_items}")
        print("=" * 80)
        
    except Exception as e:
        print(f"❌ Lỗi: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    import sys
    project_name = sys.argv[1] if len(sys.argv) > 1 else "Trang"
    check_project_checklists(project_name)
