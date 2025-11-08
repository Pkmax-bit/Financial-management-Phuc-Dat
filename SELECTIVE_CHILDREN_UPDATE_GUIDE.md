# Hướng dẫn Logic Cập nhật Chọn lọc Children

## 🎯 **Tình trạng: HOÀN THÀNH**

Đã implement logic cập nhật chỉ thay thế đối tượng cha tương ứng mới, còn các đối tượng khác không liên quan giữ nguyên.

## ✨ **Logic Cập nhật Chọn lọc:**

### **1. Kiểm tra Thay đổi Đối tượng Cha**
```typescript
// Chỉ xóa children của đối tượng cha cũ (nếu có thay đổi)
const oldParentObjectId = selectedExpenseToUpdate.expense_object_id
const newParentObjectId = dataToUse.workshopParentObject?.id

if (oldParentObjectId !== newParentObjectId) {
  console.log('🔄 Parent object changed, updating children for new parent object')
  // Thực hiện cập nhật children
} else {
  console.log('🔄 Parent object unchanged, keeping existing children')
}
```

**Logic:**
- So sánh đối tượng cha cũ với đối tượng cha mới
- Chỉ cập nhật children nếu có thay đổi đối tượng cha
- Giữ nguyên children nếu đối tượng cha không thay đổi

### **2. Xóa Children Cũ của Đối tượng Cha Cũ**
```typescript
// Xóa children cũ của đối tượng cha cũ
const { error: deleteOldChildrenError } = await supabase
  .from('project_expenses')
  .delete()
  .eq('id_parent', selectedExpenseToUpdate.id)
  .eq('expense_object_id', oldParentObjectId)

if (deleteOldChildrenError) {
  console.error('❌ Error deleting old children of old parent object:', deleteOldChildrenError)
  return false
}

console.log('✅ Old children of old parent object deleted successfully')
```

**Chức năng:**
- Chỉ xóa children có `expense_object_id` trùng với đối tượng cha cũ
- Giữ nguyên children của các đối tượng cha khác
- Đảm bảo data integrity

### **3. Tạo Children Mới cho Đối tượng Cha Mới**
```typescript
// Tạo children mới cho đối tượng cha mới
const childExpenses = Object.entries(dataToUse.directObjectTotals || {}).map(([objectId, amount]) => ({
  id: crypto.randomUUID(),
  project_id: dataToUse.formData.project_id,
  description: `${dataToUse.formData.description} - Child`,
  expense_object_id: objectId,
  amount: Number(amount),
  expense_date: dataToUse.formData.expense_date,
  status: 'pending',
  employee_id: dataToUse.formData.employee_id,
  id_parent: selectedExpenseToUpdate.id,
  expense_object_columns: [objectId],
  invoice_items: dataToUse.invoiceItems
}))

if (childExpenses.length > 0) {
  const { error: childError } = await supabase
    .from('project_expenses')
    .insert(childExpenses)
  
  if (childError) {
    console.error('❌ Error creating new children:', childError)
    return false
  }
  
  console.log('✅ New children created successfully')
}
```

**Chức năng:**
- Tạo children mới cho đối tượng cha mới
- Chỉ tạo children cho đối tượng cha đã thay đổi
- Không ảnh hưởng đến children của đối tượng cha khác

## 📱 **Workflow:**

### **1. Direct Update (Fallback)**
1. **Kiểm tra thay đổi:** So sánh `oldParentObjectId` vs `newParentObjectId`
2. **Nếu có thay đổi:** Xóa children cũ của đối tượng cha cũ → Tạo children mới cho đối tượng cha mới
3. **Nếu không thay đổi:** Giữ nguyên tất cả children hiện tại
4. **Kết quả:** Chỉ cập nhật đối tượng cha tương ứng, giữ nguyên các đối tượng khác

### **2. Target Parent Replacement**
1. **Kiểm tra thay đổi:** So sánh `oldTargetParentObjectId` vs `newTargetParentObjectId`
2. **Nếu có thay đổi:** Xóa children cũ của đối tượng cha cũ trong target parent → Tạo children mới cho đối tượng cha mới
3. **Nếu không thay đổi:** Giữ nguyên children của target parent
4. **Kết quả:** Chỉ cập nhật đối tượng cha tương ứng trong target parent

## 🚀 **Lợi ích:**

### **1. Selective Update**
- **Precise Targeting:** Chỉ cập nhật đối tượng cha tương ứng
- **Preserve Others:** Giữ nguyên các đối tượng cha khác
- **Data Integrity:** Không ảnh hưởng đến dữ liệu không liên quan

### **2. Performance**
- **Minimal Changes:** Chỉ thay đổi những gì cần thiết
- **Efficient Queries:** Queries có điều kiện cụ thể
- **Reduced Impact:** Giảm thiểu tác động đến database

### **3. User Experience**
- **Expected Behavior:** Cập nhật đúng những gì user mong đợi
- **No Data Loss:** Không mất dữ liệu không liên quan
- **Consistent State:** Trạng thái database nhất quán

## 🔍 **Technical Implementation:**

### **1. Conditional Logic**
```typescript
if (oldParentObjectId !== newParentObjectId) {
  // Chỉ cập nhật khi có thay đổi đối tượng cha
  // Xóa children cũ + Tạo children mới
} else {
  // Giữ nguyên khi không có thay đổi
  // Không thực hiện thao tác nào
}
```

### **2. Selective Deletion**
```typescript
.eq('id_parent', selectedExpenseToUpdate.id)
.eq('expense_object_id', oldParentObjectId)
```

**Chức năng:**
- Chỉ xóa children của parent cụ thể
- Chỉ xóa children của đối tượng cha cụ thể
- Giữ nguyên children của đối tượng cha khác

### **3. Targeted Creation**
```typescript
const childExpenses = Object.entries(dataToUse.directObjectTotals || {}).map(([objectId, amount]) => ({
  // Chỉ tạo children cho đối tượng cha mới
  expense_object_id: objectId,
  id_parent: selectedExpenseToUpdate.id,
  // ... other fields
}))
```

**Chức năng:**
- Chỉ tạo children cho đối tượng cha mới
- Không ảnh hưởng đến children hiện tại của đối tượng cha khác

## 📋 **Scenarios:**

### **1. Scenario 1: Không thay đổi đối tượng cha**
- **Input:** Cùng đối tượng cha
- **Action:** Giữ nguyên tất cả children
- **Result:** Không có thay đổi nào

### **2. Scenario 2: Thay đổi đối tượng cha**
- **Input:** Đối tượng cha khác
- **Action:** Xóa children cũ + Tạo children mới
- **Result:** Chỉ cập nhật đối tượng cha tương ứng

### **3. Scenario 3: Multiple Parent Objects**
- **Input:** Có nhiều đối tượng cha khác nhau
- **Action:** Chỉ cập nhật đối tượng cha đã thay đổi
- **Result:** Giữ nguyên đối tượng cha khác

## 📋 **Tóm tắt:**

**Logic mới:**
- ✅ Kiểm tra thay đổi đối tượng cha trước khi cập nhật
- ✅ Chỉ xóa children của đối tượng cha cũ
- ✅ Chỉ tạo children mới cho đối tượng cha mới
- ✅ Giữ nguyên children của đối tượng cha khác
- ✅ Conditional logic để tối ưu performance

**Kết quả:**
- ✅ Chỉ thay thế đối tượng cha tương ứng mới
- ✅ Các đối tượng khác không liên quan giữ nguyên
- ✅ Data integrity được duy trì
- ✅ Performance được tối ưu

**Logic cập nhật chọn lọc children đã được implement hoàn chỉnh! 🎯**
