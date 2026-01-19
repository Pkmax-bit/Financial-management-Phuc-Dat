"""
Service to automatically create default tasks when a project is created
"""
from typing import List, Optional
from datetime import datetime
import uuid
import logging

logger = logging.getLogger(__name__)

# Định nghĩa cấu trúc nhiệm vụ mặc định
DEFAULT_TASKS_TEMPLATE = [
    {
        "title": "Kế hoạch",
        "sub_tasks": [
            {"title": "Đo đạt", "default_responsible": None},  # STT 1
            {"title": "Thiết kế / cập nhật bản vẽ", "default_responsible": None},
            {"title": "Kế hoạch vật tư", "default_responsible": None},
            {"title": "Kế hoạch sản xuất", "default_responsible": None},
            {"title": "Kế hoạch lắp đặt", "default_responsible": None},
        ]
    },
    {
        "title": "Sản xuất",
        "sub_tasks": [
            {"title": "Mua hàng", "default_responsible": None},  # STT 6
            {"title": "Sản xuất", "default_responsible": None},
            {"title": "Hoàn thành", "default_responsible": None},
        ]
    },
    {
        "title": "Vận chuyển / lắp đặt",
        "sub_tasks": [
            {"title": "Vận chuyển", "default_responsible": None},  # STT 9
            {"title": "Lắp đặt", "default_responsible": None},
            {"title": "Nghiệm thu bàn giao", "default_responsible": None},
            {"title": "Thu tiền", "default_responsible": None},
        ]
    },
    {
        "title": "Chăm sóc khách hàng",
        "sub_tasks": [
            {"title": "Đánh giá khách hàng", "default_responsible": None},  # STT 13
            {"title": "Báo cáo / sửa chữa", "default_responsible": None},
            {"title": "Nghiệm thu tính lương", "default_responsible": None},
        ]
    },
]


def create_default_tasks_for_project(
    supabase,
    project_id: str,
    created_by: str,
    default_responsibles: Optional[dict] = None
) -> List[str]:
    """
    Tự động tạo các nhiệm vụ mặc định cho dự án
    
    Cấu trúc (giống dự án "Trang"):
    1. Tạo 1 nhiệm vụ lớn = tên dự án (parent task, không có parent_id)
    2. Tạo checklists trực tiếp trong parent task (KHÔNG tạo sub-tasks)
    3. Mỗi nhóm nhiệm vụ mẫu (Kế hoạch, Sản xuất, etc.) = 1 checklist
    4. Các nhiệm vụ nhỏ = checklist items với checkbox hoàn thành
    
    Args:
        supabase: Supabase client
        project_id: ID của dự án
        created_by: User ID của người tạo
        default_responsibles: Dict mapping task title -> list of employee_ids
                            Ví dụ: {"Kế hoạch": ["emp1", "emp2"], "Sản xuất": ["emp3"]}
    
    Returns:
        List of created task IDs
    """
    created_task_ids = []
    default_responsibles = default_responsibles or {}
    
    try:
        logger.info(f"Starting to create default tasks for project {project_id}, created_by: {created_by}")
        
        # Kiểm tra xem đã có tasks chưa (tránh tạo duplicate)
        # Lưu ý: Chỉ skip nếu đã có đầy đủ tasks mẫu (1 parent task + 4 checklists + 15 items)
        # QUAN TRỌNG: Đối với project mới, sẽ không có tasks nên sẽ tạo mới
        existing_check = supabase.table("tasks").select("id, title, parent_id").eq("project_id", project_id).execute()
        if existing_check.data and len(existing_check.data) > 0:
            existing_tasks = existing_check.data
            parent_tasks = [t for t in existing_tasks if t.get('parent_id') is None]
            
            # Kiểm tra xem đã có checklists chưa
            if len(parent_tasks) > 0:
                parent_task_id = parent_tasks[0].get('id')
                checklists_check = supabase.table("task_checklists").select("id").eq("task_id", parent_task_id).execute()
                checklists_count = len(checklists_check.data) if checklists_check.data else 0
                
                # Nếu đã có đầy đủ (1 parent task + 4 checklists), skip
                # CHỈ skip nếu có đầy đủ 4 checklists và ít nhất 10 checklist items
                if len(parent_tasks) == 1 and checklists_count >= 4:
                    # Verify checklist items count too
                    parent_task_id = parent_tasks[0].get('id')
                    checklists_result = supabase.table("task_checklists").select("id").eq("task_id", parent_task_id).execute()
                    total_items = 0
                    for checklist in (checklists_result.data or []):
                        items_result = supabase.table("task_checklist_items").select("id").eq("checklist_id", checklist.get('id')).execute()
                        items = items_result.data if items_result.data else []
                        total_items += len(items)
                    
                    # CHỈ skip nếu có đầy đủ cả checklists VÀ items (ít nhất 10 items)
                    if total_items >= 10:
                        logger.info(f"✅ Project {project_id} already has complete task structure (1 parent task + {checklists_count} checklists + {total_items} items). Skipping.")
                        logger.info(f"   Verified: {checklists_count} checklists, {total_items} checklist items")
                        return []  # Return empty list to indicate no new tasks were created
                    else:
                        logger.warning(f"⚠️  Project {project_id} has {checklists_count} checklists but only {total_items} items (expected >= 10). Will recreate...")
                else:
                    # Có tasks nhưng chưa đầy đủ → có thể là trigger tạo hoặc incomplete
                    logger.warning(f"⚠️  Project {project_id} has {len(existing_tasks)} tasks but incomplete structure (parent: {len(parent_tasks)}, checklists: {checklists_count})")
                    logger.warning(f"   Will delete existing tasks and recreate with correct structure...")
                    # Xóa tasks cũ để tạo lại
                    try:
                        supabase.table("tasks").delete().eq("project_id", project_id).execute()
                        logger.info(f"   Deleted {len(existing_tasks)} existing tasks")
                    except Exception as delete_error:
                        logger.error(f"   Error deleting existing tasks: {str(delete_error)}")
                        # Continue anyway - will try to create
            else:
                # Có tasks nhưng không có parent task → xóa và tạo lại
                logger.warning(f"⚠️  Project {project_id} has {len(existing_tasks)} tasks but no parent task. Will delete and recreate...")
                try:
                    supabase.table("tasks").delete().eq("project_id", project_id).execute()
                    logger.info(f"   Deleted {len(existing_tasks)} existing tasks")
                except Exception as delete_error:
                    logger.error(f"   Error deleting existing tasks: {str(delete_error)}")
                    # Continue anyway - will try to create
        
        # Lấy thông tin dự án để lấy start_date và name
        project_result = supabase.table("projects").select("start_date, name").eq("id", project_id).single().execute()
        project_start_date = None
        project_name = None
        if project_result.data:
            project_start_date = project_result.data.get("start_date")
            project_name = project_result.data.get("name")
        
        logger.info(f"Project name: {project_name}")
        logger.info(f"Project start_date: {project_start_date}")
        
        # Bước 1: Tạo nhiệm vụ lớn = tên dự án (parent task chính)
        main_parent_task_id = str(uuid.uuid4())
        main_parent_task_data = {
            "id": main_parent_task_id,
            "title": project_name or f"Dự án {project_id[:8]}",
            "description": f"Nhiệm vụ cho dự án {project_name or project_id}",
            "status": "todo",
            "priority": "medium",
            "project_id": project_id,
            "created_by": created_by,
            "start_date": project_start_date,
            "estimated_time": 0,
            "time_spent": 0,
            "parent_id": None,  # Nhiệm vụ lớn không có parent
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }
        
        try:
            result = supabase.table("tasks").insert(main_parent_task_data).execute()
            logger.info(f"Successfully created main parent task {main_parent_task_id}: {project_name}")
            created_task_ids.append(main_parent_task_id)
        except Exception as insert_error:
            logger.error(f"Failed to insert main parent task: {str(insert_error)}")
            raise
        
        logger.info(f"Will create {len(DEFAULT_TASKS_TEMPLATE)} checklists directly in main parent task")
        
        # Bước 2: Tạo checklists trực tiếp trong parent task (không tạo sub-tasks)
        # Giống cấu trúc dự án "Trang": 1 parent task + checklists trực tiếp
        for task_group in DEFAULT_TASKS_TEMPLATE:
            task_group_title = task_group["title"]  # Tên nhóm nhiệm vụ (Kế hoạch, Sản xuất, etc.)
            sub_tasks = task_group["sub_tasks"]
            
            logger.info(f"Creating checklist: {task_group_title} with {len(sub_tasks)} items")
            
            # Tạo checklist trực tiếp trong main parent task (không tạo sub-task)
            checklist_id = str(uuid.uuid4())
            checklist_data = {
                "id": checklist_id,
                "task_id": main_parent_task_id,  # Checklist trực tiếp trong parent task
                "title": task_group_title,  # Tên checklist = tên nhóm nhiệm vụ (Kế hoạch, Sản xuất, etc.)
                "created_by": created_by,
                "created_at": datetime.utcnow().isoformat()
                # Note: task_checklists table doesn't have updated_at column
            }
            
            try:
                result = supabase.table("task_checklists").insert(checklist_data).execute()
                logger.info(f"Successfully created checklist {checklist_id}: {task_group_title}")
            except Exception as insert_error:
                logger.error(f"Failed to insert checklist for {task_group_title}: {str(insert_error)}")
                raise
            
            # Tạo checklist items cho mỗi nhiệm vụ nhỏ
            checklist_items = []
            for idx, sub_task in enumerate(sub_tasks):
                sub_task_title = sub_task["title"]
                checklist_item_id = str(uuid.uuid4())
                checklist_item_data = {
                    "id": checklist_item_id,
                    "checklist_id": checklist_id,
                    "content": sub_task_title,
                    "is_completed": False,
                    "sort_order": idx + 1,
                    "created_at": datetime.utcnow().isoformat()
                    # Note: task_checklist_items table doesn't have updated_at or created_by columns
                }
                checklist_items.append(checklist_item_data)
            
            # Insert tất cả checklist items cùng lúc
            if checklist_items:
                try:
                    result = supabase.table("task_checklist_items").insert(checklist_items).execute()
                    logger.info(f"Successfully created {len(checklist_items)} checklist items for {task_group_title}")
                except Exception as insert_error:
                    logger.error(f"Failed to insert checklist items for {task_group_title}: {str(insert_error)}")
                    raise
            
            # Thêm người phụ trách cho checklist (nếu có)
            # Lấy danh sách employee_ids từ default_responsibles
            responsible_employee_ids = default_responsibles.get(task_group_title, [])
            
            # Nếu không có trong default_responsibles, có thể lấy từ sub_task default_responsible
            if not responsible_employee_ids:
                for sub_task in sub_tasks:
                    if sub_task.get("default_responsible"):
                        if sub_task["default_responsible"] not in responsible_employee_ids:
                            responsible_employee_ids.append(sub_task["default_responsible"])
            
            # Tạo task_participants cho main parent task với role "responsible" (nếu có)
            # Lưu ý: Người phụ trách được gán cho parent task, không phải checklist
            if responsible_employee_ids:
                participants = []
                for employee_id in responsible_employee_ids:
                    participants.append({
                        "task_id": main_parent_task_id,  # Gán cho parent task
                        "employee_id": employee_id,
                        "role": "responsible",  # Người phụ trách
                        "added_by": created_by
                    })
                
                if participants:
                    supabase.table("task_participants").insert(participants).execute()
        
        logger.info(f"Created {len(created_task_ids)} default tasks for project {project_id}")
        return created_task_ids
        
    except Exception as e:
        logger.error(f"❌ Error creating default tasks for project {project_id}: {str(e)}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        # Re-raise exception để caller biết có lỗi
        # Caller sẽ quyết định có fail project creation hay không
        raise
