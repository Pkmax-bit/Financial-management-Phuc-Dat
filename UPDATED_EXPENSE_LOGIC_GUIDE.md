# Hướng dẫn Logic Cập nhật Chi phí Thực tế - Phiên bản Mới

## 🎯 **Tình trạng: HOÀN THÀNH**

Đã implement logic cập nhật chi phí thực tế theo yêu cầu mới với điều kiện và bước thực hiện cụ thể.

## ✨ **Logic Cập nhật Mới:**

### **1. Điều kiện 1: Đã chọn chi phí thực tế của dự án**
```typescript
// Điều kiện 1: Đã chọn chi phí thực tế của dự án
if (!selectedExpenseToUpdate.id || !dataToUse.formData.project_id) {
  console.error('❌ Missing selected expense or project ID')
  return false
}

console.log('✅ Điều kiện 1: Đã chọn chi phí thực tế của dự án')
```

**Kiểm tra:**
- `selectedExpenseToUpdate.id` - Expense đã được chọn để cập nhật
- `dataToUse.formData.project_id` - Dự án đã được chọn
- Cả hai điều kiện phải thỏa mãn

### **2. Điều kiện 2: Trong dự án có chi phí đối tượng cha trùng**
```typescript
// Điều kiện 2: Trong dự án đó có chi phí đối tượng cha trùng với đối tượng cha cần cập nhật
const newParentObjectId = dataToUse.workshopParentObject?.id
if (!newParentObjectId) {
  console.error('❌ Missing new parent object ID')
  return false
}

console.log('🔍 Checking for existing parent object in project:', newParentObjectId)

// Tìm chi phí đối tượng cha trùng trong dự án
const { data: existingParentExpenses, error: searchError } = await supabase
  .from('project_expenses')
  .select('*')
  .eq('project_id', dataToUse.formData.project_id)
  .eq('expense_object_id', newParentObjectId)
  .is('id_parent', null) // Chỉ tìm parent expenses
  .neq('id', selectedExpenseToUpdate.id) // Loại trừ expense đang update

if (searchError) {
  console.error('❌ Error searching for existing parent expenses:', searchError)
  return false
}

console.log('📊 Found existing parent expenses:', existingParentExpenses?.length || 0)

if (!existingParentExpenses || existingParentExpenses.length === 0) {
  console.log('❌ Không tìm thấy chi phí đối tượng cha trùng trong dự án')
  console.log('🔄 Tạo chi phí mới thay vì cập nhật')
  
  // Fallback: Tạo chi phí mới nếu không tìm thấy parent trùng
  return await createNewExpense(expenseData)
}

console.log('✅ Điều kiện 2: Tìm thấy chi phí đối tượng cha trùng trong dự án')
```

**Kiểm tra:**
- Tìm trong database chi phí có cùng `expense_object_id` (đối tượng cha)
- Trong cùng dự án (`project_id`)
- Là parent expense (`id_parent = null`)
- Không phải expense đang update (`neq('id', selectedExpenseToUpdate.id)`)
- Nếu không tìm thấy → Fallback tạo chi phí mới

### **3. Bước thực hiện: Thay thế chi phí đối tượng cha**

#### **A. Xác định Target Parent Expense**
```typescript
// Bước thực hiện: Thay thế chi phí đối tượng cha mới vào đối tượng cha cũ
const targetParentExpense = existingParentExpenses[0] // Lấy parent expense đầu tiên
console.log('🎯 Target parent expense for replacement:', targetParentExpense.id)
```

#### **B. Cập nhật Target Parent Expense**
```typescript
// Cập nhật target parent expense với thông tin mới
const updatedParentData = {
  description: dataToUse.formData.description,
  amount: totalAmount,
  expense_date: dataToUse.formData.expense_date,
  status: 'pending',
  employee_id: dataToUse.formData.employee_id,
  expense_object_columns: dataToUse.selectedExpenseObjectIds,
  invoice_items: dataToUse.invoiceItems,
  updated_at: new Date().toISOString()
}

console.log('🔄 Updating target parent expense:', targetParentExpense.id)

const { error: updateParentError } = await supabase
  .from('project_expenses')
  .update(updatedParentData)
  .eq('id', targetParentExpense.id)

if (updateParentError) {
  console.error('❌ Error updating target parent expense:', updateParentError)
  return false
}

console.log('✅ Target parent expense updated successfully')
```

#### **C. Xóa Children Cũ của Target Parent**
```typescript
// Xóa children cũ của target parent
const { error: deleteOldChildrenError } = await supabase
  .from('project_expenses')
  .delete()
  .eq('id_parent', targetParentExpense.id)

if (deleteOldChildrenError) {
  console.error('❌ Error deleting old children of target parent:', deleteOldChildrenError)
  return false
}

console.log('✅ Old children of target parent deleted successfully')
```

#### **D. Tạo Children Mới cho Target Parent**
```typescript
// Tạo children mới cho target parent
const newChildExpenses = Object.entries(dataToUse.directObjectTotals || {}).map(([objectId, amount]) => ({
  id: crypto.randomUUID(),
  project_id: dataToUse.formData.project_id,
  description: `${dataToUse.formData.description} - Child`,
  expense_object_id: objectId,
  amount: Number(amount),
  expense_date: dataToUse.formData.expense_date,
  status: 'pending',
  employee_id: dataToUse.formData.employee_id,
  id_parent: targetParentExpense.id,
  expense_object_columns: [objectId],
  invoice_items: dataToUse.invoiceItems
}))

if (newChildExpenses.length > 0) {
  const { error: createNewChildrenError } = await supabase
    .from('project_expenses')
    .insert(newChildExpenses)
  
  if (createNewChildrenError) {
    console.error('❌ Error creating new children for target parent:', createNewChildrenError)
    return false
  }
  
  console.log('✅ New children created for target parent successfully')
}
```

#### **E. Xóa Expense Đã Chọn Ban đầu**
```typescript
// Xóa expense đã chọn ban đầu (vì đã thay thế vào target parent)
const { error: deleteSelectedExpenseError } = await supabase
  .from('project_expenses')
  .delete()
  .eq('id', selectedExpenseToUpdate.id)

if (deleteSelectedExpenseError) {
  console.error('❌ Error deleting selected expense:', deleteSelectedExpenseError)
  return false
}

console.log('✅ Selected expense deleted successfully (replaced by target parent)')

console.log('✅ Expense updated successfully - replaced parent object')
```

## 📱 **Workflow:**

### **1. Kiểm tra Điều kiện**
1. **Điều kiện 1:** Đã chọn chi phí thực tế của dự án
2. **Điều kiện 2:** Tìm chi phí đối tượng cha trùng trong dự án
3. **Fallback:** Nếu không tìm thấy → Tạo chi phí mới

### **2. Thực hiện Thay thế**
1. **Xác định Target:** Lấy parent expense đầu tiên trùng
2. **Cập nhật Target:** Update target parent với thông tin mới
3. **Xóa Children Cũ:** Delete children cũ của target parent
4. **Tạo Children Mới:** Create children mới cho target parent
5. **Xóa Expense Cũ:** Delete expense đã chọn ban đầu

### **3. Kết quả**
- Target parent expense được cập nhật với thông tin mới
- Children mới được tạo cho target parent
- Expense cũ được xóa (đã thay thế)
- Không tạo thêm chi phí mới

## 🚀 **Lợi ích:**

### **1. Logic Rõ ràng**
- **Điều kiện Cụ thể:** 2 điều kiện rõ ràng để thực hiện
- **Bước Thực hiện:** 5 bước cụ thể để thay thế
- **Fallback Logic:** Xử lý trường hợp không tìm thấy parent trùng

### **2. Data Integrity**
- **Không Duplicate:** Không tạo thêm chi phí mới
- **Thay thế Hoàn toàn:** Thay thế parent object cũ bằng mới
- **Children Sync:** Children được sync với parent mới
- **Clean Up:** Xóa expense cũ sau khi thay thế

### **3. User Experience**
- **Transparent Process:** Logging chi tiết từng bước
- **Error Handling:** Xử lý lỗi ở mỗi bước
- **Fallback Option:** Tạo chi phí mới nếu không thỏa mãn điều kiện
- **Success Feedback:** Thông báo thành công rõ ràng

## 🔍 **Debug Information:**

### **1. Điều kiện Logging**
```typescript
console.log('✅ Điều kiện 1: Đã chọn chi phí thực tế của dự án')
console.log('✅ Điều kiện 2: Tìm thấy chi phí đối tượng cha trùng trong dự án')
```

### **2. Process Logging**
```typescript
console.log('🎯 Target parent expense for replacement:', targetParentExpense.id)
console.log('🔄 Updating target parent expense:', targetParentExpense.id)
console.log('✅ Target parent expense updated successfully')
```

### **3. Result Logging**
```typescript
console.log('✅ Expense updated successfully - replaced parent object')
```

## 📋 **Tóm tắt:**

**Logic mới:**
- ✅ 2 điều kiện rõ ràng để thực hiện cập nhật
- ✅ 5 bước cụ thể để thay thế parent object
- ✅ Fallback logic tạo chi phí mới nếu không thỏa mãn
- ✅ Không tạo thêm chi phí mới, chỉ cập nhật lại
- ✅ Comprehensive logging cho debugging

**Kết quả:**
- ✅ Thay thế chi phí đối tượng cha mới vào đối tượng cha cũ
- ✅ Cập nhật lại thông tin thay vì tạo mới
- ✅ Data integrity được duy trì
- ✅ Process rõ ràng và dễ debug

**Logic cập nhật chi phí thực tế mới đã được implement hoàn chỉnh! 🎯**
