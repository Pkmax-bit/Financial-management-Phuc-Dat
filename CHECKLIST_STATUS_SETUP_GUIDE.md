# Hướng Dẫn Thiết Lập Quản Lý Người Chịu Trách Nhiệm Checklist

## Tổng Quan

Tính năng này cho phép tự động đổi người chịu trách nhiệm cho checklist items khi trạng thái thay đổi, dựa trên mapping được cấu hình sẵn.

## Các Bước Thiết Lập

### Bước 1: Chạy Migration

Chạy migration script để tạo các bảng và trigger cần thiết:

```bash
# Kết nối đến Supabase database và chạy migration
psql -h <your-db-host> -U <your-user> -d <your-database> -f database/migrations/add_checklist_status_responsible_management.sql
```

Hoặc chạy trực tiếp trong Supabase SQL Editor.

### Bước 2: Thiết Lập Mapping

Sử dụng script Python để thiết lập mapping giữa trạng thái và người chịu trách nhiệm:

```bash
# Chạy script (sẽ hiển thị danh sách nhân viên để chọn)
python scripts/setup_checklist_status_mapping.py
```

Hoặc chỉ định trực tiếp employee IDs:

```bash
python scripts/setup_checklist_status_mapping.py \
  --employee-1-id <uuid-1> \
  --employee-2-id <uuid-2> \
  --employee-3-id <uuid-3> \
  --employee-4-id <uuid-4>
```

### Bước 3: Xem Mapping Hiện Tại

Để xem tất cả mapping đã được thiết lập:

```bash
python scripts/setup_checklist_status_mapping.py --list
```

## Mapping Mặc Định

Theo yêu cầu, mapping mặc định như sau:

| Trạng Thái | Người Phụ Trách | Mô Tả |
|------------|-----------------|-------|
| THỎA THUẬN | Employee 1 | Người phụ trách giai đoạn kế hoạch |
| XƯỞNG SẢN XUẤT | Employee 2 | Người phụ trách giai đoạn sản xuất |
| VẬN CHUYỂN | Employee 3 | Người phụ trách giai đoạn vận chuyển |
| LẮP ĐẶT | Employee 3 | Người phụ trách giai đoạn lắp đặt |
| CHĂM SÓC KHÁCH HÀNG | Employee 4 | Người phụ trách chăm sóc khách hàng |
| BÁO CÁO / SỬA CHỮA | Employee 4 | Người phụ trách báo cáo và sửa chữa |
| HOÀN THÀNH | Employee 4 | Người phụ trách nghiệm thu và tính lương |

## Cách Hoạt Động

### 1. Khi Cập Nhật Status Checklist Item

Khi bạn cập nhật `status` của một checklist item:

1. **Trigger tự động chạy**: Hệ thống sẽ tự động tìm người chịu trách nhiệm tương ứng với status mới
2. **Xóa assignment cũ**: Nếu có người chịu trách nhiệm cũ (accountable), sẽ bị xóa
3. **Thêm assignment mới**: Thêm người chịu trách nhiệm mới vào `task_checklist_item_assignments`
4. **Cập nhật assignee_id**: Cập nhật `assignee_id` của checklist item

### 2. Quyền Quản Lý

- **Người chịu trách nhiệm mới** (có `responsibility_type = 'accountable'`): 
  - ✅ Có quyền quản lý checklist item
  - ✅ Có thể tạo/sửa/xóa checklist items
  - ✅ Có thể đánh dấu hoàn thành
  
- **Người chịu trách nhiệm cũ**: 
  - ❌ Không còn quyền quản lý (assignment đã bị xóa)
  
- **Admin**: 
  - ✅ Luôn có quyền quản lý

## API Endpoints

### Cập Nhật Status Checklist Item

```http
PUT /tasks/checklist-items/{item_id}/status
Content-Type: application/json

{
  "status": "XƯỞNG SẢN XUẤT"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "...",
    "status": "XƯỞNG SẢN XUẤT",
    "assignee_id": "<employee-2-id>",
    ...
  }
}
```

### Xem Mapping

```http
GET /tasks/checklist-status-mapping
```

**Response:**
```json
[
  {
    "status": "THỎA THUẬN",
    "employee_id": "...",
    "employee_name": "Nguyễn Văn A",
    "responsibility_type": "accountable"
  },
  ...
]
```

## Quản Lý Mapping Thủ Công

### Thêm Mapping Mới

```sql
INSERT INTO checklist_status_responsible_mapping 
(status, employee_id, responsibility_type, is_active)
VALUES 
('TRẠNG THÁI MỚI', '<employee-id>', 'accountable', true);
```

### Cập Nhật Mapping

```sql
UPDATE checklist_status_responsible_mapping
SET employee_id = '<new-employee-id>'
WHERE status = 'TRẠNG THÁI' AND responsibility_type = 'accountable';
```

### Vô Hiệu Hóa Mapping

```sql
UPDATE checklist_status_responsible_mapping
SET is_active = false
WHERE status = 'TRẠNG THÁI';
```

## Lưu Ý

1. **Status phải chính xác**: Status phải khớp chính xác với status trong mapping (có phân biệt hoa thường)
2. **Employee ID hợp lệ**: Employee ID phải tồn tại trong bảng `employees`
3. **Backward Compatibility**: Các checklist items cũ không có status vẫn hoạt động bình thường
4. **Multiple Assignments**: Một checklist item có thể có nhiều assignments (accountable, responsible, consulted, informed), nhưng chỉ có một accountable

## Troubleshooting

### Trigger không chạy

Kiểm tra xem trigger đã được tạo chưa:

```sql
SELECT * FROM pg_trigger WHERE tgname = 'trigger_update_checklist_responsible';
```

### Mapping không tìm thấy

Kiểm tra mapping có tồn tại và active không:

```sql
SELECT * FROM checklist_status_responsible_mapping 
WHERE status = 'TRẠNG THÁI' AND is_active = true;
```

### Assignment không được cập nhật

Kiểm tra RLS policies:

```sql
SELECT * FROM pg_policies 
WHERE tablename = 'task_checklist_item_assignments';
```

## Tài Liệu Liên Quan

- [CHECKLIST_RESPONSIBLE_PERSON_MANAGEMENT.md](./CHECKLIST_RESPONSIBLE_PERSON_MANAGEMENT.md) - Tài liệu chi tiết về tính năng
- [PHAN_QUYEN_NHIEM_VU.md](../FinancialmanagementPhucDatMobile/PHAN_QUYEN_NHIEM_VU.md) - Tài liệu về phân quyền nhiệm vụ
