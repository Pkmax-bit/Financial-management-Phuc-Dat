# Debug: Nút "Quay lại" không hiển thị

## Các bước kiểm tra

### 1. **Kiểm tra Console Logs**
Mở Developer Tools (F12) và xem Console tab:
- Tìm log: `Loading restore history for parent: {id}, table: {table}`
- Tìm log: `API response status: {status}`
- Tìm log: `Has snapshot: {true/false}`
- Tìm log: `Expense {id}: level={level}, category={category}`

### 2. **Kiểm tra Test Component**
Tôi đã thêm `TestRestoreButton` component vào trang chi phí dự án. Nếu bạn thấy component test này, có nghĩa là:
- Component `ExpenseRestoreButton` hoạt động
- Vấn đề nằm ở logic hiển thị trong bảng

### 3. **Kiểm tra Logic Hiển thị**
Nút "Quay lại" chỉ hiển thị khi:
- **Chi phí dự án**: `(!expense.level || expense.level === 0)`
- **Chi phí thường**: `!exp.id_parent`
- **Có snapshot**: `hasSnapshot = true`

### 4. **Kiểm tra API Response**
Trong Console, tìm:
```
API response status: 200
Restore history data: {restore_history: [...]}
Has snapshot: true
```

Nếu `Has snapshot: false`, có nghĩa là:
- Chưa có snapshot nào cho chi phí cha này
- Cần tạo chi phí con trước để tạo snapshot

### 5. **Tạo Snapshot Test**
Để test nút "Quay lại":
1. Tạo một chi phí cha (không có id_parent)
2. Tạo một chi phí con (có id_parent = chi phí cha)
3. Hệ thống sẽ tự động tạo snapshot
4. Nút "Quay lại" sẽ xuất hiện

## Troubleshooting

### Nếu không thấy Test Component:
- Kiểm tra import: `import TestRestoreButton from './TestRestoreButton'`
- Kiểm tra component có được render không

### Nếu Test Component hiển thị nhưng nút trong bảng không:
- Kiểm tra logic: `(!expense.level || expense.level === 0)`
- Kiểm tra `expense.level` có giá trị gì
- Kiểm tra `expense.category` có đúng không

### Nếu API trả về lỗi:
- Kiểm tra authentication token
- Kiểm tra API endpoint có hoạt động không
- Kiểm tra backend server có chạy không

### Nếu `Has snapshot: false`:
- Chưa có snapshot nào
- Cần tạo chi phí con để tạo snapshot
- Kiểm tra auto snapshot có hoạt động không

## Cách sửa nhanh

### 1. **Tạm thời hiển thị nút cho tất cả chi phí**
```jsx
{/* Restore button - hiển thị cho tất cả để test */}
<ExpenseRestoreButton
  parentId={expense.id}
  tableName={expense.category === 'planned' ? 'project_expenses_quote' : 'project_expenses'}
  onRestore={handleRestoreSuccess}
  className="inline-flex"
/>
```

### 2. **Thêm debug info**
```jsx
<div className="text-xs text-gray-500">
  Level: {expense.level}, HasSnapshot: {hasSnapshot ? 'Yes' : 'No'}
</div>
```

### 3. **Kiểm tra props**
```jsx
{console.log('Expense props:', {
  id: expense.id,
  level: expense.level,
  category: expense.category,
  hasChildren: expense.hasChildren
})}
```

## Kết luận

Nút "Quay lại" sẽ hiển thị khi:
1. ✅ Component `ExpenseRestoreButton` được import đúng
2. ✅ Logic hiển thị đúng (`!expense.level || expense.level === 0`)
3. ✅ API trả về snapshot data (`hasSnapshot = true`)
4. ✅ Chi phí cha đã có snapshot (tạo từ chi phí con)

Nếu vẫn không thấy, hãy kiểm tra Console logs để xác định vấn đề cụ thể.
