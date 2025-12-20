# Migration: Project Categories

## Mô tả
Migration này tạo bảng `project_categories` để phân loại và nhóm các dự án, và thêm cột `category_id` vào bảng `projects`.

## Chạy Migration

1. Kết nối với database Supabase
2. Chạy file migration:
```sql
\i database/migrations/create_project_categories.sql
```

Hoặc copy nội dung file và chạy trực tiếp trong Supabase SQL Editor.

## Cấu trúc

### Bảng `project_categories`
- `id`: UUID (Primary Key)
- `name`: Tên nhóm phân loại (VARCHAR 255)
- `code`: Mã nhóm (VARCHAR 50, UNIQUE)
- `description`: Mô tả (TEXT)
- `color`: Màu hiển thị (VARCHAR 7 - Hex color)
- `icon`: Icon name (VARCHAR 50)
- `display_order`: Thứ tự hiển thị (INTEGER)
- `is_active`: Trạng thái hoạt động (BOOLEAN)
- `created_at`: Thời gian tạo
- `updated_at`: Thời gian cập nhật

### Bảng `projects`
- Thêm cột `category_id`: UUID (Foreign Key đến `project_categories.id`)

## Categories mặc định

Migration tự động tạo các categories mặc định:
1. **Dự án cửa** (door-project) - #4ECDC4 - Dự án lắp đặt và thi công cửa
2. **Dự án tủ bếp** (kitchen-cabinet-project) - #FF6B6B - Dự án thiết kế và thi công tủ bếp

## API Endpoints

### Get all categories
```
GET /api/projects/categories
GET /api/projects/categories?is_active=true
```

### Get category by ID
```
GET /api/projects/categories/{category_id}
```

### Create category (Manager/Admin only)
```
POST /api/projects/categories
Body: {
  "name": "Tên nhóm",
  "code": "ma-nhom",
  "description": "Mô tả",
  "color": "#FF5733",
  "icon": "building",
  "display_order": 1,
  "is_active": true
}
```

### Update category (Manager/Admin only)
```
PUT /api/projects/categories/{category_id}
Body: {
  "name": "Tên mới",
  "color": "#FF0000"
}
```

### Delete category (Manager/Admin only)
```
DELETE /api/projects/categories/{category_id}
```

## Sử dụng trong Frontend

### Tạo dự án với category
Trong `CreateProjectModal`, có thể chọn category từ dropdown "Nhóm phân loại".

### Lọc dự án theo category
Trong `ProjectsTab`, có thể lọc dự án theo category từ bộ lọc sidebar.

### Hiển thị category
Category được hiển thị dưới dạng badge màu trong project card, sử dụng màu từ `category_color`.

## Lưu ý

- Không thể xóa category nếu đang được sử dụng bởi một hoặc nhiều dự án
- Category có thể được vô hiệu hóa bằng cách set `is_active = false`
- Màu category được hiển thị với độ trong suốt 20% (opacity) trong UI

