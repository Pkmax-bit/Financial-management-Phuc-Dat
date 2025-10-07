# 🎯 Hướng Dẫn Tạo Tài Khoản Với Schema Mới

## 📋 Cấu Trúc Database Mới

### **Bảng `users`:**
- Có foreign key tham chiếu đến `auth.users` (Supabase Auth)
- Chỉ có thể tạo user nếu đã có user tương ứng trong Supabase Auth
- Dùng để xác thực đăng nhập

### **Bảng `employees`:**
- Tham chiếu đến `users` table qua `user_id`
- Chứa thông tin chi tiết về nhân viên
- Không cần Supabase Auth

---

## 🚀 Trạng Thái Hiện Tại

### **✅ Đã Hoàn Thành:**
- **Admin User** (`admin@example.com` / `admin123`) - ✅ **HOẠT ĐỘNG**
  - Đã tạo trong Supabase Auth
  - Có record trong `users` table
  - Có record trong `employees` table

### **❌ Cần Làm Thêm:**
- Tạo các user khác trong `users` table (không cần Supabase Auth)
- Cập nhật backend authentication để xử lý cả hai loại user
- Test login functionality

---

## 🔧 Hướng Dẫn Tạo Tài Khoản

### **Bước 1: Tạo Users Trong Database**

Sử dụng SQL script `create_accounts_new_schema.sql`:

```sql
-- Tạo users trong users table (không cần Supabase Auth)
INSERT INTO users (id, email, full_name, role, phone, is_active, created_at, updated_at) VALUES
('b2a349fe-c644-4773-b1fb-3ed9e0174b94', 'sales@example.com', 'Sales Manager', 'employee', '0123456790', true, now(), now()),
('bb046b79-91e6-474f-8c46-791be8fab729', 'accountant@example.com', 'Accountant', 'employee', '0123456791', true, now(), now()),
('d9ef0457-ae4e-4a71-8081-8253992cf25e', 'workshop@example.com', 'Workshop Employee', 'workshop_employee', '0123456792', true, now(), now()),
('7e1b050c-e35b-42d8-819b-c49bc153fb3b', 'worker@example.com', 'Worker', 'employee', '0123456793', true, now(), now()),
('f0d26aa8-b444-41bb-99b6-6367853e253f', 'transport@example.com', 'Transport', 'employee', '0123456794', true, now(), now()),
('e4e9d8af-7ac0-4452-8696-c9f736873e33', 'customer@example.com', 'Customer', 'employee', '0123456795', true, now(), now());
```

### **Bước 2: Tạo Employees Trong Database**

```sql
-- Tạo employees trong employees table
INSERT INTO employees (id, user_id, employee_code, first_name, last_name, email, phone, hire_date, status, created_at, updated_at) VALUES
('efa4d889-cb3e-45d0-a198-63ae26867d1a', 'b2a349fe-c644-4773-b1fb-3ed9e0174b94', 'EMP002', 'Sales', 'Manager', 'sales@example.com', '0123456790', '2024-01-01', 'active', now(), now()),
('c2d3b44f-5e0f-4046-8271-4027d358d41f', 'bb046b79-91e6-474f-8c46-791be8fab729', 'EMP003', 'Accountant', 'User', 'accountant@example.com', '0123456791', '2024-01-01', 'active', now(), now()),
('5e02186c-f0e2-4b7b-aefd-35598a0e5312', 'd9ef0457-ae4e-4a71-8081-8253992cf25e', 'EMP004', 'Workshop', 'Employee', 'workshop@example.com', '0123456792', '2024-01-01', 'active', now(), now()),
('4bbd71f2-d716-4fa1-abc2-480d3222301c', '7e1b050c-e35b-42d8-819b-c49bc153fb3b', 'EMP005', 'Worker', 'User', 'worker@example.com', '0123456793', '2024-01-01', 'active', now(), now()),
('6f9829bb-f3f6-4e07-82f0-e12b1dd7f659', 'f0d26aa8-b444-41bb-99b6-6367853e253f', 'EMP006', 'Transport', 'User', 'transport@example.com', '0123456794', '2024-01-01', 'active', now(), now()),
('a7018514-68c0-4a25-9423-2e24256946f1', 'e4e9d8af-7ac0-4452-8696-c9f736873e33', 'EMP007', 'Customer', 'User', 'customer@example.com', '0123456795', '2024-01-01', 'active', now(), now());
```

### **Bước 3: Cập Nhật Backend Authentication**

Cần cập nhật backend để xử lý hai loại authentication:

1. **Admin User**: Sử dụng Supabase Auth
2. **Other Users**: Sử dụng database authentication

---

## 🎯 Chức Năng Phân Quyền

### **👑 Admin (admin@example.com):**
- ✅ Supabase Auth authentication
- ✅ Toàn quyền truy cập
- ✅ Quản lý hệ thống

### **💰 Sales (sales@example.com):**
- ✅ Database authentication
- ✅ Quản lý báo giá và chi phí
- ✅ Tạo, chỉnh sửa, duyệt quotes

### **📊 Accountant (accountant@example.com):**
- ✅ Database authentication
- ✅ Quản lý tài chính và hóa đơn
- ✅ Tạo và quản lý invoices

### **🔧 Workshop (workshop@example.com):**
- ✅ Database authentication
- ✅ Tạo chi phí sản xuất
- ✅ Quản lý chi phí workshop

### **👷 Worker (worker@example.com):**
- ✅ Database authentication
- ✅ Tạo chi phí cơ bản
- ✅ Quản lý chi phí công việc

### **🚚 Transport (transport@example.com):**
- ✅ Database authentication
- ✅ Tạo chi phí vận chuyển
- ✅ Quản lý chi phí logistics

### **👥 Customer (customer@example.com):**
- ✅ Database authentication
- ✅ Portal khách hàng
- ✅ Xem tiến độ dự án

---

## 📁 Files Đã Tạo

### **SQL Files:**
- `create_accounts_new_schema.sql` - SQL script cho schema mới
- `create_accounts.sql` - SQL script cho schema cũ

### **Python Scripts:**
- `create_accounts_new_schema.py` - Script tạo tài khoản với schema mới
- `create_accounts_correct_approach.py` - Script với approach đúng

### **Documentation:**
- `NEW_SCHEMA_ACCOUNT_GUIDE.md` - Hướng dẫn chi tiết

---

## 🔧 Troubleshooting

### **Lỗi Foreign Key Constraint:**
- Bảng `users` có foreign key tham chiếu đến `auth.users`
- Chỉ có thể tạo user nếu đã có user tương ứng trong Supabase Auth
- Giải pháp: Tạo user trong Supabase Auth trước, hoặc sử dụng database authentication

### **Authentication Flow:**
- Admin: Supabase Auth → Database users table
- Others: Backend API → Database users table
- Cần cập nhật backend để xử lý cả hai loại

---

## 📋 Tóm Tắt

**✅ Đã Hoàn Thành:**
- Admin User với Supabase Auth
- Database schema mới
- SQL scripts và Python scripts

**⚠️ Cần Làm Thêm:**
- Tạo users khác trong database
- Cập nhật backend authentication
- Test login functionality

**Trang login đã sẵn sàng để test với Admin User!** 🚀
