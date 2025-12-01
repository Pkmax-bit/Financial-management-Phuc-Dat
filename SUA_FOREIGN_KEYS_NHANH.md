# Hướng dẫn Sửa Foreign Keys - Phiên bản đơn giản

## 🚀 Cách nhanh nhất (3 bước)

### Bước 1: Mở Supabase SQL Editor
1. Vào https://supabase.com/dashboard
2. Chọn project của bạn
3. Click **SQL Editor** ở sidebar trái

### Bước 2: Copy và chạy SQL

**Chọn một trong hai cách:**

#### Cách A: Script đơn giản (Khuyến nghị)
Copy toàn bộ nội dung file: `database/migrations/fix_employees_foreign_keys_simple.sql`

#### Cách B: Chạy từng lệnh
Copy và chạy từng lệnh này:

```sql
-- 1. Sửa department_id
ALTER TABLE employees DROP CONSTRAINT IF EXISTS employees_department_id_fkey;
ALTER TABLE employees 
ADD CONSTRAINT employees_department_id_fkey 
FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL;

-- 2. Sửa position_id
ALTER TABLE employees DROP CONSTRAINT IF EXISTS employees_position_id_fkey;
ALTER TABLE employees 
ADD CONSTRAINT employees_position_id_fkey 
FOREIGN KEY (position_id) REFERENCES positions(id) ON DELETE SET NULL;

-- 3. Sửa manager_id
ALTER TABLE employees DROP CONSTRAINT IF EXISTS employees_manager_id_fkey;
ALTER TABLE employees 
ADD CONSTRAINT employees_manager_id_fkey 
FOREIGN KEY (manager_id) REFERENCES employees(id) ON DELETE SET NULL;
```

### Bước 3: Kiểm tra
Sau khi chạy, bạn sẽ thấy thông báo:
- ✅ Đã tạo constraint: employees_department_id_fkey
- ✅ Đã tạo constraint: employees_position_id_fkey
- ✅ Đã tạo constraint: employees_manager_id_fkey

## ✅ Xong!

Refresh frontend và kiểm tra lại dialog thêm thành viên. Phòng ban và vị trí sẽ hiển thị đúng!

