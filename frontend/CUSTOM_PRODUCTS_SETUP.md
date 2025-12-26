# Custom Products Setup Guide

## Database Setup

1. **Login to Supabase Dashboard**
   - Go to your Supabase project dashboard
   - Navigate to the SQL Editor

2. **Run the Schema SQL**
   - Copy the contents of `custom-products-schema.sql`
   - Paste it into the SQL Editor
   - Click "Run" to execute the SQL

This will create the following tables:
- `custom_product_categories` - Product categories (with `is_primary` field for red headers)
- `custom_product_columns` - Attributes/Properties for each category (with `is_primary` field for dimensions/pricing)
- `custom_product_options` - Options for each attribute (with dimension and pricing fields)

## API Endpoints Created

The following API endpoints are now available:

### Categories
- `GET /api/custom-products/categories` - List categories
- `POST /api/custom-products/categories` - Create category
- `PUT /api/custom-products/categories/[id]` - Update category
- `DELETE /api/custom-products/categories/[id]` - Delete category
- `GET /api/custom-products/categories/[id]/columns` - Get columns by category

### Columns (Attributes)
- `POST /api/custom-products/columns` - Create column
- `PUT /api/custom-products/columns/[id]` - Update column
- `DELETE /api/custom-products/columns/[id]` - Delete column
- `POST /api/custom-products/columns/reorder` - Reorder columns

### Options
- `POST /api/custom-products/options` - Create option
- `DELETE /api/custom-products/options/[id]` - Delete option

## Authentication

All API endpoints use Supabase authentication via cookies. Make sure you are logged in to the application.

## Testing

After setting up the database:

1. **Test Debug Endpoint** (recommended first step):
   - Open browser and go to: `http://localhost:3000/api/custom-products/debug`
   - Should return JSON with database status
   - Check if `tables_exist: true` and no errors

2. **Test Application**:
   - Go to `/sales/custom-products` page
   - Try creating a category
   - Add attributes (mark one as "primary" for dimensions)
   - Add options to attributes (primary columns get full dimension inputs)

## Troubleshooting

If you still get errors:

1. **Check Database Tables**: Make sure the SQL script ran successfully and tables were created
2. **Check Authentication**: Make sure you are logged in to the application
3. **Test Debug Endpoint**: Visit `/api/custom-products/debug` to check database connection
4. **Check Browser Console**: Look for any JavaScript errors
5. **Check Network Tab**: Look for failed API requests and their response details

## Recent Updates

- ✅ Fixed authentication middleware to use Supabase cookies
- ✅ Added complete API routes for categories, columns, and options
- ✅ Added proper error handling and validation
- ✅ Added primary column feature with dimensions and pricing
- ✅ Updated units: dimensions in mm, area in m², volume in m³, price in VND/m²

## Ví dụ sử dụng:

### 1. Tạo danh mục sản phẩm
- Tên: "Tủ gỗ"
- Mô tả: "Các loại tủ gỗ gia dụng"

### 2. Thêm thuộc tính chính
- Tên: "Kích thước"
- Mô tả: "Kích thước vật lý của tủ"
- ✅ **Đánh dấu "Cột chính (có kích thước và giá)"**

### 3. Thêm thuộc tính thường
- Tên: "Màu sắc"
- Mô tả: "Màu sắc bề mặt"

### 4. Thêm tùy chọn cho thuộc tính chính
- Tên: "Tủ 2m x 1.5m x 0.6m"
- Mô tả: "Tủ gỗ thông dụng"
- Ngang: 2000 mm
- Cao: 1500 mm
- Sâu: 600 mm
- Đơn giá: 500,000 VND/m²
- **Tự động tính:**
  - Diện tích: 3.000 m²
  - Thể tích: 1.800 m³
  - Giá thành: 1,500,000,000 VND

### 5. Thêm tùy chọn cho thuộc tính thường
- Tên: "Nâu"
- Giá: 100,000 VND (không có tính toán kích thước)
