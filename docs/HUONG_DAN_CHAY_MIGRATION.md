# 🚀 Hướng dẫn chạy Migration để fix lỗi Phase 2

## 📋 Vấn đề

Các columns này **CẦN THIẾT** nhưng chưa có trong database:
- `invoices.product_components` - Lưu vật tư/chi phí cho hóa đơn
- `quotes.product_components` - Lưu vật tư/chi phí cho báo giá  
- `customers.company` - Lưu tên công ty

## ✅ Giải pháp: Chạy Migration

### Cách 1: Qua Supabase Dashboard (Khuyến nghị)

1. **Mở Supabase Dashboard**
   - Truy cập: https://supabase.com/dashboard
   - Chọn project của bạn

2. **Vào SQL Editor**
   - Click vào **SQL Editor** ở sidebar bên trái

3. **Chạy migration**
   - Mở file: `database/migrations/add_missing_columns_for_phase2.sql`
   - Copy toàn bộ nội dung
   - Paste vào SQL Editor
   - Click **Run** hoặc nhấn `Ctrl+Enter`

4. **Kiểm tra kết quả**
   - Nếu thành công, sẽ thấy message: "Success. No rows returned"
   - Nếu có lỗi, sẽ hiển thị error message

### Cách 2: Qua Supabase CLI

```bash
# Nếu chưa có Supabase CLI
npm install -g supabase

# Login
supabase login

# Link project
supabase link --project-ref <your-project-ref>

# Chạy migration
supabase db push
```

### Cách 3: Qua psql (nếu có direct database access)

```bash
psql -h <db-host> -U <user> -d <database> -f database/migrations/add_missing_columns_for_phase2.sql
```

---

## 🔍 Verify sau khi chạy

Chạy query này trong Supabase SQL Editor để kiểm tra:

```sql
-- Kiểm tra tất cả columns đã được thêm
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE (table_name = 'invoices' AND column_name = 'product_components')
   OR (table_name = 'quotes' AND column_name = 'product_components')
   OR (table_name = 'customers' AND column_name = 'company')
ORDER BY table_name, column_name;
```

**Kết quả mong đợi**: 3 rows (một cho mỗi column)

---

## ✅ Test lại sau khi fix

```bash
python scripts/auto_test_phase2.py
```

**Kết quả mong đợi**: Tất cả test cases sẽ PASS! 🎉

---

## 📝 Lưu ý

1. ✅ **Migration an toàn**: Dùng `IF NOT EXISTS` nên có thể chạy nhiều lần
2. ✅ **Không mất dữ liệu**: Chỉ thêm columns mới, không xóa dữ liệu cũ
3. ✅ **Default values**: Các columns có default value `[]` hoặc `NULL` nên không ảnh hưởng dữ liệu hiện có

---

**File migration**: `database/migrations/add_missing_columns_for_phase2.sql`  
**Hướng dẫn chi tiết**: `docs/FIX_PHASE2_SCHEMA_ERRORS.md`








