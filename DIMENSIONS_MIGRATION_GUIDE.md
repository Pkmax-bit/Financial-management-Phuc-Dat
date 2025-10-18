# Hướng dẫn thêm cột kích thước vào Database

## 🎯 Mục tiêu
Thêm các cột kích thước (area, volume, height, length, depth) vào bảng `quote_items` và `invoice_items` để lưu trữ thông tin kích thước sản phẩm.

## 📋 Các bước thực hiện

### Bước 1: Truy cập Supabase Dashboard
1. Mở trình duyệt và truy cập: https://supabase.com/dashboard
2. Đăng nhập vào tài khoản của bạn
3. Chọn project: `mfmijckzlhevduwfigkl`

### Bước 2: Mở SQL Editor
1. Trong dashboard, click vào **SQL Editor** ở menu bên trái
2. Click **New query** để tạo query mới

### Bước 3: Chạy SQL Migration
Copy và paste nội dung sau vào SQL Editor:

```sql
-- Add dimension columns to quote_items and invoice_items tables
-- Safe to run multiple times due to IF NOT EXISTS guards

-- Quote items dimensions
ALTER TABLE IF EXISTS quote_items
ADD COLUMN IF NOT EXISTS area DECIMAL(10,2) NULL,
ADD COLUMN IF NOT EXISTS volume DECIMAL(10,2) NULL,
ADD COLUMN IF NOT EXISTS height DECIMAL(10,2) NULL,
ADD COLUMN IF NOT EXISTS length DECIMAL(10,2) NULL,
ADD COLUMN IF NOT EXISTS depth DECIMAL(10,2) NULL;

-- Invoice items dimensions
ALTER TABLE IF EXISTS invoice_items
ADD COLUMN IF NOT EXISTS area DECIMAL(10,2) NULL,
ADD COLUMN IF NOT EXISTS volume DECIMAL(10,2) NULL,
ADD COLUMN IF NOT EXISTS height DECIMAL(10,2) NULL,
ADD COLUMN IF NOT EXISTS length DECIMAL(10,2) NULL,
ADD COLUMN IF NOT EXISTS depth DECIMAL(10,2) NULL;

-- Add comments for better documentation
COMMENT ON COLUMN quote_items.area IS 'Diện tích của sản phẩm (m²)';
COMMENT ON COLUMN quote_items.volume IS 'Thể tích của sản phẩm (m³)';
COMMENT ON COLUMN quote_items.height IS 'Chiều cao của sản phẩm (cm)';
COMMENT ON COLUMN quote_items.length IS 'Chiều dài của sản phẩm (cm)';
COMMENT ON COLUMN quote_items.depth IS 'Chiều sâu của sản phẩm (cm)';

COMMENT ON COLUMN invoice_items.area IS 'Diện tích của sản phẩm (m²)';
COMMENT ON COLUMN invoice_items.volume IS 'Thể tích của sản phẩm (m³)';
COMMENT ON COLUMN invoice_items.height IS 'Chiều cao của sản phẩm (cm)';
COMMENT ON COLUMN invoice_items.length IS 'Chiều dài của sản phẩm (cm)';
COMMENT ON COLUMN invoice_items.depth IS 'Chiều sâu của sản phẩm (cm)';

-- Optional: Add indexes for performance if these columns are frequently queried
CREATE INDEX IF NOT EXISTS idx_quote_items_area ON quote_items (area) WHERE area IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_quote_items_volume ON quote_items (volume) WHERE volume IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_quote_items_height ON quote_items (height) WHERE height IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_quote_items_length ON quote_items (length) WHERE length IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_quote_items_depth ON quote_items (depth) WHERE depth IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_invoice_items_area ON invoice_items (area) WHERE area IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_invoice_items_volume ON invoice_items (volume) WHERE volume IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_invoice_items_height ON invoice_items (height) WHERE height IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_invoice_items_length ON invoice_items (length) WHERE length IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_invoice_items_depth ON invoice_items (depth) WHERE depth IS NOT NULL;
```

### Bước 4: Thực thi SQL
1. Click **Run** để thực thi SQL
2. Kiểm tra kết quả - bạn sẽ thấy thông báo thành công

### Bước 5: Xác minh kết quả
Chạy query sau để kiểm tra các cột đã được thêm:

```sql
-- Verify quote_items columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'quote_items'
  AND column_name IN ('area', 'volume', 'height', 'length', 'depth');

-- Verify invoice_items columns  
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'invoice_items'
  AND column_name IN ('area', 'volume', 'height', 'length', 'depth');
```

## ✅ Kết quả mong đợi
Sau khi chạy thành công, bạn sẽ thấy:
- 5 cột mới trong bảng `quote_items`: area, volume, height, length, depth
- 5 cột mới trong bảng `invoice_items`: area, volume, height, length, depth
- Tất cả cột đều có kiểu `DECIMAL(10,2)` và có thể NULL
- Các index được tạo để tối ưu hiệu suất

## 🔧 Kiểm tra ứng dụng
Sau khi migration hoàn thành:
1. Khởi động lại backend server
2. Khởi động lại frontend
3. Thử tạo quote/invoice mới với sản phẩm có kích thước
4. Kiểm tra xem dữ liệu kích thước có được lưu vào database không

## 📝 Lưu ý
- Script này an toàn để chạy nhiều lần (sử dụng `IF NOT EXISTS`)
- Nếu các cột đã tồn tại, script sẽ bỏ qua việc tạo lại
- Không có dữ liệu nào bị mất trong quá trình migration
