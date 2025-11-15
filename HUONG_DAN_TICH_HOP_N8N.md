# Hướng dẫn tích hợp n8n để gửi email

Tài liệu này hướng dẫn cách tích hợp n8n với hệ thống để gửi email quên mật khẩu và email báo giá.

## Tổng quan

Hệ thống đã được tích hợp với n8n để gửi email thông qua webhook. Khi bạn cấu hình `EMAIL_PROVIDER=n8n`, hệ thống sẽ gửi yêu cầu email đến n8n webhook thay vì gửi trực tiếp qua SMTP hoặc Resend.

## Cấu hình

### 1. Thiết lập biến môi trường

Thêm các biến sau vào file `.env` hoặc môi trường deployment:

```bash
# Chọn n8n làm email provider
EMAIL_PROVIDER="n8n"

# URL webhook của n8n (bắt buộc)
N8N_WEBHOOK_URL="https://your-n8n-instance.com/webhook/your-webhook-id"

# Webhook ID (tùy chọn - nếu n8n yêu cầu)
N8N_WEBHOOK_ID="your_webhook_id_here"

# API Key (tùy chọn - nếu n8n yêu cầu xác thực)
N8N_API_KEY="your_n8n_api_key_here"

# Bật debug để xem log chi tiết
EMAIL_DEBUG="1"
```

### 2. Import Blueprint vào n8n (Khuyến nghị)

Chúng tôi đã tạo sẵn các blueprint để bạn có thể import trực tiếp vào n8n:

#### Các blueprint có sẵn:

1. **`n8n_blueprints/email_password_reset_blueprint.json`**
   - Workflow riêng cho email quên mật khẩu
   - Đơn giản, dễ cấu hình

2. **`n8n_blueprints/email_quote_blueprint.json`**
   - Workflow riêng cho email báo giá
   - Hỗ trợ xử lý attachments (PDF, hình ảnh)

3. **`n8n_blueprints/email_unified_blueprint.json`**
   - Workflow tổng hợp xử lý tất cả loại email
   - Tự động phân loại và xử lý theo `email_type`
   - Khuyến nghị sử dụng blueprint này

#### Cách import blueprint:

1. **Mở n8n** và đăng nhập
2. **Click vào menu** (3 gạch ngang) ở góc trên bên trái
3. **Chọn "Workflows"** → **"Import from File"** hoặc **"Import from URL"**
4. **Chọn file blueprint** từ thư mục `n8n_blueprints/`
5. **Cấu hình SMTP credentials**:
   - Click vào node "Gửi Email"
   - Chọn hoặc tạo SMTP credentials
   - Điền thông tin SMTP server của bạn
6. **Lấy Webhook URL**:
   - Click vào node "Webhook"
   - Copy "Production URL" hoặc "Test URL"
   - Dán vào biến môi trường `N8N_WEBHOOK_URL`
7. **Activate workflow** (bật công tắc ở góc trên bên phải)

#### Ví dụ Webhook URL sau khi import:

- **Unified workflow**: `https://your-n8n.com/webhook/email` hoặc `https://your-n8n.com/webhook/unified-email-webhook`
- **Password reset workflow**: `https://your-n8n.com/webhook/password-reset`
- **Quote workflow**: `https://your-n8n.com/webhook/quote`

#### Workflow có sẵn trên brain.ai.vn:

- **URL**: https://brain.ai.vn/workflow/7xQoffxB4DjOeeNq
- **Mô tả**: Workflow tổng hợp xử lý tất cả loại email (password reset, quote, password change confirmation)
- **Cách dùng**: Import trực tiếp từ URL này vào n8n của bạn

### 3. Tạo workflow thủ công trong n8n (Nếu không dùng blueprint)

#### Workflow cho Email Quên Mật Khẩu

1. **Tạo Webhook Trigger**
   - Thêm node "Webhook"
   - Chọn phương thức: POST
   - Lưu URL webhook được tạo (dùng cho `N8N_WEBHOOK_URL`)

2. **Xử lý dữ liệu đầu vào**
   - Thêm node "Function" hoặc "Set" để lấy dữ liệu từ webhook:
     ```javascript
     // Dữ liệu từ backend sẽ có dạng:
     {
       "to_email": "user@example.com",
       "subject": "Hướng dẫn đặt lại mật khẩu...",
       "html_content": "<html>...</html>",
       "text_content": "Plain text version...",
       "email_type": "password_reset",
       "metadata": {
         "user_name": "Tên người dùng",
         "reset_link": "https://...",
         "expire_minutes": 30
       }
     }
     ```

3. **Gửi email**
   - Thêm node "Email Send" (SMTP) hoặc "HTTP Request" đến dịch vụ email của bạn
   - Cấu hình:
     - **To**: `{{ $json.to_email }}`
     - **Subject**: `{{ $json.subject }}`
     - **HTML Body**: `{{ $json.html_content }}`
     - **Text Body**: `{{ $json.text_content }}`

4. **Xử lý attachments (nếu có)**
   - Nếu email có attachments, chúng sẽ nằm trong `{{ $json.attachments }}`
   - Mỗi attachment có dạng:
     ```json
     {
       "name": "filename.pdf",
       "content": "base64_encoded_content",
       "mimeType": "application/pdf"
     }
     ```

#### Workflow cho Email Báo Giá

1. **Tạo Webhook Trigger** (có thể dùng chung hoặc tách riêng)
   - Tương tự như trên

2. **Xử lý dữ liệu**
   - Dữ liệu sẽ có `email_type: "quote"`
   - Metadata chứa thông tin báo giá:
     ```javascript
     {
       "quote_number": "BG-2025-001",
       "customer_name": "Tên khách hàng",
       "total_amount": 1000000,
       "issue_date": "2025-01-01",
       "employee_name": "Tên nhân viên",
       ...
     }
     ```

3. **Gửi email với attachments**
   - Xử lý attachments từ `{{ $json.attachments }}`
   - Decode base64 và đính kèm vào email

## Cấu trúc dữ liệu gửi đến n8n

### Email Quên Mật Khẩu

```json
{
  "to_email": "user@example.com",
  "subject": "Hướng dẫn đặt lại mật khẩu tài khoản Phúc Đạt",
  "html_content": "<html>...</html>",
  "text_content": "Plain text version...",
  "email_type": "password_reset",
  "metadata": {
    "user_name": "Nguyễn Văn A",
    "reset_link": "https://your-frontend.com/reset-password?token=...",
    "expire_minutes": 30
  }
}
```

### Email Báo Giá

```json
{
  "to_email": "customer@example.com",
  "subject": "Báo giá BG-2025-001 - Tên khách hàng",
  "html_content": "<html>...</html>",
  "text_content": "Plain text version...",
  "email_type": "quote",
  "attachments": [
    {
      "name": "Bao-gia-BG-2025-001.pdf",
      "content": "base64_encoded_pdf_content",
      "mimeType": "application/pdf"
    }
  ],
  "metadata": {
    "quote_number": "BG-2025-001",
    "customer_name": "Tên khách hàng",
    "customer_email": "customer@example.com",
    "total_amount": 1000000,
    "issue_date": "2025-01-01",
    "valid_until": "2025-01-31",
    "employee_name": "Tên nhân viên",
    "employee_phone": "0123456789"
  }
}
```

### Email Xác Nhận Đổi Mật Khẩu

```json
{
  "to_email": "user@example.com",
  "subject": "Mật khẩu của bạn đã được cập nhật",
  "html_content": "<html>...</html>",
  "text_content": "Plain text version...",
  "email_type": "password_change_confirmation",
  "metadata": {
    "user_name": "Nguyễn Văn A",
    "via": "manual"  // hoặc "reset_link"
  }
}
```

## Xác thực n8n (Tùy chọn)

Nếu n8n của bạn yêu cầu xác thực, bạn có thể:

1. **Sử dụng API Key trong Header**
   - Set `N8N_API_KEY` trong environment variables
   - Backend sẽ tự động thêm header `X-N8N-API-KEY` vào request

2. **Sử dụng Webhook ID trong Payload**
   - Set `N8N_WEBHOOK_ID` trong environment variables
   - Backend sẽ thêm field `webhook_id` vào payload

3. **Cấu hình trong n8n workflow**
   - Thêm node "If" để kiểm tra `webhook_id` hoặc header `X-N8N-API-KEY`
   - Chỉ xử lý request nếu xác thực thành công

## Cấu trúc Blueprint

### Blueprint Unified (Khuyến nghị)

Workflow tổng hợp xử lý tất cả loại email:

```
Webhook (POST)
  → Set (Lấy dữ liệu từ body)
  → Switch (Phân loại theo email_type)
    ├─ Case: "password_reset" 
    │   → Gửi Email Password (SMTP)
    ├─ Case: "quote"
    │   → Function (Xử lý attachments)
    │   → Gửi Email Báo Giá (SMTP với attachments)
    └─ Case: "password_change_confirmation"
        → Gửi Email Xác Nhận (SMTP)
  → Set (Chuẩn bị response)
  → Respond to Webhook
```

### Blueprint Email Quên Mật Khẩu

Workflow đơn giản cho email quên mật khẩu:

```
Webhook (POST) 
  → Set (Lấy dữ liệu từ body)
  → Email Send (SMTP)
    - To: {{ $json.to_email }}
    - Subject: {{ $json.subject }}
    - HTML: {{ $json.html_content }}
    - Text: {{ $json.text_content }}
  → Respond to Webhook
```

### Blueprint Email Báo Giá

Workflow với xử lý attachments:

```
Webhook (POST)
  → Set (Lấy dữ liệu từ body)
  → Function (Decode base64 attachments)
  → Email Send (SMTP với attachments)
  → Respond to Webhook
```

## Cấu hình SMTP trong n8n

Sau khi import blueprint, bạn cần cấu hình SMTP credentials:

1. **Click vào node "Gửi Email"** trong workflow
2. **Chọn "Credentials"** → **"Create New Credential"**
3. **Chọn loại**: SMTP
4. **Điền thông tin**:
   - **User**: Email của bạn (ví dụ: `noreply@phucdat.com`)
   - **Password**: Mật khẩu email hoặc App Password
   - **Host**: SMTP server (ví dụ: `smtp.gmail.com`)
   - **Port**: 587 (TLS) hoặc 465 (SSL)
   - **Secure**: Chọn TLS hoặc SSL tùy port
5. **Test connection** để đảm bảo hoạt động
6. **Save** credentials

### Ví dụ cấu hình Gmail:

- **Host**: `smtp.gmail.com`
- **Port**: `587`
- **Secure**: `TLS`
- **User**: Email Gmail của bạn
- **Password**: App Password (không phải mật khẩu thường)

### Ví dụ cấu hình SendGrid:

- **Host**: `smtp.sendgrid.net`
- **Port**: `587`
- **Secure**: `TLS`
- **User**: `apikey`
- **Password**: API Key của SendGrid

## Testing

1. **Test với curl**:
   ```bash
   curl -X POST https://your-n8n-instance.com/webhook/your-webhook-id \
     -H "Content-Type: application/json" \
     -d '{
       "to_email": "test@example.com",
       "subject": "Test Email",
       "html_content": "<h1>Test</h1>",
       "text_content": "Test",
       "email_type": "password_reset",
       "metadata": {}
     }'
   ```

2. **Test từ backend**:
   - Set `EMAIL_PROVIDER=n8n` và `N8N_WEBHOOK_URL`
   - Thử chức năng "Quên mật khẩu" hoặc "Gửi báo giá"
   - Kiểm tra log để xem response từ n8n

## Troubleshooting

### Lỗi: N8N_WEBHOOK_URL not set
- Kiểm tra biến môi trường `N8N_WEBHOOK_URL` đã được set chưa
- Đảm bảo URL webhook đúng và có thể truy cập được

### Lỗi: n8n Webhook Error (404)
- Kiểm tra URL webhook có đúng không
- Đảm bảo workflow trong n8n đã được activate

### Lỗi: n8n Webhook Timeout
- Kiểm tra n8n instance có đang chạy không
- Kiểm tra network connectivity giữa backend và n8n
- Có thể tăng timeout trong code nếu cần

### Email không được gửi
- Kiểm tra log trong n8n workflow để xem lỗi
- Đảm bảo node "Email Send" hoặc "HTTP Request" được cấu hình đúng
- Kiểm tra credentials của email service trong n8n

## Lợi ích của việc sử dụng n8n

1. **Tự động hóa linh hoạt**: Có thể thêm logic xử lý phức tạp trong n8n
2. **Tích hợp dễ dàng**: Kết nối với nhiều dịch vụ khác (Slack, Telegram, CRM, v.v.)
3. **Monitoring**: Theo dõi và log chi tiết trong n8n
4. **Retry logic**: Tự động retry khi gửi email thất bại
5. **Template management**: Quản lý email templates trong n8n
6. **A/B testing**: Dễ dàng test các phiên bản email khác nhau

## Chuyển đổi giữa các Email Provider

Bạn có thể dễ dàng chuyển đổi giữa các provider bằng cách thay đổi `EMAIL_PROVIDER`:

- `EMAIL_PROVIDER=smtp` - Sử dụng SMTP trực tiếp (Gmail, v.v.)
- `EMAIL_PROVIDER=resend` - Sử dụng Resend API
- `EMAIL_PROVIDER=n8n` - Sử dụng n8n webhook

Không cần thay đổi code, chỉ cần thay đổi biến môi trường!

