# Workflow URL - Email Unified

## Workflow có sẵn trên brain.ai.vn

**URL Workflow:** https://brain.ai.vn/workflow/7xQoffxB4DjOeeNq

**Mô tả:** Workflow tổng hợp xử lý tất cả loại email cho hệ thống Phúc Đạt

## Cách Import

### Bước 1: Mở n8n
- Đăng nhập vào n8n instance của bạn

### Bước 2: Import từ URL
1. Click vào menu (☰) ở góc trên bên trái
2. Chọn **"Workflows"**
3. Click nút **"+"** hoặc **"Add workflow"**
4. Chọn **"Import from URL"**
5. Dán URL: `https://brain.ai.vn/workflow/7xQoffxB4DjOeeNq`
6. Click **"Import"**

### Bước 3: Cấu hình SMTP
1. Click vào các node **"Gửi Email"** trong workflow
2. Chọn **"Credentials"** → **"Create New Credential"**
3. Chọn loại: **SMTP**
4. Điền thông tin:
   - **User**: Email của bạn
   - **Password**: Mật khẩu email hoặc App Password
   - **Host**: SMTP server (ví dụ: `smtp.gmail.com`)
   - **Port**: 587 (TLS) hoặc 465 (SSL)
   - **Secure**: TLS hoặc SSL
5. Click **"Test"** để kiểm tra
6. Click **"Save"**

### Bước 4: Lấy Webhook URL
1. Click vào node **"Webhook - Unified"**
2. Trong phần **"Webhook URL"**, copy **Production URL**
3. Ví dụ: `https://your-n8n-instance.com/webhook/email`
4. Set vào biến môi trường `N8N_WEBHOOK_URL` trong backend

### Bước 5: Activate Workflow
1. Click công tắc ở góc trên bên phải của workflow
2. Workflow sẽ chuyển sang trạng thái **"Active"** (màu xanh)

## Cấu trúc Workflow

```
Webhook - Unified (POST)
  ↓
Set - Lấy dữ liệu
  ↓
Switch - Phân loại Email
  ├─ Case: "password_reset"
  │   └─ Gửi Email Password
  ├─ Case: "quote"
  │   ├─ Function - Xử lý Attachments
  │   └─ Gửi Email Báo Giá
  └─ Case: "password_change_confirmation"
      └─ Gửi Email Xác Nhận
  ↓
Set - Response
  ↓
Respond to Webhook
```

## Dữ liệu đầu vào

Workflow nhận JSON payload với cấu trúc:

```json
{
  "to_email": "user@example.com",
  "subject": "Subject của email",
  "html_content": "<html>...</html>",
  "text_content": "Plain text version",
  "email_type": "password_reset" | "quote" | "password_change_confirmation",
  "metadata": {
    // Thông tin bổ sung tùy theo email_type
  },
  "attachments": [
    {
      "name": "filename.pdf",
      "content": "base64_encoded_content",
      "mimeType": "application/pdf"
    }
  ]
}
```

## Testing

### Test với curl

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
      "reset_link": "https://example.com/reset?token=test123"
    }
  }'
```

## Troubleshooting

### Workflow không import được
- Kiểm tra URL có đúng không
- Kiểm tra kết nối internet
- Thử import từ file JSON thay vì URL

### Email không được gửi
- Kiểm tra SMTP credentials có đúng không
- Kiểm tra execution log trong n8n
- Test SMTP connection trong node "Gửi Email"

### Webhook không nhận được request
- Kiểm tra workflow đã được activate chưa
- Kiểm tra Webhook URL có đúng không
- Kiểm tra backend có gửi request đến đúng URL không

## Lưu ý

- Workflow này được tối ưu cho hệ thống Phúc Đạt
- Có thể tùy chỉnh thêm các node theo nhu cầu
- Nên test kỹ trước khi deploy vào production

















