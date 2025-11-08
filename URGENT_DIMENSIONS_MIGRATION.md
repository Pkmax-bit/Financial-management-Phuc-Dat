# 🚨 URGENT: Chạy Database Migration để thêm cột kích thước

## ⚠️ Vấn đề hiện tại
- ✅ **Products table**: Đã có đầy đủ dữ liệu kích thước
- ❌ **Quote_items table**: Thiếu cột kích thước (area, volume, height, length, depth)
- ❌ **Invoice_items table**: Thiếu cột kích thước (area, volume, height, length, depth)

## 🎯 Kết quả mong đợi sau migration
Khi chọn sản phẩm "Bàn làm việc gỗ", các trường sẽ được tự động điền:
- **Tên sản phẩm**: Bàn làm việc gỗ
- **Số lượng**: 1
- **Đơn vị**: cái
- **Đơn giá**: 2.500.000 ₫
- **Thành tiền**: 2.500.000 ₫
- **Diện tích**: 1.2 m²
- **Thể tích**: 0.3 m³
- **Cao**: 75 cm
- **Dài**: 120 cm
- **Sâu**: 60 cm

## 📋 Các bước thực hiện

### Bước 1: Truy cập Supabase Dashboard
1. Mở trình duyệt: https://supabase.com/dashboard
2. Đăng nhập và chọn project: `mfmijckzlhevduwfigkl`

### Bước 2: Mở SQL Editor
1. Click **SQL Editor** ở menu bên trái
2. Click **New query**

### Bước 3: Copy và chạy SQL sau
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

-- Optional: Add indexes for performance
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

### Bước 4: Click "Run" để thực thi

### Bước 5: Xác minh kết quả
Chạy query sau để kiểm tra:
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

## ✅ Sau khi migration hoàn thành
1. **Khởi động lại backend server**
2. **Khởi động lại frontend**
3. **Thử tạo quote/invoice mới**
4. **Chọn sản phẩm từ danh sách**
5. **Kiểm tra xem các trường kích thước có được tự động điền không**

## 🔧 Test case
1. Tạo báo giá mới
2. Click "Chọn từ danh sách" 
3. Chọn sản phẩm "Bàn làm việc gỗ"
4. Kiểm tra các trường:
   - Diện tích: 1.2
   - Thể tích: 0.3
   - Cao: 75
   - Dài: 120
   - Sâu: 60

## 📞 Nếu gặp vấn đề
- Kiểm tra console log trong browser (F12)
- Kiểm tra network tab để xem API calls
- Đảm bảo backend server đang chạy
- Đảm bảo frontend đang chạy trên localhost:3000
