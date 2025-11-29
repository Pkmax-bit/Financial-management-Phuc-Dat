# Hướng dẫn chạy migration: Thêm cột tax_rate vào bảng quote_items

## Mục đích
Thêm cột `tax_rate` vào bảng `quote_items` để lưu %VAT (thuế suất) cho từng sản phẩm trong báo giá.

## Cách chạy migration

### Cách 1: Chạy trực tiếp trong Supabase Dashboard

1. Mở Supabase Dashboard: https://supabase.com/dashboard
2. Chọn project của bạn
3. Vào **SQL Editor**
4. Copy toàn bộ nội dung file `database/migrations/add_tax_rate_to_quote_items.sql`
5. Paste vào SQL Editor và click **Run**

### Cách 2: Chạy qua psql (nếu có quyền truy cập database)

```bash
psql -h aws-1-ap-southeast-1.pooler.supabase.com -U postgres.mfmijckzlhevduwfigkl -d postgres -f database/migrations/add_tax_rate_to_quote_items.sql
```

### Cách 3: Chạy qua Supabase CLI

```bash
supabase db push
```

## Kiểm tra kết quả

Sau khi chạy migration, kiểm tra xem cột đã được thêm chưa:

```sql
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'quote_items' AND column_name = 'tax_rate';
```

Kết quả mong đợi:
- `column_name`: tax_rate
- `data_type`: numeric
- `column_default`: 10.00

## Lưu ý

- Migration này sẽ thêm cột `tax_rate` với giá trị mặc định là 10.00 (10%)
- Các bản ghi cũ sẽ tự động có giá trị mặc định là 10%
- Sau khi chạy migration, cần reload schema cache trong Supabase Dashboard > API settings > Reload schema

## Rollback (nếu cần)

Nếu cần rollback, chạy:

```sql
ALTER TABLE quote_items DROP COLUMN IF EXISTS tax_rate;
DROP INDEX IF EXISTS idx_quote_items_tax_rate;
```

