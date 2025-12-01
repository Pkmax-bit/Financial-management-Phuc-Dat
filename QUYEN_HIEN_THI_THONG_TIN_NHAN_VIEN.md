# Quyền Hiển Thị Thông Tin Nhân Viên

Tài liệu này mô tả các điều kiện và quyền hiển thị thông tin nhân viên trên các trang **Dự án**, **Bán hàng (Sales)**, và **Chi phí (Expenses)**.

## 📋 Tổng Quan

Hệ thống kiểm soát quyền hiển thị thông tin nhân viên dựa trên:
1. **Vai trò (Role)** của người dùng
2. **Quyền truy cập dự án** (project_team membership)
3. **Giai đoạn dự án** (project stage)
4. **Loại thông tin** cần hiển thị

---

## 🏗️ TRANG DỰ ÁN (Projects)

### 1. Quyền Truy Cập Dự Án

#### Các vai trò có quyền xem TẤT CẢ dự án:
- ✅ **admin**
- ✅ **accountant**

#### Các vai trò khác:
- Chỉ xem được các dự án mà họ **thuộc project_team** với `status = 'active'`
- Kiểm tra theo `user_id` HOẶC `email` trong bảng `project_team`

**Code tham khảo:**
```python
# backend/routers/projects.py - check_user_has_project_access()
if current_user.role in ["admin", "accountant"]:
    return True  # Xem tất cả dự án

# Kiểm tra project_team membership
team_query = supabase.table("project_team")
    .select("id")
    .eq("project_id", project_id)
    .eq("status", "active")
    .eq("user_id", current_user.id)  # hoặc .eq("email", current_user.email)
```

### 2. Hiển Thị Thông Tin Nhân Viên Trong Dự Án

#### Trang Chi Tiết Dự Án (`/projects/[id]/detail`)

**Tab "Đội ngũ" (Team Tab):**
- Hiển thị danh sách thành viên từ `project_team` với `status = 'active'`
- Thông tin hiển thị:
  - ✅ Tên nhân viên
  - ✅ Email (nếu có)
  - ✅ Số điện thoại (nếu có)
  - ✅ Vai trò trong dự án (role)
  - ✅ Ngày bắt đầu (start_date)
  - ✅ Trạng thái (active/inactive)
  - ✅ Kỹ năng (skills)
  - ✅ Giá/giờ (hourly_rate) - nếu có

**Component:** `frontend/src/components/projects/ProjectTeam.tsx`

**Điều kiện hiển thị:**
- Không có điều kiện ẩn thông tin - tất cả thành viên trong `project_team` đều được hiển thị
- Chỉ lọc theo `status = 'active'`

#### Dialog Thêm Thành Viên (`ProjectTeamDialog`)

**Hiển thị danh sách nhân viên để chọn:**
- ✅ Lấy TẤT CẢ nhân viên từ bảng `employees` với `status = 'active'`
- ✅ Lấy TẤT CẢ users từ bảng `users` với `is_active = true`
- ❌ Loại bỏ những nhân viên/users đã có trong `project_team` của dự án này

**Thông tin hiển thị khi chọn nhân viên:**
- ✅ Tên đầy đủ
- ✅ Email
- ✅ Phòng ban (department)
- ✅ Vị trí (position)
- ✅ Số điện thoại
- ✅ Địa chỉ
- ✅ Quản lý (manager_name)
- ✅ Vai trò hệ thống (role) - nếu là user

**Component:** `frontend/src/components/projects/ProjectTeamDialog.tsx`

---

## 💰 TRANG BÁN HÀNG (Sales)

### 1. Quyền Truy Cập Dữ Liệu Bán Hàng

#### Các vai trò có quyền xem TẤT CẢ:
- ✅ **admin**
- ✅ **accountant**
- ✅ **workshop_employee**

#### Các vai trò khác:
- Chỉ xem được quotes/invoices của các dự án mà họ **thuộc project_team**

**Code tham khảo:**
```python
# backend/routers/sales.py - get_user_accessible_project_ids()
if current_user.role in ["admin", "accountant", "workshop_employee"]:
    return None  # Xem tất cả projects

# Lọc theo project_team
team_query = supabase.table("project_team")
    .select("project_id")
    .eq("status", "active")
    .eq("user_id", current_user.id)  # hoặc email
```

### 2. Hiển Thị Thông Tin Nhân Viên

**Trang Sales (`/sales`):**
- Không hiển thị trực tiếp thông tin nhân viên trong danh sách quotes/invoices
- Thông tin nhân viên chỉ hiển thị gián tiếp qua:
  - Tên người tạo quote/invoice (created_by)
  - Tên người phụ trách dự án (project manager)

**Component:** `frontend/src/app/sales/page.tsx`

---

## 💸 TRANG CHI PHÍ (Expenses)

### 1. Quyền Truy Cập Chi Phí

#### Các vai trò có quyền xem TẤT CẢ chi phí:
- ✅ **admin**
- ✅ **accountant**
- ✅ **workshop_employee**

#### Các vai trò khác:
- Chỉ xem được chi phí của các dự án mà họ **thuộc project_team**

**Code tham khảo:**
```python
# backend/routers/project_expenses.py
if current_user.role in ["admin", "accountant", "workshop_employee"]:
    # Xem tất cả chi phí
else:
    # Lọc theo project_team
    team_query = supabase.table("project_team")
        .select("project_id")
        .eq("status", "active")
```

### 2. Hiển Thị Thông Tin Nhân Viên

#### Trang Chi Phí Dự Án (`ProjectExpensesTab`)

**Thông tin nhân viên hiển thị:**
- ✅ Tên nhân viên phụ trách chi phí (employee_id → employees → users.full_name)
- Hiển thị trong cột "Mô tả" của bảng chi phí

**Cách lấy dữ liệu:**
```typescript
// Lấy employee_id từ project_expenses
// → Lấy user_id từ employees
// → Lấy full_name từ users
const { data: empRows } = await supabase
  .from('employees')
  .select('id, user_id')
  .in('id', employeeIds)

const { data: userRows } = await supabase
  .from('users')
  .select('id, full_name')
  .in('id', userIds)
```

**Component:** `frontend/src/components/expenses/ProjectExpensesTab.tsx`

#### Quyền Chỉnh Sửa/Xóa Chi Phí

**Các vai trò có quyền chỉnh sửa/xóa:**
- ✅ **admin**
- ✅ **accountant**
- ✅ **manager**
- ✅ **Supplier** (workshop_employee)
- ✅ **vận chuyển** (transport)
- ✅ **nhân công** (worker)

**Điều kiện bổ sung:**
- **Chi phí kế hoạch (planned):**
  - Chỉ chỉnh sửa được khi `status = 'pending'`
  - Chỉ xóa được khi `status = 'pending'` hoặc `'approved'`
  
- **Chi phí thực tế (actual):**
  - Có thể chỉnh sửa/xóa (để sửa lỗi)

**Code tham khảo:**
```typescript
// frontend/src/components/expenses/ProjectExpensesTab.tsx
const canEdit = (expense: ProjectExpense) => {
  const allowedRoles = ['admin', 'accountant', 'manager', 'Supplier', 'vận chuyển', 'nhân công']
  if (!allowedRoles.includes(userRole)) return false
  
  if (expense.category === 'planned') {
    return expense.status === 'pending'  // Chỉ pending mới sửa được
  }
  return true  // Actual expenses có thể sửa
}
```

---

## 🔐 TÓM TẮT ĐIỀU KIỆN

### 1. Quyền Xem Dự Án/Chi Phí/Bán Hàng

| Vai trò | Xem tất cả | Xem theo project_team |
|---------|-----------|----------------------|
| admin | ✅ | - |
| accountant | ✅ | - |
| workshop_employee | ❌ | ✅ |
| sales | ❌ | ✅ |
| employee | ❌ | ✅ |
| worker | ❌ | ✅ |
| transport | ❌ | ✅ |
| customer | ❌ | ✅ (nếu có trong project_team) |

### 2. Quyền Hiển Thị Thông Tin Nhân Viên

**Không có điều kiện ẩn thông tin nhân viên** - nếu người dùng có quyền xem dự án/chi phí, họ sẽ thấy:
- ✅ Tên nhân viên
- ✅ Email
- ✅ Số điện thoại
- ✅ Vai trò trong dự án
- ✅ Phòng ban/Vị trí (trong dialog chọn nhân viên)

**Lưu ý:** Thông tin nhân viên chỉ hiển thị trong phạm vi dự án mà người dùng có quyền truy cập.

### 3. Quyền Chỉnh Sửa/Xóa Chi Phí

| Vai trò | Sửa/Xóa chi phí |
|---------|----------------|
| admin | ✅ |
| accountant | ✅ |
| manager | ✅ |
| Supplier (workshop_employee) | ✅ |
| vận chuyển (transport) | ✅ |
| nhân công (worker) | ✅ |
| sales | ❌ |
| employee | ❌ |
| customer | ❌ |

---

## 📝 Ghi Chú Quan Trọng

1. **project_team là cơ chế chính** để kiểm soát quyền truy cập dự án
2. **Không có cơ chế ẩn thông tin nhân viên** - nếu có quyền xem dự án thì thấy tất cả thông tin nhân viên trong dự án đó
3. **Vai trò admin/accountant/workshop_employee** có quyền cao nhất - xem tất cả
4. **Thông tin nhân viên được lấy từ nhiều nguồn:**
   - Bảng `employees` (thông tin cơ bản)
   - Bảng `users` (thông tin tài khoản, full_name)
   - Bảng `project_team` (vai trò trong dự án)

---

## 🔍 Các File Liên Quan

### Backend:
- `backend/routers/projects.py` - Quyền truy cập dự án
- `backend/routers/sales.py` - Quyền truy cập bán hàng
- `backend/routers/project_expenses.py` - Quyền truy cập chi phí
- `backend/utils/permissions.py` - Định nghĩa quyền theo vai trò

### Frontend:
- `frontend/src/components/projects/ProjectTeam.tsx` - Hiển thị đội ngũ dự án
- `frontend/src/components/projects/ProjectTeamDialog.tsx` - Dialog chọn nhân viên
- `frontend/src/components/expenses/ProjectExpensesTab.tsx` - Hiển thị chi phí và nhân viên
- `frontend/src/utils/enhancedRolePermissions.ts` - Định nghĩa quyền frontend

---

**Cập nhật lần cuối:** Dựa trên codebase hiện tại

