# Quy trình tạo dự án - Các sự kiện diễn ra

## Tổng quan
Khi người dùng bấm nút "Tạo dự án" trong `CreateProjectModal`, một chuỗi các sự kiện sẽ được thực thi tự động.

---

## 1. Frontend - Xử lý Form Submit

### File: `frontend/src/components/projects/CreateProjectModal.tsx`

**Sự kiện:**
1. User bấm nút "Tạo dự án"
2. `handleSubmit()` được gọi
3. Validate form data
4. Chuẩn bị dữ liệu:
   - Convert budget, hourly_rate sang số
   - Set `actual_cost = 0.0`
   - Convert dates sang ISO format
5. Gọi API: `projectApi.createProject(submitData)`
   - Fallback: Nếu API fail, gọi trực tiếp Supabase

---

## 2. Backend - Xử lý Request

### File: `backend/routers/projects.py` - `create_project()`

**Sự kiện:**
1. Nhận request POST `/api/projects`
2. Validate authentication (require_manager_or_admin)
3. Chuẩn bị project data:
   - Generate UUID cho project id
   - Set `created_by = current_user.id`
   - Set `created_at`, `updated_at`
   - Convert enum values sang string
4. **Insert vào bảng `projects`**

---

## 3. Database - Triggers Tự Động (Sau khi INSERT project)

### Trigger 1: `trigger_ensure_task_group_on_project_create`
**File:** `database/migrations/sync_task_groups_with_project_categories.sql`

**Sự kiện:**
- Chạy: `AFTER INSERT ON projects`
- Function: `ensure_task_group_for_project_category()`
- **Nếu project có `category_id`:**
  - Kiểm tra xem đã có `task_group` với `category_id` này chưa
  - Nếu chưa có, tự động tạo `task_group` mới:
    - `category_id` = project.category_id
    - `is_active = true`
    - `name`, `description` sẽ được lấy từ `project_categories` khi JOIN

---

### Trigger 2: `trigger_create_task_on_project_create`
**File:** `database/migrations/sync_task_groups_with_project_categories.sql`

**Sự kiện:**
- Chạy: `AFTER INSERT ON projects` (SAU trigger 1)
- Function: `create_task_for_project()`
- **Nếu project có `category_id`:**
  - Lấy `task_group_id` từ `category_id`
  - Tự động tạo task mặc định:
    - `title` = project.name
    - `description` = "Nhiệm vụ chính cho dự án {project.name}"
    - `status` = 'todo'
    - `priority` = project.priority (map từ project_priority sang task_priority)
    - `group_id` = task_group_id
    - `project_id` = project.id
    - `assigned_to` = project.manager_id
    - `start_date` = project.start_date
    - `due_date` = project.end_date

---

## 4. Backend - Tự Động Thêm Manager vào Project Team

### File: `backend/routers/projects.py` - Sau khi insert project

**Sự kiện:**
1. **Xác định employee_id:**
   - Ưu tiên: `project_data.manager_id` (từ form)
   - Fallback: Tìm `employee_id` từ `created_by` (user_id của người tạo)

2. **Lấy thông tin employee:**
   - Query `employees` table để lấy: first_name, last_name, email, phone, user_id

3. **Kiểm tra trùng lặp:**
   - Kiểm tra xem đã có trong `project_team` chưa bằng:
     - `user_id` (nếu có)
     - `email` (nếu có)
     - `name` (nếu có)

4. **Insert vào `project_team`:**
   - `project_id` = project.id
   - `name` = employee name
   - `role` = **"manager"** (đảm bảo không null)
   - `responsibility_type` = **"accountable"** (Manager là accountable)
   - `email`, `phone`, `user_id` từ employee
   - `start_date` = project.start_date
   - `status` = "active"

---

## 5. Database - Trigger Tự Động (Sau khi INSERT project_team)

### Trigger 3: `trigger_auto_add_project_team_to_task_participants`
**File:** `database/migrations/sync_project_team_to_task_participants.sql`

**Sự kiện:**
- Chạy: `AFTER INSERT ON project_team`
- Function: `auto_add_project_team_to_task_participants()`
- **Nếu status = 'active':**
  - Tìm `employee_id` từ `user_id`
  - Tự động thêm vào `task_participants` cho TẤT CẢ tasks của project:
    - `task_id` = tất cả tasks có `project_id`
    - `employee_id` = employee_id từ project_team
    - `role` = map từ `responsibility_type`:
      - 'accountable' → 'responsible'
      - 'responsible' → 'responsible'
      - 'consulted' → 'participant'
      - 'informed' → 'observer'

---

## 6. Backend - Retry Logic Thêm vào Task Participants

### File: `backend/routers/projects.py` - Sau khi thêm vào project_team

**Sự kiện:**
1. **Retry logic (3 lần, mỗi lần đợi 0.5s):**
   - Query tasks của project
   - Nếu có tasks:
     - Kiểm tra existing participants
     - Thêm vào `task_participants` với `role = "responsible"`
   - Nếu chưa có tasks:
     - Đợi trigger tạo task (retry)

**Lý do retry:**
- Trigger tạo task có thể chạy async
- Cần đợi task được tạo trước khi thêm vào task_participants

---

## 7. Frontend - Hiển thị Success

### File: `frontend/src/components/projects/CreateProjectModal.tsx`

**Sự kiện:**
1. Nhận response từ API
2. Set `success = true`
3. Set `createdProject` với name và code
4. Hiển thị `ProjectSuccessModal`
5. Phát âm thanh success (nếu có)
6. Gọi `onSuccess()` để reload danh sách projects
7. Reset form về trạng thái ban đầu

---

## Tóm tắt Flow

```
User bấm "Tạo dự án"
    ↓
Frontend: handleSubmit()
    ↓
Backend: POST /api/projects
    ↓
Database: INSERT INTO projects
    ↓
Trigger 1: ensure_task_group (nếu có category_id)
    ↓
Trigger 2: create_task (nếu có category_id)
    ↓
Backend: Thêm manager vào project_team
    ↓
Database: INSERT INTO project_team
    ↓
Trigger 3: auto_add_to_task_participants
    ↓
Backend: Retry logic thêm vào task_participants
    ↓
Frontend: Hiển thị success modal
```

---

## Các Bảng Được Tạo/Cập Nhật

1. **projects** - Dự án mới
2. **task_groups** - Nhóm nhiệm vụ (nếu có category_id)
3. **tasks** - Nhiệm vụ mặc định (nếu có category_id)
4. **project_team** - Thành viên dự án (manager)
5. **task_participants** - Người tham gia nhiệm vụ (manager)

---

## Lưu Ý

- Tất cả các bước đều có error handling
- Nếu một bước fail, các bước trước vẫn được thực thi
- Triggers chạy tự động, không cần can thiệp thủ công
- Retry logic đảm bảo task_participants được thêm đúng

---

## Lỗi "null value in column role violates not-null constraint"

### Nguyên nhân
Lỗi này xảy ra ở **Trigger 5: `trigger_auto_add_to_project_team_if_in_multiple_tasks`**

**Sự kiện:**
- Khi thêm nhân viên vào `task_participants` của nhiều tasks (>= 50% tasks của project)
- Trigger tự động INSERT vào `project_team` nhưng **THIẾU trường `role`**
- Cột `role` trong `project_team` là NOT NULL → Lỗi!

**File:** `database/migrations/sync_task_participants_to_project_team.sql`
**Function:** `auto_add_to_project_team_if_in_multiple_tasks()`

### Cách sửa
Đã tạo migration fix: `database/migrations/fix_project_team_role_in_trigger.sql`

**Thay đổi:**
- Thêm trường `role` vào INSERT statement
- Map `responsibility_type` sang `role`:
  - 'accountable' → 'manager'
  - 'responsible' → 'member'
  - 'consulted' → 'member'
  - 'informed' → 'member'

### Các nơi khác đã được fix
1. ✅ `backend/routers/projects.py` - Tự động thêm manager với `role = "manager"`
2. ✅ `backend/routers/project_team.py` - Set default `role = "member"` nếu null
3. ✅ `backend/api/project_team.py` - Set default `role = "member"` nếu null
4. ✅ `database/migrations/fix_project_team_role_in_trigger.sql` - Fix trigger

