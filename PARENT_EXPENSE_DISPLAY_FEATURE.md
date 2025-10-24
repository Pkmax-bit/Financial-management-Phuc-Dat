# PARENT EXPENSE DISPLAY FEATURE

## 🎯 MỤC TIÊU
Hiển thị chi phí đối tượng cha của các chi phí đối tượng con (Cha = Tổng các con) trong section "Tổng chi phí theo đối tượng" để user có thể thấy rõ mối quan hệ parent-child và tổng chi phí.

## 🔧 CÁC THAY ĐỔI ĐÃ THỰC HIỆN

### 1. **Thay đổi Logic Load Expense Objects**
```typescript
if (userRole === 'workshop_employee') {
  if (category === 'actual') {
    // Cho actual expenses, hiển thị cả parent và children của workshop parent
    const workshopParent = opts.find(o => 
      o.is_parent && (o.name.includes('Xưởng') || o.name.includes('xuong') || o.name.includes('sản xuất'))
    )
    
    if (workshopParent) {
      // Hiển thị cả parent và children của workshop parent
      opts = opts.filter(o => o.id === workshopParent.id || o.parent_id === workshopParent.id)
      console.log('🔧 Workshop employee actual expenses - showing parent and children of:', workshopParent.name, opts.map(o => o.name))
    }
  }
}
```

### 2. **Thêm Logic Set Parent Object cho Tất cả User**
```typescript
// Set workshop parent object for all users when they select children objects
useEffect(() => {
  if (selectedExpenseObjectIds.length > 0 && expenseObjectsOptions.length > 0) {
    // Tìm parent object của các children được chọn
    const firstChild = expenseObjectsOptions.find(o => selectedExpenseObjectIds.includes(o.id))
    if (firstChild && firstChild.parent_id) {
      const parentObject = expenseObjectsOptions.find(o => o.id === firstChild.parent_id)
      if (parentObject && parentObject.is_parent) {
        setWorkshopParentObject(parentObject)
        console.log(`✅ Set parent object for children:`, parentObject.name)
      }
    }
  } else {
    setWorkshopParentObject(null)
  }
}, [selectedExpenseObjectIds, expenseObjectsOptions])
```

### 3. **Thay đổi Logic Hiển thị Parent Expense Section**
```typescript
{/* Hiển thị chi phí đối tượng cha khi có parent object và children được chọn */}
{workshopParentObject && selectedExpenseObjectIds.length > 0 && (
  <div className="mt-4 bg-green-100 border-2 border-green-300 rounded-lg p-4">
    <div className="flex items-center space-x-2 mb-3">
      <div className="p-2 bg-green-200 rounded-lg">
        <BarChart3 className="h-5 w-5 text-green-700" />
      </div>
      <div>
        <span className="text-lg font-bold text-green-900">Chi phí đối tượng cha</span>
        <div className="text-sm text-green-700">Cha = Tổng các con</div>
      </div>
    </div>
    
    <div className="bg-white border border-green-200 rounded-lg p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-4 h-4 rounded-full bg-green-600"></div>
          <span className="text-green-900 font-bold text-lg">{workshopParentObject.name}</span>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-green-800">
            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(
              (() => {
                const hasDirectObjectInputs = Object.values(directObjectTotals).some(val => val > 0)
                return hasDirectObjectInputs 
                  ? Object.values(directObjectTotals).reduce((sum, val) => sum + val, 0)
                  : grandAllocationTotal
              })()
            )}
          </div>
          <div className="text-sm text-green-600">Tổng chi phí</div>
        </div>
      </div>
      
      {/* Breakdown chi tiết các con */}
      {selectedExpenseObjectIds.length > 0 && (
        <div className="mt-3 pt-3 border-t border-green-200">
          <div className="text-sm text-green-700 font-medium mb-2">Chi tiết các đối tượng con:</div>
          <div className="space-y-1">
            {selectedExpenseObjectIds.map((id) => {
              const expenseObject = expenseObjectsOptions.find(obj => obj.id === id)
              const totalAmount = directObjectTotals[id] || expenseObjectTotals[id] || 0
              const parentTotal = (() => {
                const hasDirectObjectInputs = Object.values(directObjectTotals).some(val => val > 0)
                return hasDirectObjectInputs 
                  ? Object.values(directObjectTotals).reduce((sum, val) => sum + val, 0)
                  : grandAllocationTotal
              })()
              const percentage = parentTotal > 0 ? (totalAmount / parentTotal * 100) : 0
              
              return (
                <div key={id} className="flex items-center justify-between text-sm py-1 px-2 bg-green-50 rounded">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                    <span className="text-green-800">{expenseObject?.name || 'Đối tượng'}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="text-green-700 font-medium">{percentage.toFixed(1)}%</span>
                    <span className="font-semibold text-green-800">
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalAmount)}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  </div>
)}
```

## 🎨 UI/UX IMPROVEMENTS

### **Parent Expense Section:**
- ✅ **Background**: Xanh lá với border đậm
- ✅ **Icon**: BarChart3 với màu xanh lá
- ✅ **Title**: "Chi phí đối tượng cha" với font bold
- ✅ **Subtitle**: "Cha = Tổng các con" để làm rõ mối quan hệ

### **Parent Object Display:**
- ✅ **Tên đối tượng**: Font bold với màu xanh lá
- ✅ **Tổng chi phí**: Font size lớn với format VND
- ✅ **Label**: "Tổng chi phí" để làm rõ ý nghĩa
- ✅ **Màu sắc**: Xanh lá để thể hiện tính tích cực

### **Children Breakdown:**
- ✅ **Section title**: "Chi tiết các đối tượng con"
- ✅ **List items**: Mỗi child với tên, phần trăm và chi phí
- ✅ **Percentage**: Hiển thị với 1 decimal place
- ✅ **Amount**: Format VND với font semibold
- ✅ **Visual indicators**: Dots màu xanh dương cho children

## 🔍 TÍNH NĂNG HOẠT ĐỘNG

### **1. Tự động set parent object:**
- ✅ **Khi user chọn children**: System tự động tìm và set parent object
- ✅ **Khi user bỏ chọn children**: System clear parent object
- ✅ **Dynamic update**: Parent object được update theo real-time

### **2. Hiển thị có điều kiện:**
- ✅ **Chỉ hiển thị khi có parent object**: `workshopParentObject && selectedExpenseObjectIds.length > 0`
- ✅ **Tự động ẩn khi không có children**: Khi `selectedExpenseObjectIds.length === 0`
- ✅ **Responsive**: Hiển thị/ẩn theo state changes

### **3. Tính toán chính xác:**
- ✅ **Parent total**: Tổng chi phí từ tất cả children
- ✅ **Child percentage**: Phần trăm của từng child so với parent
- ✅ **Real-time update**: Cập nhật theo real-time khi user thay đổi

## 📊 DATA FLOW

### **1. User chọn children objects:**
```
User chọn children → System tìm parent object → System set workshopParentObject → System hiển thị section
```

### **2. System tính toán:**
```
System lấy directObjectTotals → System tính tổng parent → System tính percentage cho từng child → System hiển thị
```

### **3. User thay đổi chi phí:**
```
User thay đổi chi phí child → System update directObjectTotals → System recalculate parent total → System update display
```

### **4. User bỏ chọn children:**
```
User bỏ chọn children → System clear selectedExpenseObjectIds → System set workshopParentObject = null → System ẩn section
```

## 🧪 TESTING

### **Test Cases:**
1. ✅ User chọn children objects - hiển thị parent expense section
2. ✅ User bỏ chọn children - ẩn parent expense section
3. ✅ User thay đổi chi phí children - update parent total
4. ✅ User chọn children từ nhiều parent - chỉ hiển thị parent của child đầu tiên
5. ✅ User chọn children không có parent - không hiển thị section
6. ✅ Workshop employee auto-select - hiển thị đúng parent expense

### **Test Script:**
- ✅ `test_parent_expense_display.py` - Test script chi tiết
- ✅ Manual testing scenarios
- ✅ Edge cases validation

## 🚀 DEPLOYMENT

### **Frontend Changes:**
- ✅ Updated `CreateProjectExpenseDialog.tsx`
- ✅ Added parent object detection logic
- ✅ Added parent expense display section
- ✅ Added calculation logic for parent total

### **Database Requirements:**
- ✅ `expense_objects` table với parent-child relationships
- ✅ `is_parent` field để identify parent objects
- ✅ `parent_id` field để link children to parent

### **API Endpoints:**
- ✅ `GET /api/expense-objects` - Load expense objects với parent-child info
- ✅ Proper filtering và role-based access

## 🎯 KẾT QUẢ

### **Tính năng hoàn thành:**
- ✅ Hiển thị chi phí đối tượng cha khi có children được chọn
- ✅ Cha = Tổng các con (tính toán chính xác)
- ✅ Breakdown chi tiết các children với phần trăm
- ✅ UI/UX rõ ràng và thân thiện

### **Benefits:**
- 🎯 **Rõ ràng**: User thấy rõ mối quan hệ parent-child
- 🎯 **Chính xác**: Tính toán đúng theo yêu cầu "Cha = Tổng các con"
- 🎯 **Thân thiện**: UI/UX tốt với màu sắc và layout rõ ràng
- 🎯 **Linh hoạt**: Hoạt động cho tất cả user, không chỉ workshop employee

**Tính năng sẵn sàng để test và deploy!** 🚀



