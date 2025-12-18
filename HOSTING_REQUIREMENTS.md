# Yêu Cầu Tối Thiểu Để Host Dự Án Web

## 📋 Tổng Quan

Dự án bao gồm 2 phần chính:
- **Frontend**: Next.js 15.5.4 (React 19.1.0)
- **Backend**: FastAPI (Python 3.11.9)
- **Database**: Supabase (Managed Service - không cần host riêng)

---

## 🖥️ Yêu Cầu Tối Thiểu Cho Backend (FastAPI)

### **Cấu Hình Server Tối Thiểu:**
- **RAM**: 512 MB (tối thiểu) - **Khuyến nghị: 1 GB**
- **CPU**: 1 vCPU (tối thiểu) - **Khuyến nghị: 2 vCPU**
- **Storage**: 1 GB (cho code và dependencies)
- **Python Version**: 3.11.9
- **OS**: Linux (Ubuntu 20.04+ hoặc tương đương)

### **Dependencies Chính:**
- FastAPI 0.104.1
- Uvicorn (ASGI server)
- Supabase client
- PostgreSQL driver (psycopg2)
- Các thư viện xử lý dữ liệu (pandas, openpyxl)

### **Lưu Lượng Mạng:**
- **Bandwidth**: 100 GB/tháng (tối thiểu)
- **Khuyến nghị**: 500 GB/tháng cho production

### **Port & Network:**
- Port: 8000 (mặc định) hoặc PORT từ environment variable
- Cần hỗ trợ HTTPS/SSL

---

## 🌐 Yêu Cầu Tối Thiểu Cho Frontend (Next.js)

### **Cấu Hình Server Tối Thiểu:**
- **RAM**: 512 MB (tối thiểu) - **Khuyến nghị: 1 GB**
- **CPU**: 1 vCPU (tối thiểu) - **Khuyến nghị: 2 vCPU**
- **Storage**: 2 GB (cho node_modules và build files)
- **Node.js Version**: 20.x (LTS)
- **OS**: Linux (Ubuntu 20.04+ hoặc tương đương)

### **Build Requirements:**
- **RAM khi build**: Tối thiểu 1 GB (Next.js build cần nhiều memory)
- **Build time**: ~3-5 phút (tùy vào server)

### **Runtime:**
- Next.js production server (npm start)
- Static file serving
- Server-Side Rendering (SSR)

### **Lưu Lượng Mạng:**
- **Bandwidth**: 100 GB/tháng (tối thiểu)
- **Khuyến nghị**: 500 GB/tháng cho production

---

## 💾 Database (Supabase)

### **Không Cần Host Riêng:**
- Supabase là managed service
- Chỉ cần API keys và connection strings
- Free tier: 500 MB database, 2 GB bandwidth

### **Yêu Cầu:**
- Supabase URL
- Supabase Anon Key
- Supabase Service Role Key
- Database connection string (PostgreSQL)

---

## 🚀 Cấu Hình Khuyến Nghị Cho Production

### **Backend:**
```
RAM: 2 GB
CPU: 2 vCPU
Storage: 5 GB
Bandwidth: 1 TB/tháng
```

### **Frontend:**
```
RAM: 2 GB
CPU: 2 vCPU
Storage: 5 GB
Bandwidth: 1 TB/tháng
```

---

## 📦 Các Platform Hosting Được Khuyến Nghị

### **1. Render.com (Free Tier)**
- **Backend**: Free tier (512 MB RAM, sleep sau 15 phút không dùng)
- **Frontend**: Free tier (512 MB RAM)
- **Ưu điểm**: Dễ setup, hỗ trợ auto-deploy từ GitHub
- **Nhược điểm**: Sleep khi không dùng (free tier)

### **2. Vercel (Frontend) + Render (Backend)**
- **Frontend**: Vercel (tốt nhất cho Next.js)
  - Free tier: 100 GB bandwidth/tháng
  - Auto SSL, CDN global
- **Backend**: Render hoặc Railway

### **3. Railway.app**
- **Backend + Frontend**: $5/tháng
- 512 MB RAM, 1 vCPU
- Không sleep, tốc độ nhanh

### **4. DigitalOcean App Platform**
- **Starter**: $5/tháng
- 512 MB RAM, 1 vCPU
- Auto-scaling

### **5. AWS/GCP/Azure**
- **Tối thiểu**: t2.micro (AWS) - 1 GB RAM, 1 vCPU
- **Chi phí**: ~$10-15/tháng
- **Ưu điểm**: Ổn định, scalable

---

## 🔧 Environment Variables Cần Thiết

### **Backend:**
```env
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_service_key
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_DB_HOST=your_db_host
SUPABASE_DB_USER=your_db_user
SUPABASE_DB_PASSWORD=your_db_password
SUPABASE_DB_NAME=postgres
SUPABASE_DB_PORT=6543
SUPABASE_JWT_SECRET=your_jwt_secret
FRONTEND_BASE_URL=https://your-frontend-url.com
ENVIRONMENT=production
```

### **Frontend:**
```env
NEXT_PUBLIC_API_URL=https://your-backend-url.com
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

---

## 📊 So Sánh Cấu Hình

| Platform | RAM | CPU | Storage | Bandwidth | Chi Phí |
|----------|-----|-----|---------|-----------|---------|
| **Render Free** | 512 MB | 0.5 vCPU | 1 GB | Unlimited* | Free |
| **Render Starter** | 512 MB | 0.5 vCPU | 1 GB | Unlimited* | $7/tháng |
| **Railway** | 512 MB | 1 vCPU | 1 GB | Unlimited* | $5/tháng |
| **Vercel (Frontend)** | - | - | - | 100 GB/tháng | Free |
| **DigitalOcean** | 512 MB | 1 vCPU | 1 GB | 1 TB/tháng | $5/tháng |
| **AWS t2.micro** | 1 GB | 1 vCPU | 8 GB | 1 GB | ~$10/tháng |

*Unlimited với giới hạn fair use

---

## ⚠️ Lưu Ý Quan Trọng

### **1. Memory Requirements:**
- **Build time**: Cần ít nhất 1 GB RAM để build Next.js
- **Runtime**: 512 MB có thể đủ nhưng khuyến nghị 1 GB+

### **2. Cold Start:**
- Render free tier: Sleep sau 15 phút → cold start ~30 giây
- Railway/Vercel: Không sleep → không có cold start

### **3. Database:**
- Supabase free tier đủ cho development
- Production: Nên upgrade lên Pro ($25/tháng) nếu có nhiều users

### **4. SSL/HTTPS:**
- Tất cả platform hiện đại đều tự động cung cấp SSL
- Không cần cấu hình thêm

---

## 🎯 Khuyến Nghị Cho Production

### **Tối Thiểu (Small Team < 10 users):**
- **Backend**: Render Starter ($7/tháng) hoặc Railway ($5/tháng)
- **Frontend**: Vercel (Free)
- **Database**: Supabase Free tier
- **Tổng chi phí**: $5-7/tháng

### **Khuyến Nghị (Medium Team 10-50 users):**
- **Backend**: Railway ($10/tháng) hoặc DigitalOcean ($12/tháng)
- **Frontend**: Vercel Pro ($20/tháng) hoặc Vercel Free
- **Database**: Supabase Pro ($25/tháng)
- **Tổng chi phí**: $35-57/tháng

### **Tối Ưu (Large Team 50+ users):**
- **Backend**: AWS/GCP với auto-scaling
- **Frontend**: Vercel Pro với CDN
- **Database**: Supabase Pro hoặc dedicated PostgreSQL
- **Tổng chi phí**: $100+/tháng

---

## 📝 Checklist Trước Khi Deploy

- [ ] Đã cấu hình tất cả environment variables
- [ ] Database đã được setup trên Supabase
- [ ] SSL/HTTPS đã được enable
- [ ] CORS đã được cấu hình đúng
- [ ] Health check endpoints đã được setup
- [ ] Logging và monitoring đã được cấu hình
- [ ] Backup strategy đã được lên kế hoạch

---

## 🔗 Tài Liệu Tham Khảo

- [Render Documentation](https://render.com/docs)
- [Vercel Documentation](https://vercel.com/docs)
- [Railway Documentation](https://docs.railway.app)
- [Supabase Documentation](https://supabase.com/docs)

