# Phân tích Kiến trúc: Project Categories vs Task Groups

## Tình huống hiện tại

Hiện tại có 2 bảng:
- **project_categories**: Phân loại dự án (có color, icon, display_order, code)
- **task_groups**: Nhóm nhiệm vụ (có members, created_by)

Và đang đồng bộ 2 bảng này với triggers.

## Phương án 1: Giữ 2 bảng riêng + Đồng bộ (Hiện tại)

### Ưu điểm ✅

1. **Tách biệt trách nhiệm (Separation of Concerns)**
   - `project_categories`: Chỉ lo phân loại dự án
   - `task_groups`: Chỉ lo quản lý nhóm nhiệm vụ
   - Mỗi bảng có mục đích rõ ràng

2. **Linh hoạt trong tương lai**
   - Có thể có task_groups không liên quan đến project (nhiệm vụ cá nhân, nhiệm vụ nội bộ)
   - Có thể có project_categories chỉ để phân loại, không cần task_group
   - Dễ mở rộng tính năng riêng cho từng bảng

3. **Tính năng riêng biệt**
   - `task_groups` có `task_group_members` (thành viên nhóm) - tính năng riêng
   - `project_categories` có `color`, `icon`, `display_order` - dùng cho UI
   - `task_groups` có `created_by` - tracking người tạo

4. **Dễ bảo trì**
   - Thay đổi logic phân loại dự án không ảnh hưởng đến task management
   - Thay đổi logic task groups không ảnh hưởng đến project categorization

### Nhược điểm ❌

1. **Đồng bộ phức tạp**
   - Cần triggers để đồng bộ
   - Có thể có lỗi đồng bộ nếu trigger không chạy đúng
   - Phải đảm bảo data consistency

2. **Dư thừa dữ liệu**
   - name, description được lưu ở 2 nơi
   - Tốn thêm storage (nhưng không đáng kể)

3. **Phức tạp hơn**
   - Cần hiểu cả 2 bảng và cách chúng liên kết
   - Query phức tạp hơn khi cần join

## Phương án 2: Merge thành 1 bảng (project_categories)

### Ưu điểm ✅

1. **Đơn giản hơn**
   - Chỉ 1 bảng để quản lý
   - Không cần triggers đồng bộ
   - Query đơn giản hơn

2. **Không lo đồng bộ**
   - Không có vấn đề data inconsistency
   - Không cần triggers phức tạp

3. **Ít code hơn**
   - Ít API endpoints
   - Ít UI components
   - Dễ hiểu hơn

### Nhược điểm ❌

1. **Mất tính linh hoạt**
   - Không thể có task_groups độc lập (không liên quan đến project)
   - Không thể có project_categories chỉ để phân loại (không cần task_group)

2. **Vi phạm Single Responsibility Principle**
   - 1 bảng làm 2 việc: phân loại dự án + quản lý nhóm nhiệm vụ
   - Khó mở rộng tính năng riêng

3. **Vấn đề với task_group_members**
   - Nếu merge, task_group_members sẽ reference đến project_categories
   - Nhưng project_categories không có created_by, members logic
   - Phải thêm các trường này vào project_categories → làm phức tạp bảng

4. **Khó mở rộng**
   - Nếu sau này cần tính năng riêng cho task_groups (ví dụ: permissions, workflows)
   - Sẽ phải thêm vào project_categories → không phù hợp

## Phương án 3: Dùng project_categories làm chính, task_groups chỉ reference (Khuyến nghị)

### Cách hoạt động:
- `task_groups` chỉ có `category_id` (foreign key)
- Khi cần thông tin category, join với `project_categories`
- `task_groups` chỉ lưu thông tin riêng (members, created_by)

### Ưu điểm ✅

1. **Single Source of Truth**
   - `project_categories` là nguồn dữ liệu chính
   - `task_groups` chỉ reference, không duplicate data

2. **Vẫn giữ tính linh hoạt**
   - Có thể có task_groups không có category_id (NULL) cho nhiệm vụ độc lập
   - Có thể có project_categories không có task_group (nếu không cần)

3. **Đơn giản hơn đồng bộ**
   - Không cần đồng bộ name, description
   - Chỉ cần đảm bảo có task_group khi cần

4. **Dễ query**
   - Join đơn giản: `task_groups JOIN project_categories ON category_id`

### Nhược điểm ❌

1. **Vẫn cần 2 bảng**
   - Nhưng đơn giản hơn vì không duplicate data

2. **Cần join khi query**
   - Nhưng join rất đơn giản và nhanh

## Khuyến nghị: Phương án 3 (Cải thiện hiện tại)

### Cải thiện migration hiện tại:

```sql
-- Thay vì đồng bộ name, description
-- Chỉ đảm bảo có task_group khi cần
-- Khi query, join với project_categories để lấy name, description
```

### Lợi ích:
1. ✅ Single Source of Truth (project_categories)
2. ✅ Vẫn linh hoạt (có thể có task_groups độc lập)
3. ✅ Đơn giản hơn (không cần đồng bộ name/description)
4. ✅ Dễ mở rộng (mỗi bảng có tính năng riêng)

## So sánh nhanh

| Tiêu chí | 2 bảng + Đồng bộ | Merge 1 bảng | 2 bảng + Reference (Khuyến nghị) |
|----------|------------------|--------------|--------------------------------|
| Độ phức tạp | ⭐⭐⭐ Trung bình | ⭐⭐ Đơn giản | ⭐⭐ Đơn giản |
| Linh hoạt | ⭐⭐⭐ Rất tốt | ⭐ Kém | ⭐⭐⭐ Rất tốt |
| Dễ bảo trì | ⭐⭐ Trung bình | ⭐⭐⭐ Tốt | ⭐⭐⭐ Tốt |
| Data consistency | ⭐⭐ Cần triggers | ⭐⭐⭐ Tự động | ⭐⭐⭐ Tự động |
| Khả năng mở rộng | ⭐⭐⭐ Tốt | ⭐ Kém | ⭐⭐⭐ Tốt |
| Performance | ⭐⭐⭐ Tốt | ⭐⭐⭐ Tốt | ⭐⭐⭐ Tốt |

## Kết luận

**Khuyến nghị: Giữ 2 bảng nhưng cải thiện cách liên kết**

Thay vì đồng bộ name/description, nên:
- `task_groups.category_id` → reference đến `project_categories.id`
- Khi cần thông tin category, JOIN với `project_categories`
- `task_groups` chỉ lưu thông tin riêng (members, created_by)
- Triggers chỉ đảm bảo có task_group khi cần, không đồng bộ data

Cách này:
- ✅ Đơn giản hơn (không cần đồng bộ data)
- ✅ Linh hoạt hơn (có thể có task_groups độc lập)
- ✅ Dễ bảo trì hơn (single source of truth)
- ✅ Dễ mở rộng hơn (mỗi bảng có tính năng riêng)














