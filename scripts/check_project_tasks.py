"""
Script to check tasks for a specific project
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

def check_project_tasks(project_name_search="test8"):
    """Check tasks for a project"""
    print("=" * 80)
    print(f"KIỂM TRA NHIỆM VỤ CHO DỰ ÁN: {project_name_search}")
    print("=" * 80)
    print()
    
    try:
        supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
        
        # Tìm dự án
        print(f"1. Tìm dự án có tên chứa '{project_name_search}'...")
        projects_result = supabase.table("projects").select("id, project_code, name, created_at").ilike("name", f"%{project_name_search}%").order("created_at", desc=True).limit(5).execute()
        
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
        print(f"2. Kiểm tra nhiệm vụ cho dự án: {project_name}")
        print(f"   Project ID: {project_id}")
        print(f"   Project Code: {project_code}")
        print()
        
        # Lấy tất cả tasks của dự án
        tasks_result = supabase.table("tasks").select("id, title, parent_id, status, priority, created_at").eq("project_id", project_id).order("created_at").execute()
        
        if not tasks_result.data or len(tasks_result.data) == 0:
            print("   ❌ KHÔNG CÓ NHIỆM VỤ NÀO!")
            print("   ⚠️  Dự án này chưa có nhiệm vụ mẫu được tạo.")
            return
        
        tasks = tasks_result.data
        print(f"   ✅ Tìm thấy {len(tasks)} nhiệm vụ")
        print()
        
        # Phân tích cấu trúc
        parent_tasks = [t for t in tasks if t.get("parent_id") is None]
        sub_tasks = [t for t in tasks if t.get("parent_id") is not None]
        
        print(f"3. Phân tích cấu trúc:")
        print(f"   - Parent tasks (không có parent_id): {len(parent_tasks)}")
        print(f"   - Sub tasks (có parent_id): {len(sub_tasks)}")
        print()
        
        # Kiểm tra cấu trúc đúng
        if len(parent_tasks) == 1:
            print("   ✅ ĐÚNG: Có 1 parent task (tên dự án)")
        elif len(parent_tasks) > 1:
            print(f"   ⚠️  CẢNH BÁO: Có {len(parent_tasks)} parent tasks (mong đợi 1)")
            print("      Có thể do cả trigger và backend code đều tạo tasks")
        else:
            print("   ❌ SAI: Không có parent task nào")
        
        print()
        print("4. Cấu trúc nhiệm vụ:")
        print()
        
        # Tìm main parent task (tên dự án)
        main_parent = None
        for task in parent_tasks:
            if task.get("title") == project_name:
                main_parent = task
                break
        
        if not main_parent and len(parent_tasks) > 0:
            main_parent = parent_tasks[0]
        
        if main_parent:
            main_parent_id = main_parent.get("id")
            print(f"   📌 {main_parent.get('title')} (ID: {main_parent_id[:8]}...) [PARENT]")
            
            # Tìm second-level tasks (sub-tasks của main parent)
            second_level = [t for t in sub_tasks if t.get("parent_id") == main_parent_id]
            
            expected_groups = ["Kế hoạch", "Sản xuất", "Vận chuyển / lắp đặt", "Chăm sóc khách hàng"]
            found_groups = [t.get("title") for t in second_level]
            
            print(f"      ├─ Tìm thấy {len(second_level)} nhiệm vụ cấp 2:")
            
            for task in second_level:
                # Tìm third-level tasks
                third_level = [t for t in sub_tasks if t.get("parent_id") == task.get("id")]
                marker = "✅" if task.get("title") in expected_groups else "⚠️"
                print(f"      │  {marker} {task.get('title')} ({len(third_level)} sub-tasks)")
                
                # Hiển thị một vài sub-tasks
                for sub_task in third_level[:3]:
                    print(f"      │     ├─ {sub_task.get('title')}")
                if len(third_level) > 3:
                    print(f"      │     └─ ... và {len(third_level) - 3} nhiệm vụ khác")
        else:
            print("   ❌ Không tìm thấy main parent task")
            # Hiển thị tất cả parent tasks
            for task in parent_tasks:
                print(f"   - {task.get('title')} (ID: {task.get('id')[:8]}...)")
        
        print()
        print("5. Kiểm tra nhiệm vụ mẫu:")
        expected_tasks = [
            "Kế hoạch", "Sản xuất", "Vận chuyển / lắp đặt", "Chăm sóc khách hàng",
            "Đo đạt", "Thiết kế / cập nhật bản vẽ", "Kế hoạch vật tư", 
            "Kế hoạch sản xuất", "Kế hoạch lắp đặt", "Mua hàng", "Hoàn thành",
            "Vận chuyển", "Lắp đặt", "Nghiệm thu bàn giao", "Thu tiền",
            "Đánh giá khách hàng", "Báo cáo / sửa chữa", "Nghiệm thu tính lương"
        ]
        
        task_titles = [t.get("title") for t in tasks]
        found_expected = [title for title in expected_tasks if title in task_titles]
        missing_expected = [title for title in expected_tasks if title not in task_titles]
        
        print(f"   ✅ Tìm thấy {len(found_expected)}/{len(expected_tasks)} nhiệm vụ mẫu")
        if missing_expected:
            print(f"   ⚠️  Thiếu {len(missing_expected)} nhiệm vụ mẫu:")
            for missing in missing_expected[:5]:
                print(f"      - {missing}")
            if len(missing_expected) > 5:
                print(f"      ... và {len(missing_expected) - 5} nhiệm vụ khác")
        
        print()
        print("=" * 80)
        if len(parent_tasks) == 1 and len(found_expected) >= len(expected_tasks) - 2:
            print("✅ KẾT QUẢ: Dự án có đầy đủ nhiệm vụ mẫu với cấu trúc đúng!")
        elif len(parent_tasks) > 1:
            print("⚠️  KẾT QUẢ: Dự án có nhiệm vụ nhưng có duplicate parent tasks")
            print("   Cần disable database trigger (xem FIX_DUPLICATE_TASKS.md)")
        else:
            print("❌ KẾT QUẢ: Dự án thiếu nhiệm vụ mẫu hoặc cấu trúc không đúng")
        print("=" * 80)
        
    except Exception as e:
        print(f"❌ Lỗi: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    import sys
    project_name = sys.argv[1] if len(sys.argv) > 1 else "test8"
    check_project_tasks(project_name)
