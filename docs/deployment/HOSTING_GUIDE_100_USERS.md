# Hướng Dẫn Hosting và Tên Miền cho 100 Người Dùng

## 📋 Tổng Quan

Dự án của bạn sử dụng:
- **Backend**: FastAPI (Python) 
- **Frontend**: Next.js (React)
- **Database**: Supabase (PostgreSQL)

Với **100 người dùng đồng thời**, bạn cần hosting mạnh và ổn định.

---

## 🌐 1. MUA TÊN MIỀN (Domain)

### 1.1. Nhà Cung Cấp Tên Miền Việt Nam (Khuyến Nghị)

#### **P.A Vietnam** (https://www.pavietnam.vn/)
- **Giá**: ~200,000 - 300,000 VNĐ/năm (.com, .vn)
- **Ưu điểm**: 
  - Hỗ trợ tiếng Việt
  - Thanh toán dễ dàng
  - DNS quản lý đơn giản
- **Phù hợp**: Người dùng Việt Nam

#### **Matbao** (https://www.matbao.net/)
- **Giá**: ~250,000 - 350,000 VNĐ/năm
- **Ưu điểm**: 
  - Uy tín lâu năm
  - Hỗ trợ tốt
  - Nhiều tên miền .vn

#### **Nhân Hòa** (https://nhanhoa.com/)
- **Giá**: ~200,000 - 400,000 VNĐ/năm
- **Ưu điểm**: 
  - Giá rẻ
  - Nhiều khuyến mãi

### 1.2. Nhà Cung Cấp Quốc Tế

#### **Namecheap** (https://www.namecheap.com/)
- **Giá**: ~$10-15/năm (.com)
- **Ưu điểm**: 
  - Giá rẻ
  - DNS tốt
  - Bảo mật miễn phí (SSL)

#### **Cloudflare** (https://www.cloudflare.com/)
- **Giá**: ~$8-10/năm (.com)
- **Ưu điểm**: 
  - DNS nhanh nhất
  - CDN miễn phí
  - Bảo mật tốt

#### **Google Domains** (https://domains.google/)
- **Giá**: ~$12/năm
- **Ưu điểm**: 
  - Tích hợp Google
  - Quản lý dễ

### 1.3. Khuyến Nghị

**Cho người dùng Việt Nam**: 
- **P.A Vietnam** hoặc **Matbao** (dễ thanh toán, hỗ trợ tốt)

**Cho người dùng quốc tế**:
- **Namecheap** hoặc **Cloudflare** (giá rẻ, DNS tốt)

---

## 🚀 2. HOSTING BACKEND (FastAPI)

### 2.1. Option 1: Render.com (Khuyến Nghị cho 100 users)

#### **Starter Plan** ($7/tháng)
- **RAM**: 512 MB
- **CPU**: Shared
- **Bandwidth**: 100 GB/tháng
- **Ưu điểm**:
  - Dễ deploy (tự động từ GitHub)
  - SSL miễn phí
  - Auto-scaling
  - Hỗ trợ Python tốt
- **Phù hợp**: 50-100 users đồng thời

#### **Standard Plan** ($25/tháng) - **KHUYẾN NGHỊ**
- **RAM**: 2 GB
- **CPU**: Dedicated
- **Bandwidth**: 400 GB/tháng
- **Ưu điểm**:
  - Mạnh hơn, ổn định hơn
  - Không bị sleep
  - Phù hợp 100-200 users
- **Link**: https://render.com

**Cấu hình đề xuất**:
```yaml
# render.yaml
plan: starter  # hoặc standard
workers: 2-3   # Tăng số workers
```

### 2.2. Option 2: Railway.app

#### **Pro Plan** ($20/tháng)
- **RAM**: 8 GB
- **CPU**: Shared
- **Bandwidth**: Unlimited
- **Ưu điểm**:
  - Deploy nhanh
  - Auto-scaling
  - Hỗ trợ tốt
- **Link**: https://railway.app

### 2.3. Option 3: DigitalOcean App Platform

#### **Basic Plan** ($12/tháng)
- **RAM**: 512 MB
- **CPU**: Shared
- **Bandwidth**: 100 GB
- **Ưu điểm**:
  - Ổn định
  - Hỗ trợ tốt
- **Link**: https://www.digitalocean.com/products/app-platform

#### **Professional Plan** ($25/tháng) - **KHUYẾN NGHỊ**
- **RAM**: 1 GB
- **CPU**: Shared
- **Bandwidth**: 200 GB
- **Phù hợp**: 100-150 users

### 2.4. Option 4: VPS (Tự Quản Lý)

#### **DigitalOcean Droplet** ($12-24/tháng)
- **RAM**: 2-4 GB
- **CPU**: 1-2 vCPU
- **Storage**: 50-80 GB SSD
- **Ưu điểm**:
  - Toàn quyền kiểm soát
  - Hiệu năng tốt
  - Giá rẻ
- **Nhược điểm**:
  - Cần tự cấu hình
  - Tự bảo trì
- **Link**: https://www.digitalocean.com/products/droplets

#### **Vultr** ($12-24/tháng)
- Tương tự DigitalOcean
- Giá cạnh tranh
- **Link**: https://www.vultr.com

#### **Hetzner** (€4-8/tháng) - **GIÁ RẺ NHẤT**
- **RAM**: 4-8 GB
- **CPU**: 2-4 vCPU
- **Storage**: 40-80 GB SSD
- **Ưu điểm**: Giá rẻ nhất, hiệu năng tốt
- **Link**: https://www.hetzner.com

### 2.5. Khuyến Nghị Backend

**Cho 100 users, khuyến nghị**:
1. **Render Standard Plan** ($25/tháng) - Dễ nhất, ổn định
2. **DigitalOcean App Platform Professional** ($25/tháng) - Ổn định, hỗ trợ tốt
3. **VPS DigitalOcean/Hetzner** ($12-24/tháng) - Tự quản lý, hiệu năng tốt

---

## 🎨 3. HOSTING FRONTEND (Next.js)

### 3.1. Option 1: Vercel (Khuyến Nghị - TỐT NHẤT cho Next.js)

#### **Pro Plan** ($20/tháng)
- **Bandwidth**: 1 TB/tháng
- **Builds**: Unlimited
- **Edge Network**: Global CDN
- **Ưu điểm**:
  - Tối ưu cho Next.js (tạo bởi Vercel)
  - CDN toàn cầu
  - Deploy tự động từ GitHub
  - SSL miễn phí
  - Analytics
- **Link**: https://vercel.com

#### **Enterprise Plan** ($40/tháng)
- Nếu cần nhiều tính năng hơn

### 3.2. Option 2: Netlify

#### **Pro Plan** ($19/tháng)
- **Bandwidth**: 1 TB/tháng
- **Builds**: 1,000/tháng
- **Edge Network**: Global CDN
- **Ưu điểm**: Tương tự Vercel
- **Link**: https://www.netlify.com

### 3.3. Option 3: Cloudflare Pages (MIỄN PHÍ)

#### **Free Plan**
- **Bandwidth**: Unlimited
- **Builds**: 500/tháng
- **Edge Network**: Global CDN
- **Ưu điểm**: 
  - Miễn phí
  - CDN nhanh
- **Nhược điểm**: 
  - Build time giới hạn
  - Ít tính năng hơn
- **Link**: https://pages.cloudflare.com

### 3.4. Option 4: Render.com

#### **Starter Plan** ($7/tháng)
- Có thể host frontend trên Render
- Nhưng không tối ưu bằng Vercel

### 3.5. Khuyến Nghị Frontend

**Cho Next.js, khuyến nghị**:
1. **Vercel Pro** ($20/tháng) - TỐI ƯU NHẤT
2. **Netlify Pro** ($19/tháng) - Tốt
3. **Cloudflare Pages** (Miễn phí) - Nếu ngân sách hạn chế

---

## 💾 4. DATABASE (Supabase)

### 4.1. Supabase Plans

#### **Free Plan** (Miễn phí)
- **Database**: 500 MB
- **Bandwidth**: 2 GB/tháng
- **API Requests**: 50,000/tháng
- **Phù hợp**: Testing, < 10 users

#### **Pro Plan** ($25/tháng) - **KHUYẾN NGHỊ cho 100 users**
- **Database**: 8 GB
- **Bandwidth**: 50 GB/tháng
- **API Requests**: 5,000,000/tháng
- **Backup**: Daily
- **Support**: Email
- **Phù hợp**: 50-200 users
- **Link**: https://supabase.com/pricing

#### **Team Plan** ($599/tháng)
- Cho doanh nghiệp lớn
- 100+ users

### 4.2. Khuyến Nghị Database

**Cho 100 users**: **Supabase Pro** ($25/tháng)

---

## 💰 5. TỔNG CHI PHÍ HÀNG THÁNG

### Option 1: Tối Ưu (Khuyến Nghị)
- **Tên miền**: $10/năm (~$1/tháng)
- **Backend (Render Standard)**: $25/tháng
- **Frontend (Vercel Pro)**: $20/tháng
- **Database (Supabase Pro)**: $25/tháng
- **Tổng**: **~$71/tháng** (~1,700,000 VNĐ/tháng)

### Option 2: Tiết Kiệm
- **Tên miền**: $10/năm (~$1/tháng)
- **Backend (Render Starter)**: $7/tháng
- **Frontend (Cloudflare Pages)**: $0/tháng
- **Database (Supabase Pro)**: $25/tháng
- **Tổng**: **~$33/tháng** (~800,000 VNĐ/tháng)

### Option 3: Tự Quản Lý (VPS)
- **Tên miền**: $10/năm (~$1/tháng)
- **VPS (Hetzner)**: €6/tháng (~$7/tháng)
- **Frontend (Vercel Pro)**: $20/tháng
- **Database (Supabase Pro)**: $25/tháng
- **Tổng**: **~$53/tháng** (~1,300,000 VNĐ/tháng)
- **Lưu ý**: Cần kiến thức quản trị server

---

## 📝 6. HƯỚNG DẪN SETUP

### 6.1. Mua Tên Miền

1. Chọn nhà cung cấp (P.A Vietnam, Namecheap, etc.)
2. Tìm tên miền phù hợp (ví dụ: `phucdat.com.vn`)
3. Thanh toán và kích hoạt
4. Cấu hình DNS (sẽ làm sau khi có hosting)

### 6.2. Deploy Backend (Render)

1. Đăng ký tài khoản Render: https://render.com
2. Kết nối GitHub repository
3. Tạo Web Service:
   - **Environment**: Python 3
   - **Build Command**: `pip install -r backend/requirements.txt`
   - **Start Command**: `cd backend && uvicorn main:app --host 0.0.0.0 --port $PORT --workers 2`
   - **Plan**: Starter hoặc Standard
4. Thêm Environment Variables:
   - `SUPABASE_URL`
   - `SUPABASE_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `JWT_SECRET`
   - `FRONTEND_URL`
5. Deploy và lấy URL (ví dụ: `https://backend-phucdat.onrender.com`)

### 6.3. Deploy Frontend (Vercel)

1. Đăng ký tài khoản Vercel: https://vercel.com
2. Kết nối GitHub repository
3. Import Project:
   - **Root Directory**: `frontend`
   - **Framework Preset**: Next.js
4. Thêm Environment Variables:
   - `NEXT_PUBLIC_API_URL`: URL backend
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Deploy và lấy URL (ví dụ: `https://phucdat.vercel.app`)

### 6.4. Cấu Hình Tên Miền

#### Trên Render (Backend):
1. Vào Settings > Custom Domain
2. Thêm domain: `api.phucdat.com.vn`
3. Copy DNS records và thêm vào DNS provider

#### Trên Vercel (Frontend):
1. Vào Settings > Domains
2. Thêm domain: `phucdat.com.vn` và `www.phucdat.com.vn`
3. Copy DNS records và thêm vào DNS provider

#### Trên DNS Provider (P.A Vietnam, Namecheap, etc.):
1. Vào DNS Management
2. Thêm các records:
   ```
   Type    Name    Value
   A       @       [IP hoặc CNAME từ Vercel]
   CNAME   www     [CNAME từ Vercel]
   CNAME   api     [CNAME từ Render]
   ```
3. Đợi 24-48 giờ để DNS propagate

### 6.5. Upgrade Supabase

1. Vào Supabase Dashboard: https://supabase.com
2. Chọn project
3. Vào Settings > Billing
4. Upgrade lên Pro Plan ($25/tháng)

---

## 🔧 7. TỐI ƯU HIỆU NĂNG CHO 100 USERS

### 7.1. Backend Optimization

```python
# backend/main.py
# Tăng số workers
uvicorn main:app --host 0.0.0.0 --port $PORT --workers 3

# Hoặc trong render.yaml
startCommand: cd backend && uvicorn main:app --host 0.0.0.0 --port $PORT --workers 3 --timeout-keep-alive 60
```

### 7.2. Database Optimization

1. **Index các cột thường query**:
```sql
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_tasks_project_id ON tasks(project_id);
```

2. **Connection Pooling**:
   - Supabase tự động có connection pooling
   - Không cần cấu hình thêm

### 7.3. Caching

1. **Redis** (nếu cần):
   - Upstash Redis: Free tier có sẵn
   - Cache các query thường dùng

2. **CDN**:
   - Vercel tự động có CDN
   - Cloudflare Pages có CDN

### 7.4. Monitoring

1. **Uptime Monitoring**:
   - UptimeRobot (Free): https://uptimerobot.com
   - Monitor backend và frontend

2. **Error Tracking**:
   - Sentry (Free tier): https://sentry.io
   - Track lỗi real-time

---

## 📊 8. MONITORING & BACKUP

### 8.1. Monitoring

- **Render Dashboard**: Xem logs, metrics
- **Vercel Analytics**: Xem traffic, performance
- **Supabase Dashboard**: Xem database usage

### 8.2. Backup

- **Supabase Pro**: Tự động backup hàng ngày
- **Render**: Có thể backup database
- **Vercel**: Tự động backup code qua GitHub

---

## 🚨 9. LƯU Ý QUAN TRỌNG

1. **SSL Certificate**: Tất cả hosting đều có SSL miễn phí
2. **Environment Variables**: Không commit vào Git
3. **Database Migration**: Chạy migration trước khi deploy
4. **Testing**: Test kỹ trước khi deploy production
5. **Backup**: Đảm bảo có backup thường xuyên

---

## 📞 10. HỖ TRỢ

- **Render Support**: support@render.com
- **Vercel Support**: support@vercel.com
- **Supabase Support**: support@supabase.com

---

## ✅ CHECKLIST TRƯỚC KHI DEPLOY

- [ ] Mua tên miền
- [ ] Đăng ký Render (Backend)
- [ ] Đăng ký Vercel (Frontend)
- [ ] Upgrade Supabase Pro
- [ ] Cấu hình Environment Variables
- [ ] Test backend API
- [ ] Test frontend
- [ ] Cấu hình DNS
- [ ] Setup SSL
- [ ] Test với 100 users (stress test)
- [ ] Setup monitoring
- [ ] Setup backup

---

## 🎯 KHUYẾN NGHỊ CUỐI CÙNG

**Cho 100 users, tôi khuyến nghị**:

1. **Tên miền**: P.A Vietnam hoặc Namecheap (~$10/năm)
2. **Backend**: Render Standard ($25/tháng)
3. **Frontend**: Vercel Pro ($20/tháng)
4. **Database**: Supabase Pro ($25/tháng)

**Tổng chi phí**: ~$71/tháng (~1,700,000 VNĐ/tháng)

**Lý do**:
- ✅ Dễ deploy và quản lý
- ✅ Ổn định, uptime cao
- ✅ Tự động scaling
- ✅ Hỗ trợ tốt
- ✅ SSL miễn phí
- ✅ CDN toàn cầu

**Nếu ngân sách hạn chế**:
- Backend: Render Starter ($7/tháng)
- Frontend: Cloudflare Pages (Free)
- Database: Supabase Pro ($25/tháng)
- **Tổng**: ~$33/tháng
