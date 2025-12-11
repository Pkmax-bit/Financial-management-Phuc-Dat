# Hướng dẫn thêm 13 loại sản phẩm mặc định

## Danh sách 13 loại sản phẩm

1. Nhôm XingFa Nhập khẩu
2. Nhôm XingFa Việt Nam
3. Nhôm MaxPro
4. Nhôm ZhongKai
5. Nhôm OWin
6. Cửa kính cường lực
7. Vách kính
8. Phòng tắm kính
9. Lan can ban công kính
10. Lan can cầu thang kính
11. Cửa sắt CNC
12. Nhôm PMI
13. Nhôm HMA

## Cách thêm vào hệ thống

### Cách 1: Sử dụng API Endpoint (Khuyến nghị)

**Endpoint:** `POST /api/sales/product-categories/seed-defaults`

**Yêu cầu:**
- Authentication required
- User phải đăng nhập

**Cách sử dụng:**
```bash
# Sử dụng curl
curl -X POST "http://localhost:8000/api/sales/product-categories/seed-defaults" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"

# Hoặc sử dụng Postman/Insomnia
# Method: POST
# URL: http://localhost:8000/api/sales/product-categories/seed-defaults
# Headers: Authorization: Bearer YOUR_TOKEN
```

**Response:**
```json
{
  "message": "Bulk create completed: 13 created, 0 skipped",
  "created": [...],
  "skipped": [],
  "total_requested": 13
}
```

### Cách 2: Sử dụng Python Script

**File:** `backend/scripts/add_default_product_categories.py`

**Cách chạy:**
```bash
cd backend
python scripts/add_default_product_categories.py
```

**Output:**
```
🚀 Starting to add default product categories...
==================================================
✅ Added category: Nhôm XingFa Nhập khẩu
✅ Added category: Nhôm XingFa Việt Nam
...
==================================================
Summary:
  ✅ Added: 13 categories
  ⚠️  Skipped: 0 categories (already exist)
  📊 Total: 13 categories
==================================================
✨ Done!
```

### Cách 3: Sử dụng SQL Migration

**File:** `supabase/migrations/2025-01-XX_add_default_product_categories.sql`

**Cách chạy:**
```bash
# Nếu sử dụng Supabase CLI
supabase db push

# Hoặc chạy trực tiếp trong Supabase SQL Editor
# Copy nội dung file SQL và chạy trong SQL Editor
```

**Lưu ý:**
- Migration sẽ tự động skip các category đã tồn tại (ON CONFLICT DO NOTHING)
- An toàn để chạy nhiều lần

### Cách 4: Sử dụng Bulk Create API

**Endpoint:** `POST /api/sales/product-categories/bulk-create`

**Request Body:**
```json
[
  {
    "name": "Nhôm XingFa Nhập khẩu",
    "description": "Nhôm XingFa nhập khẩu chất lượng cao",
    "is_active": true
  },
  {
    "name": "Nhôm XingFa Việt Nam",
    "description": "Nhôm XingFa sản xuất tại Việt Nam",
    "is_active": true
  },
  ...
]
```

## Kiểm tra kết quả

Sau khi thêm, kiểm tra bằng cách:

1. **API:**
   ```bash
   GET /api/sales/product-categories
   ```

2. **Web App:**
   - Vào trang Quản lý sản phẩm
   - Mở CategoryManagementActivity
   - Xem danh sách categories

3. **Mobile App:**
   - Vào ProductFormActivity
   - Xem dropdown loại sản phẩm

## Lưu ý

- Tất cả categories sẽ được tạo với `is_active = true`
- Nếu category đã tồn tại (trùng tên), sẽ được skip
- Có thể chạy nhiều lần mà không gây lỗi
- Categories sẽ có `created_at` và `updated_at` tự động

## Troubleshooting

### Lỗi: "Category name already exists"
- Category đã tồn tại trong database
- Có thể bỏ qua hoặc xóa category cũ trước khi thêm lại

### Lỗi: Authentication required
- Cần đăng nhập trước khi gọi API
- Kiểm tra token trong header Authorization

### Lỗi: Database connection
- Kiểm tra kết nối database
- Kiểm tra biến môi trường SUPABASE_URL và SUPABASE_KEY




