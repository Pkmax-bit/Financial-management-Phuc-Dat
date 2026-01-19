# Logic Tạo Nhiệm Vụ Mẫu Khi Tạo Dự Án - Backend

## Tổng quan
Khi tạo dự án mới từ backend, hệ thống sẽ tự động tạo các nhiệm vụ mẫu theo template đã định nghĩa.

## Template Nhiệm Vụ Mẫu

### 1. Kế hoạch (5 sub-tasks)
- Đo đạt
- Thiết kế / cập nhật bản vẽ
- Kế hoạch vật tư
- Kế hoạch sản xuất
- Kế hoạch lắp đặt

### 2. Sản xuất (3 sub-tasks)
- Mua hàng
- Sản xuất
- Hoàn thành

### 3. Vận chuyển / lắp đặt (4 sub-tasks)
- Vận chuyển
- Lắp đặt
- Nghiệm thu bàn giao
- Thu tiền

### 4. Chăm sóc khách hàng (3 sub-tasks)
- Đánh giá khách hàng
- Báo cáo / sửa chữa
- Nghiệm thu tính lương

**Tổng cộng: 4 parent tasks + 15 sub-tasks = 19 tasks**

## Flow Tạo Tasks

### 1. Backend API: `POST /api/projects`
```python
# backend/routers/projects.py
@router.post("/", response_model=Project)
async def create_project(...):
    # 1. Tạo project
    result = supabase.table("projects").insert(project_dict).execute()
    
    # 2. Thêm manager vào project_team
    
    # 3. Tạo tasks mẫu
    task_ids = create_default_tasks_for_project(
        supabase=supabase,
        project_id=project_id,
        created_by=current_user.id,
        default_responsibles=None
    )
```

### 2. Service: `create_default_tasks_for_project()`
```python
# backend/services/project_default_tasks_service.py
def create_default_tasks_for_project(
    supabase,
    project_id: str,
    created_by: str,
    default_responsibles: Optional[dict] = None
) -> List[str]:
    # Tạo từng parent task và sub-tasks
    for task_group in DEFAULT_TASKS_TEMPLATE:
        # 1. Tạo parent task
        parent_task = create_parent_task(...)
        
        # 2. Tạo sub-tasks với parent_id
        for sub_task in task_group["sub_tasks"]:
            create_sub_task(..., parent_id=parent_task_id)
        
        # 3. Thêm task_participants nếu có default_responsibles
```

## RLS Policies

### Tasks Table
- ✅ `Service role can insert tasks` - Backend có thể tạo tasks
- ✅ `Service role can read tasks` - Backend có thể đọc tasks
- ✅ `Authenticated users can create tasks` - Users có thể tạo tasks

### Task Participants Table
- ✅ `Service role can insert task_participants` - Backend có thể tạo participants
- ✅ `Service role can read task_participants` - Backend có thể đọc participants
- ✅ `Authenticated users can create task_participants` - Users có thể tạo participants

## Database Triggers

### Trigger: `trigger_create_task_on_project_create`
- **Function**: `create_task_for_project()`
- **Mục đích**: Tạo 1 task chính (tên = project name) khi tạo project
- **Lưu ý**: Trigger này tạo task đơn giản, không tạo template đầy đủ

### Backend Service vs Trigger
- **Trigger**: Tạo 1 task chính (nếu có category_id)
- **Backend Service**: Tạo 19 tasks mẫu theo template
- **Kết quả**: Cả 2 đều chạy, không conflict vì trigger tạo task với title = project name, còn service tạo tasks với title từ template

## Logging

Backend sẽ log chi tiết:
```
✅ Creating default tasks for project {project_id}
✅ Successfully created {count} default tasks
✅ Total tasks in project after creation: {count}
Sample task titles: [...]
```

## Error Handling

- Nếu tạo tasks thất bại, project vẫn được tạo thành công
- Error được log chi tiết để debug
- User có thể tạo tasks thủ công sau nếu cần

## Files Liên Quan

1. **Backend Router**: `backend/routers/projects.py`
   - Endpoint: `POST /api/projects`
   - Gọi `create_default_tasks_for_project()` sau khi tạo project

2. **Service**: `backend/services/project_default_tasks_service.py`
   - Function: `create_default_tasks_for_project()`
   - Template: `DEFAULT_TASKS_TEMPLATE`

3. **Migrations**:
   - `add_service_role_policy_for_tasks.sql` - RLS cho tasks
   - `add_service_role_policy_for_task_participants.sql` - RLS cho task_participants

## Testing

Để test logic tạo tasks:
1. Tạo project mới từ frontend
2. Kiểm tra logs backend để xem tasks được tạo
3. Kiểm tra database để verify tasks đã được tạo đúng
4. Verify parent-child relationships giữa tasks

## Lưu ý

- Backend sử dụng `service_role` key để bypass RLS
- Tasks được tạo với `created_by` = user ID của người tạo project
- `start_date` của tasks = `start_date` của project
- Tasks mặc định có `status = "todo"`, `priority = "medium"`
