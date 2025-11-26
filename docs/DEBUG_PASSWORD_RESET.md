# Hướng Dẫn Debug Chức Năng Quên Mật Khẩu Trên Render

## 🔍 Vấn Đề Thường Gặp

Khi chức năng quên mật khẩu không hoạt động trên Render, có thể do các nguyên nhân sau:

### 1. **FRONTEND_URL Chưa Được Cấu Hình**

**Vấn đề**: Backend không biết URL frontend để tạo link reset password.

**Giải pháp**:
1. Vào Render Dashboard → Backend Service → Environment
2. Thêm biến môi trường:
   ```
   FRONTEND_URL=https://your-frontend-url.onrender.com
   ```
   (Thay `your-frontend-url` bằng URL frontend thực tế của bạn)

3. Sau khi thêm, restart service:
   - Vào Backend Service → Manual Deploy → Clear build cache & deploy

### 2. **Email Service Không Hoạt Động**

**Vấn đề**: SMTP credentials không đúng hoặc không được set.

**Kiểm tra**:
1. Vào Render Dashboard → Backend Service → Environment
2. Kiểm tra các biến sau:
   ```
   SMTP_SERVER=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USERNAME=your-email@gmail.com
   SMTP_PASSWORD=your-app-password
   ```

**Lưu ý cho Gmail**:
- Phải dùng **App Password**, không phải mật khẩu thường
- Bật 2-Step Verification trước
- Tạo App Password tại: https://myaccount.google.com/apppasswords

### 3. **CORS Configuration**

**Vấn đề**: Frontend URL chưa được thêm vào CORS allowed origins.

**Giải pháp**:
1. Vào Render Dashboard → Backend Service → Environment
2. Thêm hoặc cập nhật:
   ```
   ENVIRONMENT=production
   FRONTEND_URL=https://your-frontend-url.onrender.com
   ```

### 4. **Kiểm Tra Logs**

**Cách kiểm tra**:
1. Vào Render Dashboard → Backend Service → Logs
2. Tìm các log có prefix:
   - `📧` - Email sending attempts
   - `✅` - Success messages
   - `❌` - Error messages
   - `⚠️` - Warnings

**Log mẫu khi thành công**:
```
📧 Attempting to send password reset email to user@example.com
🔌 Connecting to SMTP server smtp.gmail.com:587...
✅ Connected to SMTP server
🔐 Starting TLS...
✅ TLS started
🔑 Authenticating with SMTP server...
✅ Authenticated successfully
📤 Sending email to user@example.com...
✅ Email sent successfully
✅ Password reset email sent successfully to user@example.com
```

**Log mẫu khi lỗi**:
```
❌ SMTP Authentication Error: (535, '5.7.8 Username and Password not accepted')
   Check SMTP_USERNAME and SMTP_PASSWORD environment variables
```

## 🔧 Các Bước Debug

### Bước 1: Kiểm Tra Environment Variables

```bash
# Trong Render Dashboard, kiểm tra các biến sau:
FRONTEND_URL=https://your-frontend.onrender.com
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
ENVIRONMENT=production
```

### Bước 2: Test API Endpoint

Sử dụng curl hoặc Postman để test:

```bash
curl -X POST https://your-backend.onrender.com/api/auth/password-reset/request \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'
```

**Response thành công**:
```json
{
  "message": "Nếu email tồn tại trong hệ thống, chúng tôi đã gửi hướng dẫn đặt lại mật khẩu."
}
```

### Bước 3: Kiểm Tra Email

1. Kiểm tra inbox của email đã đăng ký
2. Kiểm tra thư mục Spam/Junk
3. Kiểm tra logs trong Render để xem email có được gửi không

### Bước 4: Test Reset Link

Nếu nhận được email, click vào link và kiểm tra:
- Link có đúng format: `https://your-frontend.onrender.com/reset-password?token=...`
- Token có hợp lệ không
- Frontend có load được trang reset password không

## 🛠️ Sửa Lỗi Thường Gặp

### Lỗi: "FRONTEND_URL is not set"

**Nguyên nhân**: Biến `FRONTEND_URL` chưa được set trong Render.

**Giải pháp**:
1. Vào Render Dashboard → Backend Service → Environment
2. Thêm: `FRONTEND_URL=https://your-frontend-url.onrender.com`
3. Restart service

### Lỗi: "SMTP Authentication Error"

**Nguyên nhân**: SMTP credentials không đúng.

**Giải pháp**:
1. Kiểm tra `SMTP_USERNAME` và `SMTP_PASSWORD`
2. Với Gmail, phải dùng App Password
3. Đảm bảo 2-Step Verification đã bật

### Lỗi: "SMTP Connection Error"

**Nguyên nhân**: Không kết nối được SMTP server.

**Giải pháp**:
1. Kiểm tra `SMTP_SERVER` và `SMTP_PORT`
2. Kiểm tra firewall/network restrictions
3. Thử dùng SMTP server khác (nếu có)

### Lỗi: Email không đến

**Nguyên nhân**: Email bị spam filter hoặc SMTP config sai.

**Giải pháp**:
1. Kiểm tra thư mục Spam
2. Kiểm tra logs để xem email có được gửi không
3. Test với email khác
4. Kiểm tra SMTP configuration

## 📝 Checklist Trước Khi Deploy

- [ ] `FRONTEND_URL` đã được set đúng trong Render
- [ ] `SMTP_SERVER`, `SMTP_PORT`, `SMTP_USERNAME`, `SMTP_PASSWORD` đã được set
- [ ] `ENVIRONMENT=production` đã được set
- [ ] Frontend URL đã được thêm vào CORS allowed origins
- [ ] Gmail App Password đã được tạo (nếu dùng Gmail)
- [ ] Đã test API endpoint với curl/Postman
- [ ] Đã kiểm tra logs trong Render

## 🆘 Liên Hệ Hỗ Trợ

Nếu vẫn gặp vấn đề sau khi làm theo hướng dẫn:
1. Copy logs từ Render Dashboard
2. Copy response từ API test
3. Mô tả chi tiết các bước đã thực hiện


