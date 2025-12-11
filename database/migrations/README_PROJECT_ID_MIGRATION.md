# Migration: Thêm project_id vào internal_conversations

## Vấn đề
Lỗi: `Could not find the 'project_id' column of 'internal_conversations' in the schema cache`

## Giải pháp
Cần chạy migration để thêm cột `project_id` vào bảng `internal_conversations`.

## Cách chạy migration

### Cách 1: Qua Supabase Dashboard (Khuyến nghị)
1. Đăng nhập vào Supabase Dashboard
2. Vào **SQL Editor**
3. Copy nội dung file `add_project_id_to_internal_conversations.sql`
4. Paste vào SQL Editor và chạy

### Cách 2: Qua psql
```bash
psql -h your-db-host -U your-username -d your-database -f database/migrations/add_project_id_to_internal_conversations.sql
```

### Cách 3: Qua Python script
```bash
python scripts/run_migration_project_id.py
```

## Nội dung migration
Migration sẽ:
- Thêm cột `project_id UUID` vào bảng `internal_conversations`
- Tạo index `idx_conversations_project_id` để tối ưu truy vấn
- Thêm comment mô tả cho cột

## Kiểm tra sau khi chạy
Sau khi chạy migration, kiểm tra bằng SQL:
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'internal_conversations' 
AND column_name = 'project_id';
```

Nếu có kết quả, migration đã thành công.

