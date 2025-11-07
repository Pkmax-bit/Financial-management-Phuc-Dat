# 🌐 HƯỚNG DẪN CHẠY HỆ THỐNG TRÊN MẠNG

Hướng dẫn chi tiết để chạy hệ thống và cho phép các thiết bị khác truy cập qua mạng WiFi.

## 📋 MỤC LỤC

1. [Cách chạy nhanh](#cách-chạy-nhanh)
2. [Cách chạy thủ công](#cách-chạy-thủ-công)
3. [Cấu hình Firewall](#cấu-hình-firewall)
4. [Xử lý sự cố](#xử-lý-sự-cố)
5. [Kiểm tra kết nối](#kiểm-tra-kết-nối)

---

## 🚀 CÁCH CHẠY NHANH

### Bước 1: Chạy script tự động

```bash
python start_network.py
```

Script này sẽ:
- ✅ Tự động phát hiện IP local của máy
- ✅ Cập nhật file `.env.local` với IP đúng
- ✅ Khởi động backend trên `0.0.0.0:8000`
- ✅ Khởi động frontend trên `0.0.0.0:3000`
- ✅ Hiển thị thông tin truy cập

### Bước 2: Truy cập từ thiết bị khác

1. **Đảm bảo thiết bị cùng mạng WiFi** với máy chạy server
2. **Mở trình duyệt** trên thiết bị
3. **Truy cập:** `http://[IP_LOCAL]:3000`
   - Ví dụ: `http://192.168.1.25:3000`
   - IP sẽ được hiển thị khi chạy script

### Bước 3: Đăng nhập

Sử dụng một trong các tài khoản test:

| Role | Email | Password | Mô tả |
|------|-------|----------|-------|
| Admin | admin@test.com | 123456 | Quyền truy cập đầy đủ |
| Sales | sales@example.com | 123456 | Quản lý bán hàng |
| Workshop | xuong@gmail.com | 123456 | Chi phí sản xuất |
| Transport | transport@test.com | 123456 | Chi phí vận chuyển |
| Customer | customer@test.com | 123456 | Cổng khách hàng |
| Worker | worker@test.com | 123456 | Chi phí cơ bản |

---

## 🔧 CÁCH CHẠY THỦ CÔNG

Nếu script tự động không hoạt động, bạn có thể chạy thủ công:

### 1. Lấy IP Local

**Windows:**
```bash
ipconfig
```
Tìm `IPv4 Address` của adapter WiFi (thường là `192.168.x.x` hoặc `10.x.x.x`)

**Linux/Mac:**
```bash
ifconfig
# hoặc
ip addr show
```

### 2. Cập nhật file `.env.local`

Tạo hoặc chỉnh sửa file `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL="http://[IP_LOCAL]:8000"
```

Ví dụ:
```env
NEXT_PUBLIC_API_URL="http://192.168.1.25:8000"
```

### 3. Khởi động Backend

```bash
cd backend
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

**Quan trọng:** Phải dùng `--host 0.0.0.0` để cho phép truy cập từ mạng.

### 4. Khởi động Frontend

Mở terminal mới:

```bash
cd frontend
npm run dev -- --hostname 0.0.0.0 --port 3000
```

**Quan trọng:** Phải dùng `--hostname 0.0.0.0` để cho phép truy cập từ mạng.

### 5. Truy cập

- **Desktop:** http://localhost:3000
- **Mobile/Thiết bị khác:** http://[IP_LOCAL]:3000

---

## 🔥 CẤU HÌNH FIREWALL

Nếu thiết bị khác không thể truy cập, có thể Windows Firewall đang chặn.

### Cách 1: Cho phép qua Firewall (Khuyến nghị)

1. Mở **Windows Defender Firewall**
2. Click **"Allow an app or feature through Windows Defender Firewall"**
3. Click **"Change settings"** → **"Allow another app..."**
4. Thêm **Python** và **Node.js**:
   - Python: `C:\Python\python.exe` (hoặc đường dẫn Python của bạn)
   - Node.js: `C:\Program Files\nodejs\node.exe`
5. Check cả **"Private"** và **"Public"**
6. Click **OK**

### Cách 2: Tạm thời tắt Firewall (Chỉ để test)

1. Mở **Windows Defender Firewall**
2. Click **"Turn Windows Defender Firewall on or off"**
3. Tắt cho **Private network** (tạm thời)
4. **⚠️ Lưu ý:** Bật lại sau khi test xong!

### Cách 3: Mở port thủ công

1. Mở **Windows Defender Firewall**
2. Click **"Advanced settings"**
3. Click **"Inbound Rules"** → **"New Rule"**
4. Chọn **"Port"** → **Next**
5. Chọn **TCP** và nhập ports: **3000, 8000**
6. Chọn **"Allow the connection"**
7. Check cả **Domain, Private, Public**
8. Đặt tên: "Financial Management System"
9. Click **Finish**

---

## 🐛 XỬ LÝ SỰ CỐ

### Vấn đề 1: Không thể truy cập từ thiết bị khác

**Nguyên nhân có thể:**
- ❌ Firewall đang chặn
- ❌ IP không đúng
- ❌ Server không chạy trên `0.0.0.0`
- ❌ Thiết bị không cùng mạng WiFi

**Giải pháp:**
1. Kiểm tra IP: Chạy `ipconfig` và đảm bảo IP đúng
2. Kiểm tra Firewall: Xem phần [Cấu hình Firewall](#cấu-hình-firewall)
3. Kiểm tra server: Đảm bảo chạy với `--host 0.0.0.0`
4. Kiểm tra mạng: Đảm bảo thiết bị cùng WiFi

### Vấn đề 2: Lỗi "Failed to fetch" hoặc "Network error"

**Nguyên nhân:**
- ❌ Backend không chạy
- ❌ API URL không đúng trong `.env.local`
- ❌ CORS chưa được cấu hình

**Giải pháp:**
1. Kiểm tra backend: Truy cập `http://[IP]:8000/docs` từ thiết bị
2. Kiểm tra `.env.local`: Đảm bảo `NEXT_PUBLIC_API_URL` đúng
3. Restart frontend sau khi sửa `.env.local`

### Vấn đề 3: Port đã được sử dụng

**Lỗi:** `Port 8000 is already in use` hoặc `Port 3000 is already in use`

**Giải pháp:**
1. Tìm process đang dùng port:
   ```bash
   # Windows
   netstat -ano | findstr :8000
   netstat -ano | findstr :3000
   ```
2. Dừng process:
   ```bash
   taskkill /PID [PID_NUMBER] /F
   ```
3. Hoặc dùng port khác (nhớ cập nhật `.env.local`)

### Vấn đề 4: Next.js không chạy trên network

**Lỗi:** Chỉ truy cập được từ localhost

**Giải pháp:**
1. Đảm bảo chạy với `--hostname 0.0.0.0`:
   ```bash
   npm run dev -- --hostname 0.0.0.0 --port 3000
   ```
2. Kiểm tra `next.config.js` không có cấu hình chặn network

---

## ✅ KIỂM TRA KẾT NỐI

### Từ máy chạy server:

```bash
# Test backend
curl http://localhost:8000/health

# Test frontend
curl http://localhost:3000
```

### Từ thiết bị khác:

1. **Mở trình duyệt** trên thiết bị
2. **Truy cập:**
   - Backend API Docs: `http://[IP]:8000/docs`
   - Frontend: `http://[IP]:3000`
3. **Nếu thấy:**
   - ✅ API Docs → Backend OK
   - ✅ Trang login → Frontend OK
   - ❌ Không truy cập được → Xem phần [Xử lý sự cố](#xử-lý-sự-cố)

### Test với ping:

```bash
# Từ thiết bị khác, ping đến IP của máy server
ping [IP_LOCAL]
```

---

## 📱 CẤU HÌNH CHO MOBILE APP

Nếu bạn có mobile app (Android/iOS), cần cập nhật API URL:

### Android (Java/Kotlin):

```java
// AppConfig.java
public static String getBaseUrl() {
    return "http://[IP_LOCAL]:8000/api/";
}
```

### iOS (Swift):

```swift
// Config.swift
static let baseURL = "http://[IP_LOCAL]:8000/api/"
```

### React Native:

```javascript
// config.js
export const API_BASE_URL = 'http://[IP_LOCAL]:8000/api/';
```

**Lưu ý:** Thay `[IP_LOCAL]` bằng IP thực tế của máy server.

---

## 🔐 BẢO MẬT

⚠️ **Cảnh báo:** Cấu hình này chỉ dành cho **development** trên mạng local.

**Không sử dụng cho production!**

Để production:
- ✅ Sử dụng HTTPS
- ✅ Cấu hình CORS chặt chẽ
- ✅ Sử dụng reverse proxy (nginx)
- ✅ Bật authentication đầy đủ
- ✅ Giới hạn IP truy cập

---

## 📞 HỖ TRỢ

Nếu gặp vấn đề:

1. Kiểm tra log của backend và frontend
2. Kiểm tra Windows Firewall
3. Kiểm tra IP và mạng WiFi
4. Xem lại phần [Xử lý sự cố](#xử-lý-sự-cố)

---

## 🎯 TÓM TẮT NHANH

```bash
# 1. Chạy script tự động
python start_network.py

# 2. Lấy IP từ output (ví dụ: 192.168.1.25)

# 3. Truy cập từ thiết bị khác
# http://192.168.1.25:3000

# 4. Đăng nhập với tài khoản test
# admin@test.com / 123456
```

**Chúc bạn thành công! 🎉**

