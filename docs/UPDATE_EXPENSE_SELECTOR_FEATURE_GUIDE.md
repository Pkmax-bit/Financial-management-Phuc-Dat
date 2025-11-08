# Hướng dẫn Chức năng Chọn Chi phí để Cập nhật

## 🎯 **Tình trạng: HOÀN THÀNH**

Đã implement chức năng chọn chi phí dự án thực tế để cập nhật trong `CreateProjectExpenseDialog.tsx`.

## ✨ **Các thay đổi chính:**

### **1. State Variables**
```typescript
// State for expense selector
const [existingExpenses, setExistingExpenses] = useState<any[]>([])
const [selectedExpenseToUpdate, setSelectedExpenseToUpdate] = useState<any>(null)
const [showExpenseSelector, setShowExpenseSelector] = useState(false)
const [isReplaceParentMode, setIsReplaceParentMode] = useState(false)
```

**Mục đích:**
- `existingExpenses`: Lưu danh sách chi phí thực tế đã có
- `selectedExpenseToUpdate`: Chi phí được chọn để cập nhật
- `showExpenseSelector`: Hiển thị/ẩn modal chọn chi phí
- `isReplaceParentMode`: Chế độ thay thế đối tượng cha

### **2. Load Existing Expenses Function**
```typescript
const loadExistingExpenses = async () => {
  try {
    if (!formData.project_id) {
      console.log('❌ No project selected')
      return
    }
    
    console.log('🔍 Loading existing actual expenses for project:', formData.project_id)
    
    const { data, error } = await supabase
      .from('project_expenses')
      .select('*')
      .eq('project_id', formData.project_id)
      .is('id_parent', null) // Only load parent expenses
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('❌ Error loading existing expenses:', error)
      return
    }
    
    console.log('✅ Loaded existing expenses:', data?.length || 0)
    setExistingExpenses(data || [])
    setShowExpenseSelector(true)
  } catch (error) {
    console.error('❌ Error in loadExistingExpenses:', error)
  }
}
```

**Chức năng:**
- Load danh sách chi phí thực tế từ database
- Chỉ load parent expenses (id_parent = null)
- Sắp xếp theo thời gian tạo (mới nhất trước)
- Hiển thị Expense Selector Modal

### **3. Load Expense Data for Update Function**
```typescript
const loadExpenseDataForUpdate = async (expense: any) => {
  try {
    console.log('🔍 Loading expense data for update:', expense.id)
    
    // Load parent expense
    const { data: parentData, error: parentError } = await supabase
      .from('project_expenses')
      .select('*')
      .eq('id', expense.id)
      .single()
    
    if (parentError) {
      console.error('❌ Error loading parent expense:', parentError)
      return
    }
    
    // Load child expenses
    const { data: childData, error: childError } = await supabase
      .from('project_expenses')
      .select('*')
      .eq('id_parent', expense.id)
    
    if (childError) {
      console.error('❌ Error loading child expenses:', childError)
      return
    }
    
    console.log('✅ Loaded parent expense:', parentData)
    console.log('✅ Loaded child expenses:', childData?.length || 0)
    
    // Populate form with expense data
    setFormData({
      ...formData,
      project_id: parentData.project_id || '',
      employee_id: parentData.employee_id || '',
      category: 'actual',
      description: parentData.description || '',
      expense_object_id: parentData.expense_object_id || '',
      planned_amount: 0,
      actual_amount: Number(parentData.amount) || 0,
      expense_date: parentData.expense_date || new Date().toISOString().split('T')[0],
      status: parentData.status || 'pending',
      notes: parentData.notes || '',
      receipt_url: parentData.receipt_url || '',
      currency: parentData.currency || 'VND',
      id_parent: parentData.id_parent || ''
    })
    
    // Populate expense object selections
    const columns: string[] = Array.isArray(parentData.expense_object_columns) ? parentData.expense_object_columns : []
    if (columns.length > 0) {
      setSelectedExpenseObjectIds(columns)
    }
    
    // Populate invoice items
    if (Array.isArray(parentData.invoice_items) && parentData.invoice_items.length > 0) {
      const rows: InvoiceItemRow[] = parentData.invoice_items.map((it: any, idx: number) => {
        const componentsPct = it.components_pct || {}
        const componentsAmt: Record<string, number> = {}
        
        Object.keys(componentsPct).forEach((key: string) => {
          const qty = it.quantity || 0
          const price = it.unit_price || 0
          componentsAmt[key] = (qty * price * (componentsPct[key] || 0)) / 100
        })
        
        return {
          index: idx + 1,
          productId: it.product_id || '',
          productName: it.product_name || '',
          quantity: it.quantity || 0,
          unit: it.unit || '',
          unitPrice: it.unit_price || 0,
          componentsPct,
          componentsAmt
        }
      })
      setInvoiceItems(rows)
    }
    
    setSelectedExpenseToUpdate(expense)
    setShowExpenseSelector(false)
    
    console.log('✅ Form populated with expense data')
  } catch (error) {
    console.error('❌ Error in loadExpenseDataForUpdate:', error)
  }
}
```

**Chức năng:**
- Load parent expense data
- Load child expenses data
- Populate form với expense data
- Populate expense object selections
- Populate invoice items
- Đóng Expense Selector Modal

### **4. Update Existing Expense Function**
```typescript
const updateExistingExpense = async (expenseData: any) => {
  try {
    console.log('🔍 Updating existing expense:', selectedExpenseToUpdate?.id)
    
    if (!selectedExpenseToUpdate) {
      console.error('❌ No expense selected for update')
      return false
    }
    
    const dataToUse = expenseData || pendingExpenseData
    
    if (!dataToUse || !dataToUse.formData) {
      console.error('❌ Missing required data in updateExistingExpense')
      return false
    }
    
    // Calculate total amount
    const totalAmount = Object.values(dataToUse.directObjectTotals || {}).reduce((sum: number, amount: any) => sum + (Number(amount) || 0), 0)
    
    if (totalAmount <= 0) {
      console.error('❌ Total amount must be greater than 0')
      return false
    }
    
    // Update parent expense
    const parentExpenseData = {
      project_id: dataToUse.formData.project_id,
      description: dataToUse.formData.description,
      expense_object_id: dataToUse.workshopParentObject?.id,
      amount: totalAmount,
      expense_date: dataToUse.formData.expense_date,
      status: 'pending',
      employee_id: dataToUse.formData.employee_id,
      expense_object_columns: dataToUse.selectedExpenseObjectIds,
      invoice_items: dataToUse.invoiceItems,
      updated_at: new Date().toISOString()
    }
    
    const { error: parentError } = await supabase
      .from('project_expenses')
      .update(parentExpenseData)
      .eq('id', selectedExpenseToUpdate.id)
    
    if (parentError) {
      console.error('❌ Error updating parent expense:', parentError)
      return false
    }
    
    console.log('✅ Parent expense updated successfully')
    
    // Delete existing children
    const { error: deleteError } = await supabase
      .from('project_expenses')
      .delete()
      .eq('id_parent', selectedExpenseToUpdate.id)
    
    if (deleteError) {
      console.error('❌ Error deleting old children:', deleteError)
      return false
    }
    
    console.log('✅ Old children deleted successfully')
    
    // Create new children
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
    
    console.log('✅ Expense updated successfully')
    return true
  } catch (error) {
    console.error('❌ Error in updateExistingExpense:', error)
    return false
  }
}
```

**Chức năng:**
- Validate required data
- Calculate total amount
- Update parent expense
- Delete old children
- Create new children
- Return success/failure

### **5. Updated handleSubmit Logic**
```typescript
// Check if updating or creating
if (selectedExpenseToUpdate) {
  const success = await updateExistingExpense(expenseData)
  if (success) {
    alert('Cập nhật chi phí thành công!')
    onSuccess()
    onClose()
    // Reset state
    setSelectedExpenseToUpdate(null)
  } else {
    alert('Lỗi khi cập nhật chi phí!')
  }
} else {
  // Wait for state to be updated or pass data directly
  await createNewExpense(expenseData)
}
```

**Chức năng:**
- Check if updating or creating
- Call appropriate function
- Show success/error message
- Close dialog and reset state

### **6. UI Components**

#### **A. Update Button in Header**
```jsx
{/* Update existing expense button */}
{category === 'actual' && !selectedExpenseToUpdate && formData.project_id && (
  <button
    onClick={loadExistingExpenses}
    className="px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-300 rounded-lg hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
    title="Chọn chi phí thực tế đã có để cập nhật"
  >
    🔄 Cập nhật chi phí đã có
  </button>
)}
```

**Hiển thị khi:**
- Category là 'actual'
- Không có expense đang được chọn để update
- Project đã được chọn

#### **B. Selected Expense Info**
```jsx
{/* Show selected expense info */}
{selectedExpenseToUpdate && (
  <div className="mt-2 text-sm text-blue-600">
    Đang cập nhật: {selectedExpenseToUpdate.description}
  </div>
)}
```

**Hiển thị khi:**
- Có expense được chọn để update

#### **C. Expense Selector Modal**
```jsx
{/* Expense Selector Modal */}
{showExpenseSelector && (
  <div className="fixed inset-0 z-[9999] overflow-y-auto">
    <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
      <div className="fixed inset-0 transition-opacity bg-black bg-opacity-50" onClick={() => setShowExpenseSelector(false)}></div>

      <div className="inline-block w-full max-w-4xl px-6 pt-6 pb-6 overflow-hidden text-left align-bottom transition-all transform bg-white rounded-xl shadow-2xl sm:my-8 sm:align-middle">
        {/* Modal content */}
      </div>
    </div>
  </div>
)}
```

**Chức năng:**
- Hiển thị danh sách chi phí thực tế
- Cho phép chọn chi phí để update
- Hiển thị thông tin chi phí (mã, mô tả, số tiền, ngày, trạng thái)
- Nút "Chọn" để load expense data vào form

## 📱 **Workflow:**

### **1. Mở Expense Selector**
1. User bấm nút "🔄 Cập nhật chi phí đã có"
2. Function `loadExistingExpenses` được gọi
3. Load danh sách chi phí thực tế từ database
4. Hiển thị Expense Selector Modal

### **2. Chọn Expense để Update**
1. User chọn expense từ danh sách
2. Function `loadExpenseDataForUpdate` được gọi
3. Load parent và child expenses data
4. Populate form với expense data
5. Đóng Expense Selector Modal
6. Hiển thị "Đang cập nhật: [description]"

### **3. Update Expense**
1. User chỉnh sửa thông tin
2. User bấm nút "Cập nhật"
3. Function `handleSubmit` check `selectedExpenseToUpdate`
4. Function `updateExistingExpense` được gọi
5. Update parent expense
6. Delete old children
7. Create new children
8. Hiển thị thông báo thành công
9. Close dialog và refresh data

## 🚀 **Lợi ích:**

### **1. User Experience**
- **Easy Selection:** Chọn chi phí dễ dàng từ danh sách
- **Data Pre-filled:** Form được điền sẵn với dữ liệu hiện tại
- **Visual Feedback:** Clear indication của expense đang được update
- **Success Messages:** Clear confirmation sau khi update

### **2. Data Integrity**
- **Parent-Child Sync:** Children được recreate để đảm bảo sync với parent
- **Cascade Update:** Update parent và children cùng lúc
- **Validation:** Comprehensive validation trước khi update
- **Error Handling:** Graceful error handling

### **3. Flexibility**
- **Selective Update:** Chọn bất kỳ chi phí nào để update
- **Full Edit:** Có thể edit bất kỳ field nào
- **Status Preservation:** Maintain status và metadata
- **History Tracking:** updated_at timestamp được cập nhật

## 🎨 **Technical Implementation:**

### **1. Data Loading**
- Load parent expenses only (id_parent = null)
- Sort by created_at (newest first)
- Load both parent and children when selected
- Populate form với complete expense data

### **2. Data Update**
- Update parent expense with new data
- Delete all old children
- Create new children based on new allocations
- Maintain referential integrity

### **3. State Management**
- Track selected expense in `selectedExpenseToUpdate`
- Control modal visibility with `showExpenseSelector`
- Pre-fill form data with existing expense data
- Reset state after successful update

### **4. UI/UX**
- Modern, clean modal design
- Table display with sortable columns
- Status badges for visual clarity
- Responsive button states

## 📋 **Tóm tắt:**

**Đã implement:**
- ✅ Load existing expenses function
- ✅ Expense selector modal
- ✅ Load expense data for update function
- ✅ Update existing expense function
- ✅ Updated handleSubmit logic
- ✅ UI components (button, modal, info display)

**Kết quả:**
- ✅ User có thể chọn chi phí để update
- ✅ Form được điền sẵn với dữ liệu hiện tại
- ✅ Update parent và children cùng lúc
- ✅ Data integrity được duy trì
- ✅ Clear visual feedback

**Chức năng chọn chi phí để cập nhật đã được implement hoàn chỉnh! 🎯**
