# Hướng dẫn sửa lỗi Foreign Key cho bảng payments

## Vấn đề
Lỗi: `Key (created_by)=(xxx) is not present in table "employees"`

Nguyên nhân: Bảng `payments` có foreign key constraint tham chiếu sai đến bảng `employees` thay vì bảng `users`.

## Giải pháp nhanh

### Cách 1: Chạy migration fix (Khuyến nghị)

1. Mở Supabase Dashboard > SQL Editor
2. Copy và chạy file `database/migrations/fix_payments_foreign_key.sql`
3. Hoặc chạy trực tiếp:

```sql
-- Drop incorrect foreign key constraints
ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_created_by_fkey;
ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_processed_by_fkey;

-- Recreate correct foreign key constraints (references users, not employees)
ALTER TABLE payments 
ADD CONSTRAINT payments_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE payments 
ADD CONSTRAINT payments_processed_by_fkey 
FOREIGN KEY (processed_by) REFERENCES users(id) ON DELETE SET NULL;
```

### Cách 2: Chạy lại migration đầy đủ

Migration `create_payments_table.sql` đã được cập nhật để tự động sửa foreign key. Chạy lại migration này sẽ tự động sửa lỗi.

## Kiểm tra sau khi sửa

```sql
-- Kiểm tra foreign key constraints
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
WHERE tc.table_name = 'payments' 
  AND tc.constraint_type = 'FOREIGN KEY'
  AND (kcu.column_name = 'created_by' OR kcu.column_name = 'processed_by');
```

Kết quả mong đợi:
- `created_by` → `users.id`
- `processed_by` → `users.id`

## Sau khi sửa

1. Reload schema cache: Supabase Dashboard > API settings > Reload schema
2. Restart backend
3. Thử lại thanh toán

