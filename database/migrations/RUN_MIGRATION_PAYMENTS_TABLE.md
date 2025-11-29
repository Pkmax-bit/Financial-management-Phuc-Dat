# Hướng dẫn chạy migration: Tạo bảng payments

## Mục đích
Tạo bảng `payments` để lưu lịch sử thanh toán cho các hóa đơn.

## Cách chạy migration

### Cách 1: Chạy trực tiếp trong Supabase Dashboard (Khuyến nghị)

1. Mở Supabase Dashboard: https://supabase.com/dashboard
2. Chọn project của bạn
3. Vào **SQL Editor**
4. Copy toàn bộ nội dung file `database/migrations/create_payments_table.sql`
5. Paste vào SQL Editor và click **Run**

### Cách 2: Chạy qua psql (nếu có quyền truy cập database)

```bash
psql -h [your-supabase-host] -U postgres.[your-project-ref] -d postgres -f database/migrations/create_payments_table.sql
```

### Cách 3: Chạy qua Supabase CLI

```bash
supabase db push
```

## Kiểm tra kết quả

Sau khi chạy migration, kiểm tra xem bảng đã được tạo chưa:

```sql
-- Kiểm tra bảng payments
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'payments'
ORDER BY ordinal_position;

-- Kiểm tra indexes
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'payments';
```

Kết quả mong đợi:
- Bảng `payments` với các cột:
  - `id` (UUID, PRIMARY KEY)
  - `payment_number` (VARCHAR(50), UNIQUE)
  - `invoice_id` (UUID, FOREIGN KEY to invoices)
  - `customer_id` (UUID, FOREIGN KEY to customers)
  - `amount` (DECIMAL(12,2))
  - `currency` (VARCHAR(3), DEFAULT 'VND')
  - `payment_date` (DATE)
  - `payment_method` (ENUM)
  - `reference_number` (VARCHAR(255))
  - `bank_details` (TEXT)
  - `status` (ENUM)
  - `notes` (TEXT)
  - `created_by` (UUID, FOREIGN KEY to users)
  - `processed_by` (UUID, FOREIGN KEY to users)
  - `processed_at` (TIMESTAMP)
  - `created_at` (TIMESTAMP)
  - `updated_at` (TIMESTAMP)

- Các indexes:
  - `idx_payments_invoice_id`
  - `idx_payments_customer_id`
  - `idx_payments_payment_date`
  - `idx_payments_status`
  - `idx_payments_payment_method`
  - `idx_payments_created_at`

## Lưu ý

- Migration này sẽ tạo bảng `payments` nếu chưa tồn tại (sử dụng `CREATE TABLE IF NOT EXISTS`)
- **Nếu bảng đã tồn tại**, migration sẽ tự động thêm các cột còn thiếu (đặc biệt là cột `status`)
- Các enum types (`payment_method_enum`, `payment_status_enum`) sẽ được tạo nếu chưa tồn tại
- Sau khi chạy migration, cần reload schema cache trong Supabase Dashboard > API settings > Reload schema
- Migration sẽ **KHÔNG** xóa dữ liệu hiện có, chỉ thêm các cột mới nếu thiếu

## Xử lý lỗi "column status does not exist"

Nếu gặp lỗi này, có nghĩa là:
- Bảng `payments` đã tồn tại nhưng thiếu cột `status`
- Migration đã được cập nhật để tự động thêm cột `status` và các cột khác nếu thiếu
- Chạy lại migration sẽ tự động sửa lỗi này

## Rollback (nếu cần)

Nếu cần rollback, chạy:

```sql
-- Xóa indexes trước
DROP INDEX IF EXISTS idx_payments_invoice_id;
DROP INDEX IF EXISTS idx_payments_customer_id;
DROP INDEX IF EXISTS idx_payments_payment_date;
DROP INDEX IF EXISTS idx_payments_status;
DROP INDEX IF EXISTS idx_payments_payment_method;
DROP INDEX IF EXISTS idx_payments_created_at;

-- Xóa bảng
DROP TABLE IF EXISTS payments;

-- Xóa enum types (chỉ nếu không còn bảng nào sử dụng)
-- DROP TYPE IF EXISTS payment_method_enum;
-- DROP TYPE IF EXISTS payment_status_enum;
```

## Kiểm tra dữ liệu

Sau khi migration, có thể kiểm tra xem có dữ liệu nào trong bảng không:

```sql
SELECT COUNT(*) as total_payments FROM payments;
SELECT * FROM payments ORDER BY created_at DESC LIMIT 10;
```

