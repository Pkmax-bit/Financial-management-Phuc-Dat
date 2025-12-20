# Migration: Đồng bộ task_groups với project_categories

## Mô tả
Migration này liên kết `task_groups` với `project_categories` để đảm bảo:
- Mỗi project category có 1 task_group tương ứng (reference qua category_id)
- Khi tạo project category mới, tự động tạo task_group
- Khi cập nhật project category (is_active), tự động cập nhật task_group
- Khi tạo project với category, đảm bảo có task_group tương ứng
- **Single Source of Truth**: name/description lưu ở project_categories, task_groups chỉ reference

## Chạy Migration

1. Kết nối với database Supabase
2. Chạy file migration:
```sql
\i database/migrations/sync_task_groups_with_project_categories.sql
```

Hoặc copy nội dung file và chạy trực tiếp trong Supabase SQL Editor.

## Cấu trúc

### Thay đổi trong bảng `task_groups`
- Thêm cột `category_id`: UUID (Foreign Key đến `project_categories.id`)
- Unique constraint: Mỗi category chỉ có 1 task_group

### Triggers tự động

1. **trigger_create_task_group_on_category_create**
   - Khi tạo project_category mới → Tự động tạo task_group tương ứng

2. **trigger_update_task_group_on_category_update**
   - Khi cập nhật project_category → Tự động cập nhật task_group
   - Khi vô hiệu hóa category → Vô hiệu hóa task_group
   - Khi kích hoạt lại category → Kích hoạt lại task_group

3. **trigger_ensure_task_group_on_project_create**
   - Khi tạo project với category → Đảm bảo có task_group tương ứng

4. **trigger_create_task_on_project_create**
   - Khi tạo project với category → Tự động tạo task trong task_group tương ứng
   - Task được tạo với: title = project.name, description = project.description, status = 'todo'

## Quy trình hoạt động

### Khi tạo Project Category mới:
1. Tạo project_category
2. Trigger tự động tạo task_group với:
   - `category_id` = category.id (reference)
   - `is_active` = category.is_active
   - **Không lưu name/description** - sẽ JOIN với project_categories khi cần

### Khi cập nhật Project Category:
1. Cập nhật project_category
2. Trigger tự động cập nhật `is_active` của task_group tương ứng
3. **Không đồng bộ name/description** - vì task_groups chỉ reference

### Khi tạo Project với Category:
1. Tạo project với category_id
2. Trigger `ensure_task_group` kiểm tra và tạo task_group nếu chưa có
3. Trigger `create_task` tự động tạo task trong task_group vừa tạo
4. Task được tạo với thông tin từ project (name, description, priority, dates, manager)

## Lợi ích

- **Single Source of Truth**: name/description chỉ lưu ở project_categories
- **Đồng bộ tự động**: Không cần tạo task_group thủ công
- **Nhất quán dữ liệu**: Đảm bảo mỗi category có 1 task_group
- **Đơn giản hơn**: Không cần đồng bộ name/description, chỉ reference
- **Linh hoạt**: Có thể có task_groups độc lập (category_id = NULL)

## Lưu ý

- Mỗi category chỉ có 1 task_group (unique constraint)
- Khi xóa category, task_group vẫn tồn tại (ON DELETE SET NULL)
- Task_group có thể có thêm thông tin riêng (members, created_by, etc.) không liên quan đến category
- **Khi query task_group, JOIN với project_categories để lấy name/description**
- Có thể dùng view `task_groups_with_category` để query dễ dàng hơn

