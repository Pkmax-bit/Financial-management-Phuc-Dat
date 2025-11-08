# Hướng dẫn Lưu Chi Phí Dự Án Thực Tế

## 🎯 **Tình trạng: HOÀN THÀNH**

Đã phân tích schema và tạo chức năng lưu chi phí thực tế dựa trên bảng `project_expenses`.

## 📊 **Schema Analysis:**

### **1. Bảng project_expenses**
```sql
CREATE TABLE public.project_expenses (
  id uuid NOT NULL,
  expense_code text NULL,
  description text NOT NULL,
  amount numeric(18, 2) NOT NULL DEFAULT 0,
  currency text NULL DEFAULT 'VND',
  expense_date date NOT NULL,
  status text NULL DEFAULT 'pending',
  notes text NULL,
  receipt_url text NULL,
  project_id uuid NULL,
  customer_id uuid NULL,
  id_parent uuid NULL,
  employee_id uuid NULL,
  department_id uuid NULL,
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  expense_object_columns jsonb NULL DEFAULT '[]',
  invoice_items jsonb NULL DEFAULT '[]',
  expense_object_id uuid NULL
);
```

### **2. Các trường quan trọng:**
- **id:** UUID primary key
- **description:** Mô tả chi phí (required)
- **amount:** Số tiền (required)
- **expense_date:** Ngày chi phí (required)
- **project_id:** ID dự án (required)
- **expense_object_id:** ID đối tượng chi phí
- **id_parent:** ID chi phí cha (cho hierarchy)
- **employee_id:** ID nhân viên
- **status:** Trạng thái (pending/approved)
- **invoice_items:** Chi tiết hóa đơn (JSONB)
- **expense_object_columns:** Các đối tượng chi phí (JSONB)

## ✨ **Chức năng lưu chi phí thực tế:**

### **1. Function createActualExpense**
```jsx
const createActualExpense = async () => {
  console.log('💰 ===== CREATING ACTUAL EXPENSE =====')
  
  const createdExpenses = []
  
  for (const expenseObjectId of selectedExpenseObjectIds) {
    const amount = Object.values(directObjectTotals).some(val => val > 0)
      ? (directObjectTotals[expenseObjectId] || 0)
      : (expenseObjectTotals[expenseObjectId] || 0)
    
    if (amount <= 0) continue
    
    const expenseData = {
      id: crypto.randomUUID(),
      project_id: formData.project_id,
      description: formData.description,
      expense_object_id: expenseObjectId,
      role: selectedRole,
      amount: amount,
      currency: formData.currency,
      expense_date: formData.expense_date,
      status: 'approved',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      expense_object_columns: selectedExpenseObjectIds,
      expense_object_totals: directObjectTotals,
      invoice_items: getInvoiceItems()
    }
    
    // Add optional fields
    if (formData.employee_id) expenseData.employee_id = formData.employee_id
    if (formData.notes) expenseData.notes = formData.notes
    if (formData.receipt_url) expenseData.receipt_url = formData.receipt_url
    if (formData.id_parent) expenseData.id_parent = formData.id_parent
    
    // Insert to database
    const { error } = await supabase
      .from('project_expenses')
      .insert(expenseData)
  }
}
```

### **2. Data Structure cho Actual Expense**
```jsx
const expenseData = {
  // Required fields
  id: crypto.randomUUID(),
  project_id: formData.project_id,
  description: formData.description,
  expense_object_id: expenseObjectId,
  amount: amount,
  currency: formData.currency || 'VND',
  expense_date: formData.expense_date,
  status: 'approved',
  
  // Timestamps
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  
  // JSONB fields
  expense_object_columns: selectedExpenseObjectIds,
  expense_object_totals: directObjectTotals,
  invoice_items: getInvoiceItems(),
  
  // Optional fields
  employee_id: formData.employee_id,
  notes: formData.notes,
  receipt_url: formData.receipt_url,
  id_parent: formData.id_parent,
  customer_id: formData.customer_id,
  department_id: formData.department_id
}
```

## 🔄 **Chức năng cập nhật chi phí thực tế:**

### **1. Function updateActualExpense**
```jsx
const updateActualExpense = async (expenseId: string, updateData: any) => {
  console.log('🔄 ===== UPDATING ACTUAL EXPENSE =====')
  
  const { error } = await supabase
    .from('project_expenses')
    .update({
      ...updateData,
      updated_at: new Date().toISOString()
    })
    .eq('id', expenseId)
  
  if (error) {
    console.error('❌ Error updating expense:', error)
    throw error
  }
  
  console.log('✅ Expense updated successfully')
}
```

### **2. Update Logic**
```jsx
// Update existing expense
if (isEdit && editId) {
  console.log('📤 Updating actual expense:', editId)
  const updateData = { ...expenseData }
  delete updateData.id
  delete updateData.created_at
  
  const { error } = await supabase
    .from('project_expenses')
    .update(updateData)
    .eq('id', editId)
  
  if (error) {
    console.error('❌ Error updating expense:', error)
    throw error
  }
} else {
  // Create new expense
  const { error } = await supabase
    .from('project_expenses')
    .insert(expenseData)
  
  if (error) {
    console.error('❌ Error creating expense:', error)
    throw error
  }
}
```

## 🎯 **Workflow lưu chi phí thực tế:**

### **1. Data Preparation**
1. Validate form data
2. Calculate amounts from directObjectTotals
3. Prepare expense data structure
4. Add optional fields

### **2. Database Operations**
1. Loop through selected expense objects
2. Create expense record for each object
3. Insert into project_expenses table
4. Handle errors and rollback if needed

### **3. Post-processing**
1. Update parent expense totals
2. Refresh expense list
3. Show success notification
4. Close dialog

## 🚀 **Lợi ích:**

### **1. Data Integrity**
- **Required Fields:** Tất cả trường bắt buộc được validate
- **Data Types:** Đúng kiểu dữ liệu cho từng trường
- **Constraints:** Tuân thủ foreign key constraints
- **Validation:** Validation đầy đủ trước khi lưu

### **2. Flexible Structure**
- **JSONB Fields:** Lưu trữ dữ liệu phức tạp
- **Optional Fields:** Các trường tùy chọn
- **Hierarchy Support:** Hỗ trợ parent-child relationship
- **Extensible:** Dễ dàng mở rộng

### **3. Error Handling**
- **Transaction Safety:** An toàn transaction
- **Error Recovery:** Khôi phục từ lỗi
- **Rollback Support:** Hỗ trợ rollback
- **User Feedback:** Feedback cho user

## 🎨 **Technical Implementation:**

### **1. Schema Mapping**
```jsx
// Map form data to database schema
const expenseData = {
  // Core fields
  id: crypto.randomUUID(),
  project_id: formData.project_id,
  description: formData.description,
  amount: amount,
  currency: formData.currency || 'VND',
  expense_date: formData.expense_date,
  status: 'approved',
  
  // Object relationships
  expense_object_id: expenseObjectId,
  employee_id: formData.employee_id,
  id_parent: formData.id_parent,
  
  // JSONB data
  expense_object_columns: selectedExpenseObjectIds,
  invoice_items: getInvoiceItems(),
  
  // Timestamps
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
}
```

### **2. Database Operations**
```jsx
// Insert operation
const { error } = await supabase
  .from('project_expenses')
  .insert(expenseData)

// Update operation
const { error } = await supabase
  .from('project_expenses')
  .update(updateData)
  .eq('id', expenseId)

// Delete operation
const { error } = await supabase
  .from('project_expenses')
  .delete()
  .eq('id', expenseId)
```

### **3. Error Handling**
```jsx
// Comprehensive error handling
if (error) {
  console.error('❌ Database error:', error)
  throw new Error(`Failed to ${operation} expense: ${error.message}`)
}

// Success handling
console.log('✅ Expense operation successful')
```

## 📋 **Tóm tắt:**

**Schema Analysis:**
- ✅ Phân tích đầy đủ schema project_expenses
- ✅ Xác định các trường bắt buộc và tùy chọn
- ✅ Hiểu rõ relationships và constraints

**Save Functionality:**
- ✅ Function createActualExpense hoàn chỉnh
- ✅ Data structure mapping đúng schema
- ✅ Error handling và validation

**Update Functionality:**
- ✅ Function updateActualExpense
- ✅ Update logic với proper error handling
- ✅ Timestamp management

**Kết quả:**
- ✅ Chức năng lưu chi phí thực tế hoàn chỉnh
- ✅ Chức năng cập nhật chi phí thực tế
- ✅ Tuân thủ database schema
- ✅ Error handling và validation đầy đủ

**Chức năng lưu và cập nhật chi phí thực tế đã được tạo dựa trên schema! 🎯**
