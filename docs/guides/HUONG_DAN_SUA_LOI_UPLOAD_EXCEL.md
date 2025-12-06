# 🔧 Hướng dẫn khắc phục lỗi "Không thể tải file mẫu"

## ✅ THÔNG BÁO QUAN TRỌNG:

**🎉 Tải file mẫu KHÔNG CẦN đăng nhập!**

Endpoint download template đã được cập nhật thành public. Bạn có thể tải file mẫu mà không cần đăng nhập vào hệ thống.

**⚠️ Chỉ upload file mới cần đăng nhập với quyền Admin/Manager**

## ❌ Lỗi thường gặp:
```
Không thể tải file mẫu
Không thể kết nối đến backend
```

## ✅ Các bước khắc phục:

### 1. **Kiểm tra Backend có đang chạy không** ⭐ QUAN TRỌNG NHẤT

Mở terminal và chạy:
```bash
cd backend
python -m uvicorn main:app --reload
```

Backend phải chạy trên: `http://localhost:8000`

Kiểm tra bằng cách truy cập: http://localhost:8000/docs

### 2. **Tạo file `.env.local` cho Frontend**

Tạo file `frontend/.env.local` với nội dung:

```env
# Supabase Configuration
# ⚠️ Lấy từ Supabase Dashboard → Settings → API
NEXT_PUBLIC_SUPABASE_URL="https://your-project-id.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your_supabase_anon_key_here"

# API Configuration
NEXT_PUBLIC_API_URL="http://localhost:8000"

# Dify API Configuration
# ⚠️ Lấy từ Dify Dashboard → API Keys
NEXT_PUBLIC_DIFY_API_BASE_URL="https://api.dify.ai/v1"
NEXT_PUBLIC_DIFY_API_KEY="your_dify_api_key_here"
```

**Lưu ý:** Copy từ file `frontend/env.local.example` nếu có.

### 3. **Khởi động lại Frontend**

Sau khi tạo file `.env.local`:

```bash
# Dừng frontend (Ctrl+C)
cd frontend
npm run dev
```

### 4. **Kiểm tra Console Log**

Mở DevTools (F12) → Tab Console và xem log:

```
Downloading template from: http://localhost:8000/api/employees/download-template
🎉 Endpoint is public - No authentication required!
Response status: 200
Response ok: true
Blob size: 45678 bytes
✅ Template downloaded successfully!
```

## 🔍 Debug thêm:

### Kiểm tra API URL:
Khi mở modal Upload Excel, bạn sẽ thấy:
```
API URL: http://localhost:8000
```

Nếu không đúng, sửa file `frontend/.env.local`

### Kiểm tra Token (chỉ cho upload file):
**Lưu ý:** Tải file mẫu KHÔNG cần token!

Nếu bạn muốn upload file, mở Console và chạy:
```javascript
localStorage.getItem('token')
```

Nếu `null` → Bạn cần đăng nhập để upload (KHÔNG phải để tải file mẫu)

### Test Backend trực tiếp:

1. Mở trình duyệt và truy cập:
   ```
   http://localhost:8000/docs
   ```

2. Tìm endpoint: `GET /api/employees/download-template`

3. Click "Try it out" → "Execute"

4. Nếu thành công → Backend hoạt động bình thường

## 📋 Checklist:

### Cho tải file mẫu:
- [ ] Backend đang chạy trên `http://localhost:8000` ⭐ QUAN TRỌNG
- [ ] File `frontend/.env.local` đã được tạo với đúng API URL
- [ ] Frontend đã được restart sau khi tạo `.env.local`
- [ ] Console không có lỗi CORS
- [ ] **KHÔNG cần đăng nhập** ✅

### Cho upload file:
- [ ] Tất cả các mục trên ✓
- [ ] Đã đăng nhập với quyền Admin/Manager ⭐
- [ ] Token có trong localStorage
- [ ] File Excel đã điền đúng định dạng

## 🆘 Vẫn còn lỗi?

### Lỗi kết nối (Failed to fetch):
```
Không thể kết nối đến backend
```
→ **Giải pháp:** 
- Backend không chạy → Khởi động backend
- Sai API URL → Kiểm tra `.env.local`
- Firewall chặn → Tắt firewall hoặc thêm exception

### Lỗi 401/403 khi upload file:
```
Unauthorized
```
→ **Giải pháp:** Đăng nhập với quyền Admin/Manager

### Lỗi 500 (Server Error):
```
Lỗi máy chủ
```
→ **Giải pháp:** 
- Kiểm tra backend console có lỗi gì
- Kiểm tra database connection
- Restart backend

### Lỗi CORS:
```
CORS policy blocked
```
→ **Giải pháp:**
- Kiểm tra backend có cấu hình CORS cho localhost:3000
- Restart backend sau khi sửa config

### Lỗi Network:
```
Failed to fetch
```
→ **Giải pháp:**
- Backend không chạy
- Sai API URL
- Firewall chặn

## 📞 Liên hệ:

Nếu vẫn gặp lỗi sau khi thử tất cả các bước trên:
1. Copy toàn bộ log từ Console (F12)
2. Copy error message chi tiết
3. Báo cáo với team

## 🎯 Sau khi fix xong:

1. Tải file mẫu thành công ✅
2. File `mau_nhap_nhan_vien.xlsx` được download ✅
3. File có 5 sheets với dropdown lists ✅
4. Có thể upload và import nhân viên ✅

