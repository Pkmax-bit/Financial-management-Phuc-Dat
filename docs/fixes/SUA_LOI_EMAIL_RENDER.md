# Sửa Lỗi Email Trên Render - Gửi Email Quên Mật Khẩu và Báo Giá

## 🔴 Vấn Đề

Không thể gửi email quên mật khẩu, đổi mật khẩu và gửi báo giá trên Render host.

## ✅ Đã Sửa (2025-01-XX)

Code đã được cập nhật để:
- ✅ Sử dụng thread pool executor để chạy SMTP operations (tránh block async event loop)
- ✅ Thêm timeout cho SMTP connections (30 giây mặc định, có thể config qua `SMTP_TIMEOUT`)
- ✅ Cải thiện error handling với logging chi tiết
- ✅ Hỗ trợ cả `SMTP_USER` và `SMTP_USERNAME` (backward compatibility)

## 🔍 Nguyên Nhân Có Thể

### 1. Biến Môi Trường SMTP Không Được Cấu Hình Đúng

**Triệu chứng**: Logs hiển thị "Email credentials not configured"

**Nguyên nhân**: 
- Biến môi trường `SMTP_USER` hoặc `SMTP_PASSWORD` không được set trong Render Dashboard
- Tên biến không đúng (phải là `SMTP_USER`, không phải `SMTP_USERNAME`)

**Giải pháp**:
1. Vào Render Dashboard → Chọn backend service
2. Vào tab **"Environment"**
3. Đảm bảo có các biến sau:
   ```
   SMTP_USER=your-email@gmail.com
   SMTP_PASSWORD=your-app-password
   SMTP_SERVER=smtp.gmail.com
   SMTP_PORT=587
   EMAIL_DEBUG=1
   ```
4. Click **"Save Changes"**
5. Click **"Manual Deploy"** → **"Deploy latest commit"**

### 2. Lỗi SMTP Authentication (535 Authentication Failed)

**Triệu chứng**: Logs hiển thị "SMTP Authentication Error"

**Nguyên nhân**:
- Sử dụng mật khẩu Gmail thông thường thay vì App Password
- Gmail chặn đăng nhập từ ứng dụng không an toàn
- App Password không đúng

**Giải pháp**:

#### Bước 1: Tạo Gmail App Password

1. Đăng nhập vào [Google Account](https://myaccount.google.com/)
2. Vào **Security** (Bảo mật)
3. Bật **2-Step Verification** (Xác minh 2 bước) nếu chưa bật
4. Vào **App passwords** (Mật khẩu ứng dụng)
5. Chọn **Mail** và **Other (Custom name)**
6. Nhập tên: "Render Email Service"
7. Click **Generate** (Tạo)
8. Copy mật khẩu 16 ký tự (ví dụ: `abcd efgh ijkl mnop`)

#### Bước 2: Cập Nhật SMTP_PASSWORD Trong Render

1. Vào Render Dashboard → Backend service → Environment
2. Cập nhật `SMTP_PASSWORD` với App Password vừa tạo (bỏ khoảng trắng):
   ```
   SMTP_PASSWORD=abcdefghijklmnop
   ```
3. Click **"Save Changes"**
4. Click **"Manual Deploy"** → **"Deploy latest commit"**

### 3. Lỗi SMTP Connection (Không Kết Nối Được SMTP Server)

**Triệu chứng**: Logs hiển thị "SMTP Connection Error"

**Nguyên nhân**:
- Port 587 bị chặn bởi firewall
- SMTP_SERVER hoặc SMTP_PORT không đúng
- Render network restrictions

**Giải pháp**:

1. **Kiểm tra SMTP_SERVER và SMTP_PORT**:
   ```
   SMTP_SERVER=smtp.gmail.com
   SMTP_PORT=587
   ```

2. **Thử Port 465 với SSL** (nếu port 587 không hoạt động):
   - Cập nhật code để hỗ trợ SSL (cần sửa code)
   - Hoặc liên hệ Render support để kiểm tra firewall

3. **Kiểm tra Logs trong Render Dashboard**:
   - Vào tab **"Logs"**
   - Tìm các dòng có "SMTP Connection Error"
   - Xem chi tiết lỗi

### 4. Gmail Chặn Kết Nối Từ Render IP

**Triệu chứng**: Authentication thành công nhưng không gửi được email

**Nguyên nhân**: Gmail có thể chặn kết nối từ các IP lạ hoặc shared hosting

**Giải pháp**:

1. **Kiểm tra Gmail Security Alerts**:
   - Vào [Google Account Security](https://myaccount.google.com/security)
   - Xem có cảnh báo "Sign-in attempt blocked" không
   - Nếu có, click "Yes, it was me" để cho phép

2. **Sử dụng Email Service Provider Khác**:
   - **SendGrid**: Free tier 100 emails/day
   - **Mailgun**: Free tier 5,000 emails/month
   - **Amazon SES**: Pay-as-you-go
   - **Resend**: Free tier 3,000 emails/month

### 5. Timeout Issues

**Triệu chứng**: Email không gửi được, không có lỗi rõ ràng

**Nguyên nhân**: Render free tier có timeout limits

**Giải pháp**:
- Upgrade lên paid plan
- Hoặc sử dụng background tasks với timeout dài hơn

## ✅ Cách Kiểm Tra

### 1. Kiểm Tra Biến Môi Trường

Vào Render Dashboard → Backend service → Environment, đảm bảo có:

```
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_TIMEOUT=30
EMAIL_DEBUG=1
```

### 2. Kiểm Tra Logs

1. Vào Render Dashboard → Backend service → Logs
2. Thử gửi email quên mật khẩu hoặc báo giá
3. Xem logs để tìm lỗi:
   - `❌ Email credentials not configured` → Thiếu biến môi trường
   - `❌ SMTP Authentication Error` → Sai mật khẩu hoặc cần App Password
   - `❌ SMTP Connection Error` → Không kết nối được SMTP server

### 3. Test Email Service

Tạo một endpoint test (tạm thời) để kiểm tra:

```python
@router.post("/test-email")
async def test_email():
    from services.email_service import email_service
    result = await email_service.send_password_reset_email(
        user_email="test@example.com",
        user_name="Test User",
        reset_link="https://example.com/reset?token=test"
    )
    return {"success": result}
```

## 🔧 Các Bước Sửa Lỗi Chi Tiết

### Bước 1: Kiểm Tra Biến Môi Trường

1. Vào [Render Dashboard](https://dashboard.render.com)
2. Chọn backend service
3. Vào tab **"Environment"**
4. Kiểm tra các biến:
   - `SMTP_USER` (phải có)
   - `SMTP_PASSWORD` (phải có)
   - `SMTP_SERVER` (mặc định: `smtp.gmail.com`)
   - `SMTP_PORT` (mặc định: `587`)
   - `EMAIL_DEBUG=1` (khuyến nghị để debug)

### Bước 2: Tạo Gmail App Password

1. Vào [Google Account](https://myaccount.google.com/)
2. **Security** → **2-Step Verification** (bật nếu chưa)
3. **App passwords** → Tạo mới
4. Copy App Password (16 ký tự)

### Bước 3: Cập Nhật SMTP_PASSWORD

1. Vào Render Dashboard → Backend service → Environment
2. Cập nhật `SMTP_PASSWORD` với App Password
3. Save và Deploy lại

### Bước 4: Kiểm Tra Logs

1. Vào tab **"Logs"**
2. Thử gửi email
3. Xem logs để tìm lỗi cụ thể

### Bước 5: Test Lại

1. Thử chức năng "Quên mật khẩu"
2. Thử gửi báo giá
3. Kiểm tra email inbox (và spam folder)

## 📋 Checklist

- [ ] Biến môi trường `SMTP_USER` đã được set trong Render
- [ ] Biến môi trường `SMTP_PASSWORD` đã được set (sử dụng App Password)
- [ ] Biến môi trường `SMTP_SERVER` = `smtp.gmail.com`
- [ ] Biến môi trường `SMTP_PORT` = `587`
- [ ] Biến môi trường `EMAIL_DEBUG` = `1` (để debug)
- [ ] Gmail 2-Step Verification đã bật
- [ ] Gmail App Password đã được tạo
- [ ] Backend service đã được deploy lại sau khi cập nhật env vars
- [ ] Đã kiểm tra logs không có lỗi
- [ ] Đã test gửi email thành công

## 🚨 Lưu Ý Quan Trọng

1. **KHÔNG** sử dụng mật khẩu Gmail thông thường, phải dùng **App Password**
2. **KHÔNG** commit App Password lên GitHub
3. **KHÔNG** hardcode credentials trong code
4. Luôn sử dụng biến môi trường trong Render Dashboard
5. Gmail có thể chặn nếu phát hiện hoạt động bất thường
6. Render free tier có thể có giới hạn về network connections

## 🔄 Nếu Vẫn Không Hoạt Động

### Option 1: Sử dụng Email Service Provider Khác

**SendGrid** (Free: 100 emails/day):
```
SMTP_SERVER=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=your-sendgrid-api-key
```

**Mailgun** (Free: 5,000 emails/month):
```
SMTP_SERVER=smtp.mailgun.org
SMTP_PORT=587
SMTP_USER=postmaster@your-domain.mailgun.org
SMTP_PASSWORD=your-mailgun-password
```

### Option 2: Liên Hệ Hỗ Trợ

1. Xem logs chi tiết trong Render Dashboard
2. Copy toàn bộ error message
3. Liên hệ Render Support hoặc tạo issue trên GitHub

## 📚 Tài Liệu Tham Khảo

- [Gmail App Passwords](https://support.google.com/accounts/answer/185833)
- [Render Environment Variables](https://render.com/docs/environment-variables)
- [SMTP Configuration Guide](https://render.com/docs/smtp)

---

**Cập nhật lần cuối**: 2025-01-XX

