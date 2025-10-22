# Hướng dẫn debug role Supplier không thể cập nhật chi phí

## 🔍 Vấn đề
Role Supplier không thể cập nhật chi phí dự án thực tế.

## 🛠️ Các bước debug

### 1. Kiểm tra Browser Console
1. Mở trang web và nhấn **F12** để mở Developer Tools
2. Chuyển sang tab **Console**
3. Tìm các log sau:
   - `🔄 Mapped workshop_employee to Supplier`
   - `✅ Loaded user role: Supplier`
   - `🔍 canEdit check:` với thông tin userRole

### 2. Kiểm tra User Role trong Database
```sql
-- Kiểm tra role của user hiện tại
SELECT id, email, role FROM users WHERE email = 'your-email@example.com';

-- Nếu role là 'workshop_employee', cần đổi thành 'Supplier'
UPDATE users SET role = 'Supplier' WHERE email = 'your-email@example.com';
```

### 3. Kiểm tra Session
1. Trong Console, chạy:
```javascript
// Kiểm tra session
const { data: { session } } = await supabase.auth.getSession();
console.log('Session:', session);

// Kiểm tra user role
const { data: userData } = await supabase
  .from('users')
  .select('role')
  .eq('id', session.user.id)
  .single();
console.log('User role:', userData.role);
```

### 4. Kiểm tra Network Requests
1. Mở tab **Network** trong Developer Tools
2. Thử cập nhật chi phí
3. Kiểm tra request có lỗi 403 không
4. Xem response message

## 🔧 Các giải pháp thường gặp

### Giải pháp 1: Cập nhật role trong database
```sql
-- Đổi role từ workshop_employee sang Supplier
UPDATE users SET role = 'Supplier' WHERE role = 'workshop_employee';
```

### Giải pháp 2: Logout và login lại
1. Logout khỏi hệ thống
2. Login lại
3. Kiểm tra role đã được load đúng chưa

### Giải pháp 3: Clear browser cache
1. Nhấn **Ctrl + Shift + R** để hard refresh
2. Hoặc clear browser cache hoàn toàn

### Giải pháp 4: Kiểm tra role mapping
Trong code, role `workshop_employee` sẽ được map thành `Supplier`:
```typescript
if (userData.role === 'workshop_employee') {
  mappedRole = 'Supplier'
}
```

## 🎯 Các role được phép cập nhật chi phí

- `admin` - Quản trị viên
- `accountant` - Kế toán  
- `manager` - Quản lý
- `Supplier` - Nhà cung cấp
- `vận chuyển` - Vận chuyển
- `nhân công` - Nhân công

## 📋 Checklist Debug

- [ ] Kiểm tra browser console có log role loading không
- [ ] Kiểm tra user role trong database
- [ ] Kiểm tra session có hợp lệ không
- [ ] Kiểm tra network requests có lỗi không
- [ ] Thử logout/login lại
- [ ] Clear browser cache
- [ ] Kiểm tra role mapping có hoạt động không

## 🚨 Lỗi thường gặp

1. **"Requires manager or admin role"** - Role không được phép
2. **Session expired** - Cần login lại
3. **Role not loaded** - Frontend không load được role
4. **Database role incorrect** - Role trong DB không đúng

## 📞 Hỗ trợ

Nếu vẫn không giải quyết được, hãy:
1. Chụp screenshot console logs
2. Ghi lại các bước đã thử
3. Cung cấp thông tin user role trong database
