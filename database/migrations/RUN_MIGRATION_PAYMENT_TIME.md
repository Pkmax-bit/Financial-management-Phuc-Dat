# Hướng dẫn chạy migration: Thêm thời gian (giờ phút) vào thanh toán

## Mục đích
Thay đổi cột `payment_date` từ `DATE` sang `TIMESTAMP WITH TIME ZONE` để lưu cả ngày và giờ (giờ, phút, giây) của thanh toán.

## Cách chạy migration

### Cách 1: Chạy trực tiếp trong Supabase Dashboard (Khuyến nghị)

1. Mở Supabase Dashboard: https://supabase.com/dashboard
2. Chọn project của bạn
3. Vào **SQL Editor**
4. Copy toàn bộ nội dung file `database/migrations/add_payment_time.sql`
5. Paste vào SQL Editor và click **Run**

### Cách 2: Chạy qua psql

```bash
psql -h [your-supabase-host] -U postgres.[your-project-ref] -d postgres -f database/migrations/add_payment_time.sql
```

## Kiểm tra kết quả

Sau khi chạy migration, kiểm tra xem cột đã được thay đổi chưa:

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'payments' AND column_name = 'payment_date';
```

Kết quả mong đợi:
- `column_name`: payment_date
- `data_type`: timestamp with time zone
- `is_nullable`: NO

## Lưu ý

- Migration này sẽ chuyển đổi các giá trị DATE hiện có thành TIMESTAMP (với thời gian mặc định là 00:00:00)
- Các thanh toán mới sẽ tự động lưu cả ngày và giờ
- Sau khi chạy migration, cần reload schema cache trong Supabase Dashboard > API settings > Reload schema
- Restart backend để áp dụng thay đổi

## Sau khi migration

1. **Reload schema cache**: Supabase Dashboard > API settings > Reload schema
2. **Restart backend**
3. **Kiểm tra**: Khi ghi nhận thanh toán mới, hệ thống sẽ tự động lưu cả ngày và giờ

## Hiển thị

Sau khi migration, lịch sử thanh toán sẽ hiển thị:
- **Trước**: "30/11/2025"
- **Sau**: "30/11/2025 14:30" (hoặc "30/11/2025, 14:30" tùy locale)

