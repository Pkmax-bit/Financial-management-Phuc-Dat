# Quick Start - Tích hợp n8n trong 5 phút

Hướng dẫn nhanh để tích hợp n8n vào web application.

## ⚡ Các bước nhanh

### 1. Import Workflow (1 phút)

1. Mở n8n → Workflows → Import from URL
2. Dán: `https://brain.ai.vn/workflow/7xQoffxB4DjOeeNq`
3. Click Import

### 2. Cấu hình SMTP (2 phút)

1. Click node "Gửi Email" → Create New Credential → SMTP
2. Điền thông tin SMTP (Gmail/SendGrid/khác)
3. Test connection → Save

### 3. Lấy Webhook URL (30 giây)

1. Click node "Webhook - Unified"
2. Copy Production URL
3. Activate workflow (bật công tắc)

### 4. Cấu hình Backend (1 phút)

**Local (.env):**
```bash
EMAIL_PROVIDER="n8n"
N8N_WEBHOOK_URL="https://your-n8n.com/webhook/email"
EMAIL_DEBUG="1"
```

**Render (Environment Variables):**
```
EMAIL_PROVIDER=n8n
N8N_WEBHOOK_URL=https://your-n8n.com/webhook/email
EMAIL_DEBUG=1
```

### 5. Test (30 giây)

1. Restart backend
2. Test "Quên mật khẩu" từ frontend
3. Kiểm tra email inbox

## ✅ Xong!

Email sẽ được gửi qua n8n. 

📘 **Xem hướng dẫn chi tiết từng bước:** [HUONG_DAN_SETUP_EMAIL_UNIFIED.md](./HUONG_DAN_SETUP_EMAIL_UNIFIED.md)


