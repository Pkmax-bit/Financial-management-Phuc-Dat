# 🚨 QUAN TRỌNG: Chạy Migration Ngay

## Lỗi hiện tại
```
Could not find the 'project_id' column of 'internal_conversations' in the schema cache
```

## ✅ Giải pháp: Chạy Migration SQL

### Cách 1: Supabase Dashboard (KHUYẾN NGHỊ - Dễ nhất)

1. **Mở Supabase Dashboard:**
   - Truy cập: https://supabase.com/dashboard
   - Đăng nhập và chọn project của bạn

2. **Vào SQL Editor:**
   - Click vào menu bên trái
   - Chọn **SQL Editor** (biểu tượng ⚡)

3. **Copy và chạy SQL:**
   - Mở file: `database/migrations/add_project_id_to_internal_conversations.sql`
   - **Copy toàn bộ nội dung** (bên dưới)
   - Paste vào SQL Editor
   - Click **Run** hoặc nhấn `Ctrl + Enter`

4. **SQL cần chạy:**
```sql
-- Add project_id column to internal_conversations
ALTER TABLE internal_conversations
ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id) ON DELETE SET NULL;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_conversations_project_id ON internal_conversations(project_id);

-- Add comment
COMMENT ON COLUMN internal_conversations.project_id IS 'Liên kết với dự án (optional) - cho phép chat nội bộ liên kết với dự án';
```

5. **Kiểm tra kết quả:**
   - Bạn sẽ thấy: `Success. No rows returned`
   - Migration đã thành công!

---

### Cách 2: Qua Terminal (nếu có quyền truy cập database)

```bash
# Kết nối database
psql "postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres"

# Chạy migration
\i database/migrations/add_project_id_to_internal_conversations.sql
```

---

## ✅ Sau khi chạy migration

1. **Refresh lại trang chat** trong ứng dụng
2. **Thử tạo nhóm chat mới** với liên kết dự án
3. Lỗi sẽ biến mất!

---

## 🔍 Kiểm tra migration đã chạy thành công

Chạy SQL này trong Supabase SQL Editor để kiểm tra:

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'internal_conversations'
AND column_name = 'project_id';
```

**Kết quả mong đợi:**
```
column_name  | data_type | is_nullable
-------------+-----------+-------------
project_id   | uuid      | YES
```

Nếu có kết quả như trên → Migration thành công! ✅

