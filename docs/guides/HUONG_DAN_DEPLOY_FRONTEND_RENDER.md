# Hướng Dẫn Deploy Frontend Lên Render

Hướng dẫn chi tiết để deploy frontend Next.js lên Render sau khi đã deploy backend thành công.

## 📋 Yêu Cầu

- ✅ Backend đã được deploy thành công trên Render
- ✅ Đã có URL backend (ví dụ: `https://financial-management-phuc-dat.onrender.com`)
- ✅ Code đã được push lên GitHub

---

## 🚀 Các Bước Deploy Frontend

### Bước 1: Tạo Web Service Mới

1. Đăng nhập vào [Render Dashboard](https://dashboard.render.com)
2. Click **"New +"** → Chọn **"Web Service"**
3. Kết nối GitHub repository (nếu chưa kết nối)
4. Chọn repository và branch `main` (hoặc branch bạn muốn deploy)

### Bước 2: Cấu Hình Frontend Service

Điền các thông tin sau:

- **Name**: `financial-management-frontend` (hoặc tên bạn muốn)
- **Environment**: `Node`
- **Region**: `Singapore` (gần Việt Nam nhất)
- **Branch**: `main` (hoặc branch bạn muốn deploy)
- **Root Directory**: Để trống (hoặc `frontend` nếu cấu trúc khác)
- **Build Command**: 
  ```
  cd frontend && npm install && npm run build
  ```
- **Start Command**: 
  ```
  cd frontend && npm start
  ```

⚠️ **QUAN TRỌNG**: 
- Đảm bảo Start Command không có dấu backtick (`) ở cuối
- Build Command phải chạy `npm install` trước `npm run build`

### Bước 3: Cấu Hình Environment Variables

Trong phần **Environment Variables**, thêm các biến sau:

```
NODE_VERSION=20.x
# ⚠️ Lấy từ Supabase Dashboard → Settings → API
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
NEXT_PUBLIC_API_URL=https://your-backend-url.onrender.com
NEXT_PUBLIC_DIFY_API_BASE_URL=https://api.dify.ai/v1
# ⚠️ Lấy từ Dify Dashboard → API Keys
NEXT_PUBLIC_DIFY_API_KEY=your_dify_api_key_here
```

**Lưu ý quan trọng**:
- Thay `https://financial-management-phuc-dat.onrender.com` bằng **URL backend thực tế** của bạn
- URL backend phải có `https://` ở đầu
- Không có dấu `/` ở cuối URL

### Bước 4: Deploy

1. Click **"Create Web Service"**
2. Render sẽ tự động build và deploy
3. Chờ quá trình build hoàn tất (thường mất 5-10 phút cho Next.js)
4. Lưu lại URL frontend (ví dụ: `https://financial-management-frontend.onrender.com`)

### Bước 5: Cập Nhật CORS Backend

Sau khi có URL frontend, cần cập nhật CORS trong backend:

1. Vào **backend service** trong Render Dashboard
2. Vào tab **"Environment"**
3. Tìm hoặc thêm biến `CORS_ORIGINS`
4. Đặt giá trị là URL frontend:
   ```
   CORS_ORIGINS=https://financial-management-frontend.onrender.com
   ```
5. Click **"Save Changes"**
6. Click **"Manual Deploy"** → **"Deploy latest commit"** để restart backend với CORS mới

---

## ✅ Kiểm Tra Sau Khi Deploy

### 1. Kiểm Tra Frontend

1. Truy cập URL frontend: `https://your-frontend.onrender.com`
2. Kiểm tra console trong browser (F12) xem có lỗi không
3. Thử đăng nhập và test các chức năng

### 2. Kiểm Tra Backend CORS

1. Truy cập frontend
2. Mở Developer Tools (F12) → Tab Network
3. Thử thực hiện một action (ví dụ: đăng nhập)
4. Kiểm tra xem có lỗi CORS không

### 3. Kiểm Tra API Connection

1. Trong frontend, thử gọi API
2. Kiểm tra Network tab xem request có thành công không
3. Đảm bảo API URL đúng trong environment variables

---

## 🔍 Xử Lý Lỗi Thường Gặp

### Lỗi 1: Build Failed

**Triệu chứng**: Build process bị lỗi

**Giải pháp**:
- Kiểm tra logs trong Render Dashboard
- Đảm bảo `package.json` đầy đủ dependencies
- Kiểm tra Node version có đúng không (nên dùng 20.x)
- Đảm bảo Build Command đúng: `cd frontend && npm install && npm run build`

### Lỗi 2: CORS Error

**Triệu chứng**: 
```
Access to fetch at 'https://backend.onrender.com/api/...' from origin 'https://frontend.onrender.com' has been blocked by CORS policy
```

**Giải pháp**:
- Đảm bảo đã cập nhật `CORS_ORIGINS` trong backend với URL frontend
- Restart backend service sau khi cập nhật CORS
- Kiểm tra URL frontend có đúng không (không có trailing slash)

### Lỗi 3: API Connection Failed

**Triệu chứng**: Frontend không thể kết nối với backend

**Giải pháp**:
- Kiểm tra `NEXT_PUBLIC_API_URL` có đúng URL backend không
- Đảm bảo URL có `https://` ở đầu
- Kiểm tra backend có đang chạy không
- Kiểm tra `next.config.ts` có sử dụng environment variable đúng không

### Lỗi 4: Environment Variables Not Found

**Triệu chứng**: Frontend không đọc được environment variables

**Giải pháp**:
- Đảm bảo tất cả biến môi trường đã được thêm vào Render
- Biến phải bắt đầu với `NEXT_PUBLIC_` để được expose ra client-side
- Restart frontend service sau khi thêm/sửa env vars

### Lỗi 5: Service Sleep (Free Tier)

**Triệu chứng**: Service không phản hồi, mất thời gian load

**Giải pháp**:
- Render free tier có thể sleep sau 15 phút không hoạt động
- Request đầu tiên sau khi sleep có thể mất 30-60 giây để wake up
- Nên upgrade lên paid plan cho production

---

## 📝 Checklist Deploy Frontend

- [ ] Đã tạo Web Service mới trên Render
- [ ] Đã cấu hình đúng Build Command và Start Command
- [ ] Đã thêm tất cả Environment Variables
- [ ] Đã set `NEXT_PUBLIC_API_URL` = URL backend thực tế
- [ ] Frontend đã build và deploy thành công
- [ ] Đã cập nhật CORS trong backend với URL frontend
- [ ] Đã test frontend hoạt động đúng
- [ ] Đã test API connection từ frontend
- [ ] Không có lỗi CORS

---

## 🎉 Hoàn Thành

Sau khi hoàn thành các bước trên, bạn sẽ có:
- ✅ Backend chạy trên Render
- ✅ Frontend chạy trên Render
- ✅ CORS đã được cấu hình đúng
- ✅ Ứng dụng có thể truy cập qua URL frontend

---

## 📚 Xem Thêm

- Xem file `HUONG_DAN_DEPLOY_RENDER.md` để biết hướng dẫn deploy đầy đủ
- Xem file `SUA_LOI_RENDER.md` để biết cách sửa các lỗi thường gặp

Chúc bạn deploy thành công! 🚀

