# Checklist Biến Môi Trường Render

## ❌ Các Biến Cần Sửa Tên

Bạn đang có các biến với tên **SAI**, cần đổi tên:

1. **`SUPABASE_KEY`** → Đổi thành **`SUPABASE_SERVICE_KEY`**
   - Giá trị hiện tại của bạn là service role key, đúng rồi
   - Nhưng tên biến phải là `SUPABASE_SERVICE_KEY` (code đang tìm biến này)

2. **`SUPABASE_SERVICE_ROLE_KEY`** → Đổi thành **`SUPABASE_ANON_KEY`**
   - Giá trị hiện tại của bạn là anon key, đúng rồi
   - Nhưng tên biến phải là `SUPABASE_ANON_KEY` (code đang tìm biến này)

3. **`JWT_SECRET`** → Đổi thành **`SECRET_KEY`**
   - Code đang tìm `SECRET_KEY`, không phải `JWT_SECRET`
   - **LƯU Ý**: Xóa dấu ngoặc kép `"` nếu có trong giá trị

## ⚠️ Các Biến Còn Thiếu (QUAN TRỌNG)

### 1. Supabase Database Connection (BẮT BUỘC)
```
SUPABASE_DB_HOST=aws-1-ap-southeast-1.pooler.supabase.com
SUPABASE_DB_USER=postgres.mfmijckzlhevduwfigkl
SUPABASE_DB_PASSWORD=tudonghoa2025
SUPABASE_DB_NAME=postgres
SUPABASE_DB_PORT=6543
```

### 2. Dify API (Nếu dùng tính năng AI)
```
DIFY_API_BASE_URL=https://api.dify.ai/v1
DIFY_API_KEY=app-8gGZ55XJ7uNafs4TRAkqO0xl
```

### 3. JWT Configuration (BẮT BUỘC)
```
SECRET_KEY=ueqFQZLT+nMVthV1awuH7+L1MgBXHZGaW51CNBjLfLg=
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
SUPABASE_JWT_SECRET=DIiyyRJCCJrFc2FnmaKroTnzZh2I2JqouXOdhSdqu58SkZ3PTGYkpZFN9WrmP7hGfZbXgD4EdkEoatekEIrX0A==
```

### 4. Application Settings (QUAN TRỌNG)
```
DEBUG=False
CORS_ORIGINS=https://financial-management-phuc-dat.onrender.com
EMAIL_DEBUG=1
```

### 5. Optional (Có giá trị mặc định, nhưng nên set)
```
PASSWORD_RESET_TOKEN_EXPIRE_MINUTES=30
MAX_FILE_SIZE=10485760
UPLOAD_DIRECTORY=uploads
DEFAULT_TIMEZONE=Asia/Ho_Chi_Minh
```

## ✅ Danh Sách Đầy Đủ Các Biến Cần Có

Copy và paste vào Render Dashboard → Environment Variables:

```
# Python Version
PYTHON_VERSION=3.11.9

# Supabase Configuration
SUPABASE_URL=https://mfmijckzlhevduwfigkl.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1mbWlqY2t6bGhldmR1d2ZpZ2tsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjUzOTExMiwiZXhwIjoyMDcyMTE1MTEyfQ.rlFwoXK_Yls7kRxL_lYqYWe3huJhs0V60Wa4Ddd7Ero
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1mbWlqY2t6bGhldmR1d2ZpZ2tsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1MzkxMTIsImV4cCI6MjA3MjExNTExMn0.VPFmvLghhO32JybxDzq-CGVQedgI-LN7Q07rwDhxU4E

# Database Connection
SUPABASE_DB_HOST=aws-1-ap-southeast-1.pooler.supabase.com
SUPABASE_DB_USER=postgres.mfmijckzlhevduwfigkl
SUPABASE_DB_PASSWORD=tudonghoa2025
SUPABASE_DB_NAME=postgres
SUPABASE_DB_PORT=6543

# Dify API
DIFY_API_BASE_URL=https://api.dify.ai/v1
DIFY_API_KEY=app-8gGZ55XJ7uNafs4TRAkqO0xl

# Email Configuration
# Email provider: 'smtp' (default), 'resend', or 'n8n'
EMAIL_PROVIDER=n8n

# SMTP Configuration (for local development or fallback)
SMTP_USER=phannguyendangkhoa0915@gmail.com
SMTP_PASSWORD=wozhwluxehsfuqjm
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_TIMEOUT=30

# Resend API Configuration (alternative to n8n)
RESEND_API_KEY=your_resend_api_key_here
RESEND_FROM_EMAIL=noreply@resend.dev

# n8n Webhook Configuration (recommended)
N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook/email
N8N_WEBHOOK_ID=your_webhook_id_here
N8N_API_KEY=your_n8n_api_key_here

EMAIL_DEBUG=1

# JWT Configuration
SECRET_KEY=ueqFQZLT+nMVthV1awuH7+L1MgBXHZGaW51CNBjLfLg=
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
SUPABASE_JWT_SECRET=DIiyyRJCCJrFc2FnmaKroTnzZh2I2JqouXOdhSdqu58SkZ3PTGYkpZFN9WrmP7hGfZbXgD4EdkEoatekEIrX0A==

# Application Settings
ENVIRONMENT=production
FRONTEND_URL=https://financial-management-phuc-dat.onrender.com
DEBUG=False
CORS_ORIGINS=https://financial-management-phuc-dat.onrender.com
PASSWORD_RESET_TOKEN_EXPIRE_MINUTES=30
```

## 🔧 Các Bước Thực Hiện

### Bước 1: Xóa Các Biến Sai Tên
1. Vào Render Dashboard → Backend service → Environment
2. Xóa các biến sau:
   - `SUPABASE_KEY` (sẽ thay bằng `SUPABASE_SERVICE_KEY`)
   - `SUPABASE_SERVICE_ROLE_KEY` (sẽ thay bằng `SUPABASE_ANON_KEY`)
   - `JWT_SECRET` (sẽ thay bằng `SECRET_KEY`)

### Bước 2: Thêm Các Biến Mới
Thêm tất cả các biến từ danh sách trên vào Render Dashboard.

### Bước 3: Kiểm Tra
- Đảm bảo không có dấu ngoặc kép `"` trong giá trị
- Đảm bảo không có khoảng trắng thừa
- Đảm bảo tên biến chính xác (case-sensitive)

### Bước 4: Deploy Lại
1. Click **"Save Changes"**
2. Click **"Manual Deploy"** → **"Deploy latest commit"**

## ⚠️ Lưu Ý Quan Trọng

1. **CORS_ORIGINS**: Phải là URL frontend của bạn (không có trailing slash)
2. **FRONTEND_URL**: Phải là URL frontend của bạn (không có trailing slash)
3. **SECRET_KEY**: Không được có dấu ngoặc kép trong giá trị
4. **SMTP_PASSWORD**: Nên sử dụng Gmail App Password (xem `SUA_LOI_EMAIL_RENDER.md`)
5. **DEBUG**: Phải là `False` trong production

## 🔍 Kiểm Tra Sau Khi Deploy

1. Vào Logs trong Render Dashboard
2. Kiểm tra không có lỗi "environment variable not found"
3. Test các chức năng:
   - Đăng nhập
   - Quên mật khẩu (gửi email)
   - Gửi báo giá (gửi email)
   - Kết nối database

## 📝 Ghi Chú

- Các biến có giá trị mặc định trong code sẽ hoạt động nếu không set, nhưng nên set rõ ràng cho production
- Một số biến optional có thể bỏ qua nếu không dùng tính năng đó
- Luôn kiểm tra logs sau khi thay đổi environment variables

