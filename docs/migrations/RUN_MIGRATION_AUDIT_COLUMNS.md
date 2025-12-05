# 🔧 Migration: Thêm cột Audit Trail

## ❌ Lỗi gặp phải

```
Dòng 2: {'message': "Could not find the 'created_by' column of 'users' in the schema cache", 
'code': 'PGRST204'}
```

**Nguyên nhân:** Database chưa có cột `created_by` và `updated_by` trong bảng `users` và `employees`.

---

## ✅ Giải pháp: Chạy Migration

### Cách 1: Sử dụng Supabase Dashboard (KHUYẾN NGHỊ)

#### Bước 1: Mở Supabase Dashboard
```
1. Truy cập: https://app.supabase.com
2. Chọn project của bạn
3. Vào menu "SQL Editor"
```

#### Bước 2: Copy SQL migration
```
Mở file: database/migration_add_audit_columns.sql
Copy toàn bộ nội dung
```

#### Bước 3: Chạy migration
```
1. Paste SQL vào SQL Editor
2. Click "Run" hoặc nhấn Ctrl+Enter
3. Đợi kết quả: ✅ Success
```

#### Bước 4: Verify
```sql
-- Chạy query này để kiểm tra:
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' 
  AND column_name IN ('created_by', 'updated_by');

SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'employees' 
  AND column_name IN ('created_by', 'updated_by');
```

**Kết quả mong đợi:**
```
column_name  | data_type
-------------+-----------
created_by   | uuid
updated_by   | uuid
```

---

### Cách 2: Sử dụng psql (Command line)

#### Bước 1: Kết nối database
```bash
# Lấy connection string từ Supabase Dashboard
# Settings > Database > Connection string

psql "postgresql://postgres:[YOUR-PASSWORD]@[YOUR-HOST]:[PORT]/postgres"
```

#### Bước 2: Chạy migration file
```bash
\i database/migration_add_audit_columns.sql
```

hoặc

```bash
psql -f database/migration_add_audit_columns.sql "postgresql://..."
```

#### Bước 3: Kiểm tra
```sql
\d users
\d employees
```

---

### Cách 3: Sử dụng SQL Script trực tiếp

Copy và chạy SQL sau trong Supabase SQL Editor:

```sql
-- Add columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES users(id);

-- Add columns to employees table
ALTER TABLE employees 
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES users(id);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_users_created_by ON users(created_by);
CREATE INDEX IF NOT EXISTS idx_users_updated_by ON users(updated_by);
CREATE INDEX IF NOT EXISTS idx_employees_created_by ON employees(created_by);
CREATE INDEX IF NOT EXISTS idx_employees_updated_by ON employees(updated_by);

-- Done!
SELECT 'Migration completed!' as status;
```

---

## 🧪 Test sau khi chạy Migration

### Test 1: Kiểm tra cột đã tạo
```sql
-- Kiểm tra users table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'users' 
  AND column_name IN ('created_by', 'updated_by');

-- Kiểm tra employees table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'employees' 
  AND column_name IN ('created_by', 'updated_by');
```

### Test 2: Thử upload Excel
```
1. Vào trang Nhân viên
2. Click "Upload Excel"
3. Chọn file và upload
4. Kết quả: ✅ Thành công!
```

### Test 3: Kiểm tra audit trail
```sql
-- Xem nhân viên vừa tạo với audit info
SELECT 
  e.employee_code,
  e.email,
  e.created_at,
  u1.email as created_by_email,
  u2.email as updated_by_email
FROM employees e
LEFT JOIN users u1 ON e.created_by = u1.id
LEFT JOIN users u2 ON e.updated_by = u2.id
ORDER BY e.created_at DESC
LIMIT 5;
```

---

## 📋 Checklist

- [ ] **Backup database** (quan trọng!)
  ```sql
  -- Trong Supabase Dashboard > Database > Backups
  -- Hoặc export data:
  pg_dump > backup_before_migration.sql
  ```

- [ ] **Chạy migration**
  - Mở Supabase SQL Editor
  - Copy SQL từ `migration_add_audit_columns.sql`
  - Paste và Run
  - Xem kết quả: ✅ Success

- [ ] **Verify columns**
  ```sql
  \d users
  \d employees
  ```

- [ ] **Test upload Excel**
  - Upload file mẫu
  - Kiểm tra không còn lỗi PGRST204

- [ ] **Check audit data**
  ```sql
  SELECT * FROM employees 
  WHERE created_by IS NOT NULL 
  LIMIT 5;
  ```

---

## ⚠️ Lưu ý quan trọng

### 1. Nullable columns
```sql
-- Cột created_by và updated_by là NULLABLE
-- Vì records cũ không có giá trị này
-- Records mới sẽ tự động được fill
```

### 2. Foreign key constraint
```sql
-- created_by và updated_by REFERENCES users(id)
-- Đảm bảo user phải tồn tại trong bảng users
```

### 3. Không ảnh hưởng data cũ
```sql
-- Migration sử dụng IF NOT EXISTS
-- An toàn chạy nhiều lần
-- Không làm mất dữ liệu cũ
```

### 4. Performance
```sql
-- Đã tạo indexes
-- Query với created_by/updated_by sẽ nhanh
```

---

## 🔄 Rollback (Nếu cần)

Nếu muốn xóa các cột này:

```sql
-- WARNING: Chỉ chạy nếu thực sự cần rollback!

-- Drop indexes
DROP INDEX IF EXISTS idx_users_created_by;
DROP INDEX IF EXISTS idx_users_updated_by;
DROP INDEX IF EXISTS idx_employees_created_by;
DROP INDEX IF EXISTS idx_employees_updated_by;

-- Drop columns
ALTER TABLE users 
DROP COLUMN IF EXISTS created_by,
DROP COLUMN IF EXISTS updated_by;

ALTER TABLE employees 
DROP COLUMN IF EXISTS created_by,
DROP COLUMN IF EXISTS updated_by;
```

**⚠️ Lưu ý:** Rollback sẽ **XÓA VĨNH VIỄN** audit trail data!

---

## 🆘 Troubleshooting

### Lỗi: "permission denied"
**Giải pháp:** Đảm bảo user có quyền ALTER TABLE
```sql
-- Sử dụng postgres superuser
-- Hoặc trong Supabase Dashboard (có full permissions)
```

### Lỗi: "column already exists"
**Giải pháp:** Không sao! Migration sử dụng IF NOT EXISTS
```sql
-- Chỉ cần verify columns đã tạo:
\d users
\d employees
```

### Lỗi: "relation does not exist"
**Giải pháp:** Table chưa được tạo
```sql
-- Kiểm tra tables tồn tại:
SELECT tablename FROM pg_tables 
WHERE schemaname = 'public';
```

### Vẫn lỗi PGRST204 sau migration
**Giải pháp:** 
```
1. Restart backend: restart_backend.bat
2. Clear Supabase cache:
   - Supabase Dashboard > API > Reload schema
3. Hoặc đợi vài giây để cache refresh
4. Thử upload lại
```

---

## 📚 Related Files

- `database/migration_add_audit_columns.sql` - Migration SQL
- `AUDIT_TRAIL_EXCEL.md` - Audit trail documentation
- `backend/routers/employee_excel.py` - Backend code sử dụng audit columns

---

## 🎉 Sau khi chạy Migration

Upload Excel sẽ thành công với audit trail đầy đủ:

```
✅ Kết quả import
Tổng số dòng: 5
Thành công: 5
Lỗi: 0
👤 Import bởi: admin@test.com

Database sẽ lưu:
- created_by: UUID của admin@test.com
- updated_by: UUID của admin@test.com
- created_at: Timestamp
- updated_at: Timestamp
```

---

## 🎯 Next Steps

1. **Chạy migration** (5 phút)
2. **Test upload Excel** (2 phút)
3. **Verify audit trail** (1 phút)
4. **Done!** 🎉

---

*Migration: Add Audit Trail Columns*  
*File: database/migration_add_audit_columns.sql*  
*Status: Ready to run*  
*Impact: Low (adds nullable columns)*  
*Rollback: Available (if needed)*

