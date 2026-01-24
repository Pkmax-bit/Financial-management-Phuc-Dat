# Đánh giá Code Android vs Web - Phân quyền Accountable

## So sánh Logic Phân quyền

### 1. Lấy Employee ID của User hiện tại

#### Web (ProjectTasksTab.tsx):
```typescript
// Lấy từ groupMembers (project team members)
const currentEmployee = groupMembers.find(m => 
  (user.email && m.employee_email === user.email) ||
  (user.id && m.employee_id === (user as any).employee_id)
)
const currentEmployeeId = currentEmployee?.employee_id
```

**Nguồn dữ liệu:**
- `groupMembers` được load từ `/api/projects/${projectId}/team` (project team members)
- Fallback: `/api/tasks/groups/${groupId}/members?project_id=${projectId}`

#### Android (TaskDetailActivity.java):
```java
private String getCurrentEmployeeId() {
    // First try to get from taskParticipants (if user is in this task)
    if (taskParticipants != null && currentUserId != null) {
        for (TaskParticipant participant : taskParticipants) {
            if (currentUserId.equals(participant.getUserId()) || currentUserId.equals(participant.getEmployeeId())) {
                return participant.getEmployeeId();
            }
        }
    }
    // Fallback: use currentUserId directly
    return currentUserId;
}
```

**Nguồn dữ liệu:**
- `taskParticipants` được load từ task detail response (`response.getParticipants()`)
- Fallback: dùng `currentUserId` trực tiếp

### ⚠️ VẤN ĐỀ PHÁT HIỆN:

1. **Khác biệt nguồn dữ liệu:**
   - Web: Dùng **project team members** (tất cả nhân viên trong project)
   - Android: Dùng **task participants** (chỉ nhân viên được assign vào task này)
   
   **Hệ quả:** Nếu user không được assign vào task nhưng có trong project team, Android sẽ không tìm thấy employee_id, trong khi Web vẫn tìm thấy.

2. **Fallback không đúng:**
   - Android fallback về `currentUserId` - nhưng `currentUserId` có thể là `user_id` chứ không phải `employee_id`
   - Web không có fallback này, nếu không tìm thấy trong groupMembers thì return `undefined`

### 2. Logic Kiểm tra Quyền

#### Web:
```typescript
const canManageChecklist = (checklist: TaskChecklist) => {
  if (!user) return false
  if (isAdminOrManager()) return true
  
  const currentEmployeeId = currentEmployee?.employee_id
  if (!currentEmployeeId) return false
  
  // Check checklist.assignments
  if (checklist.assignments && checklist.assignments.length > 0) {
    const accountableAssignment = checklist.assignments.find((a: any) => 
      a.responsibility_type === 'accountable' && a.employee_id === currentEmployeeId
    )
    if (accountableAssignment) return true
  }
  return false
}
```

#### Android:
```java
private boolean canManageChecklist(TaskChecklist checklist) {
    if (isAdminOrManager()) return true;
    
    String currentEmployeeId = getCurrentEmployeeId();
    if (currentEmployeeId == null) return false;
    
    if (checklist.getAssignments() != null && !checklist.getAssignments().isEmpty()) {
        for (ChecklistItemAssignment assignment : checklist.getAssignments()) {
            if ("accountable".equals(assignment.getResponsibilityType()) 
                && currentEmployeeId.equals(assignment.getEmployeeId())) {
                return true;
            }
        }
    }
    return false;
}
```

**✅ Logic giống nhau** - chỉ khác về nguồn lấy `currentEmployeeId`

### 3. Bỏ Hiển thị Status

#### Web:
- ✅ Đã bỏ hoàn toàn dropdown chọn status khi tạo/edit item
- ✅ Đã bỏ badge hiển thị status
- ✅ Chỉ hiển thị accountable person

#### Android:
- ✅ Đã ẩn TextView status (`status.setVisibility(View.GONE)`)
- ✅ Đã bỏ logic set status text
- ✅ Đã thêm hiển thị accountable person

**⚠️ VẤN ĐỀ:** Layout file `item_subtask.xml` cần có `layout_accountable_person` và `text_accountable_person`. Nếu chưa có, sẽ crash khi findViewById.

## Các Vấn Đề Cần Sửa

### 1. ⚠️ CRITICAL: Nguồn lấy Employee ID

**Vấn đề:** Android dùng `taskParticipants` thay vì `project team members`

**Giải pháp:** Cần fetch project team members như Web:

```java
// Thêm method để fetch project team members
private void fetchProjectTeamMembers(String projectId) {
    // Call API: GET /api/projects/{projectId}/team
    // Store vào một List tương tự groupMembers trong Web
    // Update getCurrentEmployeeId() để tìm trong project team members trước
}
```

### 2. ⚠️ CRITICAL: Layout File

**Vấn đề:** Code Android đang tìm `layout_accountable_person` và `text_accountable_person` trong layout, nhưng có thể chưa có trong XML.

**Giải pháp:** 
- Kiểm tra `res/layout/item_subtask.xml`
- Nếu chưa có, cần thêm:
```xml
<LinearLayout
    android:id="@+id/layout_accountable_person"
    android:layout_width="wrap_content"
    android:layout_height="wrap_content"
    android:orientation="horizontal"
    android:padding="4dp"
    android:background="@drawable/bg_rounded_green"
    android:visibility="gone">
    
    <ImageView
        android:layout_width="12dp"
        android:layout_height="12dp"
        android:src="@drawable/ic_user"
        android:tint="@color/green_600" />
    
    <TextView
        android:id="@+id/text_accountable_person"
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:textSize="10sp"
        android:textColor="@color/green_700" />
</LinearLayout>
```

### 3. ⚠️ WARNING: Fallback Logic

**Vấn đề:** `getCurrentEmployeeId()` fallback về `currentUserId` - có thể không đúng nếu `currentUserId` là `user_id` chứ không phải `employee_id`.

**Giải pháp:** 
- Nếu không tìm thấy trong `taskParticipants`, nên return `null` thay vì `currentUserId`
- Hoặc fetch từ API `/api/users/{userId}` để lấy `employee_id`

### 4. ✅ OK: Logic Phân quyền

Logic kiểm tra quyền đã đúng, chỉ cần sửa nguồn lấy employee_id.

## Checklist Kiểm tra

- [x] Hàm `canManageChecklist()` đã có
- [x] Hàm `canManageChecklistItem()` đã có
- [x] Hàm `isAdminOrManager()` đã có
- [x] Hàm `getCurrentEmployeeId()` đã có
- [x] TaskChecklist model đã có field `assignments`
- [x] Đã thay thế `canManageChecklistItems()` bằng `canManageChecklist()` và `canManageChecklistItem()`
- [x] Đã ẩn status TextView
- [x] Đã thêm hiển thị accountable person
- [ ] ⚠️ Cần kiểm tra layout file có `layout_accountable_person` và `text_accountable_person`
- [ ] ⚠️ Cần sửa `getCurrentEmployeeId()` để fetch từ project team thay vì chỉ task participants

## Kết luận

**Code Android đã implement đúng logic**, nhưng có **2 vấn đề cần sửa**:

1. **Nguồn lấy Employee ID:** Cần fetch từ project team members như Web, không chỉ từ task participants
2. **Layout File:** Cần đảm bảo có các view cần thiết để hiển thị accountable person

Sau khi sửa 2 vấn đề này, code Android sẽ hoạt động giống Web.
