# 🔥 QUICK FIX: Email Không Hoạt Động Trên Render

## ⚠️ VẤN ĐỀ

**Render CHẶN các cổng SMTP** (25, 587, 465), nên **Gmail SMTP KHÔNG HOẠT ĐỘNG** trên Render.

## ✅ GIẢI PHÁP NHANH: Sử Dụng Resend (5 Phút)

### Bước 1: Đăng Ký Resend (2 phút)

1. Truy cập: https://resend.com
2. Click "Sign Up" → Đăng ký bằng email
3. Verify email của bạn

### Bước 2: Tạo API Key (1 phút)

1. Vào Dashboard → **API Keys**
2. Click **"Create API Key"**
3. Đặt tên: "Render Production"
4. Copy API key (bắt đầu với `re_`)
   - **⚠️ QUAN TRỌNG**: API key chỉ hiển thị **MỘT LẦN DUY NHẤT**
   - Copy ngay và lưu lại ở nơi an toàn
   - Ví dụ API key: `re_1234567890abcdefghijklmnopqrstuvwxyz`

### Bước 3: Cấu Hình Render (1 phút)

Vào **Render Dashboard** → **Backend service** → **Environment**, thêm:

```
EMAIL_PROVIDER=resend
RESEND_API_KEY=re_your_api_key_here
RESEND_FROM_EMAIL=noreply@resend.dev
```

**Lưu ý:** 
- Thay `re_your_api_key_here` bằng API key thực tế của bạn (từ Bước 2)
- API key thực tế có dạng: `re_1234567890abcdefghijklmnopqrstuvwxyz`
- **KHÔNG** có dấu cách, **KHÔNG** có dấu ngoặc kép
- Xem file `HUONG_DAN_LAY_RESEND_API_KEY.md` để biết chi tiết cách lấy API key

### Bước 4: Deploy Lại (1 phút)

1. Click **"Save Changes"**
2. Click **"Manual Deploy"** → **"Deploy latest commit"**

### Bước 5: Test

1. Thử chức năng "Quên mật khẩu"
2. Kiểm tra email inbox
3. Xem logs trong Render Dashboard

---

## ✅ XONG!

Sau khi setup, email sẽ hoạt động bình thường trên Render.

---

## 📚 Chi Tiết

Xem file `HUONG_DAN_EMAIL_SERVICE_PROVIDER.md` để biết thêm chi tiết và các lựa chọn khác.

---

**Cập nhật:** Code đã được cập nhật để hỗ trợ Resend API. Chỉ cần cấu hình environment variables như trên.

