# Fix: Duplicate Tasks When Creating Project

## Vấn đề
Khi tạo dự án mới, có **2 parent tasks** với cùng tên (tên dự án) thay vì chỉ 1.

## Nguyên nhân
Có **2 nơi** tạo tasks:
1. **Database trigger** (`auto_create_default_tasks_trigger.sql`) - tạo tasks ngay sau khi INSERT project
2. **Backend code** (`create_default_tasks_for_project`) - tạo tasks sau khi project được tạo

Cả 2 đều tạo main parent task với tên dự án, gây duplicate.

## Giải pháp

### Bước 1: Disable Database Trigger

Chạy SQL sau trong Supabase SQL Editor:

```sql
-- Disable the auto-create tasks trigger
DROP TRIGGER IF EXISTS trigger_create_default_tasks_on_project_insert ON projects;
```

Hoặc chạy file migration:
```bash
# Trong Supabase Dashboard > SQL Editor, chạy nội dung file:
database/migrations/disable_auto_create_tasks_trigger.sql
```

### Bước 2: Verify

Sau khi disable trigger, test lại:
```bash
python scripts/test_create_project_with_tasks.py
```

Kết quả mong đợi:
- **1 parent task** (tên dự án)
- **4 second-level tasks** (Kế hoạch, Sản xuất, Vận chuyển/lắp đặt, Chăm sóc khách hàng)
- **~15 third-level tasks** (sub-tasks)
- **Tổng: ~20 tasks** (không phải 21)

## Cấu trúc đúng sau khi fix

```
[Tên dự án] (parent_id = NULL) ← CHỈ 1 TASK NÀY
  ├─ Kế hoạch (parent_id = [Tên dự án])
  │  ├─ Đo đạt
  │  ├─ Thiết kế / cập nhật bản vẽ
  │  ├─ Kế hoạch vật tư
  │  ├─ Kế hoạch sản xuất
  │  └─ Kế hoạch lắp đặt
  ├─ Sản xuất (parent_id = [Tên dự án])
  │  ├─ Mua hàng
  │  ├─ Sản xuất
  │  └─ Hoàn thành
  ├─ Vận chuyển / lắp đặt (parent_id = [Tên dự án])
  │  ├─ Vận chuyển
  │  ├─ Lắp đặt
  │  ├─ Nghiệm thu bàn giao
  │  └─ Thu tiền
  └─ Chăm sóc khách hàng (parent_id = [Tên dự án])
     ├─ Đánh giá khách hàng
     ├─ Báo cáo / sửa chữa
     └─ Nghiệm thu tính lương
```

## Tại sao chỉ dùng Backend Code?

1. **Backend code** có logic mới đúng (3-tier hierarchy)
2. **Database trigger** có logic cũ (4 parent tasks riêng biệt)
3. Backend code dễ maintain và debug hơn
4. Backend code có thể được cập nhật mà không cần migration

## Lưu ý

- Sau khi disable trigger, chỉ backend code sẽ tạo tasks
- Nếu tạo project trực tiếp qua SQL (không qua API), tasks sẽ KHÔNG được tạo tự động
- Để tạo tasks cho project cũ, có thể chạy script: `scripts/create_tasks_for_latest_project.py`
