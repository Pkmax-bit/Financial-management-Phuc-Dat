# Kiểm Tra Phân Quyền Quản Lý Checklist

## Tổng Quan

Tài liệu này kiểm tra xem hệ thống đã có đầy đủ:
1. ✅ Bảng lưu nhân viên được quản lý checklist
2. ✅ Phân quyền quản lý nhiệm vụ checklist
3. ✅ Code chuyển đổi quản lý khi chuyển trạng thái

## 1. Bảng Lưu Nhân Viên Được Quản Lý Checklist

### ✅ Bảng `task_checklist_item_assignments`

**Mục đích:** Lưu nhiều nhân viên được gán cho mỗi checklist item với vai trò (RACI)

**Cấu trúc:**
```sql
CREATE TABLE task_checklist_item_assignments (
    id UUID PRIMARY KEY,
    checklist_item_id UUID REFERENCES task_checklist_items(id) ON DELETE CASCADE,
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    responsibility_type TEXT CHECK (responsibility_type IN ('accountable', 'responsible', 'consulted', 'informed')),
    created_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(checklist_item_id, employee_id)
);
```

**Vai trò:**
- `accountable`: Chịu trách nhiệm chính (có quyền quản lý)
- `responsible`: Thực hiện
- `consulted`: Tư vấn
- `informed`: Thông báo

**Trạng thái:** ✅ Đã có trong database

### ✅ Bảng `checklist_status_responsible_mapping`

**Mục đích:** Lưu mapping giữa trạng thái checklist và người chịu trách nhiệm

**Cấu trúc:**
```sql
CREATE TABLE checklist_status_responsible_mapping (
    id UUID PRIMARY KEY,
    status TEXT NOT NULL,
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    responsibility_type TEXT DEFAULT 'accountable',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES users(id),
    UNIQUE(status, employee_id, responsibility_type)
);
```

**Trạng thái:** ✅ Đã có trong database

### ✅ Cột `status` trong `task_checklist_items`

**Mục đích:** Lưu trạng thái hiện tại của checklist item

**Cấu trúc:**
```sql
ALTER TABLE task_checklist_items
ADD COLUMN status TEXT;
```

**Trạng thái:** ✅ Đã có trong database

## 2. Phân Quyền Quản Lý Nhiệm Vụ Checklist

### ✅ Frontend (ProjectTasksTab.tsx)

**Hàm kiểm tra quyền:**
```typescript
const canManageChecklistItem = (item: TaskChecklistItem) => {
  if (!user) return false
  
  // Admin/Manager always have permission
  if (isAdminOrManager()) return true
  
  // Get current user's employee_id from groupMembers
  const currentEmployee = groupMembers.find(m => 
    (user.email && m.employee_email === user.email) ||
    (user.id && m.employee_id === (user as any).employee_id)
  )
  
  const currentEmployeeId = currentEmployee?.employee_id
  if (!currentEmployeeId) return false
  
  // Check if user is the accountable person for this checklist item's status
  const itemStatus = (item as any).status
  if (itemStatus && statusResponsibleMapping[itemStatus]) {
    const responsibleEmployeeId = statusResponsibleMapping[itemStatus]
    if (currentEmployeeId === responsibleEmployeeId) {
      return true
    }
  }
  
  // Check if user is in assignments with accountable role
  if (item.assignments && item.assignments.length > 0) {
    const accountableAssignment = item.assignments.find((a: any) => 
      a.responsibility_type === 'accountable' && a.employee_id === currentEmployeeId
    )
    if (accountableAssignment) {
      return true
    }
  }
  
  return false
}
```

**Áp dụng phân quyền:**
- ✅ Ẩn nút Edit/Delete nếu không có quyền
- ✅ Chỉ hiển thị nút Edit/Delete cho người có quyền quản lý

**Trạng thái:** ✅ Đã có code

### ⚠️ Backend (tasks.py)

**Hiện trạng:**
- ❌ Chưa có kiểm tra quyền trong endpoint `update_checklist_item`
- ❌ Chưa có kiểm tra quyền trong endpoint `delete_checklist_item`
- ❌ Chưa có kiểm tra quyền trong endpoint `create_checklist_item`

**Cần thêm:**
- Kiểm tra quyền dựa trên status và accountable person trước khi cho phép update/delete
- Kiểm tra quyền dựa trên task participants trước khi cho phép create

**Trạng thái:** ✅ Đã thêm code phân quyền trong backend

**Hàm kiểm tra quyền:**
```python
def _can_manage_checklist_item(supabase, checklist_item_id: str, user_id: str) -> bool:
    """Kiểm tra user có quyền quản lý checklist item không
    
    Quyền quản lý được cấp cho:
    1. Admin/Manager
    2. Người chịu trách nhiệm (accountable) cho trạng thái hiện tại của checklist item
    3. Người có assignment với responsibility_type = 'accountable' cho checklist item này
    """
```

**Áp dụng:**
- ✅ `update_checklist_item`: Kiểm tra quyền trước khi update
- ✅ `delete_checklist_item`: Kiểm tra quyền trước khi delete

## 3. Code Chuyển Đổi Quản Lý Khi Chuyển Trạng Thái

### ✅ Database Trigger

**Trigger function:**
```sql
CREATE OR REPLACE FUNCTION update_checklist_responsible_on_status_change()
RETURNS TRIGGER AS $$
DECLARE
    new_responsible_employee_id UUID;
    old_responsible_employee_id UUID;
BEGIN
    -- Chỉ xử lý khi status thay đổi và status mới không null
    IF OLD.status IS DISTINCT FROM NEW.status AND NEW.status IS NOT NULL THEN
        -- Lấy người chịu trách nhiệm mới từ mapping
        SELECT employee_id INTO new_responsible_employee_id
        FROM checklist_status_responsible_mapping
        WHERE status = NEW.status
          AND responsibility_type = 'accountable'
          AND is_active = true
        LIMIT 1;
        
        -- Nếu tìm thấy người chịu trách nhiệm mới
        IF new_responsible_employee_id IS NOT NULL THEN
            -- Lấy người chịu trách nhiệm cũ (nếu có)
            SELECT employee_id INTO old_responsible_employee_id
            FROM task_checklist_item_assignments
            WHERE checklist_item_id = NEW.id
              AND responsibility_type = 'accountable'
            LIMIT 1;
            
            -- Xóa assignment cũ (accountable) nếu có và khác với mới
            IF old_responsible_employee_id IS NOT NULL 
               AND old_responsible_employee_id != new_responsible_employee_id THEN
                DELETE FROM task_checklist_item_assignments
                WHERE checklist_item_id = NEW.id
                  AND employee_id = old_responsible_employee_id
                  AND responsibility_type = 'accountable';
            END IF;
            
            -- Thêm assignment mới (hoặc cập nhật nếu đã tồn tại)
            INSERT INTO task_checklist_item_assignments 
            (checklist_item_id, employee_id, responsibility_type)
            VALUES (NEW.id, new_responsible_employee_id, 'accountable')
            ON CONFLICT (checklist_item_id, employee_id) 
            DO UPDATE SET responsibility_type = 'accountable';
            
            -- Cập nhật assignee_id (người thực hiện chính)
            UPDATE task_checklist_items
            SET assignee_id = new_responsible_employee_id
            WHERE id = NEW.id;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

**Trigger:**
```sql
CREATE TRIGGER trigger_update_checklist_responsible
    AFTER UPDATE OF status ON task_checklist_items
    FOR EACH ROW
    WHEN (OLD.status IS DISTINCT FROM NEW.status)
    EXECUTE FUNCTION update_checklist_responsible_on_status_change();
```

**Trạng thái:** ✅ Đã có trigger trong database

### ✅ Frontend Logic

**Tự động gán nhân viên khi chọn trạng thái:**
```typescript
const handleStatusChange = (status: string, checklistId: string, isEditing: boolean = false) => {
  if (isEditing) {
    setEditingChecklistItemStatus(status)
    // Auto-assign responsible person if mapping exists
    if (status && statusResponsibleMapping[status]) {
      const responsibleEmployeeId = statusResponsibleMapping[status]
      // Remove old accountable assignments
      const newAssignments = editingChecklistItemAssignments.filter(a => a.responsibility_type !== 'accountable')
      // Add new accountable assignment
      newAssignments.push({
        employee_id: responsibleEmployeeId,
        responsibility_type: 'accountable'
      })
      setEditingChecklistItemAssignments(newAssignments)
    }
  } else {
    // Similar logic for creating new items
  }
}
```

**Trạng thái:** ✅ Đã có code trong frontend

## Tóm Tắt

| Thành Phần | Trạng Thái | Ghi Chú |
|------------|-----------|---------|
| Bảng `task_checklist_item_assignments` | ✅ Có | Lưu nhân viên được gán cho checklist items |
| Bảng `checklist_status_responsible_mapping` | ✅ Có | Lưu mapping trạng thái → người chịu trách nhiệm |
| Cột `status` trong `task_checklist_items` | ✅ Có | Lưu trạng thái checklist item |
| Trigger chuyển đổi quản lý | ✅ Có | Tự động đổi người chịu trách nhiệm khi status thay đổi |
| Phân quyền Frontend | ✅ Có | Hàm `canManageChecklistItem` kiểm tra quyền |
| Phân quyền Backend | ✅ Có | Đã thêm hàm `_can_manage_checklist_item` và áp dụng vào endpoints |
| Logic tự động gán Frontend | ✅ Có | Tự động gán nhân viên khi chọn trạng thái |

## Cần Bổ Sung

### 1. Thêm Phân Quyền Backend

Cần thêm hàm kiểm tra quyền trong backend:

```python
def can_manage_checklist_item(supabase, checklist_item_id: str, user_id: str) -> bool:
    """Kiểm tra user có quyền quản lý checklist item không"""
    # Lấy employee_id từ user_id
    emp_result = supabase.table("employees").select("id").eq("user_id", user_id).single().execute()
    if not emp_result.data:
        return False
    
    employee_id = emp_result.data["id"]
    
    # Kiểm tra xem user có phải admin không
    user_result = supabase.table("users").select("role").eq("id", user_id).single().execute()
    if user_result.data and user_result.data.get("role") == "admin":
        return True
    
    # Lấy checklist item với status
    item_result = supabase.table("task_checklist_items").select("status").eq("id", checklist_item_id).single().execute()
    if not item_result.data:
        return False
    
    item_status = item_result.data.get("status")
    
    # Kiểm tra xem employee có phải accountable cho status này không
    if item_status:
        mapping_result = supabase.table("checklist_status_responsible_mapping").select("employee_id").eq(
            "status", item_status
        ).eq("employee_id", employee_id).eq("responsibility_type", "accountable").eq("is_active", True).execute()
        
        if mapping_result.data:
            return True
    
    # Kiểm tra xem employee có phải accountable trong assignments không
    assignment_result = supabase.table("task_checklist_item_assignments").select("*").eq(
        "checklist_item_id", checklist_item_id
    ).eq("employee_id", employee_id).eq("responsibility_type", "accountable").execute()
    
    return len(assignment_result.data) > 0
```

Sau đó áp dụng vào các endpoints:
- `update_checklist_item`: Kiểm tra quyền trước khi update
- `delete_checklist_item`: Kiểm tra quyền trước khi delete
- `create_checklist_item`: Kiểm tra quyền (nếu cần)

## Kết Luận

✅ **Đã có:**
- Bảng lưu nhân viên được quản lý checklist
- Trigger tự động chuyển đổi quản lý khi chuyển trạng thái
- Phân quyền frontend
- Logic tự động gán nhân viên khi chọn trạng thái

✅ **Đã hoàn thành:**
- Phân quyền backend cho các API endpoints (update và delete)
