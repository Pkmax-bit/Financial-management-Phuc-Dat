# Hướng dẫn tạo tài khoản nhân viên xưởng

## 🎯 Mục đích
Tạo tài khoản nhân viên xưởng với phân quyền phù hợp:
- Nhân viên xưởng chỉ thấy đối tượng chi phí xưởng
- Nhân công chỉ thấy đối tượng chi phí nhân công
- Tổng chi phí con được tính tự động cho đối tượng cha

## 📋 Danh sách tài khoản cần tạo

### Nhân viên xưởng (workshop_employee):
1. **xuong.quandoc@company.com**
   - Tên: Nguyễn Văn Quản Đốc
   - Role: workshop_employee
   - Mật khẩu: 123456

2. **xuong.congnhan1@company.com**
   - Tên: Trần Thị Công Nhân 1
   - Role: workshop_employee
   - Mật khẩu: 123456

3. **xuong.congnhan2@company.com**
   - Tên: Lê Văn Công Nhân 2
   - Role: workshop_employee
   - Mật khẩu: 123456

### Nhân công (worker):
1. **nhan.cong1@company.com**
   - Tên: Phạm Thị Nhân Công 1
   - Role: worker
   - Mật khẩu: 123456

2. **nhan.cong2@company.com**
   - Tên: Hoàng Văn Nhân Công 2
   - Role: worker
   - Mật khẩu: 123456

## 🔧 Các bước thực hiện

### Bước 1: Tạo đối tượng chi phí xưởng
Chạy script SQL: `create_workshop_expense_objects.sql` trong Supabase SQL Editor

### Bước 2: Tạo tài khoản Auth
Vào Supabase Dashboard > Authentication > Users > Add user

### Bước 3: Tạo User Records
Chạy script SQL sau trong Supabase SQL Editor:

```sql
-- TẠO USERS
INSERT INTO users (id, email, full_name, role, is_active, created_at, updated_at)
VALUES (gen_random_uuid(), 'xuong.quandoc@company.com', 'Nguyễn Văn Quản Đốc', 'workshop_employee', true, now(), now());

INSERT INTO users (id, email, full_name, role, is_active, created_at, updated_at)
VALUES (gen_random_uuid(), 'xuong.congnhan1@company.com', 'Trần Thị Công Nhân 1', 'workshop_employee', true, now(), now());

INSERT INTO users (id, email, full_name, role, is_active, created_at, updated_at)
VALUES (gen_random_uuid(), 'xuong.congnhan2@company.com', 'Lê Văn Công Nhân 2', 'workshop_employee', true, now(), now());

INSERT INTO users (id, email, full_name, role, is_active, created_at, updated_at)
VALUES (gen_random_uuid(), 'nhan.cong1@company.com', 'Phạm Thị Nhân Công 1', 'worker', true, now(), now());

INSERT INTO users (id, email, full_name, role, is_active, created_at, updated_at)
VALUES (gen_random_uuid(), 'nhan.cong2@company.com', 'Hoàng Văn Nhân Công 2', 'worker', true, now(), now());

-- TẠO EMPLOYEES
INSERT INTO employees (id, user_id, employee_code, first_name, last_name, email, phone, hire_date, status, created_at, updated_at)
VALUES (gen_random_uuid(), (SELECT id FROM users WHERE email = 'xuong.quandoc@company.com'), 'EMP-WORKSHOP-001', 'Quản Đốc', 'Nguyễn Văn', 'xuong.quandoc@company.com', '0123456789', '2024-01-01', 'active', now(), now());

INSERT INTO employees (id, user_id, employee_code, first_name, last_name, email, phone, hire_date, status, created_at, updated_at)
VALUES (gen_random_uuid(), (SELECT id FROM users WHERE email = 'xuong.congnhan1@company.com'), 'EMP-WORKSHOP-002', 'Công Nhân 1', 'Trần Thị', 'xuong.congnhan1@company.com', '0123456789', '2024-01-01', 'active', now(), now());

INSERT INTO employees (id, user_id, employee_code, first_name, last_name, email, phone, hire_date, status, created_at, updated_at)
VALUES (gen_random_uuid(), (SELECT id FROM users WHERE email = 'xuong.congnhan2@company.com'), 'EMP-WORKSHOP-003', 'Công Nhân 2', 'Lê Văn', 'xuong.congnhan2@company.com', '0123456789', '2024-01-01', 'active', now(), now());

INSERT INTO employees (id, user_id, employee_code, first_name, last_name, email, phone, hire_date, status, created_at, updated_at)
VALUES (gen_random_uuid(), (SELECT id FROM users WHERE email = 'nhan.cong1@company.com'), 'EMP-WORKER-001', 'Nhân Công 1', 'Phạm Thị', 'nhan.cong1@company.com', '0123456789', '2024-01-01', 'active', now(), now());

INSERT INTO employees (id, user_id, employee_code, first_name, last_name, email, phone, hire_date, status, created_at, updated_at)
VALUES (gen_random_uuid(), (SELECT id FROM users WHERE email = 'nhan.cong2@company.com'), 'EMP-WORKER-002', 'Nhân Công 2', 'Hoàng Văn', 'nhan.cong2@company.com', '0123456789', '2024-01-01', 'active', now(), now());
```

## 🌳 Cấu trúc đối tượng chi phí

```
XƯỞNG SẢN XUẤT (Root)
├── Nguyên vật liệu chính
│   ├── Thép
│   └── Xi măng
├── Nguyên vật liệu phụ
│   ├── Vít, ốc
│   └── Keo dán
└── Nhân công xưởng

NHÂN CÔNG (Root)
├── Nhân công thợ chính
└── Nhân công thợ phụ
```

## 🔐 Phân quyền

### WORKSHOP_EMPLOYEE (Nhân viên xưởng):
- **Quyền**: Chỉ thấy đối tượng chi phí xưởng
- **Tính năng**: Dashboard, Projects, Expenses
- **Đối tượng chi phí**: Xưởng sản xuất và tất cả con

### WORKER (Nhân công):
- **Quyền**: Chỉ thấy đối tượng chi phí nhân công
- **Tính năng**: Dashboard, Projects, Expenses
- **Đối tượng chi phí**: Nhân công và tất cả con

## 🚀 Cách sử dụng

### 1. Đăng nhập với tài khoản xưởng:
- **Email**: xuong.quandoc@company.com
- **Mật khẩu**: 123456
- **Role**: workshop_employee

### 2. Thêm chi phí dự án:
- Vào trang Expenses
- Click "Thêm chi phí"
- Chọn đối tượng chi phí (chỉ thấy đối tượng xưởng)

### 3. Xem báo cáo:
- Tổng chi phí xưởng = Tổng các chi phí con
- Hiển thị trong báo cáo dự án

## 🔄 Tích hợp vào frontend

### 1. Tạo file phân quyền:
Tạo file `frontend/src/utils/expenseObjectPermissions.ts`:

```typescript
// Cấu hình phân quyền đối tượng chi phí theo role
export const EXPENSE_OBJECT_ROLE_PERMISSIONS = {
  workshop_employee: [], // Sẽ được cập nhật sau khi tạo đối tượng
  worker: [], // Sẽ được cập nhật sau khi tạo đối tượng
  admin: [], // Admin thấy tất cả
  accountant: [], // Kế toán thấy tất cả
  sales: [], // Sales thấy tất cả
  transport: [], // Vận chuyển thấy tất cả
  employee: [], // Nhân viên chung thấy tất cả
  customer: [] // Khách hàng không thấy
};

// Hàm kiểm tra quyền truy cập đối tượng chi phí
export const canAccessExpenseObject = (userRole: string, expenseObjectId: string): boolean => {
  const rolePermissions = EXPENSE_OBJECT_ROLE_PERMISSIONS[userRole];
  
  // Admin, accountant, sales thấy tất cả
  if (['admin', 'accountant', 'sales'].includes(userRole)) {
    return true;
  }
  
  // Khách hàng không thấy
  if (userRole === 'customer') {
    return false;
  }
  
  // Kiểm tra quyền cụ thể
  return rolePermissions.includes(expenseObjectId);
};

// Hàm lọc đối tượng chi phí theo role
export const filterExpenseObjectsByRole = (expenseObjects: any[], userRole: string): any[] => {
  if (['admin', 'accountant', 'sales'].includes(userRole)) {
    return expenseObjects; // Thấy tất cả
  }
  
  if (userRole === 'customer') {
    return []; // Không thấy gì
  }
  
  const rolePermissions = EXPENSE_OBJECT_ROLE_PERMISSIONS[userRole];
  return expenseObjects.filter(obj => rolePermissions.includes(obj.id));
};
```

### 2. Cập nhật component CreateExpenseDialog:
Sử dụng phân quyền để lọc đối tượng chi phí theo role.

## ⚠️ Lưu ý
- Tất cả tài khoản có mật khẩu mặc định: 123456
- Vui lòng thay đổi mật khẩu sau khi đăng nhập lần đầu
- Nhân viên xưởng chỉ thấy đối tượng chi phí xưởng
- Nhân công chỉ thấy đối tượng chi phí nhân công
- Tổng chi phí con được tính tự động bởi database triggers
