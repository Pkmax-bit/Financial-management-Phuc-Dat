# Hướng Dẫn Deploy Ứng Dụng Lên Render

Hướng dẫn chi tiết để deploy ứng dụng Financial Management lên Render.

## 📋 Mục Lục

1. [Chuẩn Bị](#chuẩn-bị)
2. [Deploy Backend (FastAPI)](#deploy-backend-fastapi)
3. [Deploy Frontend (Next.js)](#deploy-frontend-nextjs)
4. [Cấu Hình Environment Variables](#cấu-hình-environment-variables)
5. [Sửa Lỗi Thường Gặp](#sửa-lỗi-thường-gặp)

---

## 🚀 Chuẩn Bị

### 1. Tạo Tài Khoản Render

1. Truy cập [https://render.com](https://render.com)
2. Đăng ký tài khoản (có thể dùng GitHub để đăng nhập)
3. Xác thực email nếu cần

### 2. Đẩy Code Lên GitHub

Đảm bảo code của bạn đã được push lên GitHub repository:

```bash
git add .
git commit -m "Prepare for Render deployment"
git push origin main
```

---

## 🔧 Deploy Backend (FastAPI)

### Bước 1: Tạo Web Service Mới

1. Đăng nhập vào [Render Dashboard](https://dashboard.render.com)
2. Click **"New +"** → Chọn **"Web Service"**
3. Kết nối GitHub repository của bạn
4. Chọn repository và branch (thường là `main` hoặc `master`)

### Bước 2: Cấu Hình Backend Service

Điền các thông tin sau:

- **Name**: `financial-management-backend`
- **Environment**: `Python 3`
- **Region**: `Singapore` (gần Việt Nam nhất)
- **Branch**: `main` (hoặc branch bạn muốn deploy)
- **Root Directory**: Để trống (hoặc `backend` nếu cấu trúc khác)
- **Build Command**: 
  ```
  pip install -r backend/requirements.txt
  ```
- **Start Command**: 
  ```
  cd backend && uvicorn main:app --host 0.0.0.0 --port $PORT
  ```

⚠️ **QUAN TRỌNG**: Đảm bảo Start Command không có dấu backtick (`) ở cuối. Phải là:
- ✅ ĐÚNG: `cd backend && uvicorn main:app --host 0.0.0.0 --port $PORT`
- ❌ SAI: `cd backend && uvicorn main:app --host 0.0.0.0 --port $PORT``

### Bước 3: Cấu Hình Environment Variables

Trong phần **Environment Variables**, thêm các biến sau:

```
PYTHON_VERSION=3.11.0
SUPABASE_URL=https://mfmijckzlhevduwfigkl.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1mbWlqY2t6bGhldmR1d2ZpZ2tsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjUzOTExMiwiZXhwIjoyMDcyMTE1MTEyfQ.rlFwoXK_Yls7kRxL_lYqYWe3huJhs0V60Wa4Ddd7Ero
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1mbWlqY2t6bGhldmR1d2ZpZ2tsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1MzkxMTIsImV4cCI6MjA3MjExNTExMn0.VPFmvLghhO32JybxDzq-CGVQedgI-LN7Q07rwDhxU4E
SUPABASE_DB_HOST=aws-1-ap-southeast-1.pooler.supabase.com
SUPABASE_DB_USER=postgres.mfmijckzlhevduwfigkl
SUPABASE_DB_PASSWORD=tudonghoa2025
SUPABASE_DB_NAME=postgres
SUPABASE_DB_PORT=6543
DIFY_API_BASE_URL=https://api.dify.ai/v1
DIFY_API_KEY=app-8gGZ55XJ7uNafs4TRAkqO0xl
SMTP_USER=phannguyendangkhoa0915@gmail.com
SMTP_PASSWORD=wozhwluxehsfuqjm
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
EMAIL_DEBUG=1
SECRET_KEY=your_secret_key_here_financial_management_2025
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
SUPABASE_JWT_SECRET=DIiyyRJCCJrFc2FnmaKroTnzZh2I2JqouXOdhSdqu58SkZ3PTGYkpZFN9WrmP7hGfZbXgD4EdkEoatekEIrX0A==
DEBUG=False
ENVIRONMENT=production
```

**Lưu ý**: `CORS_ORIGINS` sẽ được thêm sau khi có URL frontend.

### Bước 4: Deploy

1. Click **"Create Web Service"**
2. Render sẽ tự động build và deploy
3. Chờ quá trình build hoàn tất (thường mất 5-10 phút)
4. Lưu lại URL backend (ví dụ: `https://financial-management-backend.onrender.com`)

---

## 🎨 Deploy Frontend (Next.js)

### Bước 1: Tạo Web Service Mới

1. Trong Render Dashboard, click **"New +"** → Chọn **"Web Service"**
2. Chọn cùng GitHub repository
3. Chọn branch `main`

### Bước 2: Cấu Hình Frontend Service

Điền các thông tin:

- **Name**: `financial-management-frontend`
- **Environment**: `Node`
- **Region**: `Singapore`
- **Branch**: `main`
- **Root Directory**: Để trống (hoặc `frontend`)
- **Build Command**: 
  ```
  cd frontend && npm install && npm run build
  ```
- **Start Command**: 
  ```
  cd frontend && npm start
  ```

### Bước 3: Cấu Hình Environment Variables

Thêm các biến môi trường:

```
NODE_VERSION=20.x
NEXT_PUBLIC_SUPABASE_URL=https://mfmijckzlhevduwfigkl.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1mbWlqY2t6bGhldmR1d2ZpZ2tsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1MzkxMTIsImV4cCI6MjA3MjExNTExMn0.VPFmvLghhO32JybxDzq-CGVQedgI-LN7Q07rwDhxU4E
NEXT_PUBLIC_API_URL=https://financial-management-backend.onrender.com
NEXT_PUBLIC_DIFY_API_BASE_URL=https://api.dify.ai/v1
NEXT_PUBLIC_DIFY_API_KEY=app-8gGZ55XJ7uNafs4TRAkqO0xl
```

**Lưu ý**: Thay `https://financial-management-backend.onrender.com` bằng URL backend thực tế của bạn.

### Bước 4: Deploy

1. Click **"Create Web Service"**
2. Chờ quá trình build và deploy hoàn tất
3. Lưu lại URL frontend (ví dụ: `https://financial-management-frontend.onrender.com`)

### Bước 5: Cập Nhật CORS Backend

Sau khi có URL frontend, quay lại backend service và cập nhật biến `CORS_ORIGINS`:

1. Vào backend service trong Render Dashboard
2. Vào tab **"Environment"**
3. Thêm hoặc cập nhật biến:
   ```
   CORS_ORIGINS=https://financial-management-frontend.onrender.com
   ```
4. Click **"Save Changes"**
5. Click **"Manual Deploy"** → **"Deploy latest commit"** để restart backend với CORS mới

---

## ⚙️ Cấu Hình Environment Variables

### Backend Environment Variables

| Biến | Mô Tả | Ví Dụ |
|------|-------|-------|
| `PYTHON_VERSION` | Phiên bản Python | `3.11.0` |
| `SUPABASE_URL` | URL Supabase project | `https://xxx.supabase.co` |
| `SUPABASE_SERVICE_KEY` | Service role key | `eyJ...` |
| `SUPABASE_ANON_KEY` | Anon key | `eyJ...` |
| `SUPABASE_DB_HOST` | Database host | `aws-1-ap-southeast-1.pooler.supabase.com` |
| `SUPABASE_DB_USER` | Database user | `postgres.xxx` |
| `SUPABASE_DB_PASSWORD` | Database password | `password` |
| `SUPABASE_DB_NAME` | Database name | `postgres` |
| `SUPABASE_DB_PORT` | Database port | `6543` |
| `DIFY_API_BASE_URL` | Dify API URL | `https://api.dify.ai/v1` |
| `DIFY_API_KEY` | Dify API key | `app-xxx` |
| `SMTP_USER` | Email user (Gmail address) | `your-email@gmail.com` |
| `SMTP_PASSWORD` | Email password (Gmail App Password) | `app-password` |
| `SMTP_SERVER` | SMTP server | `smtp.gmail.com` |
| `SMTP_PORT` | SMTP port | `587` |
| `EMAIL_DEBUG` | Enable detailed email error logging | `1` (recommended for troubleshooting) |
| `SECRET_KEY` | JWT secret key | `your-secret-key` |
| `ALGORITHM` | JWT algorithm | `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Token expiry | `30` |
| `SUPABASE_JWT_SECRET` | Supabase JWT secret | `xxx` |
| `DEBUG` | Debug mode | `False` |
| `ENVIRONMENT` | Environment | `production` |
| `CORS_ORIGINS` | Allowed origins | `https://frontend-url.onrender.com` |

### Frontend Environment Variables

| Biến | Mô Tả | Ví Dụ |
|------|-------|-------|
| `NODE_VERSION` | Phiên bản Node.js | `20.x` |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase URL | `https://xxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key | `eyJ...` |
| `NEXT_PUBLIC_API_URL` | Backend API URL | `https://backend.onrender.com` |
| `NEXT_PUBLIC_DIFY_API_BASE_URL` | Dify API URL | `https://api.dify.ai/v1` |
| `NEXT_PUBLIC_DIFY_API_KEY` | Dify API key | `app-xxx` |

---

## 🔍 Sửa Lỗi Thường Gặp

### 1. Lỗi: `unexpected EOF while looking for matching ``'`

**Triệu chứng**: 
```
bash: -c: line 1: unexpected EOF while looking for matching ``'
```

**Nguyên nhân**: Start Command có dấu backtick (`) ở cuối

**Giải pháp**:
1. Vào Render Dashboard → Chọn service bị lỗi
2. Vào tab **"Settings"**
3. Tìm phần **"Start Command"**
4. Xóa dấu backtick (`) ở cuối nếu có
5. Start Command phải là:
   ```
   cd backend && uvicorn main:app --host 0.0.0.0 --port $PORT
   ```
   (KHÔNG có dấu backtick ở cuối)
6. Click **"Save Changes"**
7. Click **"Manual Deploy"** → **"Deploy latest commit"**

### 2. Lỗi CORS

**Triệu chứng**: Frontend không thể gọi API backend

**Giải pháp**:
- Kiểm tra `CORS_ORIGINS` trong backend có đúng URL frontend không
- Đảm bảo URL không có trailing slash
- Restart backend service sau khi sửa

### 3. Lỗi Build Failed

**Triệu chứng**: Build process bị lỗi

**Giải pháp**:
- Kiểm tra logs trong Render dashboard
- Đảm bảo `requirements.txt` và `package.json` đầy đủ
- Kiểm tra Python/Node version có đúng không
- Kiểm tra Build Command có đúng không

### 4. Lỗi Database Connection

**Triệu chứng**: Backend không kết nối được database

**Giải pháp**:
- Kiểm tra các biến môi trường database
- Đảm bảo Supabase cho phép kết nối từ Render IP
- Kiểm tra firewall settings trong Supabase

### 5. Lỗi Environment Variables

**Triệu chứng**: Ứng dụng không đọc được env vars

**Giải pháp**:
- Đảm bảo tất cả biến môi trường đã được thêm vào Render
- Kiểm tra tên biến có đúng không (case-sensitive)
- Restart service sau khi thêm/sửa env vars

### 7. Lỗi Gửi Email (Quên Mật Khẩu / Báo Giá)

**Triệu chứng**: Không gửi được email quên mật khẩu hoặc báo giá

**Giải pháp**:
- Xem file `SUA_LOI_EMAIL_RENDER.md` để hướng dẫn chi tiết
- Đảm bảo `SMTP_USER` và `SMTP_PASSWORD` đã được set (sử dụng Gmail App Password)
- Kiểm tra logs trong Render Dashboard để xem lỗi cụ thể
- Đảm bảo Gmail 2-Step Verification đã bật và đã tạo App Password

### 6. Lỗi Port Binding

**Triệu chứng**: 
```
==> No open ports detected, continuing to scan...
```

**Giải pháp**:
- Đảm bảo Start Command sử dụng `$PORT` (biến môi trường của Render)
- Start Command phải có: `--port $PORT`
- Không hardcode port number

### Xem Logs

1. Vào Render Dashboard
2. Chọn service cần xem logs
3. Click tab **"Logs"**
4. Xem real-time logs hoặc download logs

---

## 📝 Lưu Ý Quan Trọng

### 1. Free Tier Limitations

- Render free tier có thể sleep sau 15 phút không hoạt động
- Request đầu tiên sau khi sleep có thể mất 30-60 giây để wake up
- Nên upgrade lên paid plan cho production

### 2. Environment Variables

- **KHÔNG** commit các file `.env` lên GitHub
- Sử dụng Render Environment Variables thay vì file `.env`
- Các biến `NEXT_PUBLIC_*` sẽ được expose ra client-side

### 3. Security

- Đảm bảo `SECRET_KEY` và các keys khác là unique và secure
- Không hardcode secrets trong code
- Sử dụng Render's environment variables

### 4. Performance

- Render free tier có giới hạn về resources
- Nên optimize code và database queries
- Sử dụng caching khi có thể

### 5. Start Command Format

- **KHÔNG** dùng dấu backtick (`) trong Start Command
- **KHÔNG** dùng dấu nháy đơn (') hoặc nháy kép (") không cần thiết
- Sử dụng `$PORT` cho port number (Render tự động cung cấp)

---

## 🎉 Hoàn Thành

Sau khi hoàn thành các bước trên, ứng dụng của bạn sẽ được deploy lên Render và có thể truy cập qua URL được cung cấp.

### Checklist

- [ ] Backend đã deploy thành công
- [ ] Frontend đã deploy thành công
- [ ] Environment variables đã được cấu hình đầy đủ
- [ ] CORS đã được cấu hình đúng
- [ ] Start Command không có dấu backtick
- [ ] Đã test các chức năng chính
- [ ] Đã kiểm tra logs không có lỗi

---

## 📞 Hỗ Trợ

Nếu gặp vấn đề, bạn có thể:
1. Xem logs trong Render Dashboard
2. Kiểm tra [Render Documentation](https://render.com/docs)
3. Liên hệ Render Support

Chúc bạn deploy thành công! 🚀

