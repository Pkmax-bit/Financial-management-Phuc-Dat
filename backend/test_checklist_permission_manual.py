"""
Script test thủ công để kiểm tra logic phân quyền checklist
Chạy script này và làm theo hướng dẫn để test
"""
import sys
import os

# Fix encoding for Windows console
if sys.platform == 'win32':
    import codecs
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'strict')
    sys.stderr = codecs.getwriter('utf-8')(sys.stderr.buffer, 'strict')

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from services.supabase_client import get_supabase_client
from routers.projects import _get_checklist_group_for_status, _auto_assign_checklist_permissions_for_status

def print_section(title):
    print("\n" + "="*60)
    print(title)
    print("="*60)

def check_status_mapping():
    """Kiểm tra mapping status -> checklist group"""
    print_section("KIỂM TRA MAPPING STATUS -> CHECKLIST GROUP")
    
    statuses = ["THỎA THUẬN", "XƯỞNG SẢN XUẤT", "VẬN CHUYỂN", "LẮP ĐẶT", 
                "CHĂM SÓC KHÁCH HÀNG", "BÁO CÁO / SỬA CHỮA", "HOÀN THÀNH"]
    
    for status in statuses:
        group = _get_checklist_group_for_status(status)
        print(f"  {status:30} -> {group}")

def check_accountable_employees(supabase, status_name):
    """Kiểm tra nhân viên accountable cho một status"""
    print_section(f"KIỂM TRA NHÂN VIÊN ACCOUNTABLE CHO: {status_name}")
    
    mapping_result = supabase.table("checklist_status_responsible_mapping").select(
        "employee_id, status, responsibility_type, is_active"
    ).eq("status", status_name).eq("responsibility_type", "accountable").eq("is_active", True).execute()
    
    if not mapping_result.data:
        print(f"  ⚠️  Không tìm thấy nhân viên accountable cho status '{status_name}'")
        print(f"  💡 Cần tạo mapping trong bảng checklist_status_responsible_mapping")
        return []
    
    employee_ids = [item.get("employee_id") for item in mapping_result.data if item.get("employee_id")]
    
    if employee_ids:
        employees_result = supabase.table("employees").select("id, first_name, last_name, email").in_("id", employee_ids).execute()
        print(f"  ✅ Tìm thấy {len(employee_ids)} nhân viên:")
        for emp in (employees_result.data or []):
            name = f"{emp.get('first_name', '')} {emp.get('last_name', '')}".strip()
            print(f"     - {name} (ID: {emp.get('id')}, Email: {emp.get('email', 'N/A')})")
    
    return employee_ids

def check_project_tasks(supabase, project_id):
    """Kiểm tra tasks và checklists của project"""
    print_section(f"KIỂM TRA TASKS VÀ CHECKLISTS CỦA PROJECT: {project_id}")
    
    # Lấy project info
    project_result = supabase.table("projects").select("id, name, status_id").eq("id", project_id).execute()
    if not project_result.data:
        print(f"  ❌ Project {project_id} không tồn tại")
        return None, None
    
    project = project_result.data[0]
    print(f"  Project: {project.get('name')} (ID: {project_id})")
    
    # Lấy status
    status_id = project.get('status_id')
    if status_id:
        status_result = supabase.table("project_statuses").select("name").eq("id", status_id).single().execute()
        if status_result.data:
            status_name = status_result.data.get('name')
            print(f"  Status hiện tại: {status_name}")
    
    # Lấy parent task
    parent_tasks_result = supabase.table("tasks").select("id, title").eq(
        "project_id", project_id
    ).is_("parent_id", "null").is_("deleted_at", "null").limit(1).execute()
    
    if not parent_tasks_result.data:
        print(f"  ⚠️  Không tìm thấy parent task")
        return None, None
    
    parent_task = parent_tasks_result.data[0]
    parent_task_id = parent_task.get("id")
    print(f"  ✅ Parent task: {parent_task.get('title')} (ID: {parent_task_id})")
    
    # Lấy checklists
    checklists_result = supabase.table("task_checklists").select("id, title").eq(
        "task_id", parent_task_id
    ).execute()
    
    if not checklists_result.data:
        print(f"  ⚠️  Không tìm thấy checklists")
        return parent_task_id, None
    
    print(f"  ✅ Tìm thấy {len(checklists_result.data)} checklist(s):")
    for checklist in checklists_result.data:
        print(f"     - {checklist.get('title')} (ID: {checklist.get('id')})")
    
    return parent_task_id, checklists_result.data

def check_checklist_items_permissions(supabase, checklist_id, checklist_title):
    """Kiểm tra permissions của checklist items"""
    print_section(f"KIỂM TRA PERMISSIONS CỦA CHECKLIST: {checklist_title}")
    
    items_result = supabase.table("task_checklist_items").select("id, content").eq(
        "checklist_id", checklist_id
    ).execute()
    
    if not items_result.data:
        print(f"  ⚠️  Không có checklist items")
        return
    
    print(f"  ✅ Tìm thấy {len(items_result.data)} checklist item(s):")
    
    for item in items_result.data:
        item_id = item.get("id")
        item_content = item.get("content")
        
        assignments_result = supabase.table("task_checklist_item_assignments").select(
            "employee_id, responsibility_type"
        ).eq("checklist_item_id", item_id).eq("responsibility_type", "accountable").execute()
        
        if assignments_result.data:
            employee_ids = [a.get("employee_id") for a in assignments_result.data if a.get("employee_id")]
            if employee_ids:
                employees_result = supabase.table("employees").select("id, first_name, last_name").in_("id", employee_ids).execute()
                print(f"     ✅ '{item_content}':")
                for emp in (employees_result.data or []):
                    name = f"{emp.get('first_name', '')} {emp.get('last_name', '')}".strip()
                    print(f"        - {name} (accountable)")
            else:
                print(f"     ⚠️  '{item_content}': Có assignment nhưng không có employee_id hợp lệ")
        else:
            print(f"     ⚠️  '{item_content}': Chưa có accountable assignment")

def test_auto_assign(supabase, project_id, status_name):
    """Test hàm auto assign"""
    print_section(f"TEST AUTO ASSIGN PERMISSIONS")
    print(f"  Project ID: {project_id}")
    print(f"  Status: {status_name}")
    
    try:
        _auto_assign_checklist_permissions_for_status(supabase, project_id, status_name)
        print(f"  ✅ Auto assign completed successfully")
        return True
    except Exception as e:
        print(f"  ❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

def main():
    print("\n" + "="*60)
    print("CHECKLIST PERMISSION MANUAL TEST")
    print("="*60)
    
    supabase = get_supabase_client()
    
    # 1. Kiểm tra mapping
    check_status_mapping()
    
    # 2. Kiểm tra nhân viên accountable
    print("\n" + "-"*60)
    status_to_check = input("\nNhập status để kiểm tra nhân viên accountable (hoặc Enter để bỏ qua): ").strip()
    if status_to_check:
        check_accountable_employees(supabase, status_to_check)
    
    # 3. Kiểm tra project
    print("\n" + "-"*60)
    project_id = input("\nNhập Project ID để kiểm tra (hoặc Enter để bỏ qua): ").strip()
    if project_id:
        parent_task_id, checklists = check_project_tasks(supabase, project_id)
        
        if checklists:
            # 4. Kiểm tra permissions của checklist
            print("\n" + "-"*60)
            checklist_title = input("\nNhập tên checklist để kiểm tra permissions (hoặc Enter để bỏ qua): ").strip()
            if checklist_title:
                checklist_found = None
                for checklist in checklists:
                    if checklist.get('title') == checklist_title:
                        checklist_found = checklist
                        break
                
                if checklist_found:
                    check_checklist_items_permissions(supabase, checklist_found.get('id'), checklist_title)
                else:
                    print(f"  ❌ Không tìm thấy checklist '{checklist_title}'")
            
            # 5. Test auto assign
            print("\n" + "-"*60)
            test_status = input("\nNhập status để test auto assign (hoặc Enter để bỏ qua): ").strip()
            if test_status:
                if test_auto_assign(supabase, project_id, test_status):
                    # Kiểm tra lại permissions sau khi assign
                    group_name = _get_checklist_group_for_status(test_status)
                    if group_name:
                        checklist_found = None
                        for checklist in checklists:
                            if checklist.get('title') == group_name:
                                checklist_found = checklist
                                break
                        
                        if checklist_found:
                            print("\n" + "-"*60)
                            print("KIỂM TRA PERMISSIONS SAU KHI AUTO ASSIGN:")
                            check_checklist_items_permissions(supabase, checklist_found.get('id'), group_name)
    
    print("\n" + "="*60)
    print("TEST HOÀN TẤT")
    print("="*60)

if __name__ == "__main__":
    main()
