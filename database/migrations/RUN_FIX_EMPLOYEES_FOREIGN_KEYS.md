# Hướng dẫn Sửa Foreign Key Relationships cho Bảng Employees

## Vấn đề

Khi query nhân viên với relationship trong Supabase:
```sql
departments:department_id (id, name),
positions:position_id (id, name)
```

Kết quả trả về `None` thay vì dữ liệu phòng ban và vị trí.

## Nguyên nhân

Foreign key constraints có thể:
1. Chưa được tạo
2. Có tên không đúng
3. Bị lỗi trong quá trình migration

## Giải pháp

### Cách 1: Chạy Script SQL (Khuyến nghị)

1. **Mở Supabase Dashboard**
   - Truy cập: https://supabase.com/dashboard
   - Chọn project của bạn
   - Vào **SQL Editor**

2. **Chạy Script**
   - Copy toàn bộ nội dung file `database/migrations/fix_employees_foreign_keys.sql`
   - Paste vào SQL Editor
   - Click **Run** hoặc nhấn `Ctrl+Enter`

3. **Kiểm tra kết quả**
   - Script sẽ hiển thị thông báo cho mỗi bước
   - Kiểm tra phần "KIỂM TRA SAU KHI SỬA" để xem constraints đã được tạo chưa

### Cách 2: Chạy từng lệnh riêng lẻ

Nếu muốn chạy từng bước:

#### Bước 1: Kiểm tra constraints hiện tại
```sql
SELECT 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'employees' 
  AND tc.constraint_type = 'FOREIGN KEY'
ORDER BY kcu.column_name;
```

#### Bước 2: Tạo constraint cho department_id
```sql
ALTER TABLE employees 
ADD CONSTRAINT employees_department_id_fkey 
FOREIGN KEY (department_id) 
REFERENCES departments(id) 
ON DELETE SET NULL;
```

#### Bước 3: Tạo constraint cho position_id
```sql
ALTER TABLE employees 
ADD CONSTRAINT employees_position_id_fkey 
FOREIGN KEY (position_id) 
REFERENCES positions(id) 
ON DELETE SET NULL;
```

#### Bước 4: Tạo constraint cho manager_id
```sql
ALTER TABLE employees 
ADD CONSTRAINT employees_manager_id_fkey 
FOREIGN KEY (manager_id) 
REFERENCES employees(id) 
ON DELETE SET NULL;
```

### Cách 3: Sử dụng Script Python

Chạy script Python để tự động sửa:

```bash
cd backend
python scripts/fix_employees_foreign_keys.py
```

## Kiểm tra sau khi sửa

### 1. Kiểm tra trong Supabase Dashboard

Vào **Table Editor** > **employees** > **Foreign Keys** tab, bạn sẽ thấy:
- `employees_department_id_fkey` → `departments(id)`
- `employees_position_id_fkey` → `positions(id)`
- `employees_manager_id_fkey` → `employees(id)`

### 2. Test query trong SQL Editor

```sql
-- Test query với relationship
SELECT 
    e.id,
    e.first_name,
    e.last_name,
    e.department_id,
    e.position_id,
    d.name as department_name,
    p.name as position_name
FROM employees e
LEFT JOIN departments d ON e.department_id = d.id
LEFT JOIN positions p ON e.position_id = p.id
WHERE e.status = 'active'
LIMIT 5;
```

### 3. Test trong Frontend

Sau khi sửa, refresh trình duyệt và mở dialog thêm thành viên. Bạn sẽ thấy:
- ✅ Phòng ban và vị trí hiển thị đúng
- ✅ Bộ lọc phòng ban hoạt động
- ✅ Thông tin manager hiển thị đúng

## Lưu ý

1. **Backup trước khi chạy**: Nên backup database trước khi chạy migration
2. **Kiểm tra dữ liệu**: Script sẽ kiểm tra và báo lỗi nếu có dữ liệu không hợp lệ
3. **Thời gian**: Script có thể mất vài giây để chạy xong

## Troubleshooting

### Lỗi: "constraint already exists"
- Bỏ qua, constraint đã tồn tại và đúng

### Lỗi: "foreign key constraint violation"
- Có dữ liệu không hợp lệ (department_id/position_id không tồn tại)
- Chạy phần "KIỂM TRA DỮ LIỆU" trong script để tìm và sửa

### Lỗi: "permission denied"
- Đảm bảo bạn đang dùng service role key hoặc có quyền admin

## Sau khi sửa xong

1. Refresh frontend
2. Mở dialog thêm thành viên
3. Kiểm tra xem phòng ban và vị trí có hiển thị không
4. Test bộ lọc phòng ban

