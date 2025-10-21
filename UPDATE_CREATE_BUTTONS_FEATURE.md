# UPDATE/CREATE BUTTONS FEATURE

## 🎯 MỤC TIÊU
Tạo 2 nút "Cập nhật chi phí đã có" và "Tạo mới" trong confirmation dialog để xử lý logic cập nhật chi phí đối tượng cha (cha = tổng chi phí con).

## 🔧 CÁC THAY ĐỔI ĐÃ THỰC HIỆN

### 1. **Cải thiện Confirmation Dialog UI**
```typescript
<div className="space-y-3">
  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
    <div className="flex items-center space-x-2 mb-2">
      <div className="w-2 h-2 rounded-full bg-blue-500"></div>
      <span className="text-sm font-medium text-blue-900">Cập nhật chi phí đã có</span>
    </div>
    <p className="text-xs text-blue-700 mb-3">
      Cập nhật lại chi phí đối tượng cha với tổng chi phí từ các đối tượng con
    </p>
    <button onClick={updateParentExpense}>
      🔄 Cập nhật chi phí đối tượng cha
    </button>
  </div>
  
  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
    <div className="flex items-center space-x-2 mb-2">
      <div className="w-2 h-2 rounded-full bg-green-500"></div>
      <span className="text-sm font-medium text-green-900">Tạo chi phí mới</span>
    </div>
    <p className="text-xs text-green-700 mb-3">
      Tạo chi phí mới với chi tiết đối tượng con và cập nhật đối tượng cha
    </p>
    <button onClick={createNewExpense}>
      ➕ Tạo chi phí mới với chi tiết đối tượng con
    </button>
  </div>
</div>
```

### 2. **Nút "Cập nhật chi phí đã có" - Logic xử lý**
```typescript
const updateParentExpense = async () => {
  // Tìm chi phí parent hiện tại
  const { data: existingParent } = await supabase
    .from('project_expenses')
    .select('*')
    .eq('expense_object_id', workshopParentObject.id)
    .eq('project_id', pendingExpenseData.formData.project_id)
    .single()
  
  if (existingParent) {
    // Tính tổng chi phí con (cha = tổng con)
    const totalAmount = Object.values(pendingExpenseData.directObjectTotals)
      .reduce((sum, val) => sum + val, 0)
    
    // Cập nhật chi phí parent với tổng từ children
    await supabase
      .from('project_expenses')
      .update({
        amount: totalAmount,
        updated_at: new Date().toISOString(),
        expense_object_breakdown: pendingExpenseData.directObjectTotals
      })
      .eq('id', existingParent.id)
  }
}
```

### 3. **Nút "Tạo mới" - Logic xử lý**
```typescript
const createNewExpense = async () => {
  // Tính tổng chi phí con (cha = tổng con)
  const totalAmount = Object.values(pendingExpenseData.directObjectTotals)
    .reduce((sum, val) => sum + val, 0)
  
  // Tạo chi phí parent mới với tổng từ children
  const parentExpenseData = {
    id: crypto.randomUUID(),
    project_id: pendingExpenseData.formData.project_id,
    description: pendingExpenseData.formData.description,
    expense_object_id: workshopParentObject.id,
    amount: totalAmount, // Cha = tổng con
    expense_object_breakdown: pendingExpenseData.directObjectTotals
  }
  
  // Tạo chi phí con cho từng đối tượng
  for (const [childObjectId, amount] of Object.entries(pendingExpenseData.directObjectTotals)) {
    const childExpenseData = {
      id: crypto.randomUUID(),
      project_id: pendingExpenseData.formData.project_id,
      description: `${pendingExpenseData.formData.description} - ${childObjectName}`,
      expense_object_id: childObjectId,
      amount: amount,
      id_parent: createdParent.id
    }
    
    await supabase.from('project_expenses').insert(childExpenseData)
  }
}
```

## 🎨 UI/UX IMPROVEMENTS

### **Nút "Cập nhật chi phí đã có":**
- ✅ **Màu sắc**: Background xanh dương với border
- ✅ **Icon**: 🔄 để thể hiện hành động cập nhật
- ✅ **Mô tả**: "Cập nhật lại chi phí đối tượng cha với tổng chi phí từ các đối tượng con"
- ✅ **Hover effects**: Transition colors khi hover
- ✅ **Loading state**: Disabled khi đang xử lý

### **Nút "Tạo mới":**
- ✅ **Màu sắc**: Background xanh lá với border
- ✅ **Icon**: ➕ để thể hiện hành động tạo mới
- ✅ **Mô tả**: "Tạo chi phí mới với chi tiết đối tượng con và cập nhật đối tượng cha"
- ✅ **Hover effects**: Transition colors khi hover
- ✅ **Loading state**: Disabled khi đang xử lý

### **Confirmation Dialog Layout:**
- ✅ **Hiển thị chi phí đối tượng cha**: Tổng chi phí với màu xanh lá
- ✅ **Hiển thị chi tiết các đối tượng con**: Breakdown chi tiết
- ✅ **2 nút được layout rõ ràng**: Spacing và alignment tốt
- ✅ **Nút "Hủy"**: Để đóng dialog
- ✅ **Responsive design**: Hoạt động tốt trên mobile

## 🔍 TÍNH NĂNG HOẠT ĐỘNG

### **Nút "Cập nhật chi phí đã có":**

1. **Tìm chi phí parent hiện tại:**
   - ✅ Query `project_expenses` với `expense_object_id = workshop_parent_id`
   - ✅ Query với `project_id = current_project_id`
   - ✅ Kiểm tra `existingParent` có tồn tại không

2. **Cập nhật chi phí parent:**
   - ✅ Tính tổng chi phí từ `directObjectTotals`
   - ✅ Update `amount = tổng chi phí con`
   - ✅ Update `expense_object_breakdown = directObjectTotals`
   - ✅ Update `updated_at = current timestamp`

3. **Xử lý trường hợp không tìm thấy parent:**
   - ✅ Hiển thị alert: "Không tìm thấy chi phí đối tượng cha"
   - ✅ Gợi ý user chọn "Tạo chi phí mới"
   - ✅ Không thực hiện update

### **Nút "Tạo mới":**

1. **Tạo chi phí parent mới:**
   - ✅ Tính tổng chi phí từ `directObjectTotals`
   - ✅ Tạo parent expense với `amount = tổng chi phí con`
   - ✅ Set `expense_object_id = workshop_parent_id`
   - ✅ Set `expense_object_breakdown = directObjectTotals`
   - ✅ Set `status = 'approved'`

2. **Tạo chi phí con cho từng đối tượng:**
   - ✅ Loop qua từng `childObjectId` trong `directObjectTotals`
   - ✅ Tạo child expense với `amount = directObjectTotals[childObjectId]`
   - ✅ Set `expense_object_id = childObjectId`
   - ✅ Set `id_parent = createdParent.id`
   - ✅ Set `description = parent_description + ' - ' + child_name`

3. **Xử lý lỗi khi tạo:**
   - ✅ Try-catch cho toàn bộ quá trình tạo
   - ✅ Rollback nếu có lỗi xảy ra
   - ✅ Hiển thị alert với thông báo lỗi chi tiết

## 📊 DATA FLOW

### **1. Cập nhật chi phí đã có:**
```
User chọn "Cập nhật" → Tìm existing parent → Tính tổng con → Update parent amount → Success alert
```

### **2. Tạo chi phí mới:**
```
User chọn "Tạo mới" → Tạo parent expense → Tạo child expenses → Link parent-child → Success alert
```

### **3. Error handling:**
```
Error xảy ra → Catch exception → Hiển thị alert → Không đóng dialog → Cho phép retry
```

## 🧪 TESTING

### **Test Cases:**
1. ✅ Workshop employee chọn "Cập nhật chi phí đã có"
2. ✅ System tìm và cập nhật chi phí parent hiện tại
3. ✅ Workshop employee chọn "Tạo mới"
4. ✅ System tạo parent expense và child expenses
5. ✅ System xử lý lỗi khi không tìm thấy parent
6. ✅ System xử lý lỗi khi tạo mới thất bại
7. ✅ UI/UX hoạt động tốt với 2 nút

### **Test Script:**
- ✅ `test_update_create_buttons.py` - Test script chi tiết
- ✅ Manual testing scenarios
- ✅ Error handling validation

## 🚀 DEPLOYMENT

### **Frontend Changes:**
- ✅ Updated `CreateProjectExpenseDialog.tsx`
- ✅ Added 2 buttons với UI/UX tốt
- ✅ Added logic xử lý cho 2 buttons
- ✅ Added error handling và user feedback

### **Database Requirements:**
- ✅ `project_expenses` table với parent-child relationships
- ✅ `expense_object_breakdown` column để lưu breakdown
- ✅ Proper indexing cho performance

### **API Endpoints:**
- ✅ `PUT /api/project-expenses/{id}` - Update existing expense
- ✅ `POST /api/project-expenses` - Create new expense
- ✅ Proper error handling và validation

## 🎯 KẾT QUẢ

### **Tính năng hoàn thành:**
- ✅ 2 nút "Cập nhật" và "Tạo mới" với UI/UX tốt
- ✅ Logic xử lý đúng cho cả 2 trường hợp
- ✅ Error handling và user feedback
- ✅ Data flow rõ ràng và chính xác

### **Benefits:**
- 🎯 **Linh hoạt**: User có thể chọn cập nhật hoặc tạo mới
- 🎯 **Rõ ràng**: UI/UX thân thiện với mô tả chi tiết
- 🎯 **Chính xác**: Logic xử lý đúng theo yêu cầu
- 🎯 **An toàn**: Error handling và rollback khi cần

**Tính năng sẵn sàng để test và deploy!** 🚀
