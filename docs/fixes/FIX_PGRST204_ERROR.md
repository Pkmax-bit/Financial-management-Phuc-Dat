# 🔧 Fix Error PGRST204 - Missing Column

## ❌ Lỗi đầy đủ

```
Kết quả import
Tổng số dòng: 1
Thành công: 0
Lỗi: 1
👤 Import bởi: admin@test.com

Chi tiết lỗi:
Dòng 2: {
  'message': "Could not find the 'created_by' column of 'users' in the schema cache", 
  'code': 'PGRST204', 
  'hint': None, 
  'details': None
}
```

---

## 🎯 Nguyên nhân

Database **chưa có cột `created_by` và `updated_by`** trong bảng `users` và `employees`.

Code backend đã được update để lưu audit trail (người tạo, người cập nhật), nhưng database schema chưa có các cột này.

---

## ✅ Giải pháp - 3 bước (2 phút)

### Bước 1: Mở Supabase SQL Editor

```
1. Truy cập: https://app.supabase.com
2. Chọn project của bạn
3. Click vào "SQL Editor" ở sidebar bên trái
```

### Bước 2: Copy SQL migration

Mở file `database/quick_fix_audit_columns.sql` và copy toàn bộ, HOẶC copy SQL sau:

```sql
-- Add audit columns
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES users(id);

ALTER TABLE employees 
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES users(id);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_users_created_by ON users(created_by);
CREATE INDEX IF NOT EXISTS idx_users_updated_by ON users(updated_by);
CREATE INDEX IF NOT EXISTS idx_employees_created_by ON employees(created_by);
CREATE INDEX IF NOT EXISTS idx_employees_updated_by ON employees(updated_by);

-- Verify
SELECT 'users' as table_name, column_name 
FROM information_schema.columns 
WHERE table_name = 'users' AND column_name IN ('created_by', 'updated_by')
UNION ALL
SELECT 'employees', column_name 
FROM information_schema.columns 
WHERE table_name = 'employees' AND column_name IN ('created_by', 'updated_by');
```

### Bước 3: Run migration

```
1. Paste SQL vào SQL Editor
2. Click "Run" hoặc nhấn Ctrl+Enter (Cmd+Enter trên Mac)
3. Đợi vài giây
4. Thấy kết quả: 4 rows
   - users, created_by
   - users, updated_by
   - employees, created_by
   - employees, updated_by
5. ✅ Done!
```

---

## 🧪 Test lại

### Bước 1: Restart backend (Optional)
```bash
# Windows
restart_backend.bat

# Mac/Linux
cd backend
python -m uvicorn main:app --reload
```

### Bước 2: Upload Excel lại
```
1. Vào trang Nhân viên
2. Click "Upload Excel"
3. Chọn file và upload
4. Kết quả:
   ✅ Thành công: 1
   ❌ Lỗi: 0
   👤 Import bởi: admin@test.com
```

### Bước 3: Verify audit trail
```sql
-- Trong Supabase SQL Editor
SELECT 
  e.employee_code,
  e.email,
  u.email as created_by_email
FROM employees e
LEFT JOIN users u ON e.created_by = u.id
WHERE e.created_by IS NOT NULL
LIMIT 5;
```

---

## 📊 Screenshot Migration

### Trước migration:
```
❌ Error PGRST204
Could not find the 'created_by' column of 'users' in the schema cache
```

### Sau migration:
```
✅ Kết quả import
Tổng số dòng: 5
Thành công: 5
Lỗi: 0
👤 Import bởi: admin@test.com

Database lưu:
- created_by: <UUID của admin>
- updated_by: <UUID của admin>
- created_at: 2025-11-11 10:30:00
- updated_at: 2025-11-11 10:30:00
```

---

## ⚠️ Lưu ý

### 1. Migration an toàn
```sql
-- Sử dụng IF NOT EXISTS
-- Không làm mất data cũ
-- Có thể chạy nhiều lần
-- Columns là NULLABLE (records cũ sẽ NULL)
```

### 2. Không cần rollback
```
- Migration này cần thiết cho audit trail
- Không có side effects
- Chỉ thêm columns, không sửa data
```

### 3. Performance
```
- Đã tạo indexes
- Query sẽ nhanh
- Không ảnh hưởng performance
```

---

## 🆘 Nếu vẫn lỗi

### Lỗi: "permission denied"
**Giải pháp:** Sử dụng Supabase Dashboard (có full permissions)

### Lỗi: "column already exists"
**Giải pháp:** Tốt! Migration đã chạy rồi. Thử upload lại.

### Vẫn báo PGRST204 sau migration
**Giải pháp:**
```
1. Reload schema trong Supabase:
   Dashboard > API > Reload schema
   
2. Restart backend:
   restart_backend.bat
   
3. Đợi 10-30 giây (Supabase cache refresh)

4. Thử upload lại
```

### Lỗi khác
**Xem hướng dẫn đầy đủ:** `RUN_MIGRATION_AUDIT_COLUMNS.md`

---

## 📚 Files liên quan

| File | Mục đích |
|------|----------|
| `database/quick_fix_audit_columns.sql` | Quick fix SQL (30 giây) |
| `database/migration_add_audit_columns.sql` | Full migration với comments |
| `RUN_MIGRATION_AUDIT_COLUMNS.md` | Hướng dẫn chi tiết |
| `AUDIT_TRAIL_EXCEL.md` | Audit trail documentation |

---

## 🎯 Tóm tắt

```
Lỗi: PGRST204 - Missing 'created_by' column
      ↓
Giải pháp: Add columns vào database
      ↓
1. Mở Supabase SQL Editor
2. Copy SQL từ quick_fix_audit_columns.sql
3. Run migration (30 giây)
      ↓
Done! Upload Excel hoạt động bình thường ✅
```

---

## 🎉 Sau khi fix

Upload Excel sẽ thành công và lưu audit trail đầy đủ:

```json
{
  "message": "Hoàn thành import",
  "success_count": 5,
  "error_count": 0,
  "total_rows": 5,
  "imported_by": "admin@test.com",
  "imported_by_id": "123e4567-e89b-12d3-a456-426614174000"
}
```

Database sẽ có:
- ✅ created_by - Người tạo
- ✅ updated_by - Người cập nhật
- ✅ created_at - Thời gian tạo
- ✅ updated_at - Thời gian cập nhật

**Perfect for audit và compliance! 🎊**

---

*Error Code: PGRST204*  
*Fix Time: 2 minutes*  
*Difficulty: Easy*  
*Impact: None (just adds columns)*

