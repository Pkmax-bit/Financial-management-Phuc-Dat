# Hướng dẫn Import Sản phẩm

## Tổng quan

Script này sẽ import **tất cả các sản phẩm** từ danh sách được cung cấp vào database. Tổng cộng có **khoảng 180+ sản phẩm** được phân loại theo 13 loại sản phẩm.

## Danh sách sản phẩm theo loại

### Cửa kính cường lực (16 sản phẩm)
- Cửa kính cường lực 1/2 cánh (10li, 12li, 15li)
- Cửa lùa kính cường lực 1/2 cánh (10li, 12li, 15li)
- Phụ kiện bản lề sàn VVP, Hafpler
- Phụ kiện của lùa thanh treo, Zamilldoor

### Cửa sắt CNC (1 sản phẩm)
- Cổng sắt CNC 4 cánh

### Lan can ban công kính (4 sản phẩm)
- Lan can kính cường lực 10li/12li với tay vịn gỗ/nhôm

### Lan can cầu thang kính (4 sản phẩm)
- Lan can kính cường lực 10li/12li với tay vịn gỗ/nhôm

### Nhôm HMA (24 sản phẩm)
- Cửa đi mở quay (1-4 cánh)
- Cửa đi lùa (1-4 cánh)
- Cửa sổ mở quay (1-4)
- Cửa sổ lùa (1-4 cánh)
- Vách nhôm, Mặt dựng
- Cửa xếp trượt (3-8 cánh)

### Nhôm PMI (24 sản phẩm)
- Tương tự Nhôm HMA

### Nhôm MaxPro (24 sản phẩm)
- Tương tự Nhôm HMA

### Nhôm OWin (1 sản phẩm)
- Cửa thủy lực 2 cánh

### Nhôm XingFa Nhập khẩu (24 sản phẩm)
- Tương tự Nhôm HMA

### Nhôm XingFa Việt Nam (24 sản phẩm)
- Tương tự Nhôm HMA

### Nhôm ZhongKai (5 sản phẩm)
- Cửa trượt quay (2-6 cánh)

### Phòng tắm kính (7 sản phẩm)
- Phòng tắm kính cửa lùa
- Phòng tắm kính cửa mở (90°, 135°, 180°)
- Phụ kiện VVP (90°, 135°, 180°)

### Vách kính (2 sản phẩm)
- Vách kính cường lực 10li, 12li

## Cách import

### Cách 1: Sử dụng Python Script (Khuyến nghị)

**File:** `backend/scripts/import_products_full.py`

**Cách chạy:**
```bash
cd backend
python scripts/import_products_full.py
```

**Output mẫu:**
```
🚀 Starting product import...

📋 Building category mapping...
  ✅ Cửa kính cường lực: 014fca25-0e15-45d7-8977-acdd1ca7be1f
  ✅ Nhôm HMA: 73c78546-4c1d-4598-8bce-e683b7056c04
  ...

✅ Found 13/13 categories

🚀 Starting to import products...
======================================================================
  1. ✅ Cửa kính cường lực 1 cánh 10 li              | Cửa kính cường lực
  2. ✅ Cửa kính cường lực 2 cánh 10 li              | Cửa kính cường lực
  ...
======================================================================
Summary:
  ✅ Added: 180 products
  ⚠️  Skipped: 0 products (already exist)
  ❌ Errors: 0 products
  📊 Total: 180 products
======================================================================

✨ Done!
```

### Cách 2: Sử dụng API Endpoint

**Endpoint:** `POST /api/sales/products/bulk-create`

**Request Body:**
```json
[
  {
    "name": "Cửa kính cường lực 1 cánh 10 li",
    "category_name": "Cửa kính cường lực",
    "price": 0.0,
    "unit": "cái",
    "description": "Sản phẩm Cửa kính cường lực 1 cánh 10 li",
    "is_active": true
  },
  ...
]
```

**Response:**
```json
{
  "message": "Bulk create completed: 180 created, 0 skipped, 0 errors",
  "created": [...],
  "skipped": [],
  "errors": [],
  "total_requested": 180
}
```

## Lưu ý quan trọng

### 1. Trùng tên sản phẩm
- Một số sản phẩm có **cùng tên nhưng khác loại** (ví dụ: "Cửa đi mở quay 1 cánh" có trong Nhôm HMA, PMI, MaxPro, XingFa...)
- Script sẽ **cho phép** tạo các sản phẩm này vì chúng thuộc các category khác nhau
- Logic kiểm tra: `name + category_id` (không chỉ name)

### 2. Category phải tồn tại
- **Bắt buộc** phải chạy script thêm categories trước:
  ```bash
  python backend/scripts/add_default_product_categories.py
  ```
- Hoặc sử dụng API:
  ```bash
  POST /api/sales/product-categories/seed-defaults
  ```

### 3. Giá mặc định
- Tất cả sản phẩm được tạo với `price = 0.0`
- Có thể cập nhật giá sau khi import

### 4. Đơn vị mặc định
- Tất cả sản phẩm được tạo với `unit = "cái"`
- Có thể cập nhật đơn vị sau nếu cần

## Troubleshooting

### Lỗi: "Category 'X' not found"
- Chạy script thêm categories trước:
  ```bash
  python backend/scripts/add_default_product_categories.py
  ```

### Lỗi: "Product already exists"
- Script sẽ tự động skip các sản phẩm đã tồn tại
- Nếu muốn import lại, cần xóa sản phẩm cũ trước

### Lỗi: Database connection
- Kiểm tra kết nối database
- Kiểm tra biến môi trường SUPABASE_URL và SUPABASE_KEY

## Sau khi import

1. **Kiểm tra kết quả:**
   ```bash
   GET /api/sales/products?limit=200
   ```

2. **Cập nhật giá sản phẩm:**
   - Sử dụng web app hoặc mobile app
   - Hoặc cập nhật trực tiếp trong database

3. **Thêm hình ảnh:**
   - Upload hình ảnh cho từng sản phẩm qua web app

## Tổng kết

- ✅ **180+ sản phẩm** được import
- ✅ **13 loại sản phẩm** được phân loại
- ✅ Tự động skip nếu đã tồn tại
- ✅ Báo cáo chi tiết sau khi import




