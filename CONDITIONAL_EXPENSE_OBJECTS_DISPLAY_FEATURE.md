# CONDITIONAL EXPENSE OBJECTS DISPLAY FEATURE

## 🎯 MỤC TIÊU
Thay đổi logic hiển thị các cột chi phí đối tượng trong chi phí thực tế:
- Mặc định không chọn đối tượng chi phí nào
- Chỉ hiển thị các cột chi phí đối tượng khi có đối tượng được chọn
- Chỉ hiển thị khi user có role tương ứng

## 🔧 CÁC THAY ĐỔI ĐÃ THỰC HIỆN

### 1. **Thay đổi Logic Auto-selection**
```typescript
// Auto-select expense objects based on role when options are loaded (for create mode)
useEffect(() => {
  if (expenseObjectsOptions.length > 0 && !isEdit && selectedExpenseObjectIds.length === 0 && userRole) {
    // Chỉ auto-select cho workshop employee khi tạo actual expense
    if (userRole === 'workshop_employee' && category === 'actual') {
      // Logic này sẽ được xử lý trong useEffect riêng cho workshop employee
      return
    }
    
    // Cho các role khác, không auto-select mặc định
    console.log(`📋 No auto-selection for ${userRole} - user needs to manually select expense objects`)
  }
}, [expenseObjectsOptions, isEdit, selectedExpenseObjectIds.length, userRole, category])
```

### 2. **Thay đổi Logic Hiển thị Header Table**
```typescript
// Header cột đối tượng chỉ hiển thị khi có đối tượng được chọn
{selectedExpenseObjectIds.length > 0 && selectedExpenseObjectIds.map((id) => (
  <th key={`${id}-group`} colSpan={2} className="px-3 py-2 text-center font-semibold w-32">
    {(expenseObjectsOptions.find(o => o.id === id)?.name) || 'Đối tượng'}
  </th>
)))}

// Cột "Tổng phân bổ" chỉ hiển thị khi có đối tượng được chọn
{selectedExpenseObjectIds.length > 0 && (
  <th rowSpan={2} className="px-3 py-2 text-right font-semibold w-28">Tổng phân bổ</th>
)}
```

### 3. **Thay đổi Logic Hiển thị Body Table**
```typescript
// Các cột % và VND chỉ hiển thị khi có đối tượng được chọn
{selectedExpenseObjectIds.length > 0 && selectedExpenseObjectIds.map((id) => (
  <React.Fragment key={`${id}-row-${i}`}>
    <td className="px-3 py-2 text-right">
      <input
        type="number"
        className="w-full border-2 border-gray-400 rounded px-1 py-1 text-xs text-right text-black font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        value={row.componentsPct[id] ?? 0}
        onChange={(e) => {
          const pct = parseFloat(e.target.value) || 0
          updateRow(i, r => {
            const next = { ...r }
            next.componentsPct[id] = pct
            next.componentsAmt[id] = Math.round(((next.lineTotal || 0) * pct) / 100)
            return next
          })
        }}
        step="0.5"
        min="0"
        max="100"
      />
    </td>
    <td className="px-3 py-2 text-right">
      <input
        type="text"
        className="w-full border-2 border-gray-400 rounded px-1 py-1 text-xs text-right text-black font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        value={formattedObjectAmounts[id]?.[i] || formatNumber(row.componentsAmt[id] ?? 0)}
        onChange={(e) => handleObjectAmountChange(id, i, e.target.value)}
        placeholder="0"
      />
    </td>
  </React.Fragment>
))}
```

### 4. **Thay đổi Logic Hiển thị Footer Table**
```typescript
// Tổng chi phí chỉ hiển thị khi có đối tượng được chọn
{selectedExpenseObjectIds.length > 0 && (
  <tr className="bg-gray-50">
    <td className="px-3 py-2 text-left font-semibold" colSpan={6 + (selectedExpenseObjectIds.length * 2)}>Tổng chi phí</td>
    <td className="px-3 py-2 text-right font-semibold">
      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(grandAllocationTotal)}
    </td>
    <td className="px-3 py-2"></td>
  </tr>
)}

// Lợi nhuận chỉ hiển thị khi có đối tượng được chọn
{selectedExpenseObjectIds.length > 0 && (
  <tr className="bg-gray-100">
    <td className="px-3 py-2 text-left font-bold" colSpan={6 + (selectedExpenseObjectIds.length * 2)}>Lợi nhuận</td>
    <td className="px-3 py-2 text-right font-bold">
      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(profitComputed)}
    </td>
    <td className="px-3 py-2"></td>
  </tr>
)}
```

### 5. **Thay đổi Logic Hiển thị Tổng phân bổ theo dòng**
```typescript
// Tổng phân bổ theo dòng chỉ hiển thị khi có đối tượng được chọn
{selectedExpenseObjectIds.length > 0 && (
  <td className="px-3 py-2 text-right font-medium">
    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(
      selectedExpenseObjectIds.reduce((s, id) => {
        const pct = Number(row.componentsPct[id] ?? 0)
        const amt = row.componentsAmt[id]
        const value = amt !== undefined ? Number(amt) : Math.round(((row.lineTotal || 0) * pct) / 100)
        return s + (value || 0)
      }, 0)
    )}
  </td>
)}
```

## 🎨 UI/UX IMPROVEMENTS

### **Khi không có đối tượng được chọn:**
- ✅ **Header Table**: Chỉ hiển thị cột cơ bản (STT, Tên sản phẩm, Đơn giá, Số lượng, Đơn vị, Thành tiền)
- ✅ **Body Table**: Không hiển thị input fields cho đối tượng
- ✅ **Footer Table**: Chỉ hiển thị tổng doanh thu, không hiển thị tổng chi phí và lợi nhuận
- ✅ **Total Cost Breakdown**: Không hiển thị section này

### **Khi có đối tượng được chọn:**
- ✅ **Header Table**: Hiển thị cột đối tượng và cột "Tổng phân bổ"
- ✅ **Body Table**: Hiển thị input fields cho % và VND của từng đối tượng
- ✅ **Footer Table**: Hiển thị tổng chi phí và lợi nhuận
- ✅ **Total Cost Breakdown**: Hiển thị breakdown chi tiết cho từng đối tượng

## 🔍 TÍNH NĂNG HOẠT ĐỘNG

### **1. Mặc định không chọn đối tượng:**
- ✅ **Tất cả role**: Không auto-select đối tượng (trừ workshop employee)
- ✅ **User phải chọn thủ công**: Click vào checkbox để chọn đối tượng
- ✅ **UI sạch sẽ**: Chỉ hiển thị cột cơ bản khi chưa chọn đối tượng

### **2. Hiển thị có điều kiện:**
- ✅ **Header cột đối tượng**: Chỉ hiển thị khi `selectedExpenseObjectIds.length > 0`
- ✅ **Input fields**: Chỉ hiển thị khi có đối tượng được chọn
- ✅ **Tổng phân bổ**: Chỉ hiển thị khi có đối tượng được chọn
- ✅ **Total Cost Breakdown**: Chỉ hiển thị khi có đối tượng được chọn

### **3. Role-based behavior:**
- ✅ **Admin/Worker**: Không auto-select, user chọn thủ công
- ✅ **Workshop Employee**: Auto-select children objects khi tạo actual expense
- ✅ **Dynamic loading**: Expense objects được load theo role

## 📊 DATA FLOW

### **1. Mở dialog tạo chi phí thực tế:**
```
User click "Tạo chi phí thực tế" → System load expense objects theo role → Không auto-select → User thấy danh sách đối tượng
```

### **2. User chọn đối tượng:**
```
User click checkbox đối tượng → System update selectedExpenseObjectIds → System hiển thị các cột đối tượng → User nhập chi phí
```

### **3. User bỏ chọn đối tượng:**
```
User bỏ chọn đối tượng → System clear selectedExpenseObjectIds → System ẩn các cột đối tượng → Data được clear
```

### **4. Submit form:**
```
User submit → System validate → System save data → System đóng dialog
```

## 🧪 TESTING

### **Test Cases:**
1. ✅ Mở dialog tạo chi phí thực tế - không có đối tượng được chọn
2. ✅ User chọn đối tượng - hiển thị các cột đối tượng
3. ✅ User bỏ chọn đối tượng - ẩn các cột đối tượng
4. ✅ Chuyển đổi giữa các role - reload expense objects
5. ✅ Edit mode với đối tượng đã chọn - hiển thị đúng
6. ✅ Workshop employee auto-select - hoạt động đúng

### **Test Script:**
- ✅ `test_conditional_expense_objects_display.py` - Test script chi tiết
- ✅ Manual testing scenarios
- ✅ Edge cases validation

## 🚀 DEPLOYMENT

### **Frontend Changes:**
- ✅ Updated `CreateProjectExpenseDialog.tsx`
- ✅ Added conditional rendering logic
- ✅ Updated auto-selection behavior
- ✅ Added role-based filtering

### **Database Requirements:**
- ✅ `expense_objects` table với parent-child relationships
- ✅ `project_expenses` table với proper structure
- ✅ Role-based access control

### **API Endpoints:**
- ✅ `GET /api/expense-objects` - Load expense objects theo role
- ✅ `POST /api/project-expenses` - Create expense với đối tượng
- ✅ Proper validation và error handling

## 🎯 KẾT QUẢ

### **Tính năng hoàn thành:**
- ✅ Mặc định không chọn đối tượng chi phí
- ✅ Chỉ hiển thị các cột đối tượng khi có đối tượng được chọn
- ✅ Role-based behavior hoạt động đúng
- ✅ UI/UX sạch sẽ và thân thiện

### **Benefits:**
- 🎯 **Linh hoạt**: User có thể chọn hoặc không chọn đối tượng
- 🎯 **Sạch sẽ**: UI chỉ hiển thị những gì cần thiết
- 🎯 **Thân thiện**: User experience tốt hơn
- 🎯 **Hiệu quả**: Performance tốt hơn khi không cần load data không cần thiết

**Tính năng sẵn sàng để test và deploy!** 🚀



