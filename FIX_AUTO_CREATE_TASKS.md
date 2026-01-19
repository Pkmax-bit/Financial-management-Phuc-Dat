# Fix: Tự động tạo nhiệm vụ mẫu khi tạo dự án

## Vấn đề

Khi tạo dự án mới, không thấy tự động tạo nhiệm vụ mẫu.

## Nguyên nhân

1. **Logic check trong service quá strict**: Service `create_default_tasks_for_project` kiểm tra nếu đã có tasks thì skip, nhưng có thể trigger đã tạo 1 task trước (parent task với tên dự án) → service skip tạo tasks mẫu.

2. **Không kiểm tra cấu trúc đầy đủ**: Chỉ check số lượng tasks, không check xem đã có đầy đủ checklists chưa.

## Giải pháp đã áp dụng

### 1. Cải thiện logic check trong service (`project_default_tasks_service.py`)

**Trước:**
- Chỉ check số lượng tasks
- Nếu có tasks → skip

**Sau:**
- Kiểm tra cấu trúc đầy đủ:
  - 1 parent task
  - 4 checklists
- Nếu đã đầy đủ → skip
- Nếu chưa đầy đủ → xóa tasks cũ và tạo lại

### 2. Đảm bảo router xóa tasks cũ trước khi gọi service

- Router đã có logic xóa tasks từ trigger
- Thêm delay để đảm bảo deletion hoàn thành trước khi gọi service

## Cấu trúc đúng

Khi tạo dự án mới, hệ thống sẽ tự động tạo:
- **1 parent task** (tên dự án)
- **4 checklists**:
  - Kế hoạch (5 items)
  - Sản xuất (3 items)
  - Vận chuyển / lắp đặt (4 items)
  - Chăm sóc khách hàng (3 items)
- **15 checklist items** (có checkbox)

## Test

1. Tạo dự án mới từ frontend
2. Kiểm tra backend logs:
   - `🔵 Starting to create default tasks for project {project_id}`
   - `Successfully created checklist {checklist_id}: {task_group_title}`
   - `✅ VERIFIED: Total tasks in database: 1`
   - `Checklists: 4`
   - `Checklist items: 15`
3. Kiểm tra database hoặc frontend để verify tasks đã được tạo

## Lưu ý

- Nếu dự án đã có đầy đủ cấu trúc (1 parent + 4 checklists), sẽ skip để tránh duplicate
- Nếu dự án có tasks nhưng chưa đầy đủ, sẽ xóa và tạo lại
- Logic này đảm bảo mọi dự án mới đều có đầy đủ nhiệm vụ mẫu
