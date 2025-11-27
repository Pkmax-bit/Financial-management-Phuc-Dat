# Hướng dẫn kết hợp n8n vào Web Application

Hướng dẫn chi tiết từng bước để tích hợp n8n vào hệ thống web của bạn.

## 📋 Tổng quan các bước

1. ✅ Import workflow vào n8n
2. ✅ Cấu hình SMTP trong n8n
3. ✅ Lấy Webhook URL từ n8n
4. ✅ Cấu hình biến môi trường trong backend
5. ✅ Test kết nối
6. ✅ Kiểm tra hoạt động

---

## Bước 1: Import Workflow vào n8n

### 1.1. Truy cập n8n

- Mở trình duyệt và truy cập n8n instance của bạn
- Đăng nhập vào n8n

### 1.2. Import Workflow từ URL (Khuyến nghị)

1. Click vào menu (☰) ở góc trên bên trái
2. Chọn **"Workflows"**
3. Click nút **"+"** hoặc **"Add workflow"**
4. Chọn **"Import from URL"**
5. Dán URL: `https://brain.ai.vn/workflow/7xQoffxB4DjOeeNq`
6. Click **"Import"**
7. Workflow sẽ được tạo tự động với tên "Email Unified - Phúc Đạt"

**Hoặc import từ file:**
- Chọn **"Import from File"**
- Chọn file `n8n_blueprints/email_unified_blueprint.json`

---

## Bước 2: Cấu hình SMTP trong n8n

### 2.1. Tạo SMTP Credentials

1. Trong workflow vừa import, click vào node **"Gửi Email Password"** (hoặc bất kỳ node "Gửi Email" nào)
2. Trong phần **"Credential to connect with"**, click **"Create New Credential"**
3. Chọn loại: **SMTP**
4. Điền thông tin SMTP:

#### Nếu dùng Gmail:
```
User: your-email@gmail.com
Password: [App Password - không phải mật khẩu thường]
Host: smtp.gmail.com
Port: 587
Secure: TLS
```

**Lưu ý:** Cần tạo App Password từ Gmail:
1. Vào Google Account → Security
2. Bật 2-Step Verification
3. Tạo App Password cho "Mail"
4. Dùng App Password này (16 ký tự)

#### Nếu dùng SendGrid:
```
User: apikey
Password: [SendGrid API Key]
Host: smtp.sendgrid.net
Port: 587
Secure: TLS
```

#### Nếu dùng SMTP khác:
```
User: [Email của bạn]
Password: [Mật khẩu email]
Host: [SMTP server]
Port: 587 (TLS) hoặc 465 (SSL)
Secure: TLS hoặc SSL
```

### 2.2. Test SMTP Connection

1. Click nút **"Test"** trong credential form
2. Nếu thành công, bạn sẽ thấy thông báo "Connection successful"
3. Click **"Save"** để lưu credentials

### 2.3. Áp dụng Credentials cho tất cả nodes

1. Click vào từng node **"Gửi Email"** trong workflow
2. Chọn credentials vừa tạo từ dropdown
3. Lưu workflow

---

## Bước 3: Lấy Webhook URL

### 3.1. Lấy URL từ n8n

1. Click vào node **"Webhook - Unified"** trong workflow
2. Trong phần **"Webhook URL"**, bạn sẽ thấy:
   - **Production URL**: URL để dùng trong production
   - **Test URL**: URL để test (chỉ hoạt động khi workflow đang mở)

3. **Copy Production URL**, ví dụ:
   ```
   https://your-n8n-instance.com/webhook/email
   ```
   hoặc
   ```
   https://your-n8n-instance.com/webhook/unified-email-webhook
   ```

### 3.2. Activate Workflow

1. Click công tắc ở góc trên bên phải của workflow
2. Workflow sẽ chuyển sang trạng thái **"Active"** (màu xanh)
3. **Lưu ý:** Workflow phải được activate thì webhook mới hoạt động!

---

## Bước 4: Cấu hình biến môi trường trong Backend

### 4.1. Nếu chạy Local (Development)

1. Mở file `.env` trong thư mục `backend/`
2. Thêm hoặc cập nhật các biến sau:

```bash
# Email Provider - Chọn n8n
EMAIL_PROVIDER="n8n"

# n8n Webhook URL (bắt buộc)
N8N_WEBHOOK_URL="https://your-n8n-instance.com/webhook/email"

# n8n Webhook ID (tùy chọn - nếu n8n yêu cầu)
N8N_WEBHOOK_ID="your_webhook_id_here"

# n8n API Key (tùy chọn - nếu n8n yêu cầu xác thực)
N8N_API_KEY="your_n8n_api_key_here"

# Bật debug để xem log chi tiết
EMAIL_DEBUG="1"
```

3. **Lưu file** `.env`

### 4.2. Nếu deploy trên Render (Production)

1. Vào **Render Dashboard** → Chọn **Backend service**
2. Click vào tab **"Environment"**
3. Thêm các biến môi trường sau:

```
EMAIL_PROVIDER=n8n
N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook/email
N8N_WEBHOOK_ID=your_webhook_id_here
N8N_API_KEY=your_n8n_api_key_here
EMAIL_DEBUG=1
```

4. **Lưu** và **Redeploy** service

### 4.3. Nếu deploy trên server khác

- Thêm các biến môi trường tương tự vào file `.env` hoặc cấu hình của server

---

## Bước 5: Test kết nối

### 5.1. Test từ Backend (Local)

1. **Khởi động backend:**
   ```bash
   cd backend
   python -m uvicorn main:app --reload
   ```

2. **Kiểm tra log khi khởi động:**
   - Nếu thấy: `📧 Email Service initialized with provider: n8n` → OK
   - Nếu thấy: `n8n Webhook URL: SET` → OK

3. **Test chức năng "Quên mật khẩu":**
   - Mở frontend: `http://localhost:3000/forgot-password`
   - Nhập email và submit
   - Kiểm tra log backend:
     ```
     ✅ Email sent via n8n to user@example.com (Status: 200)
     ```

4. **Kiểm tra trong n8n:**
   - Vào n8n → Workflows → Chọn workflow
   - Click vào tab **"Executions"**
   - Bạn sẽ thấy execution mới với status "Success" (màu xanh)

### 5.2. Test với curl

```bash
curl -X POST https://your-n8n-instance.com/webhook/email \
  -H "Content-Type: application/json" \
  -d '{
    "to_email": "test@example.com",
    "subject": "Test Email",
    "html_content": "<h1>Test</h1>",
    "text_content": "Test",
    "email_type": "password_reset",
    "metadata": {
      "user_name": "Test User",
      "reset_link": "https://example.com/reset?token=test123",
      "expire_minutes": 30
    }
  }'
```

**Kết quả mong đợi:**
```json
{
  "success": true,
  "message": "Email đã được gửi thành công",
  "to": "test@example.com",
  "email_type": "password_reset"
}
```

### 5.3. Test từ Frontend

1. **Test "Quên mật khẩu":**
   - Vào `/forgot-password`
   - Nhập email hợp lệ
   - Submit
   - Kiểm tra email inbox

2. **Test "Gửi báo giá":**
   - Vào trang báo giá
   - Chọn một báo giá
   - Click "Gửi email"
   - Kiểm tra email inbox

---

## Bước 6: Kiểm tra hoạt động

### 6.1. Kiểm tra trong n8n

1. **Xem Executions:**
   - Vào workflow → Tab **"Executions"**
   - Xem các execution đã chạy
   - Click vào execution để xem chi tiết

2. **Kiểm tra lỗi:**
   - Nếu execution có status "Error" (màu đỏ)
   - Click vào để xem log lỗi
   - Thường gặp:
     - SMTP credentials sai
     - Email không hợp lệ
     - Network timeout

### 6.2. Kiểm tra trong Backend Log

**Log thành công:**
```
✅ Email sent via n8n to user@example.com (Status: 200)
   n8n Response: {"success": true, "message": "Email đã được gửi thành công"}
```

**Log lỗi:**
```
❌ n8n Webhook Error (404): Not Found
   → Kiểm tra N8N_WEBHOOK_URL có đúng không
   → Kiểm tra workflow đã được activate chưa

❌ n8n Webhook Timeout
   → Kiểm tra network connectivity
   → Kiểm tra n8n instance có đang chạy không
```

### 6.3. Kiểm tra Email đã được gửi

1. **Kiểm tra inbox** của email nhận
2. **Kiểm tra spam folder** nếu không thấy
3. **Kiểm tra trong n8n execution** xem email có được gửi thành công không

---

## Troubleshooting

### ❌ Lỗi: N8N_WEBHOOK_URL not set

**Nguyên nhân:** Biến môi trường chưa được set

**Giải pháp:**
1. Kiểm tra file `.env` có `N8N_WEBHOOK_URL` chưa
2. Kiểm tra biến môi trường trong Render Dashboard
3. Restart backend sau khi thêm biến

### ❌ Lỗi: n8n Webhook Error (404)

**Nguyên nhân:** 
- Webhook URL sai
- Workflow chưa được activate

**Giải pháp:**
1. Kiểm tra Webhook URL trong n8n có đúng không
2. Đảm bảo workflow đã được activate (công tắc màu xanh)
3. Copy lại Production URL từ n8n

### ❌ Lỗi: n8n Webhook Timeout

**Nguyên nhân:**
- Network connectivity issues
- n8n instance không accessible

**Giải pháp:**
1. Kiểm tra n8n instance có đang chạy không
2. Kiểm tra firewall/network rules
3. Test webhook URL bằng curl

### ❌ Email không được gửi

**Nguyên nhân:**
- SMTP credentials sai
- Email address không hợp lệ

**Giải pháp:**
1. Kiểm tra SMTP credentials trong n8n
2. Test SMTP connection trong n8n
3. Kiểm tra execution log trong n8n để xem lỗi chi tiết

### ❌ Backend vẫn dùng SMTP thay vì n8n

**Nguyên nhân:**
- `EMAIL_PROVIDER` chưa được set hoặc set sai

**Giải pháp:**
1. Kiểm tra `EMAIL_PROVIDER="n8n"` trong `.env`
2. Restart backend
3. Kiểm tra log khi khởi động: `Email Service initialized with provider: n8n`

---

## Checklist hoàn thành

- [ ] Workflow đã được import vào n8n
- [ ] SMTP credentials đã được cấu hình trong n8n
- [ ] Workflow đã được activate
- [ ] Webhook URL đã được copy
- [ ] Biến môi trường `EMAIL_PROVIDER="n8n"` đã được set
- [ ] Biến môi trường `N8N_WEBHOOK_URL` đã được set
- [ ] Backend đã được restart
- [ ] Test "Quên mật khẩu" thành công
- [ ] Test "Gửi báo giá" thành công
- [ ] Email đã được nhận trong inbox

---

## Kết quả mong đợi

Sau khi hoàn thành tất cả các bước:

✅ **Email quên mật khẩu** sẽ được gửi qua n8n  
✅ **Email báo giá** sẽ được gửi qua n8n  
✅ **Email xác nhận đổi mật khẩu** sẽ được gửi qua n8n  
✅ Tất cả email sẽ được xử lý bởi n8n workflow  
✅ Có thể theo dõi và quản lý email trong n8n dashboard  

---

## Hỗ trợ

Nếu gặp vấn đề:
1. Kiểm tra log trong backend
2. Kiểm tra executions trong n8n
3. Xem tài liệu chi tiết trong `HUONG_DAN_TICH_HOP_N8N.md`
4. Xem troubleshooting section ở trên









