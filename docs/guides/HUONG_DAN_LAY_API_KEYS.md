# 🔑 Hướng Dẫn Lấy Các API Keys và Credentials

Hướng dẫn chi tiết cách lấy tất cả các API keys và credentials cần thiết cho ứng dụng.

---

## 📋 Danh Sách Các Keys Cần Lấy

### 1. ✅ Supabase Keys

#### SUPABASE_URL
1. Đăng nhập vào [Supabase Dashboard](https://app.supabase.com)
2. Chọn project của bạn
3. Vào **Settings** → **API**
4. Copy **Project URL** (ví dụ: `https://xxxxx.supabase.co`)

#### SUPABASE_SERVICE_KEY (Service Role Key)
1. Trong cùng trang **Settings** → **API**
2. Tìm phần **Project API keys**
3. Copy **service_role** key (⚠️ **QUAN TRỌNG**: Key này có quyền admin, giữ bí mật!)
4. ⚠️ **Lưu ý**: Nếu key đã bị lộ, hãy tạo key mới ngay

#### SUPABASE_ANON_KEY
1. Trong cùng trang **Settings** → **API**
2. Copy **anon** key (public key, an toàn hơn service_role)

#### SUPABASE_JWT_SECRET
1. Vào **Settings** → **API** → **JWT Settings**
2. Copy **JWT Secret**

#### Database Connection Details
1. Vào **Settings** → **Database**
2. Tìm phần **Connection string**
3. Copy các thông tin:
   - **Host**: `aws-1-ap-southeast-1.pooler.supabase.com` (hoặc host của bạn)
   - **Database name**: Thường là `postgres`
   - **Port**: Thường là `6543` (cho connection pooling) hoặc `5432` (direct)
   - **User**: `postgres.your_project_id`
   - **Password**: Database password (nếu quên, có thể reset trong Settings)

---

### 2. ✅ Dify AI API Key

1. Đăng nhập vào [Dify Dashboard](https://dify.ai)
2. Vào **Settings** → **API Keys**
3. Click **Create API Key**
4. Đặt tên cho key (ví dụ: "Financial Management App")
5. Copy key ngay (chỉ hiển thị một lần!)
6. ⚠️ **Lưu ý**: Nếu quên, phải tạo key mới

**Format**: `app-xxxxxxxxxxxxxxxxxxxxx`

---

### 3. ✅ Gmail App Password (Cho SMTP)

#### Tạo App Password:
1. Đăng nhập vào [Google Account](https://myaccount.google.com)
2. Vào **Security** → **2-Step Verification** (phải bật 2FA trước)
3. Cuộn xuống tìm **App passwords**
4. Chọn **Mail** và **Other (Custom name)**
5. Đặt tên: "Financial Management App"
6. Click **Generate**
7. Copy password 16 ký tự (không có khoảng trắng)

**Lưu ý:**
- ⚠️ Không dùng mật khẩu Gmail thông thường
- ⚠️ Phải bật 2-Step Verification trước
- ⚠️ App Password chỉ hiển thị một lần

---

### 4. ✅ Resend API Key (Tùy chọn - Alternative to SMTP)

1. Đăng nhập vào [Resend Dashboard](https://resend.com)
2. Vào **API Keys**
3. Click **Create API Key**
4. Đặt tên và chọn quyền
5. Copy key (bắt đầu với `re_`)

---

### 5. ✅ n8n Webhook (Tùy chọn - Alternative to SMTP)

1. Đăng nhập vào n8n instance của bạn
2. Tạo workflow mới
3. Thêm **Webhook** node
4. Copy **Webhook URL**
5. (Optional) Nếu có authentication, lấy **Webhook ID** và **API Key**

---

### 6. ✅ Generate JWT Secrets

#### SECRET_KEY và API_SECRET

**Trên Linux/Mac:**
```bash
openssl rand -base64 32
```

**Trên Windows (PowerShell):**
```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

**Hoặc dùng Python:**
```python
import secrets
import base64
secret = base64.b64encode(secrets.token_bytes(32)).decode('utf-8')
print(secret)
```

Chạy lệnh này 2 lần để tạo:
- `SECRET_KEY` (cho JWT)
- `API_SECRET` (cho request signing)

---

## 📝 Điền Vào File .env

Sau khi lấy tất cả keys:

### Backend (.env)
1. Mở file `backend/.env`
2. Thay thế tất cả `your_xxx_here` bằng giá trị thật
3. Lưu file

### Frontend (.env.local)
1. Mở file `frontend/.env.local`
2. Thay thế tất cả `your_xxx_here` bằng giá trị thật
3. Lưu file

---

## ⚠️ LƯU Ý BẢO MẬT QUAN TRỌNG

1. ✅ **Không commit file .env lên git**
   - File đã được thêm vào `.gitignore`
   - Luôn kiểm tra trước khi commit

2. ✅ **Không chia sẻ keys**
   - Keys giống như mật khẩu
   - Chỉ chia sẻ với team members cần thiết
   - Sử dụng password manager hoặc secure sharing

3. ✅ **Rotate keys định kỳ**
   - Ít nhất 3-6 tháng một lần
   - Hoặc ngay khi nghi ngờ bị lộ

4. ✅ **Sử dụng environment variables trong production**
   - Render, Vercel, AWS, etc. đều có environment variables
   - Không hardcode trong code

5. ✅ **Phân biệt development và production**
   - Development: Dùng file `.env`
   - Production: Dùng environment variables trong hosting platform

---

## 🔍 Kiểm Tra Keys Đã Đúng

### Test Supabase Connection:
```bash
# Backend
cd backend
python -c "from config import settings; print('✅ Supabase URL:', settings.SUPABASE_URL)"
```

### Test Frontend:
```bash
# Frontend
cd frontend
npm run dev
# Kiểm tra console không có lỗi về missing environment variables
```

---

## 🆘 Nếu Quên Keys

### Supabase:
- Service Key: Có thể xem lại trong Dashboard (nhưng nên rotate nếu đã lộ)
- Database Password: Có thể reset trong Settings → Database

### Dify:
- Phải tạo key mới (không thể xem lại key cũ)

### Gmail App Password:
- Phải tạo password mới (không thể xem lại password cũ)

### JWT Secrets:
- Tạo lại bằng lệnh generate ở trên

---

## 📞 Cần Hỗ Trợ?

Nếu gặp vấn đề khi lấy keys, vui lòng:
1. Kiểm tra lại hướng dẫn trên
2. Xem documentation của từng service
3. Liên hệ support của service đó

---

**Cập nhật lần cuối:** 2025-01-XX

