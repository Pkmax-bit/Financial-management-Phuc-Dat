# Fix: Task Creation Issue

## Vấn đề
Khi tạo dự án mới, có 2 nơi tạo tasks:
1. **Database trigger** (`auto_create_default_tasks_trigger.sql`) - tạo cấu trúc cũ:
   - 4 parent tasks với `parent_id = NULL` (Kế hoạch, Sản xuất, Vận chuyển/lắp đặt, Chăm sóc khách hàng)
   - Các sub-tasks của chúng

2. **Backend code** (`create_default_tasks_for_project`) - tạo cấu trúc mới:
   - 1 main parent task = tên dự án (parent_id = NULL)
   - 4 task groups là sub-tasks của main parent task
   - Các sub-tasks của task groups

Điều này gây ra duplicate tasks và cấu trúc không đúng.

## Giải pháp

### Option 1: Disable Database Trigger (Recommended)
Vô hiệu hóa database trigger và chỉ dùng backend code:

1. Chạy migration SQL:
```sql
DROP TRIGGER IF EXISTS trigger_create_default_tasks_on_project_insert ON projects;
```

2. File migration: `database/migrations/disable_auto_create_tasks_trigger.sql`

### Option 2: Xóa tasks cũ trước khi tạo mới (Đã implement)
Backend code đã được cập nhật để:
- Kiểm tra tasks cũ từ trigger
- Xóa chúng trước khi tạo tasks mới với cấu trúc đúng

## Test
Chạy script test:
```bash
python scripts/test_create_project_with_tasks.py
```

Kết quả mong đợi:
- 1 main parent task (tên dự án)
- 4 second-level tasks (Kế hoạch, Sản xuất, Vận chuyển/lắp đặt, Chăm sóc khách hàng)
- ~15 third-level tasks (sub-tasks)
- Tổng: ~20 tasks

## Cấu trúc tasks đúng
```
[Tên dự án] (parent_id = NULL)
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
