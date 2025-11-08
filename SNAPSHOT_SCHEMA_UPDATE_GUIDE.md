# Hướng dẫn cập nhật Schema Snapshot

## Mục đích
Cập nhật bảng `expense_snapshots` để lưu trữ ID chi phí cha, chi phí con và project_id riêng biệt, giúp:
- Truy vấn nhanh hơn
- Xác thực snapshot thuộc đúng dự án
- Hiển thị nút "Quay lại" chính xác

## Các thay đổi

### 1. Database Schema
```sql
-- Thêm cột mới
ALTER TABLE public.expense_snapshots 
ADD COLUMN IF NOT EXISTS parent_expense_id UUID,
ADD COLUMN IF NOT EXISTS child_expense_id UUID,
ADD COLUMN IF NOT EXISTS project_id UUID;

-- Thêm indexes
CREATE INDEX IF NOT EXISTS idx_expense_snapshots_parent_id 
  ON public.expense_snapshots USING btree (parent_expense_id);

CREATE INDEX IF NOT EXISTS idx_expense_snapshots_child_id 
  ON public.expense_snapshots USING btree (child_expense_id);

CREATE INDEX IF NOT EXISTS idx_expense_snapshots_project_id 
  ON public.expense_snapshots USING btree (project_id);
```

### 2. Backend Logic
- **AutoSnapshotService**: Lưu `parent_expense_id`, `child_expense_id`, `project_id` khi tạo snapshot
- **Query optimization**: Sử dụng các cột ID riêng thay vì parse JSON
- **Project validation**: Kiểm tra `project_id` để đảm bảo snapshot thuộc đúng dự án

### 3. Frontend Logic
- **SnapshotStatusIndicator**: Nhận `projectId` prop để validate
- **ProjectExpensesTab**: Truyền `expense.project_id` vào component
- **Smart display**: Chỉ hiển thị nút "Quay lại" khi snapshot thuộc đúng dự án

## Cách thực hiện

### Bước 1: Cập nhật Database
```bash
# Chạy script cập nhật
python run_snapshot_schema_update.py
```

Hoặc chạy SQL trực tiếp trong Supabase Dashboard:
1. Vào https://supabase.com/dashboard
2. Chọn project của bạn
3. Vào SQL Editor
4. Chạy nội dung file `update_snapshot_schema.sql`

### Bước 2: Kiểm tra Schema
```sql
-- Kiểm tra cột mới
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'expense_snapshots' 
AND column_name IN ('parent_expense_id', 'child_expense_id', 'project_id');

-- Kiểm tra indexes
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'expense_snapshots' 
AND indexname LIKE 'idx_expense_snapshots_%';
```

### Bước 3: Test Functionality
1. Tạo chi phí cha trong dự án
2. Tạo chi phí con → snapshot được tạo với `parent_expense_id`, `child_expense_id`, `project_id`
3. Kiểm tra nút "Quay lại" chỉ hiển thị cho đúng dự án
4. Test restore functionality

## Lợi ích

### 1. Performance
- **Trước**: Parse JSON để tìm parent/child IDs
- **Sau**: Query trực tiếp bằng `parent_expense_id`

### 2. Accuracy
- **Trước**: Có thể hiển thị nút "Quay lại" cho snapshot của dự án khác
- **Sau**: Chỉ hiển thị cho snapshot thuộc đúng dự án

### 3. Maintainability
- **Trước**: Logic phức tạp trong JSON parsing
- **Sau**: Logic đơn giản với foreign keys

## Troubleshooting

### Lỗi: Column already exists
```sql
-- Kiểm tra cột đã tồn tại
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'expense_snapshots' 
AND column_name IN ('parent_expense_id', 'child_expense_id', 'project_id');
```

### Lỗi: Index already exists
```sql
-- Kiểm tra indexes
SELECT indexname FROM pg_indexes 
WHERE tablename = 'expense_snapshots' 
AND indexname LIKE 'idx_expense_snapshots_%';
```

### Lỗi: Foreign key constraint
```sql
-- Kiểm tra constraints
SELECT conname, contype FROM pg_constraint 
WHERE conrelid = 'expense_snapshots'::regclass;
```

## Migration cho dữ liệu cũ

Nếu có dữ liệu snapshot cũ, có thể migrate:

```sql
-- Update existing snapshots with parent_expense_id from JSON
UPDATE expense_snapshots 
SET parent_expense_id = (expenses_data->0->'parent_expense'->>'id')::uuid
WHERE parent_expense_id IS NULL 
AND jsonb_array_length(expenses_data) > 0;

-- Update project_id from parent expense data
UPDATE expense_snapshots 
SET project_id = (
  SELECT project_id 
  FROM expenses 
  WHERE id = parent_expense_id
)
WHERE project_id IS NULL 
AND parent_expense_id IS NOT NULL;
```

## Kết quả mong đợi

Sau khi cập nhật:
1. ✅ Snapshot được tạo với `parent_expense_id`, `child_expense_id`, `project_id`
2. ✅ Nút "Quay lại" chỉ hiển thị cho đúng dự án
3. ✅ Query performance tốt hơn
4. ✅ Logic đơn giản và dễ maintain
