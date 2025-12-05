# 🔒 Sửa lỗi Token Authentication - Upload Excel

## ❌ Lỗi gặp phải

```
Token verification failed: invalid JWT: unable to parse or verify signature, 
token is malformed: token contains an invalid number of segments

HTTP Status: 401 Unauthorized
```

---

## 🎯 Nguyên nhân

Lỗi này xảy ra khi:

1. **Token đã hết hạn** - JWT token có thời gian sống giới hạn
2. **Token không hợp lệ** - Format token bị sai
3. **Token bị xóa** - User đã logout nhưng còn session cũ
4. **Chưa đăng nhập** - Không có token trong localStorage
5. **Token bị corrupt** - Lỗi khi lưu/đọc từ localStorage

---

## ✅ Giải pháp

### ⭐ MỚI: Token Auto Refresh (Tự động)

**Hệ thống giờ đã tự động làm mới token!**

```
Nếu bạn đã đăng nhập và thấy user info hiển thị:
✅ Đã xác thực
👤 [Tên của bạn]
📧 [Email của bạn]
💡 Token sẽ tự động làm mới nếu cần

→ Hệ thống sẽ TỰ ĐỘNG lấy token mới từ session
→ Bạn KHÔNG CẦN làm gì!
→ Chỉ cần click Upload và đợi
```

**Xem chi tiết:** `TOKEN_AUTO_REFRESH.md`

---

### Cách 1: Đăng xuất và đăng nhập lại (Nếu auto refresh không hoạt động)

**Bước 1: Đăng xuất**
```
1. Click vào avatar/tên user góc phải trên
2. Chọn "Đăng xuất" (Logout)
```

**Bước 2: Đăng nhập lại**
```
1. Truy cập: http://localhost:3000/login
2. Nhập email và password
3. Click "Đăng nhập"
```

**Bước 3: Thử upload lại**
```
1. Vào trang Nhân viên
2. Click "Upload Excel"
3. Chọn file và upload
```

---

### Cách 2: Xóa token cũ trong Console

**Bước 1: Mở Developer Console**
```
- Windows/Linux: F12 hoặc Ctrl+Shift+I
- Mac: Cmd+Option+I
```

**Bước 2: Vào tab Console**
```javascript
// Kiểm tra token hiện tại
localStorage.getItem('token')

// Nếu có token cũ, xóa nó
localStorage.removeItem('token')

// Refresh trang
location.reload()
```

**Bước 3: Đăng nhập lại**
```
Làm theo Cách 1, Bước 2
```

---

### Cách 3: Clear toàn bộ localStorage

**Nếu vẫn lỗi, xóa hết localStorage:**

```javascript
// Trong Console (F12)
localStorage.clear()
location.reload()
```

**Sau đó đăng nhập lại**

---

## 🔍 Kiểm tra Token

### Xem token hiện tại:
```javascript
// F12 > Console
const token = localStorage.getItem('token')
console.log('Token:', token)

if (!token) {
  console.log('❌ Không có token - Chưa đăng nhập')
} else if (token.split('.').length !== 3) {
  console.log('❌ Token không hợp lệ - Format sai')
} else {
  console.log('✅ Token có vẻ hợp lệ (cần verify với server)')
}
```

### Decode JWT token:
```javascript
// F12 > Console
function parseJwt(token) {
  try {
    const base64Url = token.split('.')[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(
      atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
      }).join('')
    )
    return JSON.parse(jsonPayload)
  } catch (e) {
    return null
  }
}

const token = localStorage.getItem('token')
if (token) {
  const decoded = parseJwt(token)
  console.log('Token payload:', decoded)
  
  if (decoded && decoded.exp) {
    const expDate = new Date(decoded.exp * 1000)
    const now = new Date()
    console.log('Token expires at:', expDate)
    console.log('Is expired?', now > expDate ? '❌ YES' : '✅ NO')
  }
}
```

---

## 🛡️ Các cải tiến đã thêm

### 1. Kiểm tra token trước khi upload
```typescript
const token = localStorage.getItem('token')
if (!token) {
  throw new Error('Bạn chưa đăng nhập...')
}
```

### 2. Error handling cụ thể
```typescript
// 401 Unauthorized
if (response.status === 401) {
  throw new Error('Token không hợp lệ hoặc đã hết hạn...')
}

// 403 Forbidden
if (response.status === 403) {
  throw new Error('Bạn không có quyền upload...')
}
```

### 3. UI warning
```tsx
{/* Auth Warning */}
<div className="bg-yellow-50 border border-yellow-200">
  <p>⚠️ Yêu cầu xác thực</p>
  <p>Bạn cần đăng nhập với tài khoản Admin hoặc Manager</p>
  {!localStorage.getItem('token') && (
    <p className="text-red-600">
      ❌ Chưa có token - Vui lòng đăng nhập trước!
    </p>
  )}
</div>
```

### 4. Console logging
```
🔐 Token found, uploading file...
✅ Upload successful
❌ Authentication failed - Token invalid or expired
```

---

## 📋 Checklist khắc phục

Khi gặp lỗi token, làm theo thứ tự:

- [ ] **Bước 1:** Kiểm tra đã đăng nhập chưa
  ```javascript
  localStorage.getItem('token') !== null
  ```

- [ ] **Bước 2:** Đăng xuất và đăng nhập lại
  - Logout → Login → Thử lại

- [ ] **Bước 3:** Kiểm tra role/quyền
  - Phải là Admin hoặc Manager (accountant/sales)

- [ ] **Bước 4:** Clear localStorage nếu vẫn lỗi
  ```javascript
  localStorage.clear()
  location.reload()
  ```

- [ ] **Bước 5:** Kiểm tra backend có chạy không
  ```
  http://localhost:8000/health
  ```

- [ ] **Bước 6:** Xem console logs
  - Frontend: F12 > Console
  - Backend: Terminal output

---

## 🔐 Quyền truy cập

### Roles được phép upload:
✅ **admin** - Quản trị viên  
✅ **accountant** - Kế toán  
✅ **sales** - Bán hàng  

### Roles KHÔNG được phép:
❌ **employee** - Nhân viên thường  
❌ **worker** - Công nhân  
❌ **workshop_employee** - Nhân viên xưởng  
❌ **transport** - Vận chuyển  
❌ **customer** - Khách hàng  

---

## 💡 Tips phòng tránh

### 1. Đăng nhập trước khi upload
```
✅ Login → Upload
❌ Upload ngay (có thể token đã hết hạn)
```

### 2. Không share token
```
❌ Copy token của người khác
✅ Đăng nhập với tài khoản riêng
```

### 3. Refresh token định kỳ
```
Nếu làm việc lâu (> 1 giờ):
→ Refresh trang hoặc logout/login lại
```

### 4. Kiểm tra network
```
F12 > Network > Filter: /upload-excel
→ Xem status code và response
```

---

## 🆘 Vẫn lỗi?

Nếu đã thử tất cả các cách trên mà vẫn lỗi:

### 1. Kiểm tra backend logs
```bash
# Xem terminal đang chạy backend
# Tìm dòng có chứa "401" hoặc "Token verification"
```

### 2. Restart backend
```bash
# Windows
restart_backend.bat

# Mac/Linux
cd backend
python -m uvicorn main:app --reload
```

### 3. Kiểm tra Supabase
```
- Vào Supabase Dashboard
- Authentication > Users
- Kiểm tra user có tồn tại không
- Kiểm tra JWT settings
```

### 4. Test với tool HTML
```bash
# Mở file
test_employee_excel.html

# Nhập token thủ công
# Test upload từ đây
```

---

## 📞 Liên hệ

Nếu vẫn không giải quyết được:

1. **Screenshot error** (cả frontend và backend console)
2. **Copy full error message**
3. **Ghi lại các bước đã thử**
4. **Liên hệ quản trị viên hệ thống**

---

## 🎉 Kết luận

Lỗi token authentication thường dễ fix bằng cách:
1. ✅ Logout và login lại
2. ✅ Clear localStorage
3. ✅ Kiểm tra role/quyền

**Trong 99% trường hợp, logout/login lại sẽ fix!**

---

*Last updated: November 11, 2025*  
*Fix applied in: frontend/src/components/employees/UploadEmployeeExcel.tsx*

