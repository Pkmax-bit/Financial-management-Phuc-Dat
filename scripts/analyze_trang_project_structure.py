"""
Script to analyze the structure of "Chị Trang" project
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

def analyze_project_structure():
    """Analyze the structure of Trang project"""
    print("=" * 100)
    print("PHÂN TÍCH CẤU TRÚC DỰ ÁN: Chị Trang - 480/15 Nguyễn Tri Phương,Q10")
    print("=" * 100)
    print()
    
    try:
        supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
        
        # Tìm dự án
        print("1. Tìm dự án...")
        projects_result = supabase.table("projects").select("id, project_code, name, start_date").ilike("name", "%Trang%").order("created_at", desc=True).limit(5).execute()
        
        if not projects_result.data or len(projects_result.data) == 0:
            print("   ❌ Không tìm thấy dự án")
            return
        
        project = projects_result.data[0]
        project_id = project.get('id')
        project_name = project.get('name')
        
        print(f"   ✅ Dự án: {project_name}")
        print(f"   ID: {project_id}")
        print()
        
        # Lấy tất cả tasks
        print("2. Cấu trúc Tasks:")
        print()
        tasks_result = supabase.table("tasks").select("id, title, parent_id, status, priority, created_at").eq("project_id", project_id).order("created_at").execute()
        tasks = tasks_result.data if tasks_result.data else []
        
        # Phân loại tasks
        parent_tasks = [t for t in tasks if t.get('parent_id') is None]
        sub_tasks = [t for t in tasks if t.get('parent_id') is not None]
        
        print(f"   📊 Tổng số tasks: {len(tasks)}")
        print(f"   - Parent tasks (parent_id = null): {len(parent_tasks)}")
        print(f"   - Sub-tasks (có parent_id): {len(sub_tasks)}")
        print()
        
        # Hiển thị parent tasks
        for parent in parent_tasks:
            parent_id = parent.get('id')
            parent_title = parent.get('title')
            print(f"   📌 {parent_title} (ID: {parent_id[:8]}...)")
            
            # Tìm sub-tasks của parent này
            children = [t for t in sub_tasks if t.get('parent_id') == parent_id]
            print(f"      └─ {len(children)} sub-task(s)")
            
            # Kiểm tra checklists cho parent task
            checklists_result = supabase.table("task_checklists").select("id, title").eq("task_id", parent_id).execute()
            checklists = checklists_result.data if checklists_result.data else []
            
            if checklists:
                print(f"      └─ {len(checklists)} checklist(s):")
                for checklist in checklists:
                    checklist_id = checklist.get('id')
                    checklist_title = checklist.get('title')
                    
                    # Lấy checklist items
                    items_result = supabase.table("task_checklist_items").select("id, content, is_completed, sort_order").eq("checklist_id", checklist_id).order("sort_order").execute()
                    items = items_result.data if items_result.data else []
                    completed = len([i for i in items if i.get('is_completed')])
                    
                    print(f"         ├─ {checklist_title}: {completed}/{len(items)} hoàn thành")
                    for item in items[:5]:  # Hiển thị 5 items đầu
                        status = "✅" if item.get('is_completed') else "☐"
                        content = item.get('content', '')[:50]
                        print(f"         │  {status} {content}")
                    if len(items) > 5:
                        print(f"         │  ... và {len(items) - 5} items khác")
            
            # Hiển thị sub-tasks
            if children:
                print(f"      └─ Sub-tasks:")
                for child in children[:5]:  # Hiển thị 5 sub-tasks đầu
                    child_title = child.get('title')
                    child_status = child.get('status', 'todo')
                    print(f"         ├─ {child_title} ({child_status})")
                if len(children) > 5:
                    print(f"         └─ ... và {len(children) - 5} sub-tasks khác")
            
            print()
        
        # Tổng kết
        print("=" * 100)
        print("TỔNG KẾT CẤU TRÚC:")
        print(f"   - 1 parent task (tên dự án)")
        print(f"   - {len(sub_tasks)} sub-tasks")
        
        # Đếm checklists
        total_checklists = 0
        total_checklist_items = 0
        for parent in parent_tasks:
            checklists_result = supabase.table("task_checklists").select("id").eq("task_id", parent.get('id')).execute()
            checklists = checklists_result.data if checklists_result.data else []
            total_checklists += len(checklists)
            
            for checklist in checklists:
                items_result = supabase.table("task_checklist_items").select("id").eq("checklist_id", checklist.get('id')).execute()
                items = items_result.data if items_result.data else []
                total_checklist_items += len(items)
        
        print(f"   - {total_checklists} checklist(s)")
        print(f"   - {total_checklist_items} checklist item(s)")
        print()
        print("CẤU TRÚC:")
        print("   Parent Task (tên dự án)")
        print("   ├─ Checklists (với checkbox items)")
        print("   └─ Sub-tasks (nếu có)")
        print("=" * 100)
        
    except Exception as e:
        print(f"❌ Lỗi: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    analyze_project_structure()
