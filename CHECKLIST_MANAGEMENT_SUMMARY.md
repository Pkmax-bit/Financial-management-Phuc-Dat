# Tổng Hợp Quản Lý Checklist Và Phân Quyền

## ✅ Đã Có Đầy Đủ

### 1. Bảng Lưu Nhân Viên Được Quản Lý Checklist

#### ✅ Bảng `task_checklist_item_assignments`
**Mục đích:** Lưu nhiều nhân viên được gán cho mỗi checklist item với vai trò (RACI)

**Cấu trúc:**
- `id`: UUID - ID của assignment
- `checklist_item_id`: UUID - ID của checklist item
- `employee_id`: UUID - ID của nhân viên
- `responsibility_type`: TEXT - Loại trách nhiệm:
  - `accountable`: Chịu trách nhiệm chính (có quyền quản lý)
  - `responsible`: Thực hiện
  - `consulted`: Tư vấn
  - `informed`: Thông báo
- `created_at`: TIMESTAMP - Thời gian tạo

**Trạng thái:** ✅ Đã có trong database

#### ✅ Bảng `checklist_status_responsible_mapping`
**Mục đích:** Lưu mapping giữa trạng thái checklist và người chịu trách nhiệm

**Cấu trúc:**
- `id`: UUID - ID của mapping
- `status`: TEXT - Trạng thái (THỎA THUẬN, XƯỞNG SẢN XUẤT, etc.)
- `employee_id`: UUID - ID của nhân viên chịu trách nhiệm
- `responsibility_type`: TEXT - Mặc định là 'accountable'
- `is_active`: BOOLEAN - Có đang hoạt động không
- `created_at`, `updated_at`: TIMESTAMP

**Trạng thái:** ✅ Đã có trong database

#### ✅ Cột `status` trong `task_checklist_items`
**Mục đích:** Lưu trạng thái hiện tại của checklist item

**Trạng thái:** ✅ Đã có trong database

### 2. Phân Quyền Quản Lý Nhiệm Vụ Checklist

#### ✅ Frontend (ProjectTasksTab.tsx)

**Hàm kiểm tra quyền:**
```typescript
const canManageChecklistItem = (item: TaskChecklistItem) => {
  // 1. Admin/Manager luôn có quyền
  if (isAdminOrManager()) return true
  
  // 2. Kiểm tra xem user có phải accountable cho trạng thái hiện tại không
  const itemStatus = item.status
  if (itemStatus && statusResponsibleMapping[itemStatus]) {
    const responsibleEmployeeId = statusResponsibleMapping[itemStatus]
    if (currentEmployeeId === responsibleEmployeeId) {
      return true
    }
  }
  
  // 3. Kiểm tra xem user có assignment với accountable role không
  const accountableAssignment = item.assignments.find(a => 
    a.responsibility_type === 'accountable' && a.employee_id === currentEmployeeId
  )
  if (accountableAssignment) {
    return true
  }
  
  return false
}
```

**Áp dụng:**
- ✅ Ẩn nút Edit/Delete nếu không có quyền
- ✅ Chỉ hiển thị nút Edit/Delete cho người có quyền quản lý

**Trạng thái:** ✅ Đã có code

#### ✅ Backend (tasks.py)

**Hàm kiểm tra quyền:**
```python
def _can_manage_checklist_item(supabase, checklist_item_id: str, user_id: str) -> bool:
    """Kiểm tra user có quyền quản lý checklist item không
    
    Quyền quản lý được cấp cho:
    1. Admin/Manager
    2. Người chịu trách nhiệm (accountable) cho trạng thái hiện tại
    3. Người có assignment với responsibility_type = 'accountable'
    """
```

**Áp dụng:**
- ✅ `update_checklist_item`: Kiểm tra quyền trước khi update
- ✅ `delete_checklist_item`: Kiểm tra quyền trước khi delete

**Trạng thái:** ✅ Đã có code

### 3. Code Chuyển Đổi Quản Lý Khi Chuyển Trạng Thái

#### ✅ Database Trigger

**Trigger function:** `update_checklist_responsible_on_status_change()`

**Cách hoạt động:**
1. Khi `status` của checklist item thay đổi
2. Tự động tìm người chịu trách nhiệm mới từ `checklist_status_responsible_mapping`
3. Xóa assignment cũ (accountable) nếu có
4. Thêm assignment mới với người chịu trách nhiệm mới
5. Cập nhật `assignee_id` của checklist item

**Trigger:**
```sql
CREATE TRIGGER trigger_update_checklist_responsible
    AFTER UPDATE OF status ON task_checklist_items
    FOR EACH ROW
    WHEN (OLD.status IS DISTINCT FROM NEW.status)
    EXECUTE FUNCTION update_checklist_responsible_on_status_change();
```

**Trạng thái:** ✅ Đã có trigger trong database

#### ✅ Frontend Logic

**Tự động gán nhân viên khi chọn trạng thái:**
```typescript
const handleStatusChange = (status: string, checklistId: string, isEditing: boolean = false) => {
  if (status && statusResponsibleMapping[status]) {
    const responsibleEmployeeId = statusResponsibleMapping[status]
    // Xóa assignment cũ (accountable)
    // Thêm assignment mới với người chịu trách nhiệm mới
  }
}
```

**Trạng thái:** ✅ Đã có code trong frontend

## Mapping Trạng Thái → Người Chịu Trách Nhiệm

Theo bảng dữ liệu bạn cung cấp:

| Trạng Thái | Người Phụ Trách | Employee ID |
|------------|-----------------|-------------|
| THỎA THUẬN | Employee 1 | (cần thiết lập) |
| XƯỞNG SẢN XUẤT | Employee 2 | (cần thiết lập) |
| VẬN CHUYỂN | Employee 3 | (cần thiết lập) |
| LẮP ĐẶT | Employee 3 | (cần thiết lập) |
| CHĂM SÓC KHÁCH HÀNG | Employee 4 | (cần thiết lập) |
| BÁO CÁO / SỬA CHỮA | Employee 4 | (cần thiết lập) |
| HOÀN THÀNH | Employee 4 | (cần thiết lập) |

## Luồng Hoạt Động

### Khi Tạo Checklist Item Mới:
1. User chọn trạng thái từ dropdown
2. Frontend tự động gán nhân viên chịu trách nhiệm tương ứng với trạng thái
3. Gửi request với `status` và `assignments` (có accountable person)
4. Backend lưu vào database
5. Trigger không chạy (vì là INSERT, không phải UPDATE)

### Khi Cập Nhật Status Checklist Item:
1. User đổi trạng thái từ dropdown
2. Frontend tự động cập nhật assignments (xóa accountable cũ, thêm accountable mới)
3. Gửi request với `status` mới
4. Backend cập nhật `status` trong database
5. **Trigger tự động chạy:**
   - Tìm người chịu trách nhiệm mới từ mapping
   - Xóa assignment cũ (accountable)
   - Thêm assignment mới (accountable)
   - Cập nhật `assignee_id`

### Khi Kiểm Tra Quyền:
1. **Frontend:** Hàm `canManageChecklistItem()` kiểm tra:
   - User có phải admin/manager không?
   - User có phải accountable cho trạng thái hiện tại không?
   - User có assignment với accountable role không?
2. **Backend:** Hàm `_can_manage_checklist_item()` kiểm tra tương tự
3. Nếu không có quyền:
   - Frontend: Ẩn nút Edit/Delete
   - Backend: Trả về lỗi 403 Forbidden

## Kết Luận

✅ **Đã có đầy đủ:**
1. ✅ Bảng lưu nhân viên được quản lý checklist (`task_checklist_item_assignments`)
2. ✅ Bảng mapping trạng thái → người chịu trách nhiệm (`checklist_status_responsible_mapping`)
3. ✅ Cột `status` trong `task_checklist_items`
4. ✅ Trigger tự động chuyển đổi quản lý khi chuyển trạng thái
5. ✅ Phân quyền frontend (hàm `canManageChecklistItem`)
6. ✅ Phân quyền backend (hàm `_can_manage_checklist_item`)
7. ✅ Logic tự động gán nhân viên khi chọn trạng thái

## Bước Tiếp Theo

1. **Thiết lập mapping:** Chạy script để thiết lập mapping giữa trạng thái và người chịu trách nhiệm:
   ```bash
   python scripts/setup_checklist_status_mapping.py
   ```

2. **Test tính năng:**
   - Tạo checklist item với trạng thái → Kiểm tra người chịu trách nhiệm có tự động được gán không
   - Đổi trạng thái → Kiểm tra người chịu trách nhiệm có tự động đổi không
   - Kiểm tra quyền: Chỉ người chịu trách nhiệm mới có quyền edit/delete

3. **Sử dụng:**
   - Khi tạo checklist item, chọn trạng thái phù hợp
   - Hệ thống sẽ tự động gán người chịu trách nhiệm
   - Khi đổi trạng thái, người chịu trách nhiệm sẽ tự động đổi
   - Chỉ người chịu trách nhiệm mới có quyền quản lý checklist item
