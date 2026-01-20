# Quản Lý Người Chịu Trách Nhiệm Checklist Theo Trạng Thái

## Tổng Quan

Tài liệu này mô tả cách hệ thống quản lý người chịu trách nhiệm cho checklist items và cách tự động đổi người chịu trách nhiệm khi trạng thái thay đổi.

## Yêu Cầu

Theo bảng dữ liệu bạn cung cấp:

| STT | Nhiệm vụ lớn | Nhiệm vụ nhỏ | Người phụ trách | Trạng thái |
|-----|--------------|--------------|-----------------|------------|
| 1 | Kế hoạch | Đo đạt | 1 | THỎA THUẬN |
| 2 | | Thiết kế / cập nhật bản vẽ | | |
| 3 | | Kế hoạch vật tư | | |
| 4 | | Kế hoạch sản xuất | | |
| 5 | | Kế hoạch lắp đặt | | |
| 6 | Sản xuất | Mua hàng | 2 | XƯỞNG SẢN XUẤT |
| 7 | | Sản xuất | | |
| 8 | | Hoàn thành | | |
| 9 | Vận chuyển / lắp đặt | Vận chuyển | 3 | VẬN CHUYỂN |
| 10 | | Lắp đặt | | LẮP ĐẶT |
| 11 | | Nghiệm thu bàn giao | | |
| 12 | | Thu tiền | | CHĂM SÓC KHÁCH HÀNG |
| 13 | Chăm sóc khách hàng | Đánh giá khách hàng | 4 | CHĂM SÓC KHÁCH HÀNG |
| 14 | | Báo cáo / sửa chữa | | BÁO CÁO / SỬA CHỮA |
| 15 | | Nghiệm thu tính lương | | HOÀN THÀNH |

**Yêu cầu:**
1. Mỗi nhiệm vụ checklist có thể đổi được người chịu trách nhiệm
2. Khi đổi đến trạng thái đó, người chịu trách nhiệm cũng đổi theo
3. Người được quy định ở checklist đó (theo trạng thái mới) được quyền quản lý nhiệm vụ
4. Người chịu trách nhiệm ở checklist trước (trạng thái cũ) không còn quyền quản lý

## Cấu Trúc Hiện Tại

### 1. Database Schema

#### Bảng `task_checklist_items`
- `id`: UUID - ID của checklist item
- `checklist_id`: UUID - ID của checklist
- `content`: TEXT - Nội dung nhiệm vụ
- `is_completed`: BOOLEAN - Trạng thái hoàn thành
- `assignee_id`: UUID - Người được giao (người thực hiện chính)
- `sort_order`: INTEGER - Thứ tự sắp xếp

#### Bảng `task_checklist_item_assignments`
- `id`: UUID - ID của assignment
- `checklist_item_id`: UUID - ID của checklist item
- `employee_id`: UUID - ID của nhân viên
- `responsibility_type`: TEXT - Loại trách nhiệm:
  - `accountable`: Chịu trách nhiệm chính
  - `responsible`: Thực hiện
  - `consulted`: Tham vấn
  - `informed`: Thông báo

### 2. Logic Phân Quyền Hiện Tại

Theo file `PHAN_QUYEN_NHIEM_VU.md`:
- **Admin**: Có tất cả quyền
- **Responsible**: Người có role "responsible" trong TaskParticipant có quyền quản lý checklist
- **Assigned**: Người được giao checklist item có thể đánh dấu hoàn thành

## Giải Pháp Đề Xuất

### 1. Thêm Trường Status Cho Checklist Items

Cần thêm trường `status` vào bảng `task_checklist_items` để lưu trạng thái hiện tại:

```sql
ALTER TABLE task_checklist_items
ADD COLUMN IF NOT EXISTS status TEXT;

-- Tạo index cho status
CREATE INDEX IF NOT EXISTS idx_task_checklist_items_status 
ON task_checklist_items(status);
```

### 2. Tạo Bảng Mapping Trạng Thái → Người Chịu Trách Nhiệm

Tạo bảng để lưu mapping giữa trạng thái và người chịu trách nhiệm:

```sql
CREATE TABLE IF NOT EXISTS checklist_status_responsible_mapping (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    status TEXT NOT NULL, -- Trạng thái: THỎA THUẬN, XƯỞNG SẢN XUẤT, etc.
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE NOT NULL,
    responsibility_type TEXT NOT NULL DEFAULT 'accountable',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(status, employee_id, responsibility_type)
);

CREATE INDEX IF NOT EXISTS idx_checklist_status_mapping_status 
ON checklist_status_responsible_mapping(status);
```

### 3. Tạo Trigger Tự Động Đổi Người Chịu Trách Nhiệm

Khi trạng thái của checklist item thay đổi, tự động cập nhật người chịu trách nhiệm:

```sql
CREATE OR REPLACE FUNCTION update_checklist_responsible_on_status_change()
RETURNS TRIGGER AS $$
DECLARE
    new_responsible_employee_id UUID;
    old_responsible_employee_id UUID;
BEGIN
    -- Chỉ xử lý khi status thay đổi
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        -- Lấy người chịu trách nhiệm mới từ mapping
        SELECT employee_id INTO new_responsible_employee_id
        FROM checklist_status_responsible_mapping
        WHERE status = NEW.status
          AND responsibility_type = 'accountable'
          AND is_active = true
        LIMIT 1;
        
        -- Nếu tìm thấy người chịu trách nhiệm mới
        IF new_responsible_employee_id IS NOT NULL THEN
            -- Xóa assignment cũ (accountable) nếu có
            DELETE FROM task_checklist_item_assignments
            WHERE checklist_item_id = NEW.id
              AND responsibility_type = 'accountable';
            
            -- Thêm assignment mới
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

CREATE TRIGGER trigger_update_checklist_responsible
    AFTER UPDATE OF status ON task_checklist_items
    FOR EACH ROW
    WHEN (OLD.status IS DISTINCT FROM NEW.status)
    EXECUTE FUNCTION update_checklist_responsible_on_status_change();
```

### 4. Cập Nhật Quyền Quản Lý Dựa Trên Người Chịu Trách Nhiệm

Cần cập nhật logic phân quyền để:
- Người có `responsibility_type = 'accountable'` trong `task_checklist_item_assignments` có quyền quản lý
- Người chịu trách nhiệm cũ (không còn trong assignment) không có quyền quản lý

#### Backend (Python)

Trong `backend/routers/tasks.py`, cập nhật hàm kiểm tra quyền:

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
    
    # Kiểm tra xem employee có phải accountable cho checklist item này không
    assignment_result = supabase.table("task_checklist_item_assignments").select("*").eq(
        "checklist_item_id", checklist_item_id
    ).eq("employee_id", employee_id).eq("responsibility_type", "accountable").execute()
    
    return len(assignment_result.data) > 0
```

#### Android (Java)

Trong `TaskDetailActivity.java`, cập nhật hàm kiểm tra quyền:

```java
private boolean canManageChecklistItem(String checklistItemId) {
    // Admin có tất cả quyền
    if (isAdmin()) {
        return true;
    }
    
    // Kiểm tra xem user hiện tại có phải accountable cho checklist item này không
    String currentEmployeeId = getCurrentEmployeeId();
    if (currentEmployeeId == null) {
        return false;
    }
    
    // Kiểm tra trong danh sách assignments của checklist item
    TaskChecklist.TaskChecklistItem item = findChecklistItemById(checklistItemId);
    if (item != null && item.getAssignments() != null) {
        for (ChecklistItemAssignment assignment : item.getAssignments()) {
            if (assignment.getEmployeeId().equals(currentEmployeeId) 
                && "accountable".equals(assignment.getResponsibilityType())) {
                return true;
            }
        }
    }
    
    return false;
}
```

### 5. API Cập Nhật Status Checklist Item

Cần thêm endpoint để cập nhật status của checklist item:

```python
@router.put("/tasks/checklist-items/{item_id}/status")
async def update_checklist_item_status(
    item_id: str,
    status_data: dict,
    current_user: User = Depends(get_current_user)
):
    """Cập nhật trạng thái của checklist item"""
    supabase = get_supabase_client()
    
    # Kiểm tra quyền
    if not can_manage_checklist_item(supabase, item_id, current_user.id):
        raise HTTPException(status_code=403, detail="Không có quyền cập nhật status")
    
    # Cập nhật status
    update_result = supabase.table("task_checklist_items").update({
        "status": status_data.get("status")
    }).eq("id", item_id).execute()
    
    # Trigger sẽ tự động cập nhật người chịu trách nhiệm
    
    return {"success": True, "data": update_result.data}
```

## Cách Sử Dụng

### 1. Thiết Lập Mapping Trạng Thái → Người Chịu Trách Nhiệm

Chèn dữ liệu mapping vào bảng `checklist_status_responsible_mapping`:

```sql
-- Trạng thái THỎA THUẬN → Người phụ trách 1
INSERT INTO checklist_status_responsible_mapping (status, employee_id, responsibility_type)
VALUES ('THỎA THUẬN', '<employee_id_1>', 'accountable');

-- Trạng thái XƯỞNG SẢN XUẤT → Người phụ trách 2
INSERT INTO checklist_status_responsible_mapping (status, employee_id, responsibility_type)
VALUES ('XƯỞNG SẢN XUẤT', '<employee_id_2>', 'accountable');

-- Trạng thái VẬN CHUYỂN → Người phụ trách 3
INSERT INTO checklist_status_responsible_mapping (status, employee_id, responsibility_type)
VALUES ('VẬN CHUYỂN', '<employee_id_3>', 'accountable');

-- Trạng thái LẮP ĐẶT → Người phụ trách 3
INSERT INTO checklist_status_responsible_mapping (status, employee_id, responsibility_type)
VALUES ('LẮP ĐẶT', '<employee_id_3>', 'accountable');

-- Trạng thái CHĂM SÓC KHÁCH HÀNG → Người phụ trách 4
INSERT INTO checklist_status_responsible_mapping (status, employee_id, responsibility_type)
VALUES ('CHĂM SÓC KHÁCH HÀNG', '<employee_id_4>', 'accountable');

-- Trạng thái BÁO CÁO / SỬA CHỮA → Người phụ trách 4
INSERT INTO checklist_status_responsible_mapping (status, employee_id, responsibility_type)
VALUES ('BÁO CÁO / SỬA CHỮA', '<employee_id_4>', 'accountable');

-- Trạng thái HOÀN THÀNH → Người phụ trách 4
INSERT INTO checklist_status_responsible_mapping (status, employee_id, responsibility_type)
VALUES ('HOÀN THÀNH', '<employee_id_4>', 'accountable');
```

### 2. Cập Nhật Status Checklist Item

Khi cập nhật status của checklist item, hệ thống sẽ tự động:
1. Xóa assignment cũ (accountable)
2. Thêm assignment mới với người chịu trách nhiệm tương ứng
3. Cập nhật `assignee_id` của checklist item

### 3. Quyền Quản Lý

- **Người chịu trách nhiệm mới** (có `responsibility_type = 'accountable'`): Có quyền quản lý checklist item
- **Người chịu trách nhiệm cũ**: Không còn quyền quản lý (assignment đã bị xóa)
- **Admin**: Luôn có quyền quản lý

## Migration Script

Tạo file migration để áp dụng các thay đổi:

```sql
-- File: database/migrations/add_checklist_status_responsible_management.sql

-- 1. Thêm trường status vào task_checklist_items
ALTER TABLE task_checklist_items
ADD COLUMN IF NOT EXISTS status TEXT;

CREATE INDEX IF NOT EXISTS idx_task_checklist_items_status 
ON task_checklist_items(status);

-- 2. Tạo bảng mapping
CREATE TABLE IF NOT EXISTS checklist_status_responsible_mapping (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    status TEXT NOT NULL,
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE NOT NULL,
    responsibility_type TEXT NOT NULL DEFAULT 'accountable',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(status, employee_id, responsibility_type)
);

CREATE INDEX IF NOT EXISTS idx_checklist_status_mapping_status 
ON checklist_status_responsible_mapping(status);

-- 3. Tạo trigger function
CREATE OR REPLACE FUNCTION update_checklist_responsible_on_status_change()
RETURNS TRIGGER AS $$
DECLARE
    new_responsible_employee_id UUID;
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        SELECT employee_id INTO new_responsible_employee_id
        FROM checklist_status_responsible_mapping
        WHERE status = NEW.status
          AND responsibility_type = 'accountable'
          AND is_active = true
        LIMIT 1;
        
        IF new_responsible_employee_id IS NOT NULL THEN
            DELETE FROM task_checklist_item_assignments
            WHERE checklist_item_id = NEW.id
              AND responsibility_type = 'accountable';
            
            INSERT INTO task_checklist_item_assignments 
            (checklist_item_id, employee_id, responsibility_type)
            VALUES (NEW.id, new_responsible_employee_id, 'accountable')
            ON CONFLICT (checklist_item_id, employee_id) 
            DO UPDATE SET responsibility_type = 'accountable';
            
            UPDATE task_checklist_items
            SET assignee_id = new_responsible_employee_id
            WHERE id = NEW.id;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Tạo trigger
DROP TRIGGER IF EXISTS trigger_update_checklist_responsible ON task_checklist_items;
CREATE TRIGGER trigger_update_checklist_responsible
    AFTER UPDATE OF status ON task_checklist_items
    FOR EACH ROW
    WHEN (OLD.status IS DISTINCT FROM NEW.status)
    EXECUTE FUNCTION update_checklist_responsible_on_status_change();
```

## Lưu Ý

1. **Cần xác định employee_id**: Cần biết chính xác employee_id của các người phụ trách (1, 2, 3, 4) để thiết lập mapping
2. **RLS Policies**: Cần đảm bảo RLS policies cho bảng `checklist_status_responsible_mapping` phù hợp
3. **Validation**: Cần validate status trước khi cập nhật để đảm bảo status hợp lệ
4. **Backward Compatibility**: Các checklist items cũ không có status sẽ vẫn hoạt động bình thường

## Bước Tiếp Theo

1. ✅ Tạo migration script
2. ⏳ Chạy migration trên database
3. ⏳ Cập nhật backend API để hỗ trợ cập nhật status
4. ⏳ Cập nhật frontend để hiển thị và cho phép đổi status
5. ⏳ Cập nhật Android app để hỗ trợ đổi status
6. ⏳ Test tính năng với dữ liệu thực tế
