# Cơ Chế Project Team

Tài liệu này giải thích chi tiết về cơ chế **project_team** - hệ thống quản lý thành viên dự án và kiểm soát quyền truy cập trong hệ thống.

---

## 📋 Tổng Quan

**Project Team** là cơ chế trung tâm để:
1. ✅ **Quản lý thành viên dự án** - Ai tham gia vào dự án nào
2. ✅ **Kiểm soát quyền truy cập** - Ai được xem/chỉnh sửa dự án nào
3. ✅ **Liên kết nhân viên với dự án** - Kết nối `employees`/`users` với `projects`
4. ✅ **Quản lý vai trò trong dự án** - Vai trò cụ thể của từng thành viên trong dự án

---

## 🗄️ Cấu Trúc Database

### Bảng `project_team`

```sql
CREATE TABLE public.project_team (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name character varying(255) NOT NULL,
  role character varying(100) NOT NULL,
  email character varying(255) NULL,
  phone character varying(20) NULL,
  start_date date NOT NULL,
  hourly_rate numeric(10, 2) NULL,
  status character varying(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  skills text[] NULL,
  avatar text NULL,
  user_id uuid NULL,  -- Liên kết với bảng users
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);
```

### Các Trường Quan Trọng

| Trường | Kiểu | Mô tả | Bắt buộc |
|--------|------|-------|-----------|
| `id` | UUID | ID duy nhất của thành viên | ✅ |
| `project_id` | UUID | ID của dự án | ✅ |
| `name` | VARCHAR(255) | Tên thành viên | ✅ |
| `role` | VARCHAR(100) | Vai trò trong dự án | ✅ |
| `email` | VARCHAR(255) | Email thành viên | ❌ |
| `phone` | VARCHAR(20) | Số điện thoại | ❌ |
| `start_date` | DATE | Ngày bắt đầu tham gia dự án | ✅ |
| `hourly_rate` | DECIMAL(10,2) | Giá/giờ làm việc | ❌ |
| `status` | VARCHAR(20) | Trạng thái: 'active' hoặc 'inactive' | ✅ (mặc định: 'active') |
| `skills` | TEXT[] | Mảng kỹ năng | ❌ |
| `avatar` | TEXT | URL ảnh đại diện | ❌ |
| `user_id` | UUID | **Liên kết với bảng `users`** | ❌ |

### Indexes

```sql
CREATE INDEX idx_project_team_project_id ON project_team(project_id);
CREATE INDEX idx_project_team_status ON project_team(status);
```

---

## 🔗 Mối Quan Hệ Với Các Bảng Khác

### 1. Liên Kết Với `projects`
- **Foreign Key:** `project_id` → `projects.id`
- **ON DELETE CASCADE:** Khi xóa dự án, tự động xóa tất cả thành viên trong `project_team`

### 2. Liên Kết Với `users`
- **Trường:** `user_id` → `users.id`
- **Mục đích:** Liên kết thành viên với tài khoản hệ thống
- **Lưu ý:** Có thể có thành viên không có `user_id` (nhân viên ngoài hệ thống)

### 3. Liên Kết Với `employees`
- **Gián tiếp:** Thông qua `user_id` → `users.id` → `employees.user_id`
- **Hoặc:** So khớp qua `email` giữa `project_team.email` và `employees.email`

---

## 🔐 Cơ Chế Kiểm Soát Quyền Truy Cập

### 1. Quyền Xem Dự Án

#### Các vai trò có quyền xem TẤT CẢ dự án:
```python
if current_user.role in ["admin", "accountant"]:
    return True  # Xem tất cả dự án
```

#### Các vai trò khác (bao gồm workshop_employee, sales, employee, worker, transport):
Chỉ xem được các dự án mà họ **thuộc project_team** với `status = 'active'`

**Code kiểm tra:**
```python
def check_user_has_project_access(supabase, current_user: User, project_id: str) -> bool:
    # Admin và accountant xem tất cả
    if current_user.role in ["admin", "accountant"]:
        return True
    
    # Kiểm tra project_team membership
    team_query = supabase.table("project_team") \
        .select("id") \
        .eq("project_id", project_id) \
        .eq("status", "active")
    
    # So khớp theo user_id HOẶC email
    or_conditions = []
    if current_user.id:
        or_conditions.append(f"user_id.eq.{current_user.id}")
    if current_user.email:
        or_conditions.append(f"email.eq.{current_user.email}")
    
    if or_conditions:
        if len(or_conditions) > 1:
            team_query = team_query.or_(",".join(or_conditions))
        else:
            # Áp dụng điều kiện đơn
            condition = or_conditions[0]
            if condition.startswith("user_id.eq."):
                team_query = team_query.eq("user_id", current_user.id)
            elif condition.startswith("email.eq."):
                team_query = team_query.eq("email", current_user.email)
        
        team_result = team_query.execute()
        return len(team_result.data) > 0
    
    return False
```

### 2. Quyền Xem Chi Phí (Expenses)

Tương tự như quyền xem dự án:
- Admin/Accountant: Xem tất cả chi phí
- Các vai trò khác (bao gồm workshop_employee): Chỉ xem chi phí của dự án mà họ thuộc `project_team`

**File:** `backend/routers/project_expenses.py`

### 3. Quyền Xem Bán Hàng (Sales)

Tương tự:
- Admin/Accountant: Xem tất cả quotes/invoices
- Các vai trò khác (bao gồm workshop_employee): Chỉ xem quotes/invoices của dự án mà họ thuộc `project_team`

**File:** `backend/routers/sales.py`

---

## 🛠️ API Endpoints

### 1. Lấy Danh Sách Thành Viên

```http
GET /api/projects/{project_id}/team
```

**Response:**
```json
{
  "team_members": [
    {
      "id": "uuid",
      "project_id": "uuid",
      "name": "Nguyễn Văn A",
      "role": "Quản lý dự án",
      "email": "a@example.com",
      "phone": "0123456789",
      "start_date": "2024-01-01",
      "hourly_rate": 500000,
      "status": "active",
      "skills": ["Quản lý", "Lập trình"],
      "avatar": "https://...",
      "user_id": "uuid",
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

**File:** `backend/routers/project_team.py` - `get_project_team()`

### 2. Thêm Thành Viên

```http
POST /api/projects/{project_id}/team
Content-Type: application/json

{
  "name": "Nguyễn Văn A",
  "role": "Quản lý dự án",
  "email": "a@example.com",
  "phone": "0123456789",
  "start_date": "2024-01-01",
  "hourly_rate": 500000,
  "status": "active",
  "skills": ["Quản lý"],
  "avatar": "https://...",
  "user_id": "uuid"  // Optional
}
```

**File:** `backend/routers/project_team.py` - `add_team_member()`

### 3. Cập Nhật Thành Viên

```http
PUT /api/projects/{project_id}/team/{member_id}
Content-Type: application/json

{
  "role": "Lắp đặt",
  "status": "inactive",
  "hourly_rate": 400000
}
```

**File:** `backend/routers/project_team.py` - `update_team_member()`

### 4. Xóa Thành Viên

```http
DELETE /api/projects/{project_id}/team/{member_id}
```

**File:** `backend/routers/project_team.py` - `delete_team_member()`

---

## 💻 Frontend Implementation

### 1. Component Hiển Thị Đội Ngũ

**File:** `frontend/src/components/projects/ProjectTeam.tsx`

**Chức năng:**
- Hiển thị danh sách thành viên từ API
- Hiển thị thông tin: tên, email, SĐT, vai trò, ngày bắt đầu, kỹ năng, giá/giờ
- Thống kê: tổng thành viên, đang hoạt động, quản lý, kỹ năng

### 2. Dialog Thêm Thành Viên

**File:** `frontend/src/components/projects/ProjectTeamDialog.tsx`

**Chức năng:**
- Lấy danh sách nhân viên từ bảng `employees` (status = 'active')
- Lấy danh sách users từ bảng `users` (is_active = true)
- Loại bỏ những người đã có trong `project_team` của dự án
- Cho phép chọn nhiều nhân viên
- Phân công vai trò cho từng thành viên
- Upload avatar (lưu vào Supabase Storage bucket `minhchung_chiphi`)

**Các vai trò có thể chọn:**
- Giám sát
- Lắp đặt
- Vận chuyển
- Xưởng
- Kỹ thuật
- Thiết kế
- Quản lý dự án

**Code thêm thành viên:**
```typescript
const handleSubmit = async () => {
  const { error } = await supabase
    .from('project_team')
    .insert(
      selectedEmployees.map(employee => ({
        project_id: projectId,
        name: employee.name,
        email: employee.email,
        role: employeeRoles[employee.id] || 'Chưa phân công',
        start_date: startDate,
        user_id: employee.user_id,  // Liên kết với users
        status: 'active',
        phone: employee.phone,
        avatar: avatarUrl || employee.avatar_url
      }))
    );
  
  if (error) throw error;
  // Success
};
```

---

## 🔍 Cách Hoạt Động Chi Tiết

### 1. Quy Trình Thêm Thành Viên

```
1. User mở dialog "Thêm thành viên"
   ↓
2. Frontend lấy danh sách:
   - Tất cả employees (status = 'active')
   - Tất cả users (is_active = true)
   - Loại bỏ những người đã có trong project_team của dự án
   ↓
3. User chọn nhân viên và phân công vai trò
   ↓
4. Frontend insert vào project_team:
   - project_id: ID dự án
   - name: Tên nhân viên
   - email: Email (nếu có)
   - user_id: ID user (nếu là user trong hệ thống)
   - role: Vai trò trong dự án
   - start_date: Ngày bắt đầu
   - status: 'active'
   ↓
5. Thành viên mới có quyền truy cập dự án
```

### 2. Quy Trình Kiểm Tra Quyền Truy Cập

```
1. User yêu cầu xem dự án/chi phí/bán hàng
   ↓
2. Backend kiểm tra role:
   - Nếu admin/accountant → Cho phép
   - Nếu không → Bước 3
   ↓
3. Backend query project_team:
   SELECT id FROM project_team
   WHERE project_id = ?
     AND status = 'active'
     AND (user_id = ? OR email = ?)
   ↓
4. Nếu có kết quả → Cho phép
   Nếu không → Từ chối (403 Forbidden)
```

### 3. So Khớp User Với Project Team

Hệ thống sử dụng **2 cách** để so khớp:

**Cách 1: So khớp qua `user_id`**
```python
# Nếu user có ID trong hệ thống
if current_user.id:
    team_query = team_query.eq("user_id", current_user.id)
```

**Cách 2: So khớp qua `email`**
```python
# Nếu user có email
if current_user.email:
    team_query = team_query.eq("email", current_user.email)
```

**Ưu tiên:** Sử dụng OR condition - nếu khớp một trong hai thì cho phép.

---

## 📊 Ví Dụ Sử Dụng

### Ví Dụ 1: Thêm Nhân Viên Vào Dự Án

```typescript
// 1. User chọn nhân viên từ danh sách
const selectedEmployee = {
  id: "emp-123",
  name: "Nguyễn Văn A",
  email: "a@example.com",
  user_id: "user-456",  // Có tài khoản trong hệ thống
  type: "employee"
};

// 2. Phân công vai trò
const role = "Quản lý dự án";

// 3. Insert vào project_team
await supabase.from('project_team').insert({
  project_id: "project-789",
  name: "Nguyễn Văn A",
  email: "a@example.com",
  user_id: "user-456",  // Liên kết với users
  role: "Quản lý dự án",
  start_date: "2024-01-01",
  status: "active"
});

// 4. User "user-456" giờ có quyền truy cập dự án "project-789"
```

### Ví Dụ 2: Kiểm Tra Quyền Truy Cập

```python
# User đăng nhập với:
current_user = User(
    id="user-456",
    email="a@example.com",
    role="employee"
)

# Yêu cầu xem dự án "project-789"
project_id = "project-789"

# Backend kiểm tra:
# 1. Role không phải admin/accountant
# 2. Query project_team:
result = supabase.table("project_team") \
    .select("id") \
    .eq("project_id", "project-789") \
    .eq("status", "active") \
    .or_("user_id.eq.user-456,email.eq.a@example.com") \
    .execute()

# 3. Nếu có kết quả → Cho phép
# 4. Nếu không → Từ chối (403)
```

---

## ⚠️ Lưu Ý Quan Trọng

### 1. Trạng Thái `status`
- Chỉ thành viên với `status = 'active'` mới có quyền truy cập
- Thành viên `status = 'inactive'` không có quyền truy cập

### 2. Liên Kết `user_id`
- **Có `user_id`:** Thành viên có tài khoản trong hệ thống → So khớp qua `user_id`
- **Không có `user_id`:** Thành viên ngoài hệ thống → So khớp qua `email`

### 3. Cascade Delete
- Khi xóa dự án → Tự động xóa tất cả thành viên trong `project_team` (ON DELETE CASCADE)
- Khi xóa thành viên → Không ảnh hưởng đến dự án

### 4. Duplicate Prevention
- Frontend loại bỏ những người đã có trong `project_team` khi hiển thị danh sách chọn
- Backend không có constraint ngăn duplicate (có thể thêm nếu cần)

### 5. Vai Trò Trong Dự Án vs Vai Trò Hệ Thống
- **`project_team.role`:** Vai trò trong dự án (Giám sát, Lắp đặt, ...)
- **`users.role`:** Vai trò hệ thống (admin, sales, employee, ...)
- Hai vai trò này **độc lập** với nhau

---

## 🔧 Tối Ưu Hóa

### 1. Indexes
- `idx_project_team_project_id`: Tăng tốc query theo project_id
- `idx_project_team_status`: Tăng tốc filter theo status

### 2. Query Optimization
```python
# Query hiệu quả - chỉ select id để kiểm tra
team_query = supabase.table("project_team") \
    .select("id") \  # Chỉ select id, không cần tất cả fields
    .eq("project_id", project_id) \
    .eq("status", "active")
```

### 3. Caching (Có thể thêm)
- Cache danh sách project_ids mà user có quyền truy cập
- Invalidate cache khi thêm/xóa thành viên

---

## 📝 Tóm Tắt

| Khía Cạnh | Mô Tả |
|-----------|-------|
| **Mục đích** | Quản lý thành viên dự án và kiểm soát quyền truy cập |
| **Bảng chính** | `project_team` |
| **Liên kết** | `project_id` → `projects`, `user_id` → `users` |
| **Kiểm soát quyền** | So khớp qua `user_id` HOẶC `email` với `status = 'active'` |
| **Ngoại lệ** | Admin/Accountant xem tất cả |
| **CRUD** | Đầy đủ: Create, Read, Update, Delete |
| **Frontend** | Component `ProjectTeam` và `ProjectTeamDialog` |

---

## 📚 Files Liên Quan

### Backend:
- `backend/routers/project_team.py` - API endpoints
- `backend/routers/projects.py` - Kiểm tra quyền truy cập dự án
- `backend/routers/sales.py` - Kiểm tra quyền truy cập bán hàng
- `backend/routers/project_expenses.py` - Kiểm tra quyền truy cập chi phí

### Frontend:
- `frontend/src/components/projects/ProjectTeam.tsx` - Hiển thị đội ngũ
- `frontend/src/components/projects/ProjectTeamDialog.tsx` - Dialog thêm thành viên

### Database:
- `scripts/sql/create_project_team_table.sql` - Schema definition

---

**Cập nhật lần cuối:** Dựa trên codebase hiện tại

