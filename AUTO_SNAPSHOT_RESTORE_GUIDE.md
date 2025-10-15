# Hướng dẫn sử dụng Auto Snapshot & Restore

## Tổng quan
Tính năng Auto Snapshot & Restore tự động lưu trữ chi phí cha khi tạo chi phí con, và cung cấp nút "Quay lại" để khôi phục dữ liệu từ snapshot.

## Cách hoạt động

### 1. **Tự động tạo snapshot**
- Khi tạo chi phí con (có `id_parent`), hệ thống tự động tạo snapshot
- Snapshot lưu trữ trạng thái chi phí cha tại thời điểm tạo chi phí con
- Snapshot được lưu với tên tự động: `Auto-snapshot-{table_name}-{timestamp}`

### 2. **Nút "Quay lại"**
- Hiển thị khi đã chọn chi phí cha
- Cho phép khôi phục chi phí cha từ snapshot mới nhất
- Hiển thị lịch sử snapshot và trạng thái khôi phục

## Cài đặt

### 1. **Chạy SQL setup**
```sql
-- Chạy file auto_snapshot_on_child_creation.sql trong Supabase Dashboard
```

### 2. **Backend đã được cập nhật**
- Router `expense_restore` đã được thêm vào `main.py`
- API endpoints sẵn sàng sử dụng

### 3. **Frontend đã được tích hợp**
- Component `ExpenseRestoreButton` đã được thêm vào form tạo chi phí
- Tự động hiển thị khi chọn chi phí cha

## Sử dụng

### 1. **Tạo chi phí con**
```
1. Mở form tạo chi phí dự án
2. Chọn chi phí cha từ dropdown
3. Điền thông tin chi phí con
4. Lưu chi phí
5. Hệ thống tự động tạo snapshot chi phí cha
```

### 2. **Khôi phục chi phí cha**
```
1. Chọn chi phí cha trong form
2. Nút "Quay lại" sẽ xuất hiện
3. Nhấn "Quay lại" để khôi phục từ snapshot
4. Xem lịch sử snapshot bằng nút "History"
```

## API Endpoints

### 1. **Lấy lịch sử restore**
```http
GET /api/expense-restore/history/{parent_id}?table_name={table_name}
Authorization: Bearer <token>
```

### 2. **Lấy snapshot mới nhất**
```http
GET /api/expense-restore/latest-snapshot/{parent_id}?table_name={table_name}
Authorization: Bearer <token>
```

### 3. **Khôi phục chi phí cha**
```http
POST /api/expense-restore/restore-parent/{parent_id}?table_name={table_name}
Authorization: Bearer <token>
```

### 4. **Tạo snapshot thủ công**
```http
POST /api/expense-restore/create-manual-snapshot/{parent_id}?table_name={table_name}&snapshot_name={name}
Authorization: Bearer <token>
```

### 5. **Kiểm tra auto-snapshots**
```http
GET /api/expense-restore/check-auto-snapshots?limit=10
Authorization: Bearer <token>
```

## Các loại bảng được hỗ trợ

### 1. **expenses** - Chi phí thường
- Tự động snapshot khi tạo chi phí con
- Khôi phục thông tin chi phí cha

### 2. **project_expenses** - Chi phí dự án thực tế
- Tự động snapshot khi tạo chi phí con
- Khôi phục thông tin chi phí cha

### 3. **project_expenses_quote** - Chi phí dự án kế hoạch
- Tự động snapshot khi tạo chi phí con
- Khôi phục thông tin chi phí cha

## Giao diện người dùng

### 1. **Nút "Quay lại"**
- Màu cam để dễ nhận biết
- Hiển thị trạng thái loading khi đang khôi phục
- Thông báo kết quả khôi phục

### 2. **Nút "History"**
- Hiển thị dropdown với lịch sử snapshot
- Thông tin chi tiết: tên, thời gian tạo, trạng thái khôi phục
- Phân biệt snapshot có thể khôi phục và đã khôi phục

### 3. **Thông báo**
- Thành công: "✅ Khôi phục thành công!"
- Lỗi: "❌ Lỗi khôi phục: {chi tiết lỗi}"
- Thông tin: "💡 Snapshot được tạo tự động khi thêm chi phí con"

## Lợi ích

### 1. **Bảo vệ dữ liệu**
- Tự động backup chi phí cha khi tạo chi phí con
- Khôi phục nhanh chóng khi cần thiết
- Tránh mất dữ liệu quan trọng

### 2. **Cải thiện UX**
- Nút "Quay lại" trực quan và dễ sử dụng
- Lịch sử snapshot rõ ràng
- Thông báo trạng thái real-time

### 3. **Quản lý rủi ro**
- Backup tự động không cần can thiệp thủ công
- Khôi phục chính xác từ snapshot
- Theo dõi lịch sử thay đổi

## Lưu ý quan trọng

### 1. **Tự động snapshot**
- Chỉ tạo khi có `id_parent` (chi phí con)
- Snapshot lưu trạng thái chi phí cha tại thời điểm tạo chi phí con
- Không tạo snapshot cho chi phí cha (level 0)

### 2. **Khôi phục dữ liệu**
- Khôi phục từ snapshot mới nhất
- Chỉ khôi phục thông tin chi phí cha
- Không ảnh hưởng đến chi phí con

### 3. **Hiệu suất**
- Snapshot được tạo trong background
- Không ảnh hưởng đến tốc độ tạo chi phí
- Tối ưu với index trên bảng snapshots

## Troubleshooting

### Lỗi tạo snapshot
- Kiểm tra trigger đã được tạo chưa
- Kiểm tra quyền truy cập database
- Kiểm tra log lỗi trong console

### Lỗi khôi phục
- Kiểm tra snapshot có tồn tại không
- Kiểm tra quyền ghi vào bảng chi phí
- Kiểm tra dữ liệu snapshot có hợp lệ không

### Nút không hiển thị
- Kiểm tra đã chọn chi phí cha chưa
- Kiểm tra API endpoint có hoạt động không
- Kiểm tra authentication token

## Ví dụ sử dụng

### Tạo chi phí con với auto snapshot
```javascript
// 1. Chọn chi phí cha
formData.id_parent = "parent-expense-id"

// 2. Tạo chi phí con
const childExpense = {
  description: "Chi phí con",
  amount: 1000000,
  id_parent: "parent-expense-id"
}

// 3. Hệ thống tự động tạo snapshot chi phí cha
// 4. Nút "Quay lại" xuất hiện
```

### Khôi phục chi phí cha
```javascript
// 1. Nhấn nút "Quay lại"
// 2. Hệ thống gọi API restore
// 3. Chi phí cha được khôi phục từ snapshot
// 4. Thông báo thành công
```

## Kết luận

Tính năng Auto Snapshot & Restore giúp:
- **Bảo vệ dữ liệu**: Tự động backup khi tạo chi phí con
- **Cải thiện UX**: Nút "Quay lại" trực quan và dễ sử dụng
- **Quản lý rủi ro**: Khôi phục nhanh chóng khi cần thiết
- **Theo dõi lịch sử**: Lịch sử snapshot chi tiết và rõ ràng
