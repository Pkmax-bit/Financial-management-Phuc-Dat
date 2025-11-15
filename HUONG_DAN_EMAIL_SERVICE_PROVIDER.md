# Hướng Dẫn Sử Dụng Email Service Provider Trên Render

## 🔴 Vấn Đề

**Render CHẶN các cổng SMTP** (25, 587, 465), nên Gmail SMTP **KHÔNG HOẠT ĐỘNG** trên Render.

## ✅ Giải Pháp

Sử dụng **Email Service Provider với API HTTP** thay vì SMTP. Các dịch vụ được khuyến nghị:

### 1. **Resend** (Khuyến Nghị - Dễ Dùng Nhất) ⭐

**Ưu điểm:**
- Free tier: 3,000 emails/tháng
- API đơn giản, dễ tích hợp
- Không cần verify domain (có thể dùng email của họ)
- Tốc độ nhanh
- Hỗ trợ tốt cho production

**Cách Setup:**

1. **Đăng ký tài khoản:**
   - Truy cập [https://resend.com](https://resend.com)
   - Đăng ký tài khoản miễn phí
   - Verify email

2. **Tạo API Key:**
   - Vào Dashboard → API Keys
   - Click "Create API Key"
   - Đặt tên: "Render Production"
   - Copy API key (bắt đầu với `re_`)

3. **Cấu hình trong Render:**
   ```
   EMAIL_PROVIDER=resend
   RESEND_API_KEY=re_your_api_key_here
   RESEND_FROM_EMAIL=noreply@yourdomain.com
   ```

4. **Cập nhật code:** (Đã được thêm vào `email_service.py`)

---

### 2. **SendGrid** (Phổ Biến)

**Ưu điểm:**
- Free tier: 100 emails/ngày
- Phổ biến, nhiều tài liệu
- Cần verify domain

**Cách Setup:**

1. **Đăng ký:** [https://sendgrid.com](https://sendgrid.com)
2. **Tạo API Key:** Settings → API Keys → Create API Key
3. **Cấu hình trong Render:**
   ```
   EMAIL_PROVIDER=sendgrid
   SENDGRID_API_KEY=SG.your_api_key_here
   SENDGRID_FROM_EMAIL=noreply@yourdomain.com
   ```

---

### 3. **Mailgun** (Mạnh Mẽ)

**Ưu điểm:**
- Free tier: 5,000 emails/tháng
- Mạnh mẽ, nhiều tính năng
- Cần verify domain

**Cách Setup:**

1. **Đăng ký:** [https://mailgun.com](https://mailgun.com)
2. **Tạo API Key:** Settings → API Keys
3. **Cấu hình trong Render:**
   ```
   EMAIL_PROVIDER=mailgun
   MAILGUN_API_KEY=your_api_key_here
   MAILGUN_DOMAIN=yourdomain.com
   MAILGUN_FROM_EMAIL=noreply@yourdomain.com
   ```

---

### 4. **Postmark** (Chuyên Nghiệp)

**Ưu điểm:**
- Free tier: 100 emails/tháng
- Chuyên nghiệp, deliverability cao
- Cần verify domain

---

## 🚀 Hướng Dẫn Chi Tiết: Resend (Khuyến Nghị)

### Bước 1: Đăng Ký Resend

1. Truy cập [https://resend.com](https://resend.com)
2. Click "Sign Up" → Đăng ký bằng email
3. Verify email của bạn

### Bước 2: Tạo API Key

1. Vào Dashboard → API Keys
2. Click "Create API Key"
3. Đặt tên: "Render Production"
4. Chọn quyền: "Sending access"
5. Copy API key (ví dụ: `re_1234567890abcdef`)

### Bước 3: Cấu Hình Render

Vào Render Dashboard → Backend service → Environment, thêm:

```
EMAIL_PROVIDER=resend
RESEND_API_KEY=re_your_api_key_here
RESEND_FROM_EMAIL=noreply@resend.dev
```

**Lưu ý:** 
- Ban đầu có thể dùng `noreply@resend.dev` (email mặc định của Resend)
- Sau này nên verify domain và dùng email của bạn: `noreply@yourdomain.com`

### Bước 4: Deploy Lại

1. Click "Save Changes"
2. Click "Manual Deploy" → "Deploy latest commit"
3. Kiểm tra logs để đảm bảo không có lỗi

### Bước 5: Test

1. Thử chức năng "Quên mật khẩu"
2. Kiểm tra email inbox
3. Xem logs trong Render Dashboard

---

## 📋 So Sánh Các Dịch Vụ

| Dịch Vụ | Free Tier | Verify Domain | Độ Khó | Khuyến Nghị |
|---------|-----------|--------------|--------|-------------|
| **Resend** | 3,000/tháng | Không bắt buộc | ⭐ Dễ | ✅ **Khuyến nghị** |
| SendGrid | 100/ngày | Bắt buộc | ⭐⭐ Trung bình | ✅ Tốt |
| Mailgun | 5,000/tháng | Bắt buộc | ⭐⭐ Trung bình | ✅ Tốt |
| Postmark | 100/tháng | Bắt buộc | ⭐⭐⭐ Khó | ⚠️ Chuyên nghiệp |

---

## 🔧 Cập Nhật Code

Code đã được cập nhật để hỗ trợ Resend API. Nếu muốn dùng SendGrid hoặc Mailgun, cần cập nhật thêm.

### Kiểm Tra Code Hỗ Trợ

Code hiện tại trong `email_service.py` đã hỗ trợ:
- ✅ Resend API (HTTP)
- ✅ SMTP (cho local development)

---

## ⚠️ Lưu Ý Quan Trọng

1. **KHÔNG** dùng Gmail SMTP trên Render (bị chặn)
2. **NÊN** dùng Resend cho dễ setup
3. **NÊN** verify domain sau khi setup xong
4. **KIỂM TRA** logs sau khi deploy

---

## 🆘 Troubleshooting

### Lỗi: "EMAIL_PROVIDER not set"
- Đảm bảo đã set `EMAIL_PROVIDER=resend` trong Render

### Lỗi: "RESEND_API_KEY not set"
- Đảm bảo đã set `RESEND_API_KEY` với API key đúng

### Lỗi: "Invalid API key"
- Kiểm tra API key có đúng không
- Đảm bảo API key bắt đầu với `re_`

### Email không đến
- Kiểm tra spam folder
- Kiểm tra logs trong Render Dashboard
- Kiểm tra email address có đúng không

---

## 📚 Tài Liệu Tham Khảo

- [Resend Documentation](https://resend.com/docs)
- [SendGrid Documentation](https://docs.sendgrid.com)
- [Mailgun Documentation](https://documentation.mailgun.com)
- [Render Email Guide](https://render.com/docs/email)

---

**Cập nhật lần cuối**: 2025-01-XX

