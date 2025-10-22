# Hướng dẫn Chức năng Dropdown Chọn Chi phí Thực tế để Cập nhật

## 🎯 **Tình trạng: HOÀN THÀNH**

Đã implement dropdown chọn chi phí thực tế trong phần "Thông tin cơ bản" của `CreateProjectExpenseDialog.tsx`.

## ✨ **Các thay đổi chính:**

### **1. State Variables**
```typescript
// State for expense dropdown
const [expenseDropdownOptions, setExpenseDropdownOptions] = useState<any[]>([])
const [selectedExpenseForUpdate, setSelectedExpenseForUpdate] = useState<string>('')
```

**Mục đích:**
- `expenseDropdownOptions`: Lưu danh sách chi phí thực tế cho dropdown
- `selectedExpenseForUpdate`: ID của chi phí được chọn từ dropdown

### **2. Load Expenses for Dropdown Function**
```typescript
const loadExpensesForDropdown = async (projectId: string) => {
  try {
    if (!projectId) {
      setExpenseDropdownOptions([])
      return
    }
    
    console.log('🔍 Loading expenses for dropdown, project:', projectId)
    
    const { data, error } = await supabase
      .from('project_expenses')
      .select('*')
      .eq('project_id', projectId)
      .is('id_parent', null) // Only load parent expenses
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('❌ Error loading expenses for dropdown:', error)
      return
    }
    
    console.log('✅ Loaded expenses for dropdown:', data?.length || 0)
    setExpenseDropdownOptions(data || [])
  } catch (error) {
    console.error('❌ Error in loadExpensesForDropdown:', error)
  }
}
```

**Chức năng:**
- Load danh sách chi phí thực tế từ database
- Chỉ load parent expenses (id_parent = null)
- Sắp xếp theo thời gian tạo (mới nhất trước)
- Cập nhật state `expenseDropdownOptions`

### **3. Handle Expense Selection Function**
```typescript
const handleExpenseSelection = async (expenseId: string) => {
  try {
    if (!expenseId) {
      setSelectedExpenseForUpdate('')
      setSelectedExpenseToUpdate(null)
      return
    }
    
    console.log('🔍 Handling expense selection:', expenseId)
    
    const selectedExpense = expenseDropdownOptions.find(exp => exp.id === expenseId)
    if (!selectedExpense) {
      console.error('❌ Selected expense not found')
      return
    }
    
    console.log('✅ Selected expense:', selectedExpense)
    
    // Load expense data for update
    await loadExpenseDataForUpdate(selectedExpense)
    
    setSelectedExpenseForUpdate(expenseId)
  } catch (error) {
    console.error('❌ Error in handleExpenseSelection:', error)
  }
}
```

**Chức năng:**
- Validate expense ID
- Tìm expense từ dropdown options
- Load expense data vào form
- Cập nhật state selection

### **4. useEffect for Auto-loading**
```typescript
// Load expenses for dropdown when project changes
useEffect(() => {
  if (category === 'actual' && formData.project_id) {
    loadExpensesForDropdown(formData.project_id)
  } else {
    setExpenseDropdownOptions([])
    setSelectedExpenseForUpdate('')
    setSelectedExpenseToUpdate(null)
  }
}, [formData.project_id, category])
```

**Chức năng:**
- Auto-load expenses khi project thay đổi
- Chỉ load khi category = 'actual'
- Clear state khi không có project hoặc category khác

### **5. UI Components**

#### **A. Dropdown Selector**
```jsx
{/* Chọn chi phí thực tế để cập nhật - chỉ hiển thị khi category = 'actual' */}
{category === 'actual' && (
  <div>
    <label className="block text-sm font-semibold text-gray-900 mb-2">
      Chọn chi phí thực tế để cập nhật (tùy chọn)
    </label>
    <select
      value={selectedExpenseForUpdate}
      onChange={(e) => handleExpenseSelection(e.target.value)}
      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
    >
      <option value="">Không chọn - Tạo chi phí mới</option>
      {expenseDropdownOptions.map((expense) => (
        <option key={expense.id} value={expense.id}>
          {expense.expense_code ? `${expense.expense_code} - ` : ''}{expense.description} - {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(expense.amount || 0)} ({new Date(expense.expense_date).toLocaleDateString('vi-VN')})
        </option>
      ))}
    </select>
    <p className="text-xs text-gray-500 mt-1">
      Chọn chi phí thực tế đã có để cập nhật thông tin
    </p>
  </div>
)}
```

**Hiển thị khi:**
- Category là 'actual'
- Có project được chọn
- Có expenses trong dropdown options

#### **B. Selected Expense Info Display**
```jsx
{/* Hiển thị thông tin chi phí đã chọn */}
{selectedExpenseToUpdate && (
  <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
    <div className="flex items-center space-x-2">
      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
      <span className="text-sm font-medium text-blue-900">
        Đang cập nhật: {selectedExpenseToUpdate.description}
      </span>
    </div>
    <div className="mt-2 text-xs text-blue-700">
      Số tiền: {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(selectedExpenseToUpdate.amount || 0)} | 
      Ngày: {new Date(selectedExpenseToUpdate.expense_date).toLocaleDateString('vi-VN')} | 
      Trạng thái: {selectedExpenseToUpdate.status === 'approved' ? 'Đã duyệt' : selectedExpenseToUpdate.status === 'rejected' ? 'Từ chối' : 'Chờ duyệt'}
    </div>
  </div>
)}
```

**Hiển thị khi:**
- Có expense được chọn từ dropdown
- Hiển thị thông tin chi tiết của expense

## 📱 **Workflow:**

### **1. Auto-load Expenses**
1. User chọn project
2. useEffect detect project change
3. Load expenses for dropdown
4. Update dropdown options

### **2. Select Expense from Dropdown**
1. User chọn expense từ dropdown
2. Function `handleExpenseSelection` được gọi
3. Load expense data vào form
4. Hiển thị thông tin expense đã chọn

### **3. Update Expense**
1. User chỉnh sửa thông tin
2. User bấm nút "Cập nhật"
3. Function `handleSubmit` check `selectedExpenseToUpdate`
4. Function `updateExistingExpense` được gọi
5. Update parent và children
6. Hiển thị thông báo thành công

## 🚀 **Lợi ích:**

### **1. User Experience**
- **Easy Selection:** Chọn chi phí dễ dàng từ dropdown
- **Auto-loading:** Tự động load expenses khi chọn project
- **Visual Feedback:** Hiển thị thông tin chi phí đã chọn
- **Clear Options:** Dropdown hiển thị đầy đủ thông tin (mã, mô tả, số tiền, ngày)

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
- Auto-load when project changes
- Clear state when switching projects

### **2. Data Update**
- Update parent expense with new data
- Delete all old children
- Create new children based on new allocations
- Maintain referential integrity

### **3. State Management**
- Track dropdown options in `expenseDropdownOptions`
- Track selected expense in `selectedExpenseForUpdate`
- Track expense data in `selectedExpenseToUpdate`
- Clear state when switching projects

### **4. UI/UX**
- Modern dropdown design
- Rich option display (mã, mô tả, số tiền, ngày)
- Selected expense info display
- Responsive design

## 📋 **Dropdown Option Format:**

```
{expense_code} - {description} - {amount} ({date})
```

**Ví dụ:**
```
EXP001 - Chi phí nguyên vật liệu - 1,000,000 ₫ (22/10/2025)
- Chi phí nhân công - 500,000 ₫ (21/10/2025)
```

## 🔍 **Vấn đề đã sửa:**

### **1. Missing Dropdown Selector**
- **Problem:** Không có cách chọn chi phí để update trong form
- **Cause:** Chỉ có modal selector, không có dropdown
- **Solution:** Thêm dropdown trong phần "Thông tin cơ bản"

### **2. Auto-loading Expenses**
- **Problem:** Phải load thủ công expenses
- **Cause:** Không có auto-loading mechanism
- **Solution:** useEffect auto-load khi project thay đổi

### **3. Visual Feedback**
- **Problem:** Không biết expense nào đang được chọn
- **Cause:** Thiếu visual indicator
- **Solution:** Hiển thị thông tin chi phí đã chọn

### **4. User Experience**
- **Problem:** Workflow phức tạp với modal
- **Cause:** Phải mở modal riêng
- **Solution:** Dropdown tích hợp trong form

## 📋 **Tóm tắt:**

**Đã implement:**
- ✅ Dropdown chọn chi phí thực tế
- ✅ Auto-loading expenses khi project thay đổi
- ✅ Handle expense selection function
- ✅ Visual feedback cho expense đã chọn
- ✅ Integration với existing update logic

**Kết quả:**
- ✅ User có thể chọn chi phí từ dropdown
- ✅ Form được điền sẵn với dữ liệu hiện tại
- ✅ Clear visual feedback
- ✅ Seamless integration với existing workflow

**Chức năng dropdown chọn chi phí thực tế đã được implement hoàn chỉnh! 🎯**
