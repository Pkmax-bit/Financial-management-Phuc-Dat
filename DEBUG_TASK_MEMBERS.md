# 🔍 Debug: Đường đi lấy tên thành viên nhiệm vụ

## 📊 Luồng dữ liệu (Data Flow)

### 1. Backend API: `GET /api/tasks/{task_id}`

**Endpoint:** `backend/routers/tasks.py` → `get_task()`

**Trả về:**
```json
{
  "task": {
    "id": "...",
    "assigned_to": "employee_id",
    "assigned_to_name": "Tên nhân viên",  // ← Từ employees table
    "group_id": "group_id"
  },
  "assignments": [  // ← Từ task_assignments table
    {
      "id": "...",
      "assigned_to": "employee_id",
      "assigned_to_name": "Tên nhân viên"  // ← Từ employees table
    }
  ],
  "participants": [  // ← Từ task_participants table
    {
      "employee_id": "...",
      "employee_name": "..."
    }
  ]
}
```

**Code backend (dòng 958-975):**
```python
# Get assignments
assignments_result = supabase.table("task_assignments").select("""
    *,
    employees:assigned_to(id, first_name, last_name),
    users:assigned_by(id, full_name)
""").eq("task_id", task_id).execute()

assignments = []
for assignment in assignments_result.data or []:
    emp = assignment.get("employees")
    if emp:
        assignment["assigned_to_name"] = f"{emp.get('first_name', '')} {emp.get('last_name', '')}".strip()
    assignments.append(assignment)
```

---

### 2. Frontend: Load dữ liệu

**File:** `frontend/src/app/tasks/[taskId]/page.tsx`

**Function:** `loadTaskDetails()` (dòng 362-405)

```typescript
const data = await apiGet(`/api/tasks/${taskId}`)
setTaskData(data)  // ← Lưu vào state

// Load group members nếu có group_id
if (data?.task?.group_id) {
  const members = await apiGet(`/api/tasks/groups/${data.task.group_id}/members`)
  setGroupMembers(members || [])  // ← Lưu vào state riêng
}
```

**State:**
- `taskData.assignments` - Danh sách assignments từ API
- `taskData.task.assigned_to_name` - Tên từ task object
- `groupMembers` - Danh sách members từ group (state riêng)

---

### 3. Frontend: Hiển thị thành viên

**File:** `frontend/src/app/tasks/[taskId]/page.tsx` (dòng 918-991)

**Logic ưu tiên:**
```typescript
const assignees = []

// 1. Ưu tiên: Lấy từ assignments (nếu có)
if (assignments && assignments.length > 0) {
  assignments.forEach(assignment => {
    if (assignment.assigned_to_name) {
      assignees.push({
        id: assignment.assigned_to,
        name: assignment.assigned_to_name
      })
    }
  })
}

// 2. Nếu không có assignments: Lấy từ group members
else if (groupMembers.length > 0) {
  groupMembers.forEach(member => {
    if (member.employee_name) {
      assignees.push({
        id: member.employee_id,
        name: member.employee_name,
        email: member.employee_email
      })
    }
  })
}

// 3. Fallback: Lấy từ task.assigned_to_name
else if (task?.assigned_to_name) {
  assignees.push({
    id: task.assigned_to || '',
    name: task.assigned_to_name
  })
}
```

---

## 🐛 Các trường hợp không hiển thị được

### Trường hợp 1: Không có assignments trong database

**Kiểm tra:**
```sql
-- Chạy trong Supabase SQL Editor
SELECT * FROM task_assignments WHERE task_id = 'YOUR_TASK_ID';
```

**Nếu rỗng:**
- Nhiệm vụ chưa được gán cho ai
- Hoặc chỉ có `assigned_to` trong bảng `tasks` nhưng không có record trong `task_assignments`

**Giải pháp:**
- Tạo assignment record khi tạo task
- Hoặc dùng `task.assigned_to_name` (fallback)

---

### Trường hợp 2: Assignment không có assigned_to_name

**Nguyên nhân:**
- Foreign key `assigned_to` không tồn tại trong bảng `employees`
- Hoặc join query không trả về dữ liệu

**Kiểm tra:**
```sql
-- Kiểm tra assignment có employee không
SELECT 
  ta.*,
  e.first_name,
  e.last_name
FROM task_assignments ta
LEFT JOIN employees e ON ta.assigned_to = e.id
WHERE ta.task_id = 'YOUR_TASK_ID';
```

**Giải pháp:**
- Đảm bảo `assigned_to` trỏ đến employee hợp lệ
- Kiểm tra foreign key constraint

---

### Trường hợp 3: Không có group_id hoặc group members

**Kiểm tra:**
```sql
-- Kiểm tra task có group_id không
SELECT id, group_id FROM tasks WHERE id = 'YOUR_TASK_ID';

-- Kiểm tra group members
SELECT * FROM task_group_members WHERE group_id = 'YOUR_GROUP_ID';
```

**Nếu không có:**
- Task không thuộc group nào
- Hoặc group không có members

---

### Trường hợp 4: task.assigned_to_name không có

**Nguyên nhân:**
- `assigned_to` trong bảng `tasks` là NULL
- Hoặc join với `employees` không trả về dữ liệu

**Kiểm tra:**
```sql
-- Kiểm tra task có assigned_to không
SELECT 
  t.id,
  t.assigned_to,
  e.first_name,
  e.last_name
FROM tasks t
LEFT JOIN employees e ON t.assigned_to = e.id
WHERE t.id = 'YOUR_TASK_ID';
```

---

## 🔧 Cách debug trong Browser Console

### Bước 1: Mở Console (F12)

### Bước 2: Kiểm tra dữ liệu từ API

```javascript
// Trong React DevTools hoặc console
// Xem state taskData
console.log('Task Data:', taskData)
console.log('Assignments:', taskData?.assignments)
console.log('Group Members:', groupMembers)
console.log('Task assigned_to_name:', taskData?.task?.assigned_to_name)
```

### Bước 3: Kiểm tra logic hiển thị

Thêm vào code tạm thời để debug:

```typescript
// Trong component, thêm console.log
console.log('=== DEBUG THÀNH VIÊN ===')
console.log('1. Assignments:', assignments)
console.log('2. Group Members:', groupMembers)
console.log('3. Task assigned_to_name:', task?.assigned_to_name)

const assignees = []
if (assignments && assignments.length > 0) {
  console.log('✅ Dùng assignments')
  // ...
} else if (groupMembers.length > 0) {
  console.log('✅ Dùng group members')
  // ...
} else if (task?.assigned_to_name) {
  console.log('✅ Dùng task.assigned_to_name')
  // ...
} else {
  console.log('❌ Không có dữ liệu thành viên')
}

console.log('Final assignees:', assignees)
```

---

## 📋 Checklist Debug

- [ ] **Kiểm tra API response:**
  ```bash
  curl http://localhost:8000/api/tasks/{task_id} \
    -H "Authorization: Bearer YOUR_TOKEN"
  ```
  
- [ ] **Kiểm tra assignments có dữ liệu:**
  ```sql
  SELECT * FROM task_assignments WHERE task_id = 'YOUR_TASK_ID';
  ```

- [ ] **Kiểm tra employees có dữ liệu:**
  ```sql
  SELECT * FROM employees WHERE id IN (
    SELECT assigned_to FROM task_assignments WHERE task_id = 'YOUR_TASK_ID'
  );
  ```

- [ ] **Kiểm tra group members (nếu có group_id):**
  ```sql
  SELECT * FROM task_group_members WHERE group_id = (
    SELECT group_id FROM tasks WHERE id = 'YOUR_TASK_ID'
  );
  ```

- [ ] **Kiểm tra task.assigned_to:**
  ```sql
  SELECT id, assigned_to FROM tasks WHERE id = 'YOUR_TASK_ID';
  ```

---

## 🎯 Giải pháp nhanh

### Nếu không có assignments:

**Option 1: Tạo assignment từ task.assigned_to**
```sql
-- Tạo assignment record nếu chưa có
INSERT INTO task_assignments (task_id, assigned_to, assigned_by, status)
SELECT 
  id,
  assigned_to,
  created_by,
  status
FROM tasks
WHERE id = 'YOUR_TASK_ID'
  AND assigned_to IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM task_assignments WHERE task_id = tasks.id
  );
```

**Option 2: Sửa code để dùng participants**
```typescript
// Thêm vào logic hiển thị
else if (participants && participants.length > 0) {
  participants.forEach(participant => {
    if (participant.employee_name) {
      assignees.push({
        id: participant.employee_id,
        name: participant.employee_name
      })
    }
  })
}
```

---

## 📞 Báo cáo lỗi

Nếu vẫn không hiển thị, cung cấp:

1. **Task ID:**
2. **Console logs:** (từ bước debug)
3. **API response:** (từ Network tab)
4. **SQL queries results:** (từ Supabase)

---

*File: DEBUG_TASK_MEMBERS.md*  
*Mục đích: Debug vấn đề không hiển thị thành viên*

