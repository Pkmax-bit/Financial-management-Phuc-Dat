# Hướng dẫn Debug Thông báo Nền Xám

## 🔍 **Vấn đề:**
Khi bấm "Cập nhật" hoặc "Lưu" vẫn hiện nền xám thay vì notification đẹp.

## 🛠️ **Các bước debug:**

### **1. Kiểm tra Console Logs**
Mở browser console (F12) và tìm các log sau:
```
🔔 showNotification called: { message: "...", type: "success" }
🎨 Using color: { bg: "...", border: "...", shadow: "..." }
📝 Notification HTML: "..."
🎬 Adding CSS animation styles
✅ Notification added to DOM
⏰ Auto-hiding notification after 5 seconds
🗑️ Notification removed from DOM
```

### **2. Nếu KHÔNG thấy logs trên:**
- **Nguyên nhân:** Đang sử dụng component khác (không phải CreateProjectExpenseDialog)
- **Giải pháp:** Kiểm tra xem đang sử dụng component nào

### **3. Nếu thấy logs nhưng vẫn có nền xám:**
- **Nguyên nhân:** Notification system có lỗi và fallback về alert()
- **Giải pháp:** Kiểm tra console có lỗi JavaScript không

### **3. Kiểm tra Component đang sử dụng:**

#### **CreateProjectExpenseDialog.tsx (ĐÚNG):**
- ✅ Có notification system
- ✅ Không có alert()
- ✅ Có debug logging

#### **CreateExpenseDialog.tsx (SAI):**
- ❌ Vẫn có alert()
- ❌ Không có notification system
- ❌ Sẽ hiện nền xám

### **4. Các lỗi thường gặp:**

#### **Lỗi 1: showNotification is not defined**
```
ReferenceError: showNotification is not defined
```
**Nguyên nhân:** Function không được định nghĩa
**Giải pháp:** Kiểm tra code có function showNotification không

#### **Lỗi 2: document.createElement fails**
```
TypeError: Cannot read property 'createElement' of null
```
**Nguyên nhân:** document không tồn tại
**Giải pháp:** Kiểm tra môi trường chạy

#### **Lỗi 3: CSS animation not working**
```
Animation not applied
```
**Nguyên nhân:** CSS keyframes không được load
**Giải pháp:** Kiểm tra CSS có được thêm vào head không

#### **Lỗi 4: Z-index too low**
```
Notification behind other elements
```
**Nguyên nhân:** Z-index thấp hơn các element khác
**Giải pháp:** Tăng z-index lên 99999

### **5. Debug Steps:**

#### **Bước 1: Kiểm tra Console**
1. Mở Developer Tools (F12)
2. Chuyển sang tab Console
3. Bấm "Cập nhật" hoặc "Lưu"
4. Tìm log `🔔 showNotification called:`

#### **Bước 2: Kiểm tra DOM**
1. Chuyển sang tab Elements
2. Tìm div có style `position: fixed; top: 20px; right: 20px;`
3. Kiểm tra có notification div không

#### **Bước 3: Kiểm tra CSS**
1. Tìm style tag có id `notification-styles`
2. Kiểm tra có keyframes `slideInRight` không
3. Kiểm tra animation có được áp dụng không

#### **Bước 4: Test Manual**
1. Mở Console
2. Chạy: `showNotification('Test message', 'success')`
3. Kiểm tra có notification hiện không

### **6. Các trường hợp cụ thể:**

#### **Trường hợp 1: Không thấy logs**
- **Nguyên nhân:** Sử dụng component khác
- **Giải pháp:** Kiểm tra import component nào

#### **Trường hợp 2: Thấy logs nhưng có lỗi**
- **Nguyên nhân:** JavaScript error
- **Giải pháp:** Sửa lỗi JavaScript

#### **Trường hợp 3: Thấy logs nhưng không có notification**
- **Nguyên nhân:** CSS hoặc DOM issue
- **Giải pháp:** Kiểm tra CSS và DOM

#### **Trường hợp 4: Có notification nhưng vẫn có alert**
- **Nguyên nhân:** Có alert() khác được gọi
- **Giải pháp:** Tìm và thay thế alert() khác

### **7. Quick Fixes:**

#### **Fix 1: Tăng Z-index**
```javascript
z-index: 99999; // Thay vì 9999
```

#### **Fix 2: Thêm Error Handling**
```javascript
try {
  // notification code
} catch (error) {
  console.error('Notification error:', error)
  // fallback
}
```

#### **Fix 3: Kiểm tra Browser Support**
```javascript
if (typeof document === 'undefined') {
  alert(message) // fallback
  return
}
```

### **8. Checklist Debug:**

- [ ] Kiểm tra console có log `🔔 showNotification called:` không
- [ ] Kiểm tra có lỗi JavaScript không
- [ ] Kiểm tra DOM có notification div không
- [ ] Kiểm tra CSS có keyframes không
- [ ] Kiểm tra z-index có đủ cao không
- [ ] Test manual với showNotification()
- [ ] Kiểm tra component đang sử dụng

### **9. Common Solutions:**

#### **Nếu vẫn có nền xám:**
1. Kiểm tra có alert() nào khác không
2. Kiểm tra component đang sử dụng
3. Kiểm tra console có lỗi không
4. Test manual notification

#### **Nếu notification không hiện:**
1. Kiểm tra CSS animation
2. Kiểm tra z-index
3. Kiểm tra DOM structure
4. Kiểm tra browser support

## 📞 **Hỗ trợ:**

Nếu vẫn không giải quyết được:
1. Chụp screenshot console logs
2. Ghi lại các bước đã thử
3. Cung cấp thông tin component đang sử dụng
4. Mô tả chi tiết lỗi gặp phải
