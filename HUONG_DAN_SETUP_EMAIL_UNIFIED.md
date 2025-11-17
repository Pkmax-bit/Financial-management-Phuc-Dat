# Hướng Dẫn Setup Email Unified Blueprint - Từng Bước Chi Tiết

Hướng dẫn này sẽ hướng dẫn bạn từng bước để setup hệ thống gửi email sử dụng `email_unified_blueprint.json` trong n8n.

## 📋 Tổng Quan

Blueprint Unified xử lý tất cả các loại email:
- ✅ Email quên mật khẩu (`password_reset`)
- ✅ Email báo giá (`quote`) - có hỗ trợ attachments
- ✅ Email xác nhận đổi mật khẩu (`password_change_confirmation`)

---

## 🎯 PHẦN 1: SETUP TRONG N8N

### Bước 1: Import Blueprint vào n8n

#### Cách 1: Import từ URL (Khuyến nghị - Nhanh nhất)

1. **Mở n8n** và đăng nhập vào tài khoản của bạn
2. **Click vào menu** (☰) ở góc trên bên trái
3. **Chọn "Workflows"** từ menu
4. **Click nút "+"** hoặc **"Add Workflow"**
5. **Chọn "Import from URL"**
6. **Dán URL sau:**
   ```
   https://brain.ai.vn/workflow/7xQoffxB4DjOeeNq
   ```
7. **Click "Import"**
8. Workflow sẽ được tạo tự động với tên: **"Email Unified - Phúc Đạt (Tất cả loại email)"**

#### Cách 2: Import từ File

1. **Mở n8n** và đăng nhập
2. **Click vào menu** (☰) → **"Workflows"**
3. **Click nút "+"** → **"Import from File"**
4. **Chọn file:** `n8n_blueprints/email_unified_blueprint.json`
5. **Click "Import"**
6. Workflow sẽ được tạo tự động

#### Cách 3: Copy/Paste JSON

1. **Mở file** `n8n_blueprints/email_unified_blueprint.json` bằng text editor
2. **Copy toàn bộ nội dung** JSON
3. **Trong n8n:** Click menu → Workflows → "+" → "Import from File"
4. **Chọn tab "Paste JSON"**
5. **Dán JSON** đã copy
6. **Click "Import"**

---

### Bước 2: Kiểm tra Workflow đã Import

Sau khi import, bạn sẽ thấy workflow với các node sau:

```
Webhook - Unified
  ↓
Set - Lấy dữ liệu
  ↓
Switch - Phân loại Email
  ├─→ Gửi Email Password (cho password_reset)
  ├─→ Function - Xử lý Attachments → Gửi Email Báo Giá (cho quote)
  └─→ Gửi Email Xác Nhận (cho password_change_confirmation)
  ↓
Set - Response
  ↓
Respond to Webhook
```

**Lưu ý:** Nếu bạn thấy các node có dấu cảnh báo (⚠️), đừng lo lắng - đó là do chưa cấu hình SMTP credentials. Chúng ta sẽ cấu hình ở bước tiếp theo.

---

### Bước 3: Cấu hình SMTP Credentials

Bạn cần cấu hình SMTP cho **3 node gửi email**:
- **Gửi Email Password**
- **Gửi Email Báo Giá**
- **Gửi Email Xác Nhận**

#### 3.1. Cấu hình cho node "Gửi Email Password"

1. **Click vào node "Gửi Email Password"** (node màu xanh)
2. Trong phần **"Credential to connect with"**, click **"Create New Credential"**
3. **Chọn loại:** **SMTP**
4. **Điền thông tin SMTP:**

   **Ví dụ với Gmail:**
   - **User**: Email Gmail của bạn (ví dụ: `phannguyendangkhoa0915@gmail.com`)
   - **Password**: App Password (KHÔNG phải mật khẩu thường)
     - Cách lấy App Password: [Xem hướng dẫn](#lấy-gmail-app-password)
   - **Host**: `smtp.gmail.com`
   - **Port**: `587`
   - **Secure**: Chọn **TLS** ⚠️ **QUAN TRỌNG:** Phải chọn TLS, không phải SSL!
   - **Lưu ý:** Nếu dùng port 465, phải chọn SSL (không phải TLS)

   **Ví dụ với SendGrid:**
   - **User**: `apikey`
   - **Password**: API Key của SendGrid
   - **Host**: `smtp.sendgrid.net`
   - **Port**: `587`
   - **Secure**: Chọn **TLS**

   **Ví dụ với Outlook/Office 365:**
   - **User**: Email của bạn
   - **Password**: Mật khẩu email
   - **Host**: `smtp.office365.com`
   - **Port**: `587`
   - **Secure**: Chọn **TLS**

5. **Click "Test"** để kiểm tra kết nối
6. Nếu test thành công, **click "Save"**
7. **Đặt tên credential:** Ví dụ: "SMTP Account - Phuc Dat"
8. **Click "Save"** lần nữa

#### 3.2. Cấu hình cho node "Gửi Email Báo Giá"

1. **Click vào node "Gửi Email Báo Giá"**
2. Trong phần **"Credential to connect with"**, **chọn credential đã tạo** ở bước 3.1 (hoặc tạo mới nếu muốn dùng email khác)
3. **Kiểm tra các field:**
   - **From Email**: `sales@phucdat.com` (hoặc email bạn muốn dùng cho báo giá)
   - **To Email**: `={{ $json.to_email }}` (tự động lấy từ webhook)
   - **Subject**: `={{ $json.subject }}`
   - **Message**: `={{ $json.html_content }}`
   - **Text**: `={{ $json.text_content }}`
   - **Attachments**: `={{ $json.processedAttachments || [] }}`
4. **Click "Save"** để lưu node

#### 3.3. Cấu hình cho node "Gửi Email Xác Nhận"

1. **Click vào node "Gửi Email Xác Nhận"**
2. **Chọn credential** đã tạo ở bước 3.1
3. **Kiểm tra các field** (tương tự như trên)
4. **Click "Save"**

#### 3.4. Cấu hình cho node "Gửi Email Password"

1. **Click vào node "Gửi Email Password"**
2. **Chọn credential** đã tạo ở bước 3.1
3. **Kiểm tra các field**
4. **Click "Save"**

---

### Bước 4: Lấy Webhook URL

1. **Click vào node "Webhook - Unified"** (node đầu tiên, màu xanh lá)
2. Trong phần **"Webhook URL"**, bạn sẽ thấy 2 URL:
   - **Production URL**: URL để dùng trong production
   - **Test URL**: URL để test (chỉ dùng khi workflow chưa activate)

3. **Copy Production URL** (hoặc Test URL nếu chưa activate)
   - Ví dụ: `https://your-n8n-instance.com/webhook/email`
   - Hoặc: `https://your-n8n-instance.com/webhook/unified-email-webhook`

4. **Lưu URL này lại** - bạn sẽ cần dùng ở bước setup backend

---

### Bước 5: Activate Workflow

1. **Click công tắc** ở góc trên bên phải của workflow (gần tên workflow)
2. Công tắc sẽ chuyển sang màu **xanh** (Active)
3. **Lưu workflow:** Click nút **"Save"** (hoặc Ctrl+S / Cmd+S)

**Lưu ý:** Workflow phải được **Activate** thì mới nhận được requests từ backend!

---

## 🖥️ PHẦN 2: SETUP TRONG BACKEND (WEB)

### Bước 1: Cấu hình Biến Môi Trường

#### 1.1. Nếu chạy Local (Development)

1. **Mở file** `backend/.env` (hoặc tạo mới nếu chưa có)
2. **Thêm hoặc cập nhật** các biến sau:

```bash
# Chọn n8n làm email provider
EMAIL_PROVIDER="n8n"

# URL webhook của n8n (BẮT BUỘC)
# Thay thế bằng Production URL bạn đã copy ở Bước 4 (Phần 1)
N8N_WEBHOOK_URL="https://your-n8n-instance.com/webhook/email"

# Webhook ID (TÙY CHỌN - chỉ cần nếu n8n yêu cầu xác thực)
N8N_WEBHOOK_ID=""

# API Key (TÙY CHỌN - chỉ cần nếu n8n yêu cầu xác thực)
N8N_API_KEY=""

# Bật debug để xem log chi tiết (khuyến nghị khi test)
EMAIL_DEBUG="1"
```

3. **Lưu file** `.env`

#### 1.2. Nếu Deploy trên Render

1. **Mở Render Dashboard** → Chọn service backend của bạn
2. **Vào tab "Environment"**
3. **Thêm hoặc cập nhật** các biến môi trường:

```
EMAIL_PROVIDER=n8n
N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook/email
N8N_WEBHOOK_ID=
N8N_API_KEY=
EMAIL_DEBUG=1
```

4. **Click "Save Changes"**
5. **Render sẽ tự động restart** service

#### 1.3. Nếu Deploy trên VPS/Server khác

1. **SSH vào server**
2. **Mở file** `.env` trong thư mục backend
3. **Thêm các biến** như ở phần 1.1
4. **Restart backend service**

---

### Bước 2: Restart Backend

Sau khi cấu hình biến môi trường, bạn cần restart backend:

#### Local:
```bash
# Dừng backend (Ctrl+C nếu đang chạy)
# Sau đó chạy lại:
cd backend
python -m uvicorn main:app --reload
```

#### Render:
- Render tự động restart sau khi save environment variables

#### VPS/Server:
```bash
# Tùy vào cách bạn chạy backend (systemd, PM2, v.v.)
sudo systemctl restart your-backend-service
# hoặc
pm2 restart backend
```

---

## ✅ PHẦN 3: TEST VÀ KIỂM TRA

### Bước 1: Test với curl (Khuyến nghị)

Mở terminal và chạy lệnh sau (thay URL bằng webhook URL của bạn):

```bash
# Test email quên mật khẩu
curl -X POST https://your-n8n-instance.com/webhook/email \
  -H "Content-Type: application/json" \
  -d '{
    "to_email": "your-email@example.com",
    "subject": "Test Password Reset",
    "html_content": "<h1>Test Email</h1><p>Đây là email test từ n8n</p>",
    "text_content": "Test Email\n\nĐây là email test từ n8n",
    "email_type": "password_reset",
    "metadata": {
      "user_name": "Test User",
      "reset_link": "https://example.com/reset?token=test123",
      "expire_minutes": 30
    }
  }'
```

**Kết quả mong đợi:**
- Response: `{"success": true, "message": "Email đã được gửi thành công", ...}`
- Email sẽ được gửi đến địa chỉ bạn chỉ định

### Bước 2: Test từ Frontend

1. **Mở ứng dụng web** của bạn
2. **Thử chức năng "Quên mật khẩu"**:
   - Nhập email của bạn
   - Click "Gửi email"
   - Kiểm tra inbox email

3. **Thử chức năng "Gửi báo giá"** (nếu có):
   - Tạo báo giá
   - Gửi email báo giá
   - Kiểm tra inbox và attachments

### Bước 3: Kiểm tra Log

#### Kiểm tra Log Backend:

**Local:**
- Xem console output khi chạy backend
- Tìm dòng: `✅ Email sent via n8n to ...`

**Render:**
- Vào Render Dashboard → Logs
- Tìm dòng: `✅ Email sent via n8n to ...`

#### Kiểm tra Execution trong n8n:

1. **Mở n8n** → Workflows
2. **Click vào workflow** "Email Unified - Phúc Đạt"
3. **Vào tab "Executions"** (ở trên cùng)
4. **Xem các execution** gần đây:
   - ✅ **Success** (màu xanh): Email đã được gửi thành công
   - ❌ **Error** (màu đỏ): Có lỗi xảy ra - click vào để xem chi tiết

---

## 🔧 PHẦN 4: TROUBLESHOOTING

### Lỗi 1: "N8N_WEBHOOK_URL not set"

**Nguyên nhân:** Biến môi trường chưa được set

**Giải pháp:**
1. Kiểm tra file `.env` có biến `N8N_WEBHOOK_URL` chưa
2. Đảm bảo đã restart backend sau khi thêm biến
3. Kiểm tra chính tả: `N8N_WEBHOOK_URL` (không phải `N8N_WEBHOOK`)

---

### Lỗi 2: "n8n Webhook Error (404)"

**Nguyên nhân:** 
- URL webhook không đúng
- Workflow chưa được activate

**Giải pháp:**
1. **Kiểm tra URL webhook:**
   - Vào n8n → Click node "Webhook - Unified"
   - Copy lại Production URL
   - So sánh với URL trong `.env`

2. **Kiểm tra workflow đã activate:**
   - Vào n8n → Workflows
   - Kiểm tra công tắc ở góc trên bên phải phải là màu **xanh** (Active)

3. **Kiểm tra webhook path:**
   - Trong node Webhook, xem "Path" là gì
   - URL phải kết thúc bằng path đó (ví dụ: `/webhook/email`)

---

### Lỗi 3: "n8n Webhook Timeout"

**Nguyên nhân:**
- n8n instance không truy cập được
- Network connectivity issue

**Giải pháp:**
1. **Kiểm tra n8n instance có đang chạy không:**
   - Mở URL n8n trong browser
   - Đảm bảo có thể truy cập được

2. **Kiểm tra network:**
   - Từ backend server, thử ping n8n instance
   - Kiểm tra firewall có chặn không

3. **Kiểm tra timeout setting:**
   - Backend mặc định timeout 30 giây
   - Nếu n8n xử lý lâu, có thể cần tăng timeout

---

### Lỗi 4: SSL/TLS Error - "wrong version number" hoặc "Couldn't connect"

**Nguyên nhân:**
- **Port và Secure setting không khớp!** Đây là lỗi phổ biến nhất.
- Port 587 phải dùng **TLS** (không phải SSL)
- Port 465 phải dùng **SSL** (không phải TLS)

**Giải pháp:**

1. **Kiểm tra cấu hình Port và Secure:**

   **Với Gmail (Port 587):**
   - ✅ **Port**: `587`
   - ✅ **Secure**: Chọn **TLS** (KHÔNG phải SSL)
   - ❌ Nếu bạn chọn SSL với port 587 → Sẽ bị lỗi "wrong version number"

   **Với Gmail (Port 465 - Alternative):**
   - ✅ **Port**: `465`
   - ✅ **Secure**: Chọn **SSL** (KHÔNG phải TLS)
   - ❌ Nếu bạn chọn TLS với port 465 → Sẽ bị lỗi

2. **Cách sửa trong n8n:**
   - Click vào node "Gửi Email" → Click vào credential
   - Hoặc tạo credential mới
   - **Đảm bảo:**
     - Port `587` → Secure = **TLS**
     - Port `465` → Secure = **SSL**
   - Click "Test" để kiểm tra lại

3. **Bảng tham khảo Port và Secure:**

   | Email Provider | Host | Port | Secure | Ghi chú |
   |---------------|------|------|--------|---------|
   | Gmail | smtp.gmail.com | 587 | **TLS** | Khuyến nghị |
   | Gmail | smtp.gmail.com | 465 | **SSL** | Alternative |
   | SendGrid | smtp.sendgrid.net | 587 | **TLS** | |
   | Outlook | smtp.office365.com | 587 | **TLS** | |
   | Yahoo | smtp.mail.yahoo.com | 587 | **TLS** | |

4. **Nếu vẫn lỗi sau khi sửa:**
   - Thử đổi sang port 465 với SSL
   - Hoặc kiểm tra firewall có chặn port không
   - Kiểm tra App Password có đúng không (với Gmail)

---

### Lỗi 5: Email không được gửi (nhưng n8n nhận được request)

**Nguyên nhân:**
- SMTP credentials sai
- SMTP server từ chối kết nối
- App Password không đúng (với Gmail)

**Giải pháp:**
1. **Kiểm tra execution trong n8n:**
   - Vào n8n → Workflows → Executions
   - Click vào execution gần nhất
   - Xem node nào bị lỗi (thường là node "Gửi Email")

2. **Kiểm tra SMTP credentials:**
   - Click vào node "Gửi Email" bị lỗi
   - Click "Test" để kiểm tra kết nối SMTP
   - Nếu test fail, kiểm tra lại:
     - User/Password có đúng không
     - Host/Port có đúng không
     - Secure (TLS/SSL) có đúng không (xem Lỗi 4 ở trên)

3. **Với Gmail:**
   - Đảm bảo đã bật "2-Step Verification"
   - Đảm bảo đã tạo "App Password" (không phải mật khẩu thường)
   - App Password phải là 16 ký tự, không có khoảng trắng
   - Xem hướng dẫn bên dưới

---

### Lỗi 6: Attachments không được gửi (chỉ với email báo giá)

**Nguyên nhân:**
- Node "Function - Xử lý Attachments" có lỗi
- Format attachments từ backend không đúng

**Giải pháp:**
1. **Kiểm tra execution trong n8n:**
   - Xem node "Function - Xử lý Attachments" có chạy thành công không
   - Xem output của node này

2. **Kiểm tra format attachments từ backend:**
   - Attachments phải có format:
     ```json
     {
       "name": "filename.pdf",
       "content": "base64_encoded_content",
       "mimeType": "application/pdf"
     }
     ```

3. **Kiểm tra code trong node Function:**
   - Click vào node "Function - Xử lý Attachments"
   - Đảm bảo code không bị lỗi syntax

---

## 📝 PHỤ LỤC

### Lấy Gmail App Password

1. **Đăng nhập Gmail** → Vào [Google Account](https://myaccount.google.com/)
2. **Bật 2-Step Verification** (nếu chưa bật):
   - Security → 2-Step Verification → Turn on
3. **Tạo App Password:**
   - Security → App passwords
   - Select app: "Mail"
   - Select device: "Other (Custom name)"
   - Nhập tên: "n8n Email"
   - Click "Generate"
4. **Copy App Password** (16 ký tự, không có khoảng trắng)
5. **Dán vào n8n SMTP credential** (field Password)

---

### Cấu trúc Dữ liệu Gửi đến n8n

Backend sẽ gửi JSON với format sau:

```json
{
  "to_email": "user@example.com",
  "subject": "Subject của email",
  "html_content": "<html>Nội dung HTML</html>",
  "text_content": "Nội dung text thuần",
  "email_type": "password_reset" | "quote" | "password_change_confirmation",
  "metadata": {
    // Tùy vào email_type, metadata sẽ khác nhau
  },
  "attachments": [
    // Chỉ có khi email_type = "quote"
    {
      "name": "filename.pdf",
      "content": "base64_encoded_content",
      "mimeType": "application/pdf"
    }
  ]
}
```

---

### Các Email Type được Hỗ trợ

1. **`password_reset`**: Email quên mật khẩu
   - Metadata: `user_name`, `reset_link`, `expire_minutes`

2. **`quote`**: Email báo giá
   - Metadata: `quote_number`, `customer_name`, `total_amount`, v.v.
   - Có thể có `attachments` (PDF báo giá)

3. **`password_change_confirmation`**: Email xác nhận đổi mật khẩu
   - Metadata: `user_name`, `via`

---

## ✅ Checklist Hoàn Thành

Sau khi setup xong, đảm bảo bạn đã:

- [ ] Import blueprint vào n8n
- [ ] Cấu hình SMTP credentials cho cả 3 node gửi email
- [ ] Lấy và lưu Production Webhook URL
- [ ] Activate workflow trong n8n
- [ ] Cấu hình `EMAIL_PROVIDER=n8n` trong backend
- [ ] Cấu hình `N8N_WEBHOOK_URL` trong backend
- [ ] Restart backend
- [ ] Test với curl hoặc từ frontend
- [ ] Kiểm tra email đã được gửi thành công
- [ ] Kiểm tra execution trong n8n (không có lỗi)

---

## 🎉 Hoàn Thành!

Nếu bạn đã hoàn thành tất cả các bước trên và test thành công, hệ thống email của bạn đã sẵn sàng sử dụng!

**Lưu ý:** 
- Workflow trong n8n phải luôn ở trạng thái **Active**
- Nếu thay đổi SMTP credentials, chỉ cần cập nhật trong n8n (không cần restart backend)
- Nếu thay đổi webhook URL, cần cập nhật `N8N_WEBHOOK_URL` và restart backend

---

## 📚 Tài Liệu Tham Khảo

- [Hướng dẫn tích hợp n8n chi tiết](./HUONG_DAN_TICH_HOP_N8N.md)
- [Quick Start n8n](./QUICK_START_N8N.md)
- [README Blueprints](./n8n_blueprints/README.md)

