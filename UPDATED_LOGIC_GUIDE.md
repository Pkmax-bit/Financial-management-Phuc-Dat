# Hướng dẫn Logic Cập Nhật Mới

## 🔄 **Logic Cập Nhật Đã Được Viết Lại**

### ✅ **Các cải tiến chính:**

1. **Validation tốt hơn:**
   - Kiểm tra `workshopParentObject` và `pendingExpenseData`
   - Kiểm tra `project_id` có tồn tại
   - Kiểm tra `directObjectTotals` có dữ liệu
   - Kiểm tra tổng chi phí > 0

2. **Tìm kiếm chi phí parent:**
   - Thay đổi từ `.single()` sang `.select()` để lấy TẤT CẢ chi phí parent
   - Sắp xếp theo `created_at` giảm dần
   - Lấy chi phí parent mới nhất

3. **Cập nhật chi phí con:**
   - Xóa tất cả chi phí con cũ
   - Tạo chi phí con mới với dữ liệu mới
   - Đảm bảo tính nhất quán dữ liệu

4. **Error handling tốt hơn:**
   - Xử lý lỗi cho từng bước
   - Thông báo lỗi chi tiết
   - Logging đầy đủ

## 🎯 **Luồng Logic Mới:**

### **Bước 1: Validation**
```javascript
// Kiểm tra dữ liệu cần thiết
if (!workshopParentObject || !pendingExpenseData) {
  alert('Thiếu dữ liệu cần thiết để cập nhật. Vui lòng thử lại.')
  return
}

// Kiểm tra project_id
if (!pendingExpenseData.formData.project_id) {
  alert('Thiếu thông tin dự án. Vui lòng thử lại.')
  return
}

// Kiểm tra dữ liệu chi phí
if (!pendingExpenseData.directObjectTotals || Object.keys(pendingExpenseData.directObjectTotals).length === 0) {
  alert('Không có dữ liệu chi phí để cập nhật. Vui lòng nhập số tiền.')
  return
}
```

### **Bước 2: Tìm Chi Phí Parent**
```javascript
// Tìm TẤT CẢ chi phí parent (không dùng .single())
const { data: existingParents, error: searchError } = await supabase
  .from('project_expenses')
  .select('*')
  .eq('expense_object_id', workshopParentObject.id)
  .eq('project_id', pendingExpenseData.formData.project_id)
  .order('created_at', { ascending: false })

// Lấy chi phí parent mới nhất
const existingParent = existingParents[0]
```

### **Bước 3: Tính Toán Tổng Chi Phí**
```javascript
// Tính tổng chi phí con (cha = tổng con)
const totalAmount = (Object.values(pendingExpenseData.directObjectTotals) as number[]).reduce((sum: number, val: number) => sum + val, 0)

// Kiểm tra tổng chi phí > 0
if (totalAmount <= 0) {
  alert('Tổng chi phí phải lớn hơn 0. Vui lòng kiểm tra lại số tiền.')
  return
}
```

### **Bước 4: Cập Nhật Chi Phí Parent**
```javascript
// Cập nhật chi phí parent với tổng từ children
const { error: updateError } = await supabase
  .from('project_expenses')
  .update({
    amount: totalAmount,
    description: pendingExpenseData.formData.description || existingParent.description,
    updated_at: new Date().toISOString(),
    role: selectedRole,
    expense_object_breakdown: pendingExpenseData.directObjectTotals
  })
  .eq('id', existingParent.id)
```

### **Bước 5: Cập Nhật Chi Phí Con**
```javascript
// Xóa tất cả chi phí con cũ
await supabase
  .from('project_expenses')
  .delete()
  .eq('id_parent', parentId)

// Tạo chi phí con mới
for (const [childObjectId, amount] of Object.entries(directObjectTotals)) {
  if (amount > 0) {
    // Tạo chi phí con mới
    await supabase
      .from('project_expenses')
      .insert(childExpenseData)
  }
}
```

## 🔍 **Console Logs Mong Đợi:**

Khi bấm nút "Cập nhật", bạn sẽ thấy các log sau trong console:

```
🔄 Starting updateParentExpense...
📊 workshopParentObject: [object data]
📊 pendingExpenseData: [object data]
🔍 Searching for existing parent expenses...
📊 Found existing parents: [array of parents]
📊 Using parent expense: [selected parent]
💰 Total amount calculated: [number]
✅ Updated parent expense: [id] with amount: [number]
🔄 Updating child expenses for parent: [id]
✅ Deleted old child expenses
✅ Created child expense: [name] with amount: [number]
✅ All child expenses updated
🔄 Calling onSuccess callback...
✅ Update completed successfully
```

## 🎯 **Các Trường Hợp Xử Lý:**

### **Trường hợp 1: Thành công**
- Tìm thấy chi phí parent
- Cập nhật thành công
- Hiển thị thông báo thành công

### **Trường hợp 2: Không tìm thấy chi phí parent**
- Hiển thị thông báo: "Không tìm thấy chi phí đối tượng cha để cập nhật. Vui lòng chọn 'Tạo chi phí mới'."
- Gợi ý sử dụng "Tạo chi phí mới"

### **Trường hợp 3: Lỗi validation**
- Thiếu dữ liệu cần thiết
- Thiếu project_id
- Không có dữ liệu chi phí
- Tổng chi phí <= 0

### **Trường hợp 4: Lỗi database**
- Lỗi tìm kiếm chi phí parent
- Lỗi cập nhật chi phí parent
- Lỗi xóa/tạo chi phí con

## 🚀 **Hướng Dẫn Sử Dụng:**

### **Khi nào dùng "Cập nhật":**
- Đã có chi phí parent trong database
- Muốn thay đổi số tiền của chi phí parent
- Muốn cập nhật thông tin chi phí parent

### **Khi nào dùng "Tạo chi phí mới":**
- Chưa có chi phí parent trong database
- Muốn tạo chi phí parent mới
- Muốn tạo chi phí con mới

## 📋 **Checklist Test:**

- [ ] Kiểm tra console có log `🔄 Starting updateParentExpense...` không
- [ ] Kiểm tra validation có hoạt động không
- [ ] Kiểm tra tìm kiếm chi phí parent có đúng không
- [ ] Kiểm tra cập nhật chi phí parent có thành công không
- [ ] Kiểm tra cập nhật chi phí con có đúng không
- [ ] Kiểm tra onSuccess callback có được gọi không
- [ ] Kiểm tra database có được cập nhật đúng không

## 🔧 **Troubleshooting:**

### **Nếu vẫn không hoạt động:**
1. Kiểm tra console logs để xem bước nào bị lỗi
2. Kiểm tra database có chi phí parent không
3. Kiểm tra dữ liệu đầu vào có đúng không
4. Thử với "Tạo chi phí mới" thay vì "Cập nhật"

### **Nếu có lỗi database:**
1. Kiểm tra kết nối Supabase
2. Kiểm tra quyền truy cập
3. Kiểm tra cấu trúc bảng

## 📞 **Hỗ trợ:**

Nếu vẫn gặp vấn đề, hãy:
1. Chụp screenshot console logs
2. Ghi lại các bước đã thử
3. Cung cấp thông tin database
4. Mô tả chi tiết lỗi gặp phải
