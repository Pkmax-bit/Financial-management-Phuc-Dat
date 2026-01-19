"""
Script to check full structure of a project including tasks and checklists
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

def check_project_full_structure(project_name_search="test9"):
    """Check full structure of a project"""
    print("=" * 100)
    print(f"KIỂM TRA CẤU TRÚC ĐẦY ĐỦ DỰ ÁN: {project_name_search}")
    print("=" * 100)
    print()
    
    try:
        supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
        
        # Tìm dự án
        print(f"1. Tìm dự án có tên chứa '{project_name_search}'...")
        projects_result = supabase.table("projects").select("id, project_code, name, created_at").ilike("name", f"%{project_name_search}%").order("created_at", desc=True).limit(5).execute()
        
        if not projects_result.data or len(projects_result.data) == 0:
            print(f"   ❌ Không tìm thấy dự án nào có tên chứa '{project_name_search}'")
            return
        
        project = projects_result.data[0]
        project_id = project.get('id')
        project_name = project.get('name')
        project_code = project.get('project_code')
        created_at = project.get('created_at')
        
        print(f"   ✅ Dự án: {project_name}")
        print(f"   Code: {project_code}")
        print(f"   ID: {project_id}")
        print(f"   Created at: {created_at}")
        print()
        
        # Lấy tasks
        print("2. Kiểm tra Tasks:")
        tasks_result = supabase.table("tasks").select("id, title, parent_id, status, created_at").eq("project_id", project_id).execute()
        tasks = tasks_result.data if tasks_result.data else []
        
        print(f"   📊 Tổng số tasks: {len(tasks)}")
        
        if len(tasks) == 0:
            print("   ⚠️  KHÔNG CÓ TASKS NÀO!")
            print("   Có thể:")
            print("   1. Logic tạo tasks chưa được gọi")
            print("   2. Logic tạo tasks bị lỗi")
            print("   3. Tasks bị xóa sau khi tạo")
            print()
        else:
            parent_tasks = [t for t in tasks if t.get('parent_id') is None]
            sub_tasks = [t for t in tasks if t.get('parent_id') is not None]
            
            print(f"   - Parent tasks (parent_id = null): {len(parent_tasks)}")
            print(f"   - Sub-tasks (có parent_id): {len(sub_tasks)}")
            print()
            
            for task in tasks:
                task_id = task.get('id')
                task_title = task.get('title')
                parent_id = task.get('parent_id')
                status = task.get('status', 'todo')
                
                indent = "      " if parent_id else "   "
                print(f"{indent}📌 {task_title} (ID: {task_id[:8]}...) - {status}")
                if parent_id:
                    print(f"{indent}   Parent ID: {parent_id[:8]}...")
            print()
        
        # Lấy checklists
        print("3. Kiểm tra Checklists:")
        if len(tasks) > 0:
            # Lấy checklists cho tất cả tasks
            all_checklists = []
            for task in tasks:
                task_id = task.get('id')
                checklists_result = supabase.table("task_checklists").select("id, title, task_id").eq("task_id", task_id).execute()
                checklists = checklists_result.data if checklists_result.data else []
                all_checklists.extend(checklists)
            
            print(f"   📊 Tổng số checklists: {len(all_checklists)}")
            
            if len(all_checklists) == 0:
                print("   ⚠️  KHÔNG CÓ CHECKLISTS NÀO!")
                print("   Logic tạo checklists có thể chưa được gọi hoặc bị lỗi")
                print()
            else:
                for checklist in all_checklists:
                    checklist_id = checklist.get('id')
                    checklist_title = checklist.get('title')
                    task_id = checklist.get('task_id')
                    
                    # Tìm task tương ứng
                    task = next((t for t in tasks if t.get('id') == task_id), None)
                    task_title = task.get('title') if task else "Unknown"
                    
                    # Lấy checklist items
                    items_result = supabase.table("task_checklist_items").select("id, content, is_completed").eq("checklist_id", checklist_id).execute()
                    items = items_result.data if items_result.data else []
                    completed = len([i for i in items if i.get('is_completed')])
                    
                    print(f"   ├─ {checklist_title} (Task: {task_title[:30]}...)")
                    print(f"   │  Items: {completed}/{len(items)} hoàn thành")
                    if items:
                        for item in items[:3]:
                            status = "✅" if item.get('is_completed') else "☐"
                            content = item.get('content', '')[:40]
                            print(f"   │  {status} {content}")
                        if len(items) > 3:
                            print(f"   │  ... và {len(items) - 3} items khác")
                    print()
        else:
            print("   ⚠️  Không có tasks nên không thể kiểm tra checklists")
            print()
        
        # Tổng kết
        print("=" * 100)
        print("TỔNG KẾT:")
        print(f"   - Tasks: {len(tasks)}")
        if len(tasks) > 0:
            total_checklists = 0
            total_items = 0
            for task in tasks:
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
        
        if len(tasks) == 0:
            print("⚠️  VẤN ĐỀ: Dự án không có tasks!")
            print("   Cần kiểm tra:")
            print("   1. Backend logs khi tạo dự án")
            print("   2. Logic create_default_tasks_for_project có được gọi không")
            print("   3. Có lỗi RLS hoặc database constraint không")
        print("=" * 100)
        
    except Exception as e:
        print(f"❌ Lỗi: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    import sys
    project_name = sys.argv[1] if len(sys.argv) > 1 else "test9"
    check_project_full_structure(project_name)
