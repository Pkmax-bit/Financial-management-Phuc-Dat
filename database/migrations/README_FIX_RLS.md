# Hướng Dẫn Áp Dụng Migration Fix RLS và Performance

## ⚠️ QUAN TRỌNG: ĐỌC KỸ TRƯỚC KHI CHẠY

### Bước 1: Backup Database
```bash
# Backup toàn bộ database trước khi chạy migration
pg_dump -h <host> -U <user> -d <database> > backup_before_rls_fix.sql
```

### Bước 2: Test trên Development/Staging
- **KHÔNG** chạy trực tiếp trên production
- Test kỹ trên môi trường development/staging trước
- Kiểm tra tất cả các chức năng sau khi apply

### Bước 3: Chạy Migration

#### Cách 1: Sử dụng Supabase Dashboard
1. Mở Supabase Dashboard
2. Vào SQL Editor
3. Copy nội dung file `fix_all_rls_and_performance.sql`
4. Paste và chạy

#### Cách 2: Sử dụng MCP
```bash
# Sử dụng MCP Supabase để apply migration
# (Cần project_id)
```

#### Cách 3: Sử dụng psql
```bash
psql -h <host> -U <user> -d <database> -f fix_all_rls_and_performance.sql
```

### Bước 4: Verify

```sql
-- Kiểm tra RLS status
SELECT * FROM verify_rls_status();

-- Kiểm tra indexes cho task_comments
SELECT 
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
    AND tablename = 'task_comments'
ORDER BY indexname;

-- Kiểm tra policies cho task_comments
SELECT 
    policyname,
    cmd as command,
    qual as using_expression
FROM pg_policies
WHERE schemaname = 'public'
    AND tablename = 'task_comments'
ORDER BY policyname;
```

### Bước 5: Test Ứng Dụng

Sau khi apply migration, test các chức năng:

1. **Realtime Chat:**
   - Gửi tin nhắn
   - Nhận tin nhắn realtime
   - Xem lịch sử chat

2. **Tasks:**
   - Tạo task
   - Xem task
   - Cập nhật task
   - Xóa task

3. **Projects:**
   - Xem projects
   - Tạo project
   - Cập nhật project

4. **Users/Employees:**
   - Đăng nhập
   - Xem thông tin user
   - Cập nhật profile

### Bước 6: Rollback (Nếu Cần)

Nếu có vấn đề, rollback bằng cách:

```sql
BEGIN;

-- Disable RLS (tạm thời)
ALTER TABLE tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE task_comments DISABLE ROW LEVEL SECURITY;
-- ... (cho các bảng khác)

-- Hoặc restore từ backup
-- pg_restore -h <host> -U <user> -d <database> backup_before_rls_fix.sql

COMMIT;
```

---

## 📋 Checklist Trước Khi Apply

- [ ] Đã backup database
- [ ] Đã test trên development/staging
- [ ] Đã thông báo team về maintenance window (nếu cần)
- [ ] Đã chuẩn bị rollback plan
- [ ] Đã đọc kỹ migration file

---

## 🔍 Các Vấn Đề Có Thể Gặp

### 1. Lỗi: "Policy already exists"
- **Nguyên nhân:** Policy đã tồn tại
- **Giải pháp:** Migration đã có `DROP POLICY IF EXISTS`, nên sẽ tự động xử lý

### 2. Lỗi: "Index already exists"
- **Nguyên nhân:** Index đã tồn tại
- **Giải pháp:** Migration sử dụng `CREATE INDEX IF NOT EXISTS`, nên an toàn

### 3. Ứng dụng không thể truy cập dữ liệu
- **Nguyên nhân:** Policies quá nghiêm ngặt
- **Giải pháp:** Kiểm tra policies và điều chỉnh nếu cần

### 4. Hiệu năng chậm
- **Nguyên nhân:** Policies chưa được tối ưu đầy đủ
- **Giải pháp:** Chạy `EXPLAIN ANALYZE` để xem query plan và tối ưu thêm

---

## 📊 Monitoring Sau Khi Apply

### 1. Monitor Query Performance
```sql
-- Xem slow queries
SELECT 
    query,
    calls,
    total_time,
    mean_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;
```

### 2. Monitor RLS Policy Usage
```sql
-- Xem policies được sử dụng
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

### 3. Monitor Index Usage
```sql
-- Xem indexes được sử dụng
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan as scans,
    idx_tup_read as tuples_read,
    idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;
```

---

## 📝 Notes

- Migration này **KHÔNG** xóa dữ liệu
- Migration này **KHÔNG** thay đổi cấu trúc bảng
- Migration này chỉ **BẬT RLS** và **TẠO INDEXES**
- Migration này **TỐI ƯU** các policies hiện có

---

## 🔗 Tài Liệu Tham Khảo

- [Supabase RLS Documentation](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [PostgreSQL Index Best Practices](https://www.postgresql.org/docs/current/indexes.html)
- [Database Security Review](./DATABASE_SECURITY_PERFORMANCE_REVIEW.md)

