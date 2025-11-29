# 🔧 Migration: Thêm tính năng Reply cho Task Comments

## ❌ Lỗi gặp phải

```
500 Internal Server Error khi GET /api/tasks/{task_id}
```

**Nguyên nhân:** Database chưa có cột `parent_id` trong bảng `task_comments`.

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
Mở file: database/migrations/add_parent_id_to_task_comments.sql
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
WHERE table_name = 'task_comments' 
  AND column_name = 'parent_id';
```

**Kết quả mong đợi:**
```
column_name  | data_type
-------------+-----------
parent_id    | uuid
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
\i database/migrations/add_parent_id_to_task_comments.sql
```

hoặc

```bash
psql -f database/migrations/add_parent_id_to_task_comments.sql "postgresql://..."
```

#### Bước 3: Kiểm tra
```sql
\d task_comments
```

---

## 📋 Nội dung Migration

File: `database/migrations/add_parent_id_to_task_comments.sql`

```sql
-- Migration: Add parent_id to task_comments for reply functionality
-- This allows comments to be replies to other comments

-- Add parent_id column to task_comments table
ALTER TABLE task_comments 
ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES task_comments(id) ON DELETE CASCADE;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_task_comments_parent_id ON task_comments(parent_id);

-- Add comment
COMMENT ON COLUMN task_comments.parent_id IS 'ID of parent comment if this is a reply, NULL for top-level comments';
```

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
-- Chỉ cần verify column đã tạo:
\d task_comments
```

### Lỗi: "relation does not exist"
**Giải pháp:** Table chưa được tạo
```sql
-- Kiểm tra tables tồn tại:
SELECT tablename FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'task_comments';
```

### Lỗi: PGRST204 - "Could not find the 'parent_id' column in the schema cache"
**Nguyên nhân:** Cột đã tồn tại trong database nhưng Supabase PostgREST cache chưa được refresh

**Giải pháp (QUAN TRỌNG - Làm theo thứ tự):**
```
1. Reload schema trong Supabase Dashboard:
   - Vào: Supabase Dashboard > Settings > API
   - Tìm phần "Schema Cache" hoặc "Reload schema"
   - Click "Reload" hoặc "Refresh schema"
   - Đợi 10-30 giây

2. Restart backend:
   - Dừng backend (Ctrl+C)
   - Chạy lại: restart_backend.bat
   - Hoặc: cd backend && python -m uvicorn main:app --reload

3. Đợi thêm 10-20 giây để cache refresh hoàn toàn

4. Thử lại API call
```

**Nếu vẫn lỗi:**
```sql
-- Verify column đã tồn tại:
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'task_comments' 
  AND column_name = 'parent_id';

-- Nếu có kết quả (column tồn tại):
-- → Chỉ cần reload schema cache (bước 1-2 ở trên)

-- Nếu không có kết quả (column chưa tồn tại):
-- → Chạy lại migration SQL
```

### Vẫn lỗi 500 sau migration
**Giải pháp:** 
```
1. Restart backend: restart_backend.bat
2. Clear Supabase cache:
   - Supabase Dashboard > API > Reload schema
3. Hoặc đợi vài giây để cache refresh
4. Thử lại API call
```

---

## 🎉 Sau khi chạy Migration

Tính năng reply sẽ hoạt động:

```
✅ Trả lời bằng nút: Hover vào tin nhắn → Click nút Reply
✅ Trả lời bằng kéo: Giữ và kéo tin nhắn sang phải → Thả ra
✅ Hiển thị replies lồng nhau trong comments
✅ Hủy reply bằng nút X hoặc phím Escape
```

---

## 🎯 Next Steps

1. **Chạy migration** (2 phút)
2. **Restart backend** (30 giây)
3. **Test tính năng reply** (1 phút)
4. **Done!** 🎉

---

*Migration: Add parent_id to task_comments*  
*File: database/migrations/add_parent_id_to_task_comments.sql*  
*Status: Ready to run*  
*Impact: Low (adds nullable column)*  
*Rollback: Available (if needed)*

