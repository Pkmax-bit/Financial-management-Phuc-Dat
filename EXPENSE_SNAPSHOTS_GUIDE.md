# Hướng dẫn sử dụng Expense Snapshots

## Tổng quan
Expense Snapshots là tính năng cho phép lưu lại và khôi phục trạng thái chi phí tại một thời điểm cụ thể, bao gồm cả mối quan hệ cha-con giữa các chi phí.

## Tính năng chính

### 1. **Lưu trữ đa dạng loại chi phí**
- Chi phí thường (`expenses`)
- Chi phí dự án kế hoạch (`project_expenses_quote`)
- Chi phí dự án thực tế (`project_expenses`)
- Tất cả loại chi phí (`all`)

### 2. **Hỗ trợ mối quan hệ cha-con**
- Lưu trữ cấu trúc phân cấp chi phí
- Phân biệt chi phí cha và chi phí con
- Tính toán thống kê theo cấp độ

### 3. **Thống kê chi tiết**
- Tổng số chi phí
- Số chi phí cha
- Số chi phí con
- Tổng số tiền theo từng cấp độ
- Độ sâu cây chi phí

## Cấu trúc bảng

### Bảng `expense_snapshots`
```sql
CREATE TABLE public.expense_snapshots (
  id UUID PRIMARY KEY,
  snapshot_name VARCHAR(255) NOT NULL,
  snapshot_description TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Thống kê số lượng
  total_expenses_count INTEGER DEFAULT 0,
  root_expenses_count INTEGER DEFAULT 0,
  child_expenses_count INTEGER DEFAULT 0,
  
  -- Thống kê số tiền
  total_amount NUMERIC(15, 2) DEFAULT 0,
  root_amount NUMERIC(15, 2) DEFAULT 0,
  child_amount NUMERIC(15, 2) DEFAULT 0,
  
  -- Metadata
  snapshot_month VARCHAR(7),
  snapshot_type VARCHAR(20) DEFAULT 'all',
  
  -- Dữ liệu chi phí
  expenses_data JSONB NOT NULL DEFAULT '[]',
  parent_expenses_data JSONB DEFAULT '[]',
  child_expenses_data JSONB DEFAULT '[]',
  
  -- Thông tin phân cấp
  hierarchy_levels INTEGER DEFAULT 0,
  max_depth INTEGER DEFAULT 0,
  
  -- Trạng thái
  is_active BOOLEAN DEFAULT TRUE,
  restored_at TIMESTAMP WITH TIME ZONE,
  restored_by UUID REFERENCES users(id)
);
```

## API Endpoints

### 1. Tạo snapshot
```http
POST /api/expense-snapshots
Content-Type: application/json
Authorization: Bearer <token>

{
  "snapshot_name": "Snapshot tháng 1/2025",
  "snapshot_description": "Lưu trữ chi phí đầu tháng",
  "snapshot_type": "all"
}
```

### 2. Lấy danh sách snapshots
```http
GET /api/expense-snapshots?snapshot_type=all&is_active=true&limit=50
Authorization: Bearer <token>
```

### 3. Lấy thông tin snapshot
```http
GET /api/expense-snapshots/{snapshot_id}
Authorization: Bearer <token>
```

### 4. Lấy thống kê snapshot
```http
GET /api/expense-snapshots/{snapshot_id}/statistics
Authorization: Bearer <token>
```

### 5. Khôi phục snapshot
```http
POST /api/expense-snapshots/{snapshot_id}/restore
Authorization: Bearer <token>
```

### 6. Xóa snapshot
```http
DELETE /api/expense-snapshots/{snapshot_id}
Authorization: Bearer <token>
```

## Sử dụng trong Python

### Tạo snapshot
```python
from expense_snapshots_manager import ExpenseSnapshotsManager

manager = ExpenseSnapshotsManager()

# Tạo snapshot cho tất cả chi phí
snapshot = manager.create_snapshot(
    snapshot_name="Snapshot tháng 1/2025",
    snapshot_description="Lưu trữ chi phí đầu tháng",
    snapshot_type="all"
)

print(f"Snapshot created: {snapshot['id']}")
```

### Lấy thống kê
```python
# Lấy thống kê snapshot
stats = manager.get_snapshot_statistics(snapshot['id'])
print(f"Total expenses: {stats['total_expenses_count']}")
print(f"Root expenses: {stats['root_expenses_count']}")
print(f"Child expenses: {stats['child_expenses_count']}")
print(f"Total amount: {stats['total_amount']}")
```

### Khôi phục snapshot
```python
# Khôi phục snapshot
success = manager.restore_snapshot(snapshot['id'])
if success:
    print("Snapshot restored successfully")
else:
    print("Failed to restore snapshot")
```

## Các loại snapshot

### 1. **All Expenses** (`all`)
- Lưu trữ tất cả loại chi phí
- Bao gồm chi phí thường, chi phí dự án kế hoạch, chi phí dự án thực tế
- Phù hợp cho backup toàn hệ thống

### 2. **Regular Expenses** (`expenses`)
- Chỉ lưu trữ chi phí thường
- Không bao gồm chi phí dự án
- Phù hợp cho backup chi phí hành chính

### 3. **Project Planned Expenses** (`project_planned`)
- Chỉ lưu trữ chi phí dự án kế hoạch
- Bao gồm mối quan hệ cha-con
- Phù hợp cho backup kế hoạch dự án

### 4. **Project Actual Expenses** (`project_actual`)
- Chỉ lưu trữ chi phí dự án thực tế
- Bao gồm mối quan hệ cha-con
- Phù hợp cho backup chi phí thực tế

## Lợi ích

### 1. **Backup và khôi phục**
- Lưu trữ trạng thái chi phí tại thời điểm cụ thể
- Khôi phục nhanh chóng khi cần thiết
- Bảo vệ dữ liệu quan trọng

### 2. **Phân tích xu hướng**
- So sánh chi phí giữa các thời điểm
- Theo dõi sự thay đổi cấu trúc chi phí
- Phân tích hiệu quả quản lý

### 3. **Quản lý rủi ro**
- Backup trước khi thay đổi lớn
- Khôi phục khi có lỗi
- Đảm bảo tính toàn vẹn dữ liệu

## Lưu ý quan trọng

### 1. **Kích thước dữ liệu**
- Snapshots có thể lớn nếu có nhiều chi phí
- Cần quản lý không gian lưu trữ
- Xóa snapshots cũ khi không cần thiết

### 2. **Hiệu suất**
- Tạo snapshot có thể mất thời gian với dữ liệu lớn
- Khôi phục snapshot cần cẩn thận
- Sử dụng index để tối ưu truy vấn

### 3. **Bảo mật**
- Chỉ người có quyền mới tạo/khôi phục snapshot
- Log hoạt động snapshot
- Kiểm tra quyền truy cập

## Troubleshooting

### Lỗi tạo snapshot
- Kiểm tra quyền truy cập database
- Đảm bảo có đủ không gian lưu trữ
- Kiểm tra kết nối database

### Lỗi khôi phục snapshot
- Kiểm tra dữ liệu snapshot có hợp lệ
- Đảm bảo có quyền ghi vào bảng chi phí
- Kiểm tra ràng buộc dữ liệu

### Lỗi hiệu suất
- Tối ưu index trên bảng snapshots
- Giới hạn kích thước snapshot
- Sử dụng pagination cho danh sách
