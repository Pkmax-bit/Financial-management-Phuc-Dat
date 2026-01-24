# So sánh tính năng Web vs Android - Nhiệm vụ và Dự án

## Tổng quan
Tài liệu này liệt kê các tính năng mới được thêm vào Web mà Android chưa có, dựa trên code hiện tại.

---

## 1. PHẦN NHIỆM VỤ CHI TIẾT (Task Detail)

### 1.1. Quản lý Checklist - Phân quyền theo "Accountable"
**Web (ProjectTasksTab.tsx):**
- ✅ Có hàm `canManageChecklist()` - kiểm tra quyền quản lý checklist dựa trên `accountable` assignments
- ✅ Có hàm `canManageChecklistItem()` - kiểm tra quyền quản lý checklist item dựa trên `accountable` assignments
- ✅ Nút "Nhân viên" (quản lý assignments) chỉ hiển thị cho người có quyền `accountable`
- ✅ Nút "Thêm" (thêm checklist item) chỉ hiển thị cho người có quyền `accountable`
- ✅ Nút "MoreVertical" (menu quản lý checklist) chỉ hiển thị cho người có quyền `accountable`
- ✅ Nút Edit/Delete checklist item chỉ hiển thị cho người có quyền `accountable`

**Android (TaskDetailActivity.java):**
- ❌ Chưa có logic kiểm tra `accountable` assignments
- ❌ Sử dụng `canManageChecklistItems()` - kiểm tra quyền dựa trên role (admin/responsible) hoặc assignee
- ❌ Chưa có logic kiểm tra `checklist.assignments` với `responsibility_type = 'accountable'`

**Cần thêm vào Android:**
```java
// Tương tự như canManageChecklist() trong web
private boolean canManageChecklist(TaskChecklist checklist) {
    // Admin/Manager luôn có quyền
    if (isAdminOrManager()) return true;
    
    // Kiểm tra xem current user có trong checklist.assignments với accountable role không
    // Cần fetch checklist assignments từ API
}
```

### 1.2. Checklist Item - Bỏ hiển thị Status
**Web (ProjectTasksTab.tsx):**
- ✅ Đã bỏ dropdown chọn status khi tạo checklist item mới
- ✅ Đã bỏ dropdown chọn status khi edit checklist item
- ✅ Đã bỏ badge hiển thị status của checklist item
- ✅ Chỉ hiển thị "Người chịu trách nhiệm" (accountable person) thay vì status
- ✅ Comment: `{/* Display responsible person - Đã bỏ phần hiển thị status */}`

**Android (TaskDetailActivity.java):**
- ❌ Vẫn có `TextView status = view.findViewById(R.id.text_subtask_status);` (dòng 901)
- ❌ Vẫn hiển thị status của checklist item
- ❌ Cần bỏ hiển thị status và chỉ hiển thị accountable person

**Cần thay đổi trong Android:**
- Bỏ `text_subtask_status` TextView
- Thêm hiển thị accountable person từ `item.assignments` với `responsibility_type = 'accountable'`

### 1.3. Checklist Menu (MoreVertical)
**Web (ProjectTasksTab.tsx):**
- ✅ Có nút `MoreVertical` bên cạnh nút "Thêm"
- ✅ Dropdown menu với 2 options:
  - "Thêm item mới"
  - "Xóa checklist"
- ✅ Menu tự động đóng khi click ra ngoài (useEffect với mousedown listener)
- ✅ State: `showChecklistMenu: Record<string, boolean>`

**Android (TaskDetailActivity.java):**
- ❌ Chưa có menu MoreVertical cho checklist
- ❌ Chỉ có các nút riêng lẻ: Add, Edit, Delete

**Cần thêm vào Android:**
- Thêm menu dropdown (PopupMenu) cho checklist header
- Options: "Thêm item mới", "Xóa checklist"

### 1.4. Checklist Assignments Management
**Web (ProjectTasksTab.tsx):**
- ✅ Có nút "Nhân viên" để quản lý assignments cho checklist
- ✅ Dropdown với multi-select checkboxes
- ✅ Hiển thị danh sách assignments đã chọn với badge số lượng
- ✅ Có thể xóa assignment bằng nút X
- ✅ Chỉ hiển thị cho người có quyền `accountable`

**Android (TaskDetailActivity.java):**
- ❌ Chưa có tính năng quản lý assignments cho checklist
- ❌ Chỉ có quản lý assignments cho checklist item

**Cần thêm vào Android:**
- Dialog/Activity để quản lý checklist assignments
- Multi-select employees
- Hiển thị danh sách assignments hiện tại

---

## 2. PHẦN XEM CHI TIẾT DỰ ÁN - NHIỆM VỤ (Project Detail - Tasks Tab)

### 2.1. Progress Bar - Tính từ Tasks
**Web (ProjectDetailSidebar.tsx):**
- ✅ Có state `tasksProgress: number` (dòng 108)
- ✅ Có hàm `fetchTasksProgress()` (dòng 161-183):
  - Fetch tất cả tasks của project
  - Đếm số tasks có `status = 'completed'`
  - Tính %: `(completedTasks / totalTasks) * 100`
- ✅ Progress bar hiển thị `tasksProgress` thay vì `project.progress`
- ✅ Đã bỏ UI để edit progress thủ công (input field, save/cancel buttons)
- ✅ Progress tự động cập nhật dựa trên completion của tasks

**Android:**
- ❌ Chưa có logic tính progress từ tasks
- ❌ Vẫn dùng `project.progress` (giá trị manual)

**Cần thêm vào Android:**
```java
// Tương tự fetchTasksProgress() trong web
private void fetchTasksProgress(String projectId) {
    // Fetch tasks từ API: /api/tasks?project_id={projectId}
    // Đếm tasks có status = 'completed'
    // Tính % và cập nhật progress bar
}
```

### 2.2. Checklist Status Removal
**Web (ProjectTasksTab.tsx):**
- ✅ Đã bỏ tất cả UI liên quan đến status của checklist item:
  - Bỏ dropdown chọn status khi tạo item (dòng 3714-3727 đã xóa)
  - Bỏ dropdown chọn status khi edit item (dòng 4014-4028 đã xóa)
  - Bỏ badge hiển thị status (dòng 4410-4418 đã sửa)
  - Bỏ dropdown chọn status trong display mode (dòng 4252-4279 đã xóa)
- ✅ `handleCreateChecklistItem` không gửi `status` nữa (dòng 1891, 1897)

**Android (TaskDetailActivity.java):**
- ❌ Vẫn có `TextView status = view.findViewById(R.id.text_subtask_status);`
- ❌ Vẫn hiển thị status trong UI

**Cần thay đổi trong Android:**
- Bỏ `text_subtask_status` TextView
- Bỏ logic set status text
- Bỏ status parameter khi tạo/edit checklist item

---

## 3. TÍNH NĂNG MỚI KHÁC

### 3.1. Auto-filter theo người đăng nhập
**Web (KanbanBoard.tsx):**
- ✅ Tự động filter dự án theo employee_id của user đăng nhập khi vào trang
- ✅ State: `currentUserEmployeeId`, `hasAutoFiltered`
- ✅ useEffect tự động set `employeeFilter` khi component mount

**Android:**
- ❌ Chưa có tính năng auto-filter

---

## 4. TÓM TẮT CẦN CẬP NHẬT CHO ANDROID

### Priority 1 (Quan trọng):
1. ✅ **Phân quyền theo Accountable**: 
   - Thêm `canManageChecklist()` và `canManageChecklistItem()` dựa trên `accountable` assignments
   - Ẩn/hiện nút quản lý dựa trên quyền accountable

2. ✅ **Bỏ hiển thị Status của Checklist Item**:
   - Bỏ `text_subtask_status` TextView
   - Thay bằng hiển thị accountable person

3. ✅ **Progress Bar tính từ Tasks**:
   - Thêm logic fetch tasks và tính % completion
   - Cập nhật progress bar tự động

### Priority 2 (Cải thiện UX):
4. ✅ **Checklist Menu (MoreVertical)**:
   - Thêm PopupMenu cho checklist header
   - Options: "Thêm item mới", "Xóa checklist"

5. ✅ **Checklist Assignments Management**:
   - Dialog để quản lý assignments cho checklist (không chỉ item)
   - Multi-select employees

6. ✅ **Auto-filter theo người đăng nhập**:
   - Tự động filter dự án khi vào trang

---

## 5. API ENDPOINTS CẦN SỬ DỤNG

### Checklist Assignments:
- `GET /api/tasks/checklists/{checklistId}/assignments` - Lấy assignments của checklist
- `POST /api/tasks/checklists/{checklistId}/assignments` - Thêm assignment
- `DELETE /api/tasks/checklists/{checklistId}/assignments/{assignmentId}` - Xóa assignment

### Checklist Item Assignments:
- `GET /api/tasks/checklist-items/{itemId}/assignments` - Lấy assignments của item
- `POST /api/tasks/checklist-items/{itemId}/assignments` - Thêm assignment
- `DELETE /api/tasks/checklist-items/{itemId}/assignments/{assignmentId}` - Xóa assignment

### Tasks Progress:
- `GET /api/tasks?project_id={projectId}` - Lấy tất cả tasks của project để tính progress

---

## 6. FILES CẦN CẬP NHẬT TRONG ANDROID

1. **TaskDetailActivity.java**:
   - Thêm `canManageChecklist()` và `canManageChecklistItem()`
   - Bỏ `text_subtask_status` TextView
   - Thêm hiển thị accountable person
   - Thêm PopupMenu cho checklist header
   - Thêm dialog quản lý checklist assignments

2. **ProjectDetailActivity/Fragment** (nếu có):
   - Thêm logic tính progress từ tasks
   - Cập nhật progress bar

3. **Layout files**:
   - `item_subtask.xml`: Bỏ `text_subtask_status`, thêm accountable person display
   - `view_subtasks_header.xml`: Thêm menu button (MoreVertical)

---

## 7. NOTES

- Web đã loại bỏ hoàn toàn việc quản lý status ở cấp độ checklist item
- Web chỉ quản lý status ở cấp độ checklist (không phải item)
- Web sử dụng `accountable` assignments để kiểm tra quyền, không dựa vào status nữa
- Progress bar trong web tự động tính từ tasks, không cho phép edit thủ công
