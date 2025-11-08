# Hướng dẫn Logic Cập nhật Additive (Chỉ Thêm vào)

## 🎯 **Tình trạng: HOÀN THÀNH**

Đã implement logic cập nhật additive: chỉ thêm vào chưa có, thay thế nếu đã có, giữ nguyên các đối tượng khác.

## ✨ **Logic Cập nhật Additive:**

### **1. Kiểm tra Đối tượng Hiện tại**
```typescript
// Kiểm tra có đối tượng bên trong chi phí được chọn không
const newParentObjectId = dataToUse.workshopParentObject?.id

// Lấy danh sách children hiện tại của expense được chọn
const { data: existingChildren, error: fetchChildrenError } = await supabase
  .from('project_expenses')
  .select('*')
  .eq('id_parent', selectedExpenseToUpdate.id)

// Kiểm tra xem có children với đối tượng cha mới không
const hasExistingObject = existingChildren?.some(child => 
  child.expense_object_id === newParentObjectId
) || false
```

**Chức năng:**
- Lấy danh sách children hiện tại
- Kiểm tra xem đối tượng cha mới đã tồn tại trong children chưa
- Quyết định logic xử lý dựa trên kết quả

### **2. Trường hợp 1: Không có đối tượng (Additive)**
```typescript
if (!hasExistingObject) {
  // Trường hợp 1: Nếu không có thì thêm vào và giữ nguyên các chi phí cũ
  console.log('🔄 Case 1: Object does not exist, adding new children while keeping old ones')
  
  // Tạo children mới cho đối tượng cha mới (không xóa children cũ)
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
  
  // Insert children mới
  const { error: childError } = await supabase
    .from('project_expenses')
    .insert(childExpenses)
}
```

**Chức năng:**
- **Additive Behavior:** Chỉ thêm vào, không xóa gì
- **Preserve Existing:** Giữ nguyên tất cả children hiện tại
- **Add New:** Thêm children mới cho đối tượng cha mới

### **3. Trường hợp 2: Có đối tượng (Replacement)**
```typescript
if (hasExistingObject) {
  // Trường hợp 2: Nếu có thì chỉ thay thế đối tượng đó
  console.log('🔄 Case 2: Object exists, replacing only that object')
  
  // Xóa children cũ của đối tượng cha này
  const { error: deleteOldChildrenError } = await supabase
    .from('project_expenses')
    .delete()
    .eq('id_parent', selectedExpenseToUpdate.id)
    .eq('expense_object_id', newParentObjectId)
  
  // Tạo children mới cho đối tượng cha này
  const childExpenses = Object.entries(dataToUse.directObjectTotals || {}).map(([objectId, amount]) => ({
    // ... same structure as above
  }))
  
  // Insert children mới
  const { error: childError } = await supabase
    .from('project_expenses')
    .insert(childExpenses)
}
```

**Chức năng:**
- **Selective Replacement:** Chỉ thay thế đối tượng đã tồn tại
- **Preserve Others:** Giữ nguyên các đối tượng khác
- **Update Existing:** Cập nhật children của đối tượng cụ thể

## 📱 **Workflow:**

### **1. Direct Update (Fallback)**
1. **Fetch Children:** Lấy danh sách children hiện tại
2. **Check Existence:** Kiểm tra đối tượng cha mới đã tồn tại chưa
3. **Case 1 (Additive):** Nếu chưa có → Thêm vào, giữ nguyên cũ
4. **Case 2 (Replacement):** Nếu đã có → Thay thế, giữ nguyên khác

### **2. Target Parent Replacement**
1. **Fetch Target Children:** Lấy danh sách children của target parent
2. **Check Target Existence:** Kiểm tra đối tượng cha mới trong target parent
3. **Case 1 (Additive):** Nếu chưa có trong target → Thêm vào target
4. **Case 2 (Replacement):** Nếu đã có trong target → Thay thế trong target

## 🚀 **Lợi ích:**

### **1. Additive Behavior**
- **No Data Loss:** Không mất dữ liệu hiện tại
- **Incremental Updates:** Cập nhật tăng dần
- **Preserve History:** Giữ nguyên lịch sử chi phí

### **2. Selective Replacement**
- **Precise Updates:** Chỉ cập nhật đối tượng cần thiết
- **Maintain Others:** Giữ nguyên các đối tượng khác
- **Data Integrity:** Đảm bảo tính toàn vẹn dữ liệu

### **3. User Experience**
- **Expected Behavior:** Hành vi như user mong đợi
- **No Confusion:** Không gây nhầm lẫn
- **Consistent Logic:** Logic nhất quán

## 🔍 **Technical Implementation:**

### **1. Existence Check**
```typescript
const hasExistingObject = existingChildren?.some(child => 
  child.expense_object_id === newParentObjectId
) || false
```

**Chức năng:**
- Sử dụng `Array.some()` để kiểm tra tồn tại
- So sánh `expense_object_id` với `newParentObjectId`
- Trả về boolean để quyết định logic

### **2. Additive Logic**
```typescript
// Không xóa children cũ
// Chỉ thêm children mới
const { error: childError } = await supabase
  .from('project_expenses')
  .insert(childExpenses)
```

**Chức năng:**
- Không có DELETE operation
- Chỉ có INSERT operation
- Giữ nguyên tất cả children hiện tại

### **3. Replacement Logic**
```typescript
// Xóa children cũ của đối tượng cụ thể
.eq('id_parent', selectedExpenseToUpdate.id)
.eq('expense_object_id', newParentObjectId)

// Thêm children mới cho đối tượng cụ thể
const { error: childError } = await supabase
  .from('project_expenses')
  .insert(childExpenses)
```

**Chức năng:**
- DELETE có điều kiện cụ thể
- INSERT children mới
- Chỉ ảnh hưởng đến đối tượng cụ thể

## 📋 **Scenarios:**

### **1. Scenario 1: Đối tượng mới (Additive)**
- **Input:** Đối tượng cha mới chưa tồn tại
- **Action:** Thêm children mới, giữ nguyên children cũ
- **Result:** Tổng children tăng lên

### **2. Scenario 2: Đối tượng đã tồn tại (Replacement)**
- **Input:** Đối tượng cha mới đã tồn tại
- **Action:** Xóa children cũ của đối tượng này, thêm children mới
- **Result:** Children của đối tượng này được cập nhật

### **3. Scenario 3: Multiple Objects**
- **Input:** Có nhiều đối tượng cha khác nhau
- **Action:** Chỉ cập nhật đối tượng tương ứng
- **Result:** Các đối tượng khác không bị ảnh hưởng

## 📋 **Tóm tắt:**

**Logic mới:**
- ✅ Kiểm tra tồn tại đối tượng trước khi xử lý
- ✅ Additive behavior: Thêm vào nếu chưa có
- ✅ Replacement behavior: Thay thế nếu đã có
- ✅ Preserve others: Giữ nguyên các đối tượng khác
- ✅ Selective updates: Chỉ cập nhật đối tượng cần thiết

**Kết quả:**
- ✅ Chỉ thêm vào chưa có (không thay thế chi phí có sẵn)
- ✅ Thay thế nếu đã có đối tượng tương ứng
- ✅ Giữ nguyên các đối tượng khác
- ✅ Data integrity được duy trì
- ✅ User experience tốt hơn

**Logic cập nhật additive đã được implement hoàn chỉnh! 🎯**
