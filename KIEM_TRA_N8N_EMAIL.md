# Hướng Dẫn Kiểm Tra Email Có Gửi Qua n8n Không

## ⚠️ VẤN ĐỀ: Không Thấy Execution Trong n8n

Nếu bạn không thấy execution trong n8n, có nghĩa là **email KHÔNG được gửi qua n8n**. Hãy làm theo các bước sau để kiểm tra và sửa.

---

## 🔍 Bước 1: Kiểm Tra Cấu Hình Hiện Tại (QUAN TRỌNG NHẤT)

### Bước 1: Kiểm tra cấu hình email

**Mở trình duyệt và truy cập:**
```
http://localhost:8000/api/auth/email-config
```

**Kết quả mong đợi nếu đã cấu hình n8n:**
```json
{
  "email_provider": "n8n",  ← PHẢI LÀ "n8n"
  "n8n_webhook_url": "https://brain.ai.vn/webhook/email",  ← PHẢI CÓ URL
  "n8n_webhook_id": "NOT SET",
  "n8n_api_key": "NOT SET",
  "resend_api_key": "NOT SET",
  "smtp_configured": true,
  "debug_mode": true,
  "env_email_provider": "n8n",  ← PHẢI LÀ "n8n"
  "env_n8n_webhook_url": "https://brain.ai.vn/webhook/email"  ← PHẢI CÓ URL
}
```

**❌ Nếu chưa cấu hình n8n (VẤN ĐỀ):**
```json
{
  "email_provider": "smtp",  ← SAI! Phải là "n8n"
  "n8n_webhook_url": "NOT SET",  ← SAI! Phải có URL
  ...
}
```

**👉 Nếu thấy `email_provider: "smtp"` → Email đang gửi qua SMTP, KHÔNG phải n8n!**

---

## 🔍 Cách 2: Kiểm Tra Log Khi Gửi Email

### Bước 1: Bật debug mode

Thêm vào file `.env`:
```bash
EMAIL_DEBUG=1
```

### Bước 2: Test gửi email

1. Vào trang `/forgot-password`
2. Nhập email test
3. Click "Test gửi email qua n8n"
4. Xem log trong console backend

**Log mong đợi nếu gửi qua n8n:**
```
🔍 Testing email with provider: n8n
   n8n Webhook URL: https://brain.ai.vn/webhook/email
📧 Sending test email to: test@example.com
   Provider: n8n
   n8n Webhook: https://brain.ai.vn/webhook/email
✅ Email sent via n8n to test@example.com (Status: 200)
   n8n Response: {"success": true, "message": "Email đã được gửi thành công", ...}
```

**Log nếu gửi qua SMTP:**
```
🔍 Testing email with provider: smtp
📧 Sending test email to: test@example.com
   Provider: smtp
✅ Password reset email sent successfully to test@example.com
```

---

## 🔍 Cách 3: Kiểm Tra Trong n8n

### Bước 1: Mở n8n workflow

1. Đăng nhập vào n8n: https://brain.ai.vn
2. Vào **Workflows**
3. Tìm workflow **"Email Unified - Phúc Đạt"**

### Bước 2: Xem Executions

1. Click vào workflow
2. Vào tab **"Executions"** (ở trên cùng)
3. Xem các execution gần đây:
   - ✅ **Success** (màu xanh): Email đã được gửi thành công qua n8n
   - ❌ **Error** (màu đỏ): Có lỗi xảy ra

### Bước 3: Xem chi tiết execution

1. Click vào một execution
2. Xem các node:
   - **Webhook - Unified**: Nhận request từ backend
   - **Set - Lấy dữ liệu**: Lấy dữ liệu từ webhook
   - **Switch - Phân loại Email**: Phân loại email type
   - **Gửi Email**: Gửi email qua SMTP

**Nếu thấy execution trong n8n** → Email đã được gửi qua n8n ✅

**Nếu không thấy execution** → Email không được gửi qua n8n ❌

---

## 🔍 Cách 4: Test Trực Tiếp Webhook n8n

### Bước 1: Test với curl

Mở terminal và chạy:

```bash
curl -X POST https://brain.ai.vn/webhook/email \
  -H "Content-Type: application/json" \
  -d '{
    "to_email": "your-email@example.com",
    "subject": "Test Email từ n8n",
    "html_content": "<h1>Test</h1><p>Đây là email test từ n8n</p>",
    "text_content": "Test\n\nĐây là email test từ n8n",
    "email_type": "password_reset",
    "metadata": {
      "user_name": "Test User",
      "reset_link": "https://example.com/reset?token=test",
      "expire_minutes": 30
    }
  }'
```

**Kết quả mong đợi:**
```json
{
  "success": true,
  "message": "Email đã được gửi thành công",
  "to": "your-email@example.com",
  "email_type": "password_reset"
}
```

**Nếu webhook hoạt động:**
- ✅ Response 200 với JSON success
- ✅ Email sẽ được gửi đến địa chỉ bạn chỉ định
- ✅ Trong n8n sẽ có execution mới

**Nếu webhook không hoạt động:**
- ❌ Response 404: Workflow chưa được activate
- ❌ Response 500: Có lỗi trong workflow
- ❌ Timeout: n8n instance không truy cập được

---

## 🔧 CÁCH SỬA: Làm Sao Để Email Gửi Qua n8n?

### ⚠️ VẤN ĐỀ: EMAIL_PROVIDER chưa được set hoặc sai

**Kiểm tra:**
1. Mở file `backend/.env`
2. Tìm dòng `EMAIL_PROVIDER=`
3. Nếu không có hoặc là `EMAIL_PROVIDER=smtp` → ĐÂY LÀ VẤN ĐỀ!

**Sửa ngay:**
1. Mở file `backend/.env`
2. Tìm hoặc thêm dòng:
   ```bash
   EMAIL_PROVIDER=n8n
   ```
   ⚠️ **QUAN TRỌNG:** Phải là `n8n` (chữ thường), không phải `N8N` hay `N8n`
3. **Lưu file**
4. **Restart backend** (dừng và chạy lại)

---

### ⚠️ VẤN ĐỀ: N8N_WEBHOOK_URL chưa được set

**Kiểm tra:**
1. Mở file `backend/.env`
2. Tìm dòng `N8N_WEBHOOK_URL=`
3. Nếu không có hoặc là `N8N_WEBHOOK_URL=""` → ĐÂY LÀ VẤN ĐỀ!

**Sửa ngay:**
1. Mở file `backend/.env`
2. Thêm hoặc sửa:
   ```bash
   N8N_WEBHOOK_URL=https://brain.ai.vn/webhook/email
   ```
   ⚠️ **QUAN TRỌNG:** 
   - URL phải đúng với webhook URL trong n8n workflow
   - Không có dấu ngoặc kép ở đầu/cuối
   - Không có khoảng trắng thừa
3. **Lưu file**
4. **Restart backend** (dừng và chạy lại)

**Kiểm tra lại:**
- Truy cập: `http://localhost:8000/api/auth/email-config`
- Xem `n8n_webhook_url` phải có giá trị, không phải "NOT SET"

---

### Vấn đề 3: Workflow trong n8n chưa được activate

**Kiểm tra:**
1. Vào n8n → Workflows
2. Tìm workflow "Email Unified - Phúc Đạt"
3. Kiểm tra công tắc ở góc trên bên phải phải là màu **xanh** (Active)

**Sửa:**
1. Click công tắc để activate workflow
2. Lưu workflow (Ctrl+S hoặc Cmd+S)

---

### Vấn đề 4: Webhook URL không đúng

**Kiểm tra:**
1. Vào n8n → Workflows
2. Click vào node "Webhook - Unified"
3. Copy **Production URL**
4. So sánh với `N8N_WEBHOOK_URL` trong `.env`

**Sửa:**
1. Cập nhật `N8N_WEBHOOK_URL` trong `.env` với URL đúng
2. Restart backend

---

## ✅ CHECKLIST: Làm Theo Từng Bước

### Bước 1: Kiểm tra file `.env`

Mở file `backend/.env` và đảm bảo có **CHÍNH XÁC** 2 dòng sau:

```bash
EMAIL_PROVIDER=n8n
N8N_WEBHOOK_URL=https://brain.ai.vn/webhook/email
EMAIL_DEBUG=1
```

**Lưu ý:**
- ✅ `EMAIL_PROVIDER=n8n` (chữ thường, không có dấu ngoặc kép)
- ✅ `N8N_WEBHOOK_URL=https://brain.ai.vn/webhook/email` (URL đúng, không có dấu ngoặc kép)
- ✅ Không có khoảng trắng thừa
- ✅ Không có dấu `#` ở đầu dòng (nếu có sẽ bị comment)

### Bước 2: Restart Backend

**QUAN TRỌNG:** Sau khi sửa `.env`, PHẢI restart backend!

**Cách restart:**
1. Dừng backend (Ctrl+C trong terminal)
2. Chạy lại: `python -m uvicorn main:app --reload` (hoặc lệnh bạn dùng)

### Bước 3: Kiểm tra lại cấu hình

Truy cập: `http://localhost:8000/api/auth/email-config`

**Phải thấy:**
```json
{
  "email_provider": "n8n",  ← PHẢI LÀ "n8n"
  "n8n_webhook_url": "https://brain.ai.vn/webhook/email",  ← PHẢI CÓ URL
  ...
}
```

**Nếu vẫn thấy `"email_provider": "smtp"`:**
- ❌ File `.env` chưa được sửa đúng
- ❌ Backend chưa được restart
- ❌ File `.env` không ở đúng thư mục `backend/`

### Bước 4: Kiểm tra n8n Workflow

1. Vào https://brain.ai.vn
2. Workflows → "Email Unified - Phúc Đạt"
3. **Kiểm tra công tắc** ở góc trên bên phải phải là màu **XANH** (Active)
4. Nếu chưa active → Click công tắc để activate
5. **Lưu workflow** (Ctrl+S hoặc Cmd+S)

### Bước 5: Test lại

1. Vào trang `/forgot-password`
2. Nhập email test
3. Click "Test gửi email qua n8n"
4. **Kiểm tra:**
   - Response phải có `"email_provider": "n8n"`
   - Log backend phải có `"Email sent via n8n"`
   - **Trong n8n phải có execution mới!**

---

## 🎯 Kết Quả Mong Đợi

Sau khi làm đúng các bước trên:

✅ Endpoint `/api/auth/email-config` trả về `email_provider: "n8n"`  
✅ Test email thành công  
✅ **Trong n8n có execution mới (màu xanh)**  
✅ Email thực sự được gửi đến inbox

---

## 🎯 Kết Luận

**Nếu email được gửi qua n8n:**
- ✅ Thấy execution trong n8n
- ✅ Log backend hiển thị "Email sent via n8n"
- ✅ Response từ n8n webhook thành công

**Nếu email KHÔNG được gửi qua n8n:**
- ❌ Không thấy execution trong n8n
- ❌ Log backend hiển thị "Email sent via smtp" hoặc "Email sent via resend"
- ❌ Cần kiểm tra lại cấu hình `EMAIL_PROVIDER` và `N8N_WEBHOOK_URL`

