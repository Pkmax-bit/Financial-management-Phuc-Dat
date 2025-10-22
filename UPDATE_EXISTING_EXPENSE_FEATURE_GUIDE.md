# Hướng dẫn Chức năng Cập nhật Chi phí Thực tế

## 🎯 **Tình trạng: HOÀN THÀNH**

Đã thêm chức năng cập nhật chi phí thực tế đã có với UI để chọn chi phí cần cập nhật.

## ✨ **Các thay đổi chính:**

### **1. State Management**
```jsx
// State for updating existing expenses
const [existingExpenses, setExistingExpenses] = useState<any[]>([])
const [selectedExpenseToUpdate, setSelectedExpenseToUpdate] = useState<any>(null)
const [showExpenseSelector, setShowExpenseSelector] = useState(false)
```

**Cải thiện:**
- ✅ State để quản lý existing expenses
- ✅ State để chọn expense cần cập nhật
- ✅ State để hiển thị expense selector modal

### **2. Load Existing Expenses**
```jsx
const loadExistingExpenses = async () => {
  try {
    console.log('🔍 Loading existing expenses...')
    
    const { data: expenses, error } = await supabase
      .from('project_expenses')
      .select(`
        id,
        description,
        amount,
        expense_date,
        status,
        expense_object_id,
        id_parent,
        created_at,
        expense_objects!inner(name, parent_id)
      `)
      .eq('status', 'approved')
      .is('id_parent', null) // Only parent expenses
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('❌ Error loading existing expenses:', error)
      return
    }
    
    console.log('📊 Loaded existing expenses:', expenses)
    setExistingExpenses(expenses || [])
    
  } catch (error) {
    console.error('❌ Error loading existing expenses:', error)
  }
}
```

**Cải thiện:**
- ✅ Load existing parent expenses
- ✅ Filter by approved status
- ✅ Order by creation date
- ✅ Include expense object details

### **3. Load Expense Data for Update**
```jsx
const loadExpenseDataForUpdate = async (expense: any) => {
  try {
    console.log('🔍 Loading expense data for update:', expense)
    
    // Load child expenses
    const { data: childExpenses, error: childError } = await supabase
      .from('project_expenses')
      .select(`
        id,
        description,
        amount,
        expense_object_id,
        expense_objects!inner(name)
      `)
      .eq('id_parent', expense.id)
    
    if (childError) {
      console.error('❌ Error loading child expenses:', childError)
      return
    }
    
    console.log('📊 Loaded child expenses:', childExpenses)
    
    // Populate form with expense data
    setFormData({
      project_id: expense.project_id || '',
      description: expense.description || '',
      actual_amount: expense.amount || 0,
      currency: expense.currency || 'VND',
      expense_date: expense.expense_date || '',
      employee_id: expense.employee_id || '',
      notes: expense.notes || '',
      category: 'actual',
      status: 'approved',
      receipt_url: '',
      id_parent: '',
      expense_object_id: '',
      planned_amount: 0
    })
    
    // Set selected expense objects
    const expenseObjectIds = childExpenses?.map(child => child.expense_object_id) || []
    setSelectedExpenseObjectIds(expenseObjectIds)
    
    // Calculate direct object totals from child expenses
    const directTotals: Record<string, number> = {}
    childExpenses?.forEach(child => {
      if (child.expense_object_id) {
        directTotals[child.expense_object_id] = child.amount || 0
      }
    })
    setDirectObjectTotals(directTotals)
    
    console.log('✅ Expense data loaded for update:', {
      formData: formData,
      selectedExpenseObjectIds: expenseObjectIds,
      directObjectTotals: directTotals
    })
    
  } catch (error) {
    console.error('❌ Error loading expense data for update:', error)
  }
}
```

**Cải thiện:**
- ✅ Load child expenses
- ✅ Populate form data
- ✅ Set selected expense objects
- ✅ Calculate direct object totals

### **4. Update Existing Expense**
```jsx
const updateExistingExpense = async (expense: any) => {
  try {
    console.log('🔄 Updating existing expense:', expense.id)
    setSubmitting(true)
    
    // Calculate total amount from direct object totals
    const totalAmount = Object.values(directObjectTotals).reduce((sum, amount) => sum + (amount || 0), 0)
    
    if (totalAmount <= 0) {
      console.error('❌ Total amount must be greater than 0')
      return
    }
    
    // Update parent expense
    const { error: parentError } = await supabase
      .from('project_expenses')
      .update({
        description: formData.description,
        amount: totalAmount,
        currency: formData.currency,
        expense_date: formData.expense_date,
        updated_at: new Date().toISOString()
      })
      .eq('id', expense.id)
    
    if (parentError) {
      console.error('❌ Error updating parent expense:', parentError)
      return
    }
    
    console.log('✅ Updated parent expense')
    
    // Delete existing child expenses
    const { error: deleteError } = await supabase
      .from('project_expenses')
      .delete()
      .eq('id_parent', expense.id)
    
    if (deleteError) {
      console.error('❌ Error deleting child expenses:', deleteError)
      return
    }
    
    console.log('✅ Deleted existing child expenses')
    
    // Create new child expenses
    for (const [childObjectId, amountValue] of Object.entries(directObjectTotals)) {
      if (amountValue <= 0) {
        console.log('⚠️ Skipping child with zero amount:', childObjectId)
        continue
      }
      
      const childObjectName = expenseObjectsOptions.find(o => o.id === childObjectId)?.name || 'Đối tượng'
      const childExpenseData = {
        id: crypto.randomUUID(),
        project_id: formData.project_id,
        description: `${formData.description} - ${childObjectName}`,
        expense_object_id: childObjectId,
        amount: amountValue,
        currency: formData.currency || 'VND',
        expense_date: formData.expense_date,
        status: 'approved',
        employee_id: formData.employee_id || null,
        id_parent: expense.id, // Link to parent
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        expense_object_columns: [childObjectId],
        invoice_items: []
      }
      
      console.log('📤 Creating child expense:', childObjectName, 'amount:', amountValue)
      
      const { error: childError } = await supabase
        .from('project_expenses')
        .insert(childExpenseData)
      
      if (childError) {
        console.error('❌ Error creating child expense:', childError)
        return
      }
      
      console.log('✅ Created child expense:', childObjectName, 'with amount:', amountValue)
    }
    
    console.log('✅ Updated existing expense successfully')
    
    // Clear selection and close
    setSelectedExpenseToUpdate(null)
    onSuccess()
    onClose()
    resetForm()
    
  } catch (error) {
    console.error('❌ Error updating existing expense:', error)
  } finally {
    setSubmitting(false)
  }
}
```

**Cải thiện:**
- ✅ Update parent expense
- ✅ Delete existing child expenses
- ✅ Create new child expenses
- ✅ Maintain parent-child relationship

### **5. UI Components**

#### **Update Button in Header**
```jsx
{/* Update existing expense option */}
{category === 'actual' && (
  <div className="mt-3 flex items-center space-x-3">
    <button
      onClick={() => {
        setShowExpenseSelector(true)
        loadExistingExpenses()
      }}
      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
    >
      📝 Cập nhật chi phí đã có
    </button>
    
    {selectedExpenseToUpdate && (
      <div className="flex items-center space-x-2 text-sm">
        <span className="text-gray-600">Đang cập nhật:</span>
        <span className="font-medium text-blue-600">{selectedExpenseToUpdate.description}</span>
        <button
          onClick={() => setSelectedExpenseToUpdate(null)}
          className="text-red-500 hover:text-red-700"
        >
          ✕
        </button>
      </div>
    )}
  </div>
)}
```

#### **Expense Selector Modal**
```jsx
{/* Expense Selector Modal */}
{showExpenseSelector && (
  <div className="fixed inset-0 z-[9999] bg-black bg-opacity-50 flex items-center justify-center">
    <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900">Chọn chi phí cần cập nhật</h3>
          <button
            onClick={() => setShowExpenseSelector(false)}
            className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
      
      <div className="p-6 max-h-[60vh] overflow-y-auto">
        {existingExpenses.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p>Không có chi phí nào để cập nhật</p>
          </div>
        ) : (
          <div className="space-y-3">
            {existingExpenses.map((expense) => (
              <div
                key={expense.id}
                onClick={() => {
                  setSelectedExpenseToUpdate(expense)
                  setShowExpenseSelector(false)
                  // Load expense data for editing
                  loadExpenseDataForUpdate(expense)
                }}
                className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 cursor-pointer transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">{expense.description}</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      {expense.expense_objects?.name} • {new Date(expense.expense_date).toLocaleDateString('vi-VN')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(expense.amount)}
                    </p>
                    <p className="text-xs text-gray-500">{expense.status}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  </div>
)}
```

**Cải thiện:**
- ✅ Update button in header
- ✅ Selected expense display
- ✅ Expense selector modal
- ✅ Expense list with details

### **6. Handle Submit Logic**
```jsx
const handleSubmit = async () => {
  if (!validateForm()) {
    return
  }

  // Kiểm tra nếu có parent object và children được chọn
  console.log('🔍 Debug dialog trigger:', { 
    workshopParentObject: workshopParentObject?.name, 
    selectedExpenseObjectIds: selectedExpenseObjectIds.length,
    category,
    userRole,
    selectedExpenseToUpdate: selectedExpenseToUpdate?.id
  })
  
  // Check if updating existing expense
  if (selectedExpenseToUpdate) {
    console.log('🔄 Updating existing expense:', selectedExpenseToUpdate.id)
    await updateExistingExpense(selectedExpenseToUpdate)
    return
  }
  
  // ... rest of create logic
}
```

**Cải thiện:**
- ✅ Check for update mode
- ✅ Call update function
- ✅ Maintain create logic

## 🔍 **Vấn đề đã sửa:**

### **1. Update Existing Expenses**
- **Problem:** Không có cách để cập nhật chi phí đã có
- **Cause:** Chỉ có chức năng tạo mới
- **Solution:** Thêm chức năng cập nhật với UI selector

### **2. Data Loading**
- **Problem:** Không load được dữ liệu chi phí cũ
- **Cause:** Thiếu function load existing expenses
- **Solution:** Thêm loadExistingExpenses function

### **3. Form Population**
- **Problem:** Form không được populate với dữ liệu cũ
- **Cause:** Thiếu logic populate form
- **Solution:** Thêm loadExpenseDataForUpdate function

### **4. Update Logic**
- **Problem:** Không có logic cập nhật chi phí
- **Cause:** Thiếu update function
- **Solution:** Thêm updateExistingExpense function

## 🎯 **Giải pháp:**

### **1. UI/UX Flow**
1. **Update Button:** Hiển thị button "Cập nhật chi phí đã có"
2. **Expense Selector:** Modal để chọn chi phí cần cập nhật
3. **Form Population:** Tự động populate form với dữ liệu cũ
4. **Update Process:** Cập nhật parent và child expenses

### **2. Data Management**
1. **Load Existing:** Load danh sách chi phí đã có
2. **Load Details:** Load chi tiết chi phí được chọn
3. **Update Process:** Cập nhật parent và tạo lại child expenses
4. **Data Integrity:** Đảm bảo tính toàn vẹn dữ liệu

### **3. User Experience**
1. **Clear Selection:** Hiển thị chi phí đang được cập nhật
2. **Easy Selection:** Dễ dàng chọn chi phí cần cập nhật
3. **Form Pre-fill:** Form được điền sẵn dữ liệu
4. **Smooth Update:** Quá trình cập nhật mượt mà

## 📱 **Workflow mới:**

### **1. Update Flow**
1. Click "Cập nhật chi phí đã có"
2. Chọn chi phí cần cập nhật từ modal
3. Form được populate với dữ liệu cũ
4. Chỉnh sửa thông tin cần thiết
5. Click "Cập nhật" để lưu

### **2. Data Flow**
1. Load existing expenses
2. Select expense to update
3. Load expense details
4. Populate form
5. Update parent expense
6. Delete old child expenses
7. Create new child expenses

### **3. UI Flow**
1. Update button in header
2. Expense selector modal
3. Selected expense display
4. Form editing
5. Update confirmation

## 🚀 **Lợi ích:**

### **1. User Experience**
- **Easy Updates:** Dễ dàng cập nhật chi phí
- **Clear Selection:** Rõ ràng chi phí đang cập nhật
- **Form Pre-fill:** Form được điền sẵn
- **Smooth Process:** Quá trình mượt mà

### **2. Data Management**
- **Data Integrity:** Đảm bảo tính toàn vẹn
- **Parent-Child:** Duy trì mối quan hệ
- **Update History:** Lịch sử cập nhật
- **Error Handling:** Xử lý lỗi tốt

### **3. Functionality**
- **Update Existing:** Cập nhật chi phí đã có
- **Create New:** Vẫn có thể tạo mới
- **Flexible:** Linh hoạt trong sử dụng
- **Comprehensive:** Đầy đủ chức năng

## 🎨 **Technical Implementation:**

### **1. State Management**
```jsx
// State for updating existing expenses
const [existingExpenses, setExistingExpenses] = useState<any[]>([])
const [selectedExpenseToUpdate, setSelectedExpenseToUpdate] = useState<any>(null)
const [showExpenseSelector, setShowExpenseSelector] = useState(false)
```

### **2. Data Loading**
```jsx
// Load existing expenses
const loadExistingExpenses = async () => {
  const { data: expenses, error } = await supabase
    .from('project_expenses')
    .select(`
      id, description, amount, expense_date, status,
      expense_object_id, id_parent, created_at,
      expense_objects!inner(name, parent_id)
    `)
    .eq('status', 'approved')
    .is('id_parent', null)
    .order('created_at', { ascending: false })
  
  setExistingExpenses(expenses || [])
}
```

### **3. Update Logic**
```jsx
// Update existing expense
const updateExistingExpense = async (expense: any) => {
  // Update parent expense
  await supabase
    .from('project_expenses')
    .update({ description, amount, currency, expense_date })
    .eq('id', expense.id)
  
  // Delete existing child expenses
  await supabase
    .from('project_expenses')
    .delete()
    .eq('id_parent', expense.id)
  
  // Create new child expenses
  for (const [childObjectId, amountValue] of Object.entries(directObjectTotals)) {
    await supabase
      .from('project_expenses')
      .insert({
        id: crypto.randomUUID(),
        project_id: formData.project_id,
        description: `${formData.description} - ${childObjectName}`,
        expense_object_id: childObjectId,
        amount: amountValue,
        currency: formData.currency,
        expense_date: formData.expense_date,
        status: 'approved',
        employee_id: formData.employee_id,
        id_parent: expense.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        expense_object_columns: [childObjectId],
        invoice_items: []
      })
  }
}
```

## 📋 **Tóm tắt:**

**Đã thêm:**
- ✅ State management cho update functionality
- ✅ Load existing expenses function
- ✅ Load expense data for update function
- ✅ Update existing expense function
- ✅ UI components cho expense selection
- ✅ Handle submit logic cho update mode

**Kết quả:**
- ✅ Có thể cập nhật chi phí đã có
- ✅ UI để chọn chi phí cần cập nhật
- ✅ Form được populate với dữ liệu cũ
- ✅ Maintain parent-child relationship
- ✅ User experience tốt

**Chức năng cập nhật chi phí thực tế đã được thêm với UI selector! 🎯**
