# 🔄 Token Auto Refresh - Tự động làm mới Token

## ✨ Tính năng

Hệ thống **tự động làm mới token** khi phát hiện token trong localStorage bị mất nhưng user vẫn đang đăng nhập.

---

## 🎯 Vấn đề đã giải quyết

### ❌ Trước đây:
```
Tình huống:
1. User đăng nhập thành công
2. Token được lưu vào localStorage
3. Token bị xóa (do clear cache, privacy mode, etc.)
4. User state vẫn còn (trong React state)
5. Upload Excel → Lỗi: "Phiên đăng nhập đã hết hạn"
6. Phải logout và login lại
```

### ✅ Bây giờ:
```
Tình huống:
1. User đăng nhập thành công
2. Token được lưu vào localStorage
3. Token bị xóa
4. User state vẫn còn
5. Upload Excel → Hệ thống TỰ ĐỘNG:
   - Phát hiện không có token
   - Lấy session từ Supabase
   - Lấy access_token mới
   - Lưu vào localStorage
   - Tiếp tục upload
6. Upload thành công! ✅
```

---

## 🔧 Cách hoạt động

### Logic Flow:

```typescript
async function handleUpload() {
  // 1. Lấy token từ localStorage
  let token = localStorage.getItem('token')
  
  // 2. Kiểm tra: Không có token NHƯNG có currentUser?
  if (!token && currentUser) {
    console.log('⚠️ No token in localStorage, trying to get fresh session...')
    
    try {
      // 3. Lấy session từ Supabase
      const { supabase } = await import('@/lib/supabase')
      const { data: { session } } = await supabase.auth.getSession()
      
      // 4. Nếu có session, lấy access_token
      if (session?.access_token) {
        token = session.access_token
        localStorage.setItem('token', token)
        console.log('✅ Got fresh token from session')
      } else {
        throw new Error('Không thể lấy session. Vui lòng đăng nhập lại.')
      }
    } catch (sessionError) {
      console.error('❌ Failed to get session:', sessionError)
      throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.')
    }
  }
  
  // 5. Final check
  if (!token) {
    throw new Error('Bạn chưa đăng nhập...')
  }
  
  // 6. Tiếp tục upload với token mới
  const response = await fetch('/api/employee-excel/upload-excel', {
    headers: { 'Authorization': `Bearer ${token}` }
  })
}
```

---

## 🔍 Khi nào Token Auto Refresh chạy?

### Scenario 1: Token bị xóa do clear cache
```
User: Clear browser cache
↓
localStorage.clear() → Token bị xóa
↓
User state vẫn còn (trong memory)
↓
Upload → Auto refresh ✅
```

### Scenario 2: Privacy/Incognito mode
```
User: Mở tab incognito
↓
localStorage isolated → Không có token
↓
Nhưng Supabase session vẫn còn
↓
Upload → Auto refresh ✅
```

### Scenario 3: Multiple tabs
```
User: Mở nhiều tab
↓
Tab 1: Logout → Clear localStorage
↓
Tab 2: Upload → Không có token
↓
Nhưng Supabase session vẫn còn
↓
Upload → Auto refresh ✅
```

---

## 📊 Console Logs

### Khi auto refresh thành công:
```
⚠️ No token in localStorage, trying to get fresh session...
🔍 Fetching Supabase session...
✅ Got fresh token from session
🔐 Token found, uploading file...
👤 Current user: admin@test.com
✅ Upload successful
```

### Khi session cũng hết hạn:
```
⚠️ No token in localStorage, trying to get fresh session...
🔍 Fetching Supabase session...
❌ Failed to get session: Error: No session found
❌ Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.
```

---

## 🎨 UI Display

### Khi có currentUser:
```
┌──────────────────────────────────────────┐
│ ✅ Đã xác thực                           │
│ 👤 Admin Test                            │
│ 📧 admin@test.com                        │
│ 🎭 Vai trò: ADMIN                        │
│ 💡 Token sẽ tự động làm mới nếu cần     │
└──────────────────────────────────────────┘
```

**Message mới:** "💡 Token sẽ tự động làm mới nếu cần"
→ User biết hệ thống sẽ tự động xử lý

---

## ⚙️ Implementation Details

### Dynamic Import Supabase
```typescript
// Tại sao dùng dynamic import?
const { supabase } = await import('@/lib/supabase')

// Lý do:
// 1. Tránh SSR issues (Next.js)
// 2. Code splitting
// 3. Chỉ load khi cần
```

### Session vs Token
```typescript
// Session: Supabase auth session (có thể refresh)
const { data: { session } } = await supabase.auth.getSession()

// Access Token: JWT token để gọi API
const token = session.access_token

// Refresh Token: Để lấy access token mới
const refreshToken = session.refresh_token
```

---

## 🔐 Security

### Vẫn đảm bảo an toàn:
```
✅ Token vẫn được verify bởi backend
✅ Session có expiry time
✅ Không bypass authentication
✅ Chỉ refresh khi có valid session
✅ Backend vẫn check permissions
```

### Không làm:
```
❌ Không tạo token giả
❌ Không bypass backend validation
❌ Không expose sensitive data
❌ Không lưu password
```

---

## 🧪 Testing

### Test Case 1: Clear localStorage manually
```
1. Đăng nhập
2. F12 → Console
3. localStorage.clear()
4. Upload Excel
5. Expected: ✅ Auto refresh và upload thành công
```

### Test Case 2: Multiple tabs
```
1. Mở 2 tabs
2. Tab 1: Đăng nhập
3. Tab 2: Upload Excel
4. Expected: ✅ Auto refresh và upload thành công
```

### Test Case 3: Session hết hạn thật sự
```
1. Đăng nhập
2. Đợi token hết hạn (vài giờ)
3. Clear localStorage
4. Upload Excel
5. Expected: ❌ "Phiên đăng nhập đã hết hạn"
```

---

## 🆘 Troubleshooting

### Vấn đề: Auto refresh không hoạt động

**Kiểm tra 1: Có currentUser không?**
```javascript
// F12 > Console
console.log('currentUser:', currentUser)
// Nếu null → Không trigger auto refresh
```

**Kiểm tra 2: Có Supabase session không?**
```javascript
// F12 > Console
import { supabase } from '@/lib/supabase'
const { data: { session } } = await supabase.auth.getSession()
console.log('session:', session)
// Nếu null → Không thể refresh
```

**Kiểm tra 3: Token có expire không?**
```javascript
// F12 > Console
const token = localStorage.getItem('token')
if (token) {
  const payload = JSON.parse(atob(token.split('.')[1]))
  const exp = new Date(payload.exp * 1000)
  console.log('Token expires:', exp)
  console.log('Is expired:', new Date() > exp)
}
```

---

### Vấn đề: Vẫn báo "Phiên đăng nhập đã hết hạn"

**Nguyên nhân:**
- Session Supabase cũng đã hết hạn
- Không có refresh token valid

**Giải pháp:**
```
1. Đăng xuất hoàn toàn
2. Đăng nhập lại
3. Thử upload lại
```

---

## 📋 Best Practices

### 1. Session Lifetime
```
- Default: 1 giờ (access token)
- Refresh token: 7 ngày
- Nên set appropriate expiry trong Supabase settings
```

### 2. Token Storage
```
✅ localStorage cho web apps
✅ SessionStorage cho extra security
✅ Cookies với httpOnly cho production
❌ Không lưu trong plain text files
```

### 3. Error Handling
```
✅ Catch specific errors
✅ Log đầy đủ
✅ User-friendly messages
✅ Fallback to login page
```

---

## 🎯 Benefits

### User Experience:
```
✅ Không phải login lại liên tục
✅ Seamless workflow
✅ Ít frustration
✅ Tăng productivity
```

### Developer Experience:
```
✅ Less support tickets
✅ Better error handling
✅ Clear logs
✅ Easy debugging
```

### Security:
```
✅ Vẫn validate đầy đủ
✅ Session-based
✅ Token expiry
✅ Backend still controls access
```

---

## 🔮 Future Enhancements

Có thể thêm trong tương lai:

1. **Automatic token refresh in background**
   - Set interval check
   - Refresh before expire
   - Silent refresh

2. **Toast notification**
   - "Token đã được làm mới"
   - User aware of what's happening

3. **Retry mechanism**
   - Auto retry failed requests
   - With refreshed token

4. **Session monitoring**
   - Track session health
   - Alert before expire
   - Prompt user to stay logged in

---

## 📚 Related Documentation

- `AUTO_AUTH_EXCEL_UPLOAD.md` - Tự động xác thực
- `FIX_TOKEN_ERROR.md` - Sửa lỗi token
- `AUDIT_TRAIL_EXCEL.md` - Audit trail

---

## 🎉 Conclusion

Token Auto Refresh giúp:
- ✅ Cải thiện UX đáng kể
- ✅ Giảm lỗi "session expired"
- ✅ Seamless workflow
- ✅ Vẫn đảm bảo security

**User không cần lo lắng về token management nữa!** 🎉

---

*Feature: Token Auto Refresh*  
*Version: 2.3*  
*Date: November 11, 2025*  
*Status: ✅ ACTIVE*

