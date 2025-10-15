# Hướng dẫn Snapshot Status Indicator

## Tổng quan
`SnapshotStatusIndicator` là component mới hiển thị trạng thái snapshot và cho phép khôi phục dữ liệu từ snapshot cho chi phí cha.

## Tính năng chính

### 1. **Hiển thị trạng thái snapshot**
- ✅ **Có snapshot**: Hiển thị "Có snapshot" với nút "Quay lại"
- ❌ **Không có snapshot**: Hiển thị "Không có snapshot"
- ⏳ **Đang kiểm tra**: Hiển thị "Kiểm tra snapshot..."

### 2. **Nút "Quay lại" thông minh**
- Chỉ hiển thị khi có snapshot
- Disabled khi không có snapshot
- Loading state khi đang khôi phục
- Tooltip giải thích trạng thái

### 3. **Lịch sử snapshot**
- Nút "History" để xem lịch sử snapshot
- Thông tin chi tiết: tên, thời gian tạo, trạng thái khôi phục
- Phân biệt snapshot có thể khôi phục và đã khôi phục

## Cách hoạt động

### 1. **Kiểm tra snapshot tự động**
```jsx
// Component tự động kiểm tra snapshot khi load
useEffect(() => {
  loadRestoreHistory()
}, [parentId, tableName])
```

### 2. **Hiển thị trạng thái**
```jsx
{hasSnapshot ? (
  <div className="flex items-center text-green-600">
    <CheckCircle className="h-4 w-4 mr-1" />
    <span className="text-xs">Có snapshot</span>
  </div>
) : (
  <div className="flex items-center text-gray-500">
    <AlertCircle className="h-4 w-4 mr-1" />
    <span className="text-xs">Không có snapshot</span>
  </div>
)}
```

### 3. **Khôi phục dữ liệu**
```jsx
const handleRestore = async () => {
  // Gọi API khôi phục
  const response = await fetch(
    `${API_BASE_URL}/api/expense-restore/restore-parent/${parentId}?table_name=${tableName}`,
    { method: 'POST' }
  )
  
  // Cập nhật UI và gọi callback
  if (response.ok) {
    setRestoreMessage('✅ Khôi phục thành công!')
    await loadRestoreHistory()
    if (onRestore) onRestore()
  }
}
```

## Sử dụng trong ProjectExpensesTab

### 1. **Import component**
```jsx
import SnapshotStatusIndicator from './SnapshotStatusIndicator'
```

### 2. **Hiển thị cho parent expenses**
```jsx
{(!expense.level || expense.level === 0) && (
  <SnapshotStatusIndicator
    parentId={expense.id}
    tableName={expense.category === 'planned' ? 'project_expenses_quote' : 'project_expenses'}
    onRestore={handleRestoreSuccess}
    className="inline-flex"
  />
)}
```

### 3. **Callback function**
```jsx
const handleRestoreSuccess = async () => {
  // Reload data after successful restore
  await fetchProjectExpenses()
}
```

## Sử dụng trong ExpensesTab

### 1. **Import component**
```jsx
import SnapshotStatusIndicator from './SnapshotStatusIndicator'
```

### 2. **Hiển thị cho parent expenses**
```jsx
{!exp.id_parent && (
  <SnapshotStatusIndicator
    parentId={exp.id}
    tableName="expenses"
    onRestore={handleRestoreSuccess}
    className="inline-flex"
  />
)}
```

## Giao diện người dùng

### 1. **Trạng thái "Có snapshot"**
```
✅ Có snapshot  [Quay lại] [History]
```

### 2. **Trạng thái "Không có snapshot"**
```
⚠️ Không có snapshot
```

### 3. **Trạng thái "Đang kiểm tra"**
```
⏳ Kiểm tra snapshot...
```

### 4. **Trạng thái "Đang khôi phục"**
```
✅ Có snapshot  [⏳ Đang khôi phục...] [History]
```

## Lợi ích

### 1. **Trực quan và rõ ràng**
- Người dùng biết ngay chi phí nào có snapshot
- Không cần đoán hoặc thử nghiệm
- Trạng thái được cập nhật real-time

### 2. **Tương tác thông minh**
- Nút "Quay lại" chỉ hiển thị khi cần thiết
- Disabled state rõ ràng
- Loading state khi đang xử lý

### 3. **Thông tin chi tiết**
- Lịch sử snapshot đầy đủ
- Trạng thái khôi phục rõ ràng
- Tooltip giải thích chức năng

## API Integration

### 1. **Load restore history**
```http
GET /api/expense-restore/history/{parent_id}?table_name={table_name}
Authorization: Bearer {token}
```

### 2. **Restore from snapshot**
```http
POST /api/expense-restore/restore-parent/{parent_id}?table_name={table_name}
Authorization: Bearer {token}
```

## Debug và Troubleshooting

### 1. **Console logs**
```javascript
// Kiểm tra API calls
console.log(`Loading restore history for parent: ${parentId}, table: ${tableName}`)
console.log(`API response status: ${response.status}`)
console.log(`Has snapshot: ${data.restore_history.length > 0}`)
```

### 2. **Kiểm tra trạng thái**
- **Có snapshot**: `hasSnapshot = true`, `restoreHistory.length > 0`
- **Không có snapshot**: `hasSnapshot = false`, `restoreHistory.length = 0`
- **API lỗi**: Check console logs và network tab

### 3. **Common issues**
- **Authentication**: Kiểm tra token có hợp lệ không
- **API endpoint**: Kiểm tra URL và parameters
- **Data format**: Kiểm tra response structure

## Kết luận

`SnapshotStatusIndicator` cung cấp:
- **Trạng thái rõ ràng**: Biết ngay chi phí nào có snapshot
- **Tương tác thông minh**: Nút chỉ hiển thị khi cần thiết
- **Thông tin chi tiết**: Lịch sử snapshot đầy đủ
- **UX tốt**: Loading states và feedback rõ ràng

Component này thay thế `ExpenseRestoreButton` cũ và cung cấp trải nghiệm người dùng tốt hơn.
