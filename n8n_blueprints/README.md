# n8n Blueprints cho Hệ thống Phúc Đạt

Thư mục này chứa các blueprint (template workflow) để import vào n8n.

## Các Blueprint có sẵn

### 1. `email_unified_blueprint.json` ⭐ (Khuyến nghị)

**Workflow tổng hợp xử lý tất cả loại email**

- ✅ Xử lý email quên mật khẩu
- ✅ Xử lý email báo giá (với attachments)
- ✅ Xử lý email xác nhận đổi mật khẩu
- ✅ Tự động phân loại theo `email_type`
- ✅ Xử lý attachments tự động

**Cách sử dụng:**

#### Phương pháp 1: Import từ URL (Khuyến nghị)

1. Mở n8n và đăng nhập
2. Click vào menu (☰) → **"Workflows"**
3. Click **"Import from URL"**
4. Dán URL: `https://brain.ai.vn/workflow/7xQoffxB4DjOeeNq`
5. Click **"Import"**
6. Workflow sẽ được tạo tự động

#### Phương pháp 2: Import từ File

1. Import file `email_unified_blueprint.json` vào n8n
2. Cấu hình SMTP credentials
3. Lấy Webhook URL và set vào `N8N_WEBHOOK_URL`
4. Activate workflow

**Webhook path:** `/webhook/email` hoặc `/webhook/unified-email-webhook`

**Workflow URL:** https://brain.ai.vn/workflow/7xQoffxB4DjOeeNq

---

### 2. `email_password_reset_blueprint.json`

**Workflow riêng cho email quên mật khẩu**

- ✅ Đơn giản, dễ cấu hình
- ✅ Chỉ xử lý email quên mật khẩu

**Cách sử dụng:**
1. Import file này vào n8n
2. Cấu hình SMTP credentials
3. Lấy Webhook URL và set vào `N8N_WEBHOOK_URL`
4. Activate workflow

**Webhook path:** `/webhook/password-reset`

**Lưu ý:** Nếu dùng blueprint này, bạn cần tạo workflow riêng cho email báo giá.

---

### 3. `email_quote_blueprint.json`

**Workflow riêng cho email báo giá**

- ✅ Xử lý email báo giá với attachments
- ✅ Decode base64 attachments tự động
- ✅ Hỗ trợ PDF và các file đính kèm khác

**Cách sử dụng:**
1. Import file này vào n8n
2. Cấu hình SMTP credentials
3. Lấy Webhook URL và set vào `N8N_WEBHOOK_URL`
4. Activate workflow

**Webhook path:** `/webhook/quote`

**Lưu ý:** Nếu dùng blueprint này, bạn cần tạo workflow riêng cho email quên mật khẩu.

---

## Cách Import Blueprint

### Phương pháp 1: Import từ File

1. Mở n8n và đăng nhập
2. Click vào menu (☰) ở góc trên bên trái
3. Chọn **"Workflows"**
4. Click **"Import from File"** hoặc nút **"+"** → **"Import from File"**
5. Chọn file blueprint (`.json`) từ thư mục này
6. Workflow sẽ được tạo tự động

### Phương pháp 2: Import từ URL

1. Upload file blueprint lên GitHub Gist hoặc server
2. Trong n8n, chọn **"Import from URL"**
3. Dán URL của file blueprint
4. Workflow sẽ được tạo tự động

### Phương pháp 3: Copy/Paste JSON

1. Mở file blueprint bằng text editor
2. Copy toàn bộ nội dung JSON
3. Trong n8n, chọn **"Import from File"** → **"Paste JSON"**
4. Dán JSON đã copy
5. Workflow sẽ được tạo tự động

---

## Cấu hình sau khi Import

### 1. Cấu hình SMTP Credentials

1. Click vào node **"Gửi Email"** hoặc **"Gửi Email với Attachments"**
2. Trong phần **"Credential to connect with"**, chọn **"Create New Credential"**
3. Chọn loại: **SMTP**
4. Điền thông tin:
   - **User**: Email của bạn
   - **Password**: Mật khẩu email hoặc App Password
   - **Host**: SMTP server (ví dụ: `smtp.gmail.com`)
   - **Port**: 587 (TLS) hoặc 465 (SSL)
   - **Secure**: TLS hoặc SSL
5. Click **"Test"** để kiểm tra
6. Click **"Save"**

### 2. Lấy Webhook URL

1. Click vào node **"Webhook"**
2. Trong phần **"Webhook URL"**, bạn sẽ thấy:
   - **Production URL**: URL để dùng trong production
   - **Test URL**: URL để test
3. Copy **Production URL**
4. Dán vào biến môi trường `N8N_WEBHOOK_URL` trong backend

**Ví dụ:**
```
N8N_WEBHOOK_URL="https://your-n8n-instance.com/webhook/email"
```

### 3. Activate Workflow

1. Click công tắc ở góc trên bên phải của workflow
2. Workflow sẽ chuyển sang trạng thái **"Active"** (màu xanh)
3. Bây giờ workflow đã sẵn sàng nhận requests từ backend

---

## Tùy chỉnh Blueprint

### Thay đổi Email From Address

1. Click vào node **"Gửi Email"**
2. Thay đổi field **"From Email"**
3. Ví dụ: `sales@phucdat.com` cho email báo giá, `noreply@phucdat.com` cho email hệ thống

### Thêm Xử lý Lỗi

1. Thêm node **"Error Trigger"** sau node **"Gửi Email"**
2. Kết nối với node **"Notify"** hoặc **"Slack"** để nhận thông báo lỗi

### Thêm Logging

1. Thêm node **"Function"** để log dữ liệu
2. Hoặc sử dụng node **"Postgres"** để lưu vào database

### Thêm Retry Logic

1. Thêm node **"Wait"** trước node **"Gửi Email"**
2. Hoặc sử dụng node **"Retry"** để tự động retry khi lỗi

---

## Testing

### Test với curl

```bash
# Test email quên mật khẩu
curl -X POST https://your-n8n-instance.com/webhook/email \
  -H "Content-Type: application/json" \
  -d '{
    "to_email": "test@example.com",
    "subject": "Test Password Reset",
    "html_content": "<h1>Test</h1>",
    "text_content": "Test",
    "email_type": "password_reset",
    "metadata": {
      "user_name": "Test User",
      "reset_link": "https://example.com/reset?token=test123",
      "expire_minutes": 30
    }
  }'

# Test email báo giá
curl -X POST https://your-n8n-instance.com/webhook/email \
  -H "Content-Type: application/json" \
  -d '{
    "to_email": "test@example.com",
    "subject": "Test Quote",
    "html_content": "<h1>Báo giá test</h1>",
    "text_content": "Báo giá test",
    "email_type": "quote",
    "metadata": {
      "quote_number": "BG-2025-001",
      "customer_name": "Test Customer"
    },
    "attachments": []
  }'
```

### Test từ Backend

1. Set `EMAIL_PROVIDER=n8n` và `N8N_WEBHOOK_URL` trong `.env`
2. Thử chức năng "Quên mật khẩu" hoặc "Gửi báo giá"
3. Kiểm tra execution trong n8n để xem kết quả

---

## Troubleshooting

### Workflow không nhận được request

- ✅ Kiểm tra workflow đã được activate chưa
- ✅ Kiểm tra Webhook URL có đúng không
- ✅ Kiểm tra backend có gửi request đến đúng URL không

### Email không được gửi

- ✅ Kiểm tra SMTP credentials có đúng không
- ✅ Kiểm tra execution log trong n8n để xem lỗi
- ✅ Test SMTP connection trong node "Gửi Email"

### Attachments không được gửi

- ✅ Kiểm tra node "Function - Xử lý Attachments" có chạy không
- ✅ Kiểm tra format của attachments từ backend
- ✅ Kiểm tra base64 encoding có đúng không

---

## Hỗ trợ

Nếu gặp vấn đề, vui lòng:
1. Kiểm tra execution log trong n8n
2. Kiểm tra log của backend
3. Xem tài liệu chi tiết trong `HUONG_DAN_TICH_HOP_N8N.md`

