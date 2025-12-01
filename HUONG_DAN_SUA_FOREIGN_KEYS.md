# Hướng dẫn Sửa Foreign Key Relationships cho Employees

## 🔍 Vấn đề

Khi query nhân viên với relationship trong Supabase, không lấy được dữ liệu phòng ban và vị trí:
- `departments:department_id (id, name)` → trả về `None`
- `positions:position_id (id, name)` → trả về `None`

## ✅ Giải pháp

### Phương pháp 1: Chạy SQL Script (Khuyến nghị - Dễ nhất)

1. **Mở Supabase Dashboard**
   ```
   https://supabase.com/dashboard
   → Chọn project của bạn
   → SQL Editor
   ```

2. **Chạy Script SQL**
   - Mở file: `database/migrations/fix_employees_foreign_keys.sql`
   - Copy toàn bộ nội dung
   - Paste vào SQL Editor
   - Click **Run** (hoặc nhấn `Ctrl+Enter`)

3. **Kiểm tra kết quả**
   - Script sẽ hiển thị thông báo cho mỗi bước
   - Xem phần cuối để kiểm tra constraints đã được tạo

### Phương pháp 2: Chạy từng lệnh SQL

Nếu muốn chạy từng bước một:

#### Bước 1: Kiểm tra constraints hiện tại
```sql
SELECT 
    tc.constraint_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'employees' 
  AND tc.constraint_type = 'FOREIGN KEY';
```

#### Bước 2: Tạo constraint cho department_id
```sql
-- Xóa constraint cũ nếu có
ALTER TABLE employees 
DROP CONSTRAINT IF EXISTS employees_department_id_fkey;

-- Tạo constraint mới
ALTER TABLE employees 
ADD CONSTRAINT employees_department_id_fkey 
FOREIGN KEY (department_id) 
REFERENCES departments(id) 
ON DELETE SET NULL;
```

#### Bước 3: Tạo constraint cho position_id
```sql
ALTER TABLE employees 
DROP CONSTRAINT IF EXISTS employees_position_id_fkey;

ALTER TABLE employees 
ADD CONSTRAINT employees_position_id_fkey 
FOREIGN KEY (position_id) 
REFERENCES positions(id) 
ON DELETE SET NULL;
```

#### Bước 4: Tạo constraint cho manager_id
```sql
ALTER TABLE employees 
DROP CONSTRAINT IF EXISTS employees_manager_id_fkey;

ALTER TABLE employees 
ADD CONSTRAINT employees_manager_id_fkey 
FOREIGN KEY (manager_id) 
REFERENCES employees(id) 
ON DELETE SET NULL;
```

### Phương pháp 3: Sử dụng Script Python

**Lưu ý**: Script này cần `SUPABASE_SERVICE_ROLE_KEY` và có thể không hoạt động nếu không có quyền.

```bash
cd backend
python scripts/fix_employees_foreign_keys.py
```

## 🧪 Kiểm tra sau khi sửa

### 1. Kiểm tra trong Supabase Dashboard

1. Vào **Table Editor**
2. Chọn bảng **employees**
3. Vào tab **Foreign Keys**
4. Bạn sẽ thấy:
   - ✅ `employees_department_id_fkey` → `departments(id)`
   - ✅ `employees_position_id_fkey` → `positions(id)`
   - ✅ `employees_manager_id_fkey` → `employees(id)`

### 2. Test query trong SQL Editor

```sql
-- Test query với JOIN (cách truyền thống)
SELECT 
    e.id,
    e.first_name,
    e.last_name,
    d.name as department_name,
    p.name as position_name
FROM employees e
LEFT JOIN departments d ON e.department_id = d.id
LEFT JOIN positions p ON e.position_id = p.id
WHERE e.status = 'active'
LIMIT 5;
```

### 3. Test relationship query trong Supabase

```sql
-- Test query với relationship (PostgREST syntax)
SELECT 
    id,
    first_name,
    last_name,
    departments:department_id (name),
    positions:position_id (name)
FROM employees
WHERE status = 'active'
LIMIT 5;
```

### 4. Test trong Frontend

1. Refresh trình duyệt
2. Mở dialog thêm thành viên dự án
3. Kiểm tra:
   - ✅ Phòng ban và vị trí hiển thị đúng
   - ✅ Bộ lọc phòng ban hoạt động
   - ✅ Thông tin manager hiển thị đúng

## 📊 Test Script

Chạy script test để kiểm tra dữ liệu:

```bash
cd backend
python test_employee_departments_positions.py
```

Script này sẽ:
- ✅ Test lấy danh sách phòng ban
- ✅ Test lấy danh sách vị trí
- ✅ Test query nhân viên với relationship
- ✅ Test map nhân viên với phòng ban/vị trí
- ✅ Hiển thị thống kê

## ⚠️ Lưu ý

1. **Backup**: Nên backup database trước khi chạy migration
2. **Quyền**: Cần quyền admin hoặc service role key
3. **Dữ liệu**: Script sẽ kiểm tra và báo lỗi nếu có dữ liệu không hợp lệ

## 🐛 Troubleshooting

### Lỗi: "constraint already exists"
- ✅ Bình thường, constraint đã tồn tại và đúng
- Có thể bỏ qua hoặc xóa constraint cũ trước

### Lỗi: "foreign key constraint violation"
- ❌ Có dữ liệu không hợp lệ
- Chạy query kiểm tra:
  ```sql
  -- Tìm nhân viên có department_id không tồn tại
  SELECT e.* FROM employees e
  LEFT JOIN departments d ON e.department_id = d.id
  WHERE e.department_id IS NOT NULL AND d.id IS NULL;
  ```
- Sửa dữ liệu hoặc set NULL cho các giá trị không hợp lệ

### Lỗi: "permission denied"
- ❌ Không có quyền sửa schema
- Giải pháp: Dùng service role key hoặc chạy SQL trực tiếp trong Supabase Dashboard

### Relationship query vẫn không hoạt động
- Kiểm tra xem constraints đã được tạo chưa
- Thử query với JOIN thay vì relationship
- Frontend code đã có fallback method, sẽ tự động query riêng và map

## 📝 Tóm tắt

1. **Chạy SQL script** trong Supabase Dashboard (dễ nhất)
2. **Kiểm tra** constraints đã được tạo
3. **Test** query với relationship
4. **Refresh frontend** và kiểm tra lại

Sau khi sửa xong, frontend sẽ tự động lấy được dữ liệu phòng ban và vị trí của nhân viên!

