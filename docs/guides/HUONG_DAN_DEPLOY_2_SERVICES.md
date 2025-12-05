# Hướng Dẫn Deploy Backend và Frontend Trên 2 Render Services Riêng Biệt

## 📌 Tổng Quan

Deploy backend (FastAPI) và frontend (Next.js) trên 2 Web Services riêng biệt để tối ưu hiệu suất và dễ quản lý.

---

## 🚀 CÁCH 1: Deploy Tự Động Với render.yaml (RECOMMENDED)

### Bước 1: Commit file render.yaml

```bash
git add render.yaml
git commit -m "Add Render blueprint for auto-deployment"
git push origin main
```

### Bước 2: Deploy trên Render Dashboard

1. Đăng nhập vào [Render Dashboard](https://dashboard.render.com/)
2. Click **"New"** → **"Blueprint"**
3. Chọn repository GitHub của bạn: `Pkmax-bit/Financial-management-Phuc-Dat`
4. Render sẽ tự động tạo 2 services từ file `render.yaml`
5. **Quan trọng**: Thêm Environment Variables trong từng service

### Bước 3: Config Environment Variables

#### Backend Service:
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
JWT_SECRET=auto-generated-hoặc-tự-tạo
ENVIRONMENT=production
```

#### Frontend Service:
```
NEXT_PUBLIC_API_URL=https://financial-management-backend.onrender.com
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### Bước 4: Lấy Backend URL

1. Sau khi backend deploy xong, copy URL (ví dụ: `https://financial-management-backend.onrender.com`)
2. Vào Frontend Service → **Environment** → Update biến `NEXT_PUBLIC_API_URL` với URL này
3. Redeploy frontend service

---

## 🛠️ CÁCH 2: Deploy Thủ Công (Manual Setup)

### A. Deploy Backend Service

1. Vào [Render Dashboard](https://dashboard.render.com/)
2. Click **"New+"** → **"Web Service"**
3. Connect repository: `Pkmax-bit/Financial-management-Phuc-Dat`
4. Điền thông tin:

   **Basic Info:**
   - **Name**: `financial-management-backend`
   - **Region**: Singapore (hoặc gần bạn nhất)
   - **Branch**: `main`
   - **Root Directory**: để trống (hoặc `backend`)

   **Build & Deploy:**
   - **Runtime**: `Python 3`
   - **Build Command**: 
     ```bash
     pip install -r backend/requirements.txt
     ```
   - **Start Command**: 
     ```bash
     cd backend && uvicorn main:app --host 0.0.0.0 --port $PORT
     ```

   **Environment Variables:**
   ```
   PYTHON_VERSION=3.11
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   JWT_SECRET=your-secret-key-here
   ENVIRONMENT=production
   ```

5. Click **"Create Web Service"**
6. Đợi deploy xong, copy URL backend (ví dụ: `https://financial-management-backend.onrender.com`)

### B. Deploy Frontend Service

1. Click **"New+"** → **"Web Service"** (hoặc "Static Site" nếu muốn)
2. Connect cùng repository: `Pkmax-bit/Financial-management-Phuc-Dat`
3. Điền thông tin:

   **Basic Info:**
   - **Name**: `financial-management-frontend`
   - **Region**: Singapore (cùng region với backend)
   - **Branch**: `main`
   - **Root Directory**: để trống (hoặc `frontend`)

   **Build & Deploy:**
   - **Runtime**: `Node`
   - **Build Command**: 
     ```bash
     cd frontend && npm install && npm run build
     ```
   - **Start Command**: 
     ```bash
     cd frontend && npm start
     ```

   **Environment Variables:**
   ```
   NODE_VERSION=20.x
   NEXT_PUBLIC_API_URL=https://financial-management-backend.onrender.com
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

4. Click **"Create Web Service"**

---

## ✅ Kiểm Tra Sau Khi Deploy

### Test Backend:
```bash
curl https://financial-management-backend.onrender.com/
```
Kết quả mong đợi: Response từ FastAPI

### Test Frontend:
Truy cập: `https://financial-management-frontend.onrender.com`
Kết quả mong đợi: Trang web load được

### Test API Connection:
1. Vào frontend URL
2. Mở DevTools Console (F12)
3. Kiểm tra Network tab xem API calls có thành công không

---

## 🔄 Auto-Deploy Khi Push Code

Mỗi khi bạn push code lên GitHub:
- Backend service tự động rebuild nếu có thay đổi trong `backend/`
- Frontend service tự động rebuild nếu có thay đổi trong `frontend/`
- Render sẽ gửi email thông báo kết quả deploy

---

## 💰 Chi Phí

### Free Plan (Khuyến nghị cho test):
- **Backend**: Free Web Service (750 giờ/tháng, sleep sau 15 phút không hoạt động)
- **Frontend**: Free Web Service hoặc Static Site
- **Tổng**: $0/tháng

### Starter Plan (Khuyến nghị cho production):
- **Backend**: $7/tháng (không sleep, 512MB RAM)
- **Frontend**: $7/tháng (hoặc dùng Vercel/Netlify free cho frontend)
- **Tổng**: $14/tháng

---

## 🐛 Troubleshooting

### 1. Lỗi Python Version (Backend build failed):
**Lỗi:** `The PYTHON_VERSION must provide a major, minor, and patch version, e.g. 3.8.1`

**Nguyên nhân:** Render yêu cầu Python version phải có 3 số (major.minor.patch)

**Giải pháp:**
```yaml
# ❌ SAI
PYTHON_VERSION=3.11

# ✅ ĐÚNG
PYTHON_VERSION=3.11.9
```

Đã fix trong commit mới nhất, chỉ cần redeploy hoặc pull code mới.

### 2. Frontend không connect được Backend:
- Kiểm tra `NEXT_PUBLIC_API_URL` đã đúng backend URL chưa
- Kiểm tra CORS trong backend (`main.py`) có allow frontend URL chưa
- Thêm `FRONTEND_URL` vào backend environment variables

### 3. Backend bị sleep (Free plan):
- Dùng [UptimeRobot](https://uptimerobot.com/) để ping backend mỗi 5 phút
- Hoặc upgrade lên Starter plan ($7/tháng)

### 4. Build failed - Module not found:
**Lỗi:** `Module not found: Can't resolve '@/lib/apiUrl'`

**Nguyên nhân:** File `apiUrl.ts` bị gitignore

**Giải pháp:** Đã fix trong commit `9644f7f`, pull code mới nhất

### 5. CORS Error trong browser:
**Lỗi:** `Access to fetch at '...' from origin '...' has been blocked by CORS policy`

**Giải pháp:**
1. Thêm `FRONTEND_URL` vào backend environment variables
2. Set `ENVIRONMENT=production` trong backend
3. Redeploy backend service

### 6. Logs và Debug:
- Vào Render Dashboard → Service → **Logs** tab
- Xem realtime logs để debug
- Tìm error messages cụ thể

---

## 📚 Tài Liệu Tham Khảo

- [Render Web Services](https://render.com/docs/web-services)
- [Render Blueprints](https://render.com/docs/blueprint-spec)
- [Deploy Next.js on Render](https://render.com/docs/deploy-nextjs-app)
- [Deploy FastAPI on Render](https://render.com/docs/deploy-fastapi)

---

## 🎯 Kết Luận

**Nên chọn cách nào?**
- ✅ **Cách 1 (Blueprint)**: Nhanh, tự động, dễ quản lý → **KHUYẾN NGHỊ**
- ⚠️ **Cách 2 (Manual)**: Kiểm soát chi tiết hơn, phù hợp nếu cần custom nhiều

**2 Services hay 1 Service?**
- ✅ **2 Services riêng biệt** → **KHUYẾN NGHỊ**
- ❌ 1 Service duy nhất → Phức tạp, khó maintain

