# Fix: Duplicate Tasks Display Issue

## Vấn đề
Nhiệm vụ bị lặp lại khi hiển thị ở trang chi tiết dự án.

## Nguyên nhân
1. **Logic build hierarchy** có thể thêm tasks vào children nhiều lần
2. **Cả trigger và backend code** đều tạo tasks (đã fix bằng cách xóa tasks cũ)
3. **Frontend render** có thể hiển thị tasks nhiều lần

## Giải pháp đã áp dụng

### 1. Backend: Kiểm tra và xóa tasks cũ trước khi tạo mới
- Kiểm tra nếu có nhiều hơn 1 parent task → xóa tất cả và tạo lại
- Kiểm tra nếu có trigger tasks (Kế hoạch, Sản xuất, etc. với parent_id = NULL) → xóa tất cả và tạo lại
- Verify deletion để đảm bảo xóa sạch

### 2. Backend: Thêm check trong `create_default_tasks_for_project`
- Kiểm tra xem đã có tasks chưa trước khi tạo
- Nếu đã có tasks, skip để tránh duplicate

### 3. Frontend: Cải thiện logic build hierarchy
- Sử dụng `processedTaskIds` Set để track tasks đã được xử lý
- Chỉ thêm task vào children một lần
- Kiểm tra `alreadyExists` trước khi thêm vào children
- Recursively sort children và sub-children

### 4. Frontend: Render hierarchy đúng cách
- Hiển thị parent task
- Hiển thị sub-tasks (children) với indent
- Hiển thị sub-sub-tasks (children của children) với indent sâu hơn

## Cấu trúc hiển thị đúng

```
📌 [Tên dự án] (parent task)
  ├─ Kế hoạch (sub-task)
  │  ├─ Đo đạt (sub-sub-task)
  │  ├─ Thiết kế / cập nhật bản vẽ (sub-sub-task)
  │  └─ ...
  ├─ Sản xuất (sub-task)
  │  ├─ Mua hàng (sub-sub-task)
  │  └─ ...
  └─ ...
```

## Test
1. Tạo dự án mới → Kiểm tra xem có 1 parent task và các sub-tasks không
2. Refresh trang → Kiểm tra xem tasks không bị duplicate
3. Kiểm tra console → Không có lỗi

## Lưu ý
- Nếu vẫn thấy duplicate, có thể do:
  1. Database trigger vẫn đang chạy → Cần disable trigger
  2. Logic xóa tasks cũ chưa hoạt động đúng → Kiểm tra logs
  3. Frontend cache → Hard refresh (Ctrl+Shift+R)
