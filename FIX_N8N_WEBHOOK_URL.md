# Sửa Lỗi: N8N_WEBHOOK_URL is not set

## ⚠️ VẤN ĐỀ

Lỗi: `N8N_WEBHOOK_URL is not set. Please set it in environment variables (backend/.env file).`

## ✅ GIẢI PHÁP

### Bước 1: Kiểm tra file `.env`

File `.env` đã có và có dòng:
```
N8N_WEBHOOK_URL=https://brain.ai.vn/webhook/email
```

✅ **File đã có đúng cấu hình!**

### Bước 2: Restart Backend (QUAN TRỌNG!)

**Vấn đề:** Backend chưa load lại biến môi trường từ file `.env`.

**Cách sửa:**

1. **Dừng backend:**
   - Tìm terminal đang chạy backend
   - Nhấn `Ctrl+C` để dừng hoàn toàn

2. **Chạy lại backend:**
   ```bash
   cd backend
   python -m uvicorn main:app --reload
   ```

3. **Đợi backend khởi động xong:**
   - Sẽ thấy: `INFO:     Application startup complete.`
   - Hoặc: `INFO:     Uvicorn running on http://127.0.0.1:8000`

### Bước 3: Kiểm tra lại

1. **Kiểm tra endpoint config:**
   - Truy cập: `http://localhost:8000/api/auth/email-config`
   - Phải thấy: `"n8n_webhook_url": "https://brain.ai.vn/webhook/email"` (không phải "NOT SET")

2. **Test lại nút test email:**
   - Vào `/forgot-password`
   - Nhập email và click "Test gửi email qua n8n"
   - Phải thành công và thấy log trong console backend

---

## 🔍 Nếu Vẫn Lỗi Sau Khi Restart

### Kiểm tra 1: File `.env` có ở đúng thư mục không?

File `.env` phải ở trong thư mục `backend/`, không phải thư mục root.

**Đường dẫn đúng:**
```
C:\Projects\Financial-management-Phuc-Dat\backend\.env
```

**Kiểm tra:**
```bash
cd backend
dir .env
```

### Kiểm tra 2: Format trong file `.env` có đúng không?

Mở file `backend/.env` và kiểm tra:

**✅ ĐÚNG:**
```bash
N8N_WEBHOOK_URL=https://brain.ai.vn/webhook/email
```

**❌ SAI:**
```bash
N8N_WEBHOOK_URL="https://brain.ai.vn/webhook/email"  # Có dấu ngoặc kép
N8N_WEBHOOK_URL = https://brain.ai.vn/webhook/email  # Có khoảng trắng
# N8N_WEBHOOK_URL=https://brain.ai.vn/webhook/email  # Có dấu # (bị comment)
```

### Kiểm tra 3: Backend có đọc được biến môi trường không?

Thêm test endpoint để kiểm tra:

Truy cập: `http://localhost:8000/api/auth/email-config`

Xem `env_n8n_webhook_url`:
- ✅ Có URL → Backend đã đọc được
- ❌ "NOT SET" → Backend chưa đọc được, cần restart lại

---

## 🎯 Tóm Tắt

**Vấn đề:** Backend chưa load lại biến môi trường từ `.env`

**Giải pháp:**
1. ✅ File `.env` đã có `N8N_WEBHOOK_URL` (đã kiểm tra)
2. ✅ **Restart backend** (Ctrl+C rồi chạy lại)
3. ✅ Test lại endpoint `/api/auth/email-config`
4. ✅ Test lại nút "Test gửi email qua n8n"

**Sau khi restart, nút test sẽ hoạt động và gửi email qua n8n!**

