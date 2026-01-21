"""
Test script để kiểm tra logic tự động gán quyền checklist khi chuyển trạng thái dự án
"""
import sys
import os
from typing import Optional

# Fix encoding for Windows console
if sys.platform == 'win32':
    import codecs
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'strict')
    sys.stderr = codecs.getwriter('utf-8')(sys.stderr.buffer, 'strict')

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from services.supabase_client import get_supabase_client
from routers.projects import _get_checklist_group_for_status, _auto_assign_checklist_permissions_for_status
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def test_status_to_group_mapping():
    """Test hàm mapping status name -> checklist group name"""
    print("\n" + "="*60)
    print("TEST 1: Status to Checklist Group Mapping")
    print("="*60)
    
    test_cases = [
        ("THỎA THUẬN", "Kế hoạch"),
        ("XƯỞNG SẢN XUẤT", "Sản xuất"),
        ("VẬN CHUYỂN", "Vận chuyển / lắp đặt"),
        ("LẮP ĐẶT", "Vận chuyển / lắp đặt"),
        ("CHĂM SÓC KHÁCH HÀNG", "Chăm sóc khách hàng"),
        ("BÁO CÁO / SỬA CHỮA", "Chăm sóc khách hàng"),
        ("HOÀN THÀNH", "Chăm sóc khách hàng"),
        ("INVALID STATUS", None),  # Test case không có mapping
        ("  thỏa thuận  ", "Kế hoạch"),  # Test với whitespace
        ("xưởng sản xuất", "Sản xuất"),  # Test case-insensitive
    ]
    
    passed = 0
    failed = 0
    
    for status_name, expected_group in test_cases:
        result = _get_checklist_group_for_status(status_name)
        if result == expected_group:
            print(f"✅ PASS: '{status_name}' -> '{result}'")
            passed += 1
        else:
            print(f"❌ FAIL: '{status_name}' -> Expected: '{expected_group}', Got: '{result}'")
            failed += 1
    
    print(f"\nResult: {passed} passed, {failed} failed")
    return failed == 0


def test_checklist_permission_auto_assign(project_id: Optional[str] = None):
    """Test hàm tự động gán quyền checklist"""
    print("\n" + "="*60)
    print("TEST 2: Auto Assign Checklist Permissions")
    print("="*60)
    
    if not project_id:
        print("⚠️  No project_id provided. Skipping integration test.")
        print("   To test: python test_checklist_permission_auto_assign.py <project_id>")
        return True
    
    try:
        supabase = get_supabase_client()
        
        # 1. Kiểm tra project tồn tại
        project_result = supabase.table("projects").select("id, name, status_id").eq("id", project_id).execute()
        if not project_result.data:
            print(f"❌ FAIL: Project {project_id} not found")
            return False
        
        project = project_result.data[0]
        print(f"✅ Found project: {project.get('name')} (ID: {project_id})")
        
        # 2. Lấy status hiện tại
        current_status_id = project.get('status_id')
        if current_status_id:
            status_result = supabase.table("project_statuses").select("name").eq("id", current_status_id).single().execute()
            if status_result.data:
                current_status_name = status_result.data.get('name')
                print(f"   Current status: {current_status_name}")
        
        # 3. Kiểm tra parent task tồn tại
        parent_tasks_result = supabase.table("tasks").select("id, title").eq(
            "project_id", project_id
        ).is_("parent_id", "null").is_("deleted_at", "null").limit(1).execute()
        
        if not parent_tasks_result.data:
            print(f"❌ FAIL: No parent task found for project {project_id}")
            return False
        
        parent_task = parent_tasks_result.data[0]
        print(f"✅ Found parent task: {parent_task.get('title')} (ID: {parent_task.get('id')})")
        
        # 4. Kiểm tra checklists tồn tại
        checklists_result = supabase.table("task_checklists").select("id, title").eq(
            "task_id", parent_task.get('id')
        ).execute()
        
        if not checklists_result.data:
            print(f"❌ FAIL: No checklists found for parent task")
            return False
        
        print(f"✅ Found {len(checklists_result.data)} checklist(s):")
        for checklist in checklists_result.data:
            print(f"   - {checklist.get('title')} (ID: {checklist.get('id')})")
        
        # 5. Test với các status khác nhau
        test_statuses = ["THỎA THUẬN", "XƯỞNG SẢN XUẤT", "VẬN CHUYỂN", "LẮP ĐẶT"]
        
        print(f"\n📋 Testing auto-assign for different statuses:")
        for status_name in test_statuses:
            print(f"\n   Testing status: {status_name}")
            
            # Kiểm tra có mapping không
            group_name = _get_checklist_group_for_status(status_name)
            if not group_name:
                print(f"   ⚠️  No mapping for status '{status_name}'. Skipping.")
                continue
            
            print(f"   → Maps to checklist group: '{group_name}'")
            
            # Kiểm tra có checklist group này không
            checklist_found = any(c.get('title') == group_name for c in checklists_result.data)
            if not checklist_found:
                print(f"   ⚠️  Checklist group '{group_name}' not found. Skipping.")
                continue
            
            # Kiểm tra có accountable employees cho status này không
            mapping_result = supabase.table("checklist_status_responsible_mapping").select(
                "employee_id, status"
            ).eq("status", status_name).eq("responsibility_type", "accountable").eq("is_active", True).execute()
            
            if not mapping_result.data:
                print(f"   ⚠️  No accountable employees found for status '{status_name}'. Skipping.")
                continue
            
            employee_ids = [item.get("employee_id") for item in mapping_result.data if item.get("employee_id")]
            print(f"   ✅ Found {len(employee_ids)} accountable employee(s)")
            
            # Lấy thông tin employees
            if employee_ids:
                employees_result = supabase.table("employees").select("id, first_name, last_name").in_("id", employee_ids).execute()
                if employees_result.data:
                    print(f"   Employees:")
                    for emp in employees_result.data:
                        name = f"{emp.get('first_name', '')} {emp.get('last_name', '')}".strip()
                        print(f"     - {name} (ID: {emp.get('id')})")
        
        print(f"\n✅ Integration test completed successfully")
        return True
        
    except Exception as e:
        print(f"❌ FAIL: Error during test: {str(e)}")
        import traceback
        traceback.print_exc()
        return False


def test_checklist_items_permissions(project_id: Optional[str] = None, checklist_group_name: Optional[str] = None):
    """Test xem checklist items có được gán quyền đúng không"""
    print("\n" + "="*60)
    print("TEST 3: Checklist Items Permissions Check")
    print("="*60)
    
    if not project_id or not checklist_group_name:
        print("⚠️  Missing project_id or checklist_group_name. Skipping.")
        return True
    
    try:
        supabase = get_supabase_client()
        
        # 1. Tìm parent task
        parent_tasks_result = supabase.table("tasks").select("id").eq(
            "project_id", project_id
        ).is_("parent_id", "null").is_("deleted_at", "null").limit(1).execute()
        
        if not parent_tasks_result.data:
            print(f"❌ FAIL: No parent task found")
            return False
        
        parent_task_id = parent_tasks_result.data[0].get("id")
        
        # 2. Tìm checklist
        checklists_result = supabase.table("task_checklists").select("id").eq(
            "task_id", parent_task_id
        ).eq("title", checklist_group_name).limit(1).execute()
        
        if not checklists_result.data:
            print(f"❌ FAIL: Checklist '{checklist_group_name}' not found")
            return False
        
        checklist_id = checklists_result.data[0].get("id")
        
        # 3. Lấy tất cả checklist items
        items_result = supabase.table("task_checklist_items").select("id, content").eq(
            "checklist_id", checklist_id
        ).execute()
        
        if not items_result.data:
            print(f"⚠️  No checklist items found")
            return True
        
        print(f"✅ Found {len(items_result.data)} checklist items:")
        
        # 4. Kiểm tra permissions cho mỗi item
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
                    print(f"   ✅ '{item_content}':")
                    for emp in (employees_result.data or []):
                        name = f"{emp.get('first_name', '')} {emp.get('last_name', '')}".strip()
                        print(f"      - {name} (accountable)")
                else:
                    print(f"   ⚠️  '{item_content}': No valid employee IDs")
            else:
                print(f"   ⚠️  '{item_content}': No accountable assignments")
        
        return True
        
    except Exception as e:
        print(f"❌ FAIL: Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return False


def main():
    """Main test function"""
    print("\n" + "="*60)
    print("CHECKLIST PERMISSION AUTO-ASSIGN TEST SUITE")
    print("="*60)
    
    # Test 1: Mapping function
    test1_result = test_status_to_group_mapping()
    
    # Test 2: Integration test (requires project_id)
    project_id = sys.argv[1] if len(sys.argv) > 1 else None
    test2_result = test_checklist_permission_auto_assign(project_id)
    
    # Test 3: Check permissions (optional, requires project_id and checklist_group_name)
    checklist_group_name = sys.argv[2] if len(sys.argv) > 2 else None
    test3_result = test_checklist_items_permissions(project_id, checklist_group_name)
    
    # Summary
    print("\n" + "="*60)
    print("TEST SUMMARY")
    print("="*60)
    print(f"Test 1 (Mapping): {'✅ PASSED' if test1_result else '❌ FAILED'}")
    print(f"Test 2 (Integration): {'✅ PASSED' if test2_result else '❌ FAILED'}")
    print(f"Test 3 (Permissions Check): {'✅ PASSED' if test3_result else '❌ FAILED'}")
    
    all_passed = test1_result and test2_result and test3_result
    print(f"\nOverall: {'✅ ALL TESTS PASSED' if all_passed else '❌ SOME TESTS FAILED'}")
    
    if not project_id:
        print("\n💡 Tip: Run with project_id to test integration:")
        print("   python test_checklist_permission_auto_assign.py <project_id> [checklist_group_name]")
    
    return 0 if all_passed else 1


if __name__ == "__main__":
    sys.exit(main())
