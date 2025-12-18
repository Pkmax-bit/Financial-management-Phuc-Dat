# Migration: Add tax_rate to invoice_items

## Mô tả
Thêm cột `tax_rate` vào bảng `invoice_items` để lưu thuế suất cho từng sản phẩm trong hóa đơn.

## Cách chạy migration

### Option 1: Chạy trực tiếp trong Supabase Dashboard
1. Mở Supabase Dashboard
2. Vào SQL Editor
3. Copy nội dung file `add_tax_rate_to_invoice_items.sql`
4. Paste và chạy

### Option 2: Chạy qua Supabase CLI
```bash
supabase db push
```

### Option 3: Chạy trực tiếp với psql
```bash
psql -h <host> -U <user> -d <database> -f database/migrations/add_tax_rate_to_invoice_items.sql
```

## Kiểm tra sau khi chạy
```sql
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'invoice_items' 
AND column_name = 'tax_rate';
```

Kết quả mong đợi:
- column_name: tax_rate
- data_type: numeric
- column_default: 10.00

## Lưu ý
- Migration này an toàn, sử dụng `IF NOT EXISTS` nên có thể chạy nhiều lần
- Giá trị mặc định là 10% (10.00)
- Các invoice_items hiện có sẽ được set tax_rate = 10.00

