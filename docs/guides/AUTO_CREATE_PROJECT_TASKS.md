# Tự động tạo nhiệm vụ khi tạo dự án

## Tổng quan

Khi tạo một dự án mới, hệ thống sẽ tự động tạo các nhiệm vụ lớn và nhiệm vụ nhỏ theo mẫu có sẵn.

## Cấu trúc nhiệm vụ mặc định

Hệ thống sẽ tự động tạo 4 nhiệm vụ lớn với các nhiệm vụ nhỏ tương ứng:

### 1. Kế hoạch
- Đo đạt
- Thiết kế / cập nhật bản vẽ
- Kế hoạch vật tư
- Kế hoạch sản xuất
- Kế hoạch lắp đặt

### 2. Sản xuất
- Mua hàng
- Sản xuất
- Hoàn thành

### 3. Vận chuyển / lắp đặt
- Vận chuyển
- Lắp đặt
- Nghiệm thu bàn giao
- Thu tiền

### 4. Chăm sóc khách hàng
- Đánh giá khách hàng
- Báo cáo / sửa chữa
- Nghiệm thu tính lương

## Cách hoạt động

1. **Khi tạo dự án**: Hệ thống tự động gọi `create_default_tasks_for_project()` sau khi tạo dự án thành công.

2. **Cấu trúc nhiệm vụ**:
   - Mỗi nhiệm vụ lớn là một task với `parent_id = null`
   - Mỗi nhiệm vụ nhỏ là một task với `parent_id` trỏ đến nhiệm vụ lớn tương ứng

3. **Người phụ trách**:
   - Một nhiệm vụ lớn có thể có nhiều người phụ trách
   - Người phụ trách được lưu trong bảng `task_participants` với `role = "responsible"`
   - Ban đầu, các nhiệm vụ lớn không có người phụ trách (có thể thêm sau)

## Thêm/Thay đổi người phụ trách

### Thêm người phụ trách cho nhiệm vụ lớn

Sử dụng API `POST /tasks/{task_id}/participants`:

```json
{
  "employee_id": "employee-uuid",
  "role": "responsible"
}
```

### Cập nhật người phụ trách

Sử dụng API `PUT /tasks/participants/{participant_id}`:

```json
{
  "employee_id": "new-employee-uuid",
  "role": "responsible"
}
```

### Xóa người phụ trách

Sử dụng API `DELETE /tasks/participants/{participant_id}`

## Tùy chỉnh nhiệm vụ mặc định

Để thay đổi cấu trúc nhiệm vụ mặc định, chỉnh sửa file `backend/services/project_default_tasks_service.py`:

```python
DEFAULT_TASKS_TEMPLATE = [
    {
        "title": "Tên nhiệm vụ lớn",
        "sub_tasks": [
            {"title": "Nhiệm vụ nhỏ 1", "default_responsible": None},
            {"title": "Nhiệm vụ nhỏ 2", "default_responsible": None},
        ]
    },
    # ...
]
```

## Chỉ định người phụ trách ban đầu

Để chỉ định người phụ trách khi tạo dự án, có thể mở rộng `ProjectCreate` model để nhận thêm tham số `default_task_responsibles`:

```python
default_task_responsibles: Optional[dict] = None
# Ví dụ: {"Kế hoạch": ["emp1", "emp2"], "Sản xuất": ["emp3"]}
```

Sau đó truyền vào `create_default_tasks_for_project()`.

## Lưu ý

- Việc tạo nhiệm vụ mặc định không làm fail việc tạo dự án nếu có lỗi (chỉ log warning)
- Tất cả nhiệm vụ được tạo với status = "todo" và priority = "medium"
- Start date của nhiệm vụ được lấy từ `project.start_date`
- Người tạo dự án (`created_by`) sẽ là người tạo tất cả các nhiệm vụ
