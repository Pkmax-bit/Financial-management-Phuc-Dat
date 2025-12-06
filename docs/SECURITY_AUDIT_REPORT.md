# 🔒 BÁO CÁO KIỂM TRA BẢO MẬT

**Ngày kiểm tra:** 2025-01-XX  
**Mức độ nghiêm trọng:** ⚠️ **CAO** - Có nhiều thông tin nhạy cảm bị hardcode

---

## 🚨 CÁC VẤN ĐỀ BẢO MẬT NGHIÊM TRỌNG

### 1. ⚠️ **CRITICAL: Hardcoded Credentials trong Code**

#### `backend/config.py` - **NGUY HIỂM NHẤT**
```python
# ❌ TẤT CẢ CÁC GIÁ TRỊ NÀY ĐANG BỊ HARDCODE (ĐÃ ĐƯỢC SỬA):
SUPABASE_SERVICE_KEY = "your_supabase_service_role_key_here" # Service Role Key - QUYỀN ADMIN
SUPABASE_DB_PASSWORD = "your_database_password_here"  # Database password
DIFY_API_KEY = "your_dify_api_key_here"  # AI API key
SMTP_PASSWORD = "your_gmail_app_password_here"  # Gmail App Password
SMTP_USER = "your_email@gmail.com"  # Email address
SUPABASE_JWT_SECRET = "your_supabase_jwt_secret_here"
```

**Rủi ro:**
- ✅ Service Role Key cho phép truy cập toàn bộ database (bypass RLS)
- ✅ Database password cho phép kết nối trực tiếp
- ✅ SMTP password cho phép gửi email từ tài khoản của bạn
- ✅ Dify API key có thể bị lạm dụng

#### `backend/services/email_service.py`
```python
# ❌ Hardcoded SMTP password
self.smtp_password = os.getenv("SMTP_PASSWORD")  # Must be provided via environment variable
```

---

### 2. ⚠️ **HIGH: Credentials trong Documentation Files**

Các file documentation chứa credentials thật (KHÔNG phải ví dụ):

- `docs/guides/HUONG_DAN_DEPLOY_RENDER.md` - Chứa tất cả credentials
- `docs/setup/ENV_VARS_CHECKLIST.md` - Chứa credentials thật
- `docs/guides/HUONG_DAN_DEPLOY_FRONTEND_RENDER.md` - Chứa API keys
- `docs/guides/HUONG_DAN_SUA_LOI_UPLOAD_EXCEL.md` - Chứa keys
- `docs/FIX_USER_NOT_ALLOWED_ERROR.md` - Chứa service key
- `docs/fixes/FIX_SERVICE_KEY_ERROR.md` - Chứa keys

**Rủi ro:** Bất kỳ ai có quyền truy cập repository đều có thể đọc được

---

### 3. ⚠️ **MEDIUM: Hardcoded URLs và Defaults**

#### Frontend Files:
- `frontend/src/lib/supabase.ts` - Hardcoded Supabase URL
- `frontend/src/components/sales/QuoteEmailPreviewModal.tsx` - Hardcoded URLs
- `frontend/src/app/customer-view/page.tsx` - Hardcoded storage URLs

#### Scripts:
- `scripts/create/create_admin_user.py` - Hardcoded Supabase URL
- `scripts/utils/simple_dimensions_migration.py` - Hardcoded URL
- `scripts/run/run_dimensions_migration.py` - Hardcoded URL

**Rủi ro:** Dễ dàng xác định infrastructure của bạn

---

### 4. ⚠️ **LOW: Email Addresses trong Code**

- Email `phannguyendangkhoa0915@gmail.com` xuất hiện ở nhiều nơi
- Có thể dùng để social engineering

---

## ✅ GIẢI PHÁP KHẮC PHỤC

### Bước 1: Xóa Hardcoded Credentials trong Code (URGENT)

#### 1.1. Sửa `backend/config.py`
```python
# ✅ SỬA THÀNH:
SUPABASE_URL = os.getenv("SUPABASE_URL")  # Không có default
if not SUPABASE_URL:
    raise ValueError("SUPABASE_URL environment variable is required")

SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")
if not SUPABASE_SERVICE_KEY:
    raise ValueError("SUPABASE_SERVICE_KEY environment variable is required")

# Tương tự cho tất cả các credentials khác
```

#### 1.2. Sửa `backend/services/email_service.py`
```python
# ✅ SỬA THÀNH:
self.smtp_password = os.getenv("SMTP_PASSWORD")
if not self.smtp_password:
    raise ValueError("SMTP_PASSWORD environment variable is required")
```

---

### Bước 2: Xóa Credentials trong Documentation

#### 2.1. Thay thế bằng placeholders
```markdown
# ❌ SAI:
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# ✅ ĐÚNG:
SUPABASE_SERVICE_KEY=your_supabase_service_key_here
```

#### 2.2. Files cần sửa:
- `docs/guides/HUONG_DAN_DEPLOY_RENDER.md`
- `docs/setup/ENV_VARS_CHECKLIST.md`
- `docs/guides/HUONG_DAN_DEPLOY_FRONTEND_RENDER.md`
- `docs/guides/HUONG_DAN_SUA_LOI_UPLOAD_EXCEL.md`
- `docs/FIX_USER_NOT_ALLOWED_ERROR.md`
- `docs/fixes/FIX_SERVICE_KEY_ERROR.md`

---

### Bước 3: Xóa Hardcoded URLs (Optional nhưng nên làm)

#### 3.1. Frontend
```typescript
// ✅ SỬA THÀNH:
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
if (!supabaseUrl) {
  throw new Error("NEXT_PUBLIC_SUPABASE_URL is required")
}
```

---

### Bước 4: Rotate Tất Cả Credentials (QUAN TRỌNG)

Sau khi xóa hardcoded credentials, **PHẢI** rotate (đổi) tất cả:

1. ✅ **Supabase Service Role Key** - Tạo key mới trong Supabase Dashboard
2. ✅ **Database Password** - Đổi password trong Supabase
3. ✅ **Gmail App Password** - Tạo App Password mới
4. ✅ **Dify API Key** - Tạo key mới trong Dify Dashboard
5. ✅ **JWT Secrets** - Tạo secrets mới
6. ✅ **Supabase JWT Secret** - Cập nhật trong Supabase

**Lý do:** Ngay cả khi xóa khỏi code, credentials cũ vẫn có thể đã bị lộ trong git history.

---

### Bước 5: Cập Nhật .gitignore

Đảm bảo `.gitignore` đã có:
```
.env
.env.local
.env.*.local
*.key
*.pem
*.secret
config.local.py
```

---

### Bước 6: Xóa Git History (Nếu Cần)

Nếu repository đã public, credentials có thể đã bị lộ trong git history:

```bash
# ⚠️ CẢNH BÁO: Thao tác này sẽ rewrite git history
# Chỉ làm nếu repository chưa có nhiều contributors

# Option 1: Sử dụng git-filter-repo (recommended)
git filter-repo --path backend/config.py --invert-paths
git filter-repo --path docs/guides/HUONG_DAN_DEPLOY_RENDER.md --invert-paths
# ... (lặp lại cho tất cả files có credentials)

# Option 2: Tạo repository mới và copy code (sau khi đã xóa credentials)
```

---

## 📋 CHECKLIST HÀNH ĐỘNG

### Ngay lập tức (URGENT):
- [ ] Xóa hardcoded credentials trong `backend/config.py`
- [ ] Xóa hardcoded password trong `backend/services/email_service.py`
- [ ] Xóa credentials trong tất cả documentation files
- [ ] Rotate tất cả credentials (Supabase, Gmail, Dify, JWT)
- [ ] Cập nhật environment variables trong Render
- [ ] Test lại ứng dụng sau khi thay đổi

### Trong tuần này:
- [ ] Xóa hardcoded URLs trong frontend
- [ ] Xóa hardcoded URLs trong scripts
- [ ] Review lại tất cả files có thể chứa secrets
- [ ] Thêm validation cho environment variables
- [ ] Tạo script kiểm tra missing environment variables

### Dài hạn:
- [ ] Setup secret scanning (GitHub Advanced Security, GitGuardian)
- [ ] Implement pre-commit hooks để chặn commit secrets
- [ ] Document security best practices
- [ ] Regular security audits

---

## 🔍 CÁC FILE CẦN SỬA NGAY

### Code Files (URGENT):
1. `backend/config.py` - **CRITICAL**
2. `backend/services/email_service.py` - **HIGH**
3. `frontend/src/lib/supabase.ts` - **MEDIUM**
4. `frontend/src/components/sales/QuoteEmailPreviewModal.tsx` - **MEDIUM**
5. `scripts/create/create_admin_user.py` - **MEDIUM**
6. `scripts/utils/simple_dimensions_migration.py` - **MEDIUM**
7. `scripts/run/run_dimensions_migration.py` - **MEDIUM**

### Documentation Files (HIGH):
1. `docs/guides/HUONG_DAN_DEPLOY_RENDER.md` - **HIGH**
2. `docs/setup/ENV_VARS_CHECKLIST.md` - **HIGH**
3. `docs/guides/HUONG_DAN_DEPLOY_FRONTEND_RENDER.md` - **HIGH**
4. `docs/guides/HUONG_DAN_SUA_LOI_UPLOAD_EXCEL.md` - **HIGH**
5. `docs/FIX_USER_NOT_ALLOWED_ERROR.md` - **HIGH**
6. `docs/fixes/FIX_SERVICE_KEY_ERROR.md` - **HIGH**

---

## 🛡️ KHUYẾN NGHỊ BẢO MẬT

1. **Luôn dùng environment variables** - Không bao giờ hardcode credentials
2. **Validate environment variables** - Throw error nếu thiếu
3. **Rotate credentials định kỳ** - Ít nhất 3-6 tháng một lần
4. **Sử dụng secret management** - AWS Secrets Manager, HashiCorp Vault
5. **Code review** - Luôn review code trước khi merge
6. **Security scanning** - Sử dụng tools như GitGuardian, Snyk
7. **Least privilege** - Chỉ cấp quyền tối thiểu cần thiết

---

## 📞 LIÊN HỆ NẾU CẦN HỖ TRỢ

Nếu cần hỗ trợ rotate credentials hoặc setup security tools, vui lòng liên hệ.

**⚠️ QUAN TRỌNG:** Thực hiện các bước trên NGAY LẬP TỨC để bảo vệ hệ thống.

