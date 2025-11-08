# Hướng dẫn sử dụng nút "Quay lại" cho chi phí cha

## Tổng quan
Nút "Quay lại" được thêm vào chi phí cha để khôi phục dữ liệu từ snapshot tự động khi tạo chi phí con.

## Vị trí nút "Quay lại"

### 1. **Chi phí dự án** (`ProjectExpensesTab.tsx`)
- **Vị trí**: Cột "Thao tác" trong bảng chi phí dự án
- **Hiển thị**: Chỉ cho chi phí cha (không có `level` hoặc `level = 0`)
- **Bảng**: 
  - Chi phí kế hoạch: `project_expenses_quote`
  - Chi phí thực tế: `project_expenses`

### 2. **Chi phí thường** (`ExpensesTab.tsx`)
- **Vị trí**: Cột "Thao tác" trong bảng chi phí thường
- **Hiển thị**: Chỉ cho chi phí cha (không có `id_parent`)
- **Bảng**: `expenses`

## Cách hoạt động

### 1. **Tự động tạo snapshot**
- Khi tạo chi phí con (có `id_parent`), hệ thống tự động tạo snapshot chi phí cha
- Snapshot lưu trữ trạng thái chi phí cha tại thời điểm tạo chi phí con

### 2. **Nút "Quay lại"**
- Hiển thị cho chi phí cha có snapshot
- Cho phép khôi phục chi phí cha từ snapshot mới nhất
- Có nút "History" để xem lịch sử snapshot

### 3. **Khôi phục dữ liệu**
- Khôi phục thông tin chi phí cha từ snapshot
- Cập nhật các field: `description`, `amount`, `currency`, `expense_date`, `status`, `notes`, `receipt_url`
- Reload dữ liệu sau khi khôi phục thành công

## Giao diện người dùng

### 1. **Nút "Quay lại"**
```jsx
<ExpenseRestoreButton
  parentId={expense.id}
  tableName="expenses" // hoặc "project_expenses", "project_expenses_quote"
  onRestore={handleRestoreSuccess}
  className="inline-flex"
/>
```

### 2. **Màu sắc và trạng thái**
- **Màu cam**: Dễ nhận biết và phân biệt với các nút khác
- **Loading state**: Hiển thị khi đang khôi phục
- **Thông báo**: Success/Error messages

### 3. **Nút "History"**
- Dropdown hiển thị lịch sử snapshot
- Thông tin: tên, thời gian tạo, trạng thái khôi phục
- Phân biệt snapshot có thể khôi phục và đã khôi phục

## Logic hiển thị

### 1. **Chi phí dự án**
```jsx
{(!expense.level || expense.level === 0) && (
  <ExpenseRestoreButton
    parentId={expense.id}
    tableName={expense.category === 'planned' ? 'project_expenses_quote' : 'project_expenses'}
    onRestore={handleRestoreSuccess}
    className="inline-flex"
  />
)}
```

### 2. **Chi phí thường**
```jsx
{!exp.id_parent && (
  <ExpenseRestoreButton
    parentId={exp.id}
    tableName="expenses"
    onRestore={handleRestoreSuccess}
    className="inline-flex"
  />
)}
```

## Callback functions

### 1. **handleRestoreSuccess**
```jsx
const handleRestoreSuccess = async () => {
  // Reload data after successful restore
  await fetchExpenses() // hoặc fetchProjectExpenses()
}
```

### 2. **Reload data**
- **ExpensesTab**: `fetchExpenses()`
- **ProjectExpensesTab**: `fetchProjectExpenses()`

## API Integration

### 1. **Backend endpoints**
- `GET /api/expense-restore/history/{parent_id}` - Lấy lịch sử
- `GET /api/expense-restore/latest-snapshot/{parent_id}` - Lấy snapshot mới nhất
- `POST /api/expense-restore/restore-parent/{parent_id}` - Khôi phục

### 2. **Service layer**
- `AutoSnapshotService.create_auto_snapshot_for_child()` - Tạo snapshot
- `AutoSnapshotService.restore_parent_from_snapshot()` - Khôi phục
- `AutoSnapshotService.get_restore_history()` - Lấy lịch sử

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

## Sử dụng thực tế

### 1. **Tạo chi phí con**
```
1. Chọn chi phí cha
2. Tạo chi phí con
3. Hệ thống tự động tạo snapshot chi phí cha
4. Nút "Quay lại" xuất hiện cho chi phí cha
```

### 2. **Khôi phục chi phí cha**
```
1. Nhấn nút "Quay lại" trên chi phí cha
2. Hệ thống khôi phục từ snapshot mới nhất
3. Dữ liệu được cập nhật và reload
4. Thông báo thành công
```

### 3. **Xem lịch sử snapshot**
```
1. Nhấn nút "History" bên cạnh "Quay lại"
2. Xem danh sách snapshot
3. Thông tin chi tiết: tên, thời gian, trạng thái
4. Phân biệt snapshot có thể khôi phục
```

## Troubleshooting

### 1. **Nút không hiển thị**
- Kiểm tra chi phí có phải là chi phí cha không
- Kiểm tra có snapshot nào không
- Kiểm tra API endpoint có hoạt động không

### 2. **Khôi phục thất bại**
- Kiểm tra snapshot có tồn tại không
- Kiểm tra quyền ghi database
- Kiểm tra dữ liệu snapshot có hợp lệ không

### 3. **Lỗi hiển thị**
- Kiểm tra component `ExpenseRestoreButton` có được import không
- Kiểm tra CSS classes có đúng không
- Kiểm tra props có được truyền đúng không

## Kết luận

Nút "Quay lại" giúp:
- **Bảo vệ dữ liệu**: Tự động backup và khôi phục
- **Cải thiện UX**: Giao diện trực quan và dễ sử dụng
- **Quản lý rủi ro**: Backup tự động và khôi phục nhanh chóng
- **Theo dõi lịch sử**: Lịch sử snapshot chi tiết và rõ ràng
