# Database Migration - Quick Guide

## ✅ File Đã Sửa

**File:** `database/migrations/add_performance_indexes.sql`

**Thay đổi:** Đã remove tất cả `WHERE deleted_at IS NULL` conditions vì database hiện tại chưa có soft delete columns.

## 🚀 Cách Chạy Migration

### Option 1: Supabase Dashboard (Dễ nhất)

1. Mở: https://supabase.com/dashboard
2. Chọn project của bạn
3. Vào **SQL Editor** (biểu tượng ⚡ bên trái)
4. Click **New Query**
5. Copy toàn bộ file `add_performance_indexes.sql` 
6. Paste vào editor
7. Click **Run** hoặc `Ctrl + Enter`

### Option 2: psql CLI

```bash
psql -h aws-1-ap-southeast-1.pooler.supabase.com \
     -p 6543 \
     -d postgres \
     -U postgres.mfmijckzlhevduwfigkl \
     -f database/migrations/add_performance_indexes.sql
```

## 📊 Indexes Được Tạo

### Projects (6 indexes)
- `idx_projects_status` - Filter by status
- `idx_projects_customer_id` - Filter by customer
- `idx_projects_manager_id` - Filter by manager
- `idx_projects_created_at` - Order by date
- `idx_projects_customer_status` - Composite customer+status
- `idx_projects_name_gin` - Full-text search

### Expenses (5 indexes)
- `idx_expenses_project_id` - Project expenses
- `idx_expenses_date` - Filter by date
- `idx_expenses_status` - Filter by status
- `idx_expenses_project_date` - Composite project+date
- `idx_expenses_category` - Filter by category

### Customers (3 indexes)
- `idx_customers_email` - Unique email
- `idx_customers_created_at` - Order by date
- `idx_customers_name_gin` - Full-text search

### Employees (4 indexes)
- `idx_employees_email` - Unique email
- `idx_employees_department_id` - Filter by department
- `idx_employees_position_id` - Filter by position
- `idx_employees_created_at` - Order by date

### Quotes (4 indexes)
- `idx_quotes_customer_id` - Filter by customer
- `idx_quotes_project_id` - Filter by project
- `idx_quotes_status` - Filter by status
- `idx_quotes_created_at` - Order by date

**Total: 22 indexes + pg_trgm extension**

## ✅ Verification

Sau khi chạy migration, verify bằng query này:

```sql
-- Check all indexes created
SELECT tablename, indexname, indexdef
FROM pg_indexes 
WHERE tablename IN ('projects', 'expenses', 'customers', 'employees', 'quotes')
ORDER BY tablename, indexname;
```

Expected output: ~22 indexes

## 📈 Performance Test

Test query performance:

```sql
-- Before indexes: Seq Scan
-- After indexes: Index Scan

EXPLAIN ANALYZE 
SELECT * FROM projects WHERE status = 'active';

-- Should show: Index Scan using idx_projects_status
```

## ⚠️ Notes

- Migration is **safe** - uses `IF NOT EXISTS`
- Can be run **multiple times** without errors
- Typically takes **10-30 seconds** depending on data size
- **No downtime** required
- Creates **pg_trgm extension** for full-text search

## 🎉 Done!

Sau khi chạy migration thành công, database của bạn sẽ nhanh hơn đáng kể! 🚀
