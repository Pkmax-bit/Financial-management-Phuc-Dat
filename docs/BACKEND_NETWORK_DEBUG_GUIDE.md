# Hướng dẫn Debug Backend và Network Không Hoạt Động

## 🔍 **Vấn đề:**
Console có hoạt động nhưng backend và network không thấy có hoạt động cập nhật hay lưu gì cả.

## 🛠️ **Các bước debug:**

### **1. Kiểm tra Console Logs**
Mở browser console (F12) và tìm các log sau:

#### **Khi bấm button "Cập nhật":**
```
🔄 Update button clicked
📊 workshopParentObject before call: [object data]
📊 pendingExpenseData before call: [object data]
🔄 Starting updateParentExpense...
📊 workshopParentObject: [object data]
📊 pendingExpenseData: [object data]
```

#### **Khi bấm button "Tạo mới":**
```
➕ Create button clicked
📊 workshopParentObject before call: [object data]
📊 pendingExpenseData before call: [object data]
🔄 Starting createNewExpense...
📊 workshopParentObject: [object data]
📊 pendingExpenseData: [object data]
```

### **2. Nếu KHÔNG thấy logs trên:**
- **Nguyên nhân:** Button không được click
- **Giải pháp:** Kiểm tra dialog có hiển thị đúng không

### **3. Nếu thấy logs nhưng không có network:**
- **Nguyên nhân:** Function bị lỗi ở validation hoặc early return
- **Giải pháp:** Kiểm tra validation logs

### **4. Kiểm tra Validation Logs:**

#### **Nếu thấy log này:**
```
❌ Missing required data: { workshopParentObject: null, pendingExpenseData: null }
```
**Nguyên nhân:** Dữ liệu không được truyền đúng
**Giải pháp:** Kiểm tra `workshopParentObject` và `pendingExpenseData`

#### **Nếu thấy log này:**
```
❌ Missing project_id
```
**Nguyên nhân:** Thiếu project_id
**Giải pháp:** Kiểm tra form data

#### **Nếu thấy log này:**
```
❌ No directObjectTotals data
```
**Nguyên nhân:** Thiếu dữ liệu chi phí
**Giải pháp:** Kiểm tra directObjectTotals

### **5. Kiểm tra Network Tab:**
1. Mở Developer Tools (F12)
2. Chuyển sang tab Network
3. Bấm button "Cập nhật" hoặc "Tạo mới"
4. Tìm requests đến Supabase

### **6. Các requests mong đợi:**

#### **Cho updateParentExpense:**
- `GET` đến `project_expenses` (tìm existing parents)
- `PUT` đến `project_expenses` (cập nhật parent)
- `DELETE` đến `project_expenses` (xóa children cũ)
- `POST` đến `project_expenses` (tạo children mới)

#### **Cho createNewExpense:**
- `POST` đến `project_expenses` (tạo parent)
- `POST` đến `project_expenses` (tạo children)

## 🎯 **Các nguyên nhân có thể:**

### **1. Validation fails:**
- `workshopParentObject` là null
- `pendingExpenseData` là null
- `project_id` không có
- `directObjectTotals` rỗng

### **2. Function không được gọi:**
- Button click không hoạt động
- Event handler không được bind
- JavaScript error

### **3. Early return:**
- Function return sớm do validation
- Không có error message
- Không có network request

### **4. Supabase connection:**
- Supabase client không được init
- Authentication failed
- Database connection error

## 🔧 **Quick Fixes:**

### **Fix 1: Kiểm tra dữ liệu**
```javascript
console.log('workshopParentObject:', workshopParentObject)
console.log('pendingExpenseData:', pendingExpenseData)
console.log('selectedRole:', selectedRole)
```

### **Fix 2: Kiểm tra Supabase connection**
```javascript
console.log('Supabase client:', supabase)
console.log('Supabase auth:', await supabase.auth.getSession())
```

### **Fix 3: Test manual function**
```javascript
// Trong console
await updateParentExpense()
await createNewExpense()
```

### **Fix 4: Kiểm tra network**
```javascript
// Trong console
fetch('http://localhost:8000/api/test')
  .then(res => res.json())
  .then(console.log)
```

## 📋 **Debug Checklist:**

### **Bước 1: Kiểm tra Console**
- [ ] Có log `🔄 Update button clicked` hoặc `➕ Create button clicked` không
- [ ] Có log `🔄 Starting updateParentExpense...` hoặc `🔄 Starting createNewExpense...` không
- [ ] Có log validation errors không
- [ ] Có JavaScript errors không

### **Bước 2: Kiểm tra Dữ liệu**
- [ ] `workshopParentObject` có dữ liệu không
- [ ] `pendingExpenseData` có dữ liệu không
- [ ] `project_id` có tồn tại không
- [ ] `directObjectTotals` có dữ liệu không

### **Bước 3: Kiểm tra Network**
- [ ] Có requests đến Supabase không
- [ ] Requests có thành công không
- [ ] Có error responses không
- [ ] Có authentication errors không

### **Bước 4: Test Manual**
- [ ] Test function trong console
- [ ] Test Supabase connection
- [ ] Test network requests

## 🚀 **Các giải pháp:**

### **Giải pháp 1: Sửa validation**
```javascript
if (!workshopParentObject || !pendingExpenseData) {
  console.error('❌ Missing data:', { workshopParentObject, pendingExpenseData })
  showNotification('Thiếu dữ liệu cần thiết', 'error')
  return
}
```

### **Giải pháp 2: Thêm error handling**
```javascript
try {
  await updateParentExpense()
} catch (error) {
  console.error('❌ Error:', error)
  showNotification('Có lỗi xảy ra: ' + error.message, 'error')
}
```

### **Giải pháp 3: Kiểm tra Supabase**
```javascript
const { data, error } = await supabase
  .from('project_expenses')
  .select('*')
  .limit(1)

if (error) {
  console.error('❌ Supabase error:', error)
  return
}
```

### **Giải pháp 4: Debug step by step**
```javascript
console.log('Step 1: Starting function')
console.log('Step 2: Validation passed')
console.log('Step 3: Making request')
console.log('Step 4: Request completed')
```

## 📞 **Hỗ trợ:**

Nếu vẫn không giải quyết được:
1. Chụp screenshot console logs
2. Chụp screenshot network tab
3. Ghi lại các bước đã thử
4. Cung cấp thông tin lỗi cụ thể
