# Hướng dẫn Đăng nhập bằng QR Code

## Tổng quan

Tính năng đăng nhập bằng QR Code cho phép người dùng đăng nhập vào ứng dụng Android bằng cách quét mã QR từ trình duyệt web (sau khi đã đăng nhập trên web).

## Cách sử dụng

### Bước 1: Đăng nhập trên Web

1. Mở trình duyệt và truy cập trang đăng nhập: `http://localhost:3000/login` (hoặc URL production)
2. Đăng nhập bằng email và mật khẩu như bình thường
3. Sau khi đăng nhập thành công, bạn sẽ được chuyển đến Dashboard

### Bước 2: Tạo QR Code trên Web

1. Trên Dashboard, tìm và nhấn nút **"📱 Đăng nhập bằng QR"** hoặc **"QR Login"**
2. Một modal sẽ hiển thị với mã QR code
3. QR code có hiệu lực trong **5 phút**

### Bước 3: Quét QR Code từ Android App

1. Mở ứng dụng Android trên điện thoại
2. Ở màn hình đăng nhập, nhấn nút **"📱 Đăng nhập bằng QR"**
3. Cho phép ứng dụng sử dụng camera (nếu được yêu cầu)
4. Đưa camera vào mã QR trên màn hình web
5. Ứng dụng sẽ tự động:
   - Quét và đọc QR code
   - Xác thực với server
   - Đăng nhập tự động
   - Chuyển đến màn hình chính

### Bước 4: Xác nhận

- Trên web: Modal sẽ hiển thị "Đăng nhập thành công!" và tự động đóng sau 2 giây
- Trên Android: Ứng dụng sẽ chuyển đến màn hình Dashboard

## Lưu ý quan trọng

1. **Thời gian hiệu lực**: QR code chỉ có hiệu lực trong 5 phút
2. **Một lần sử dụng**: Mỗi QR code chỉ có thể sử dụng 1 lần
3. **Yêu cầu đăng nhập web**: Bạn phải đăng nhập trên web trước để tạo QR code
4. **Quyền camera**: Android app cần quyền camera để quét QR code
5. **Kết nối mạng**: Cả web và Android app cần kết nối internet

## Xử lý lỗi

### QR code hết hạn
- **Triệu chứng**: "QR code has expired"
- **Giải pháp**: Tạo mã QR mới từ web

### QR code đã được sử dụng
- **Triệu chứng**: "QR code has already been used"
- **Giải pháp**: Tạo mã QR mới từ web

### Không quét được QR code
- **Triệu chứng**: Camera không nhận diện được QR code
- **Giải pháp**: 
  - Đảm bảo đủ ánh sáng
  - Giữ điện thoại ổn định
  - Đưa camera gần hơn hoặc xa hơn
  - Làm sạch camera

### Lỗi kết nối
- **Triệu chứng**: "Lỗi kết nối" hoặc timeout
- **Giải pháp**: 
  - Kiểm tra kết nối internet
  - Đảm bảo backend API đang chạy
  - Thử lại sau vài giây

## Vị trí các nút

### Trên Web (Dashboard)
- Nút **"📱 Đăng nhập bằng QR"** hoặc **"QR Login"** ở:
  - Header/Dashboard
  - Menu người dùng (nếu có)
  - Hoặc có thể thêm vào Settings

### Trên Android App
- Nút **"📱 Đăng nhập bằng QR"** ở:
  - Màn hình đăng nhập (`LoginActivity`)
  - Bên dưới nút "Đăng nhập" thông thường

## Kiến trúc kỹ thuật

### Flow hoạt động

```
1. User đăng nhập trên Web
   ↓
2. Web gọi API: POST /api/auth/qr/generate
   ↓
3. Backend tạo QR session với:
   - session_id (UUID)
   - secret_token (random 32 bytes)
   - user_id, user_email
   - expires_at (5 phút)
   ↓
4. Web hiển thị QR code (JSON chứa session_id + secret_token)
   ↓
5. Web polling: GET /api/auth/qr/status/{session_id} (mỗi 2 giây)
   ↓
6. Android app quét QR code
   ↓
7. Android gọi: POST /api/auth/qr/verify (với session_id)
   ↓
8. Android gọi: POST /api/auth/qr/complete (với session_id + secret_token)
   ↓
9. Backend trả về access_token
   ↓
10. Android lưu token và đăng nhập
    ↓
11. Web nhận status = "verified" và đóng modal
```

### API Endpoints

#### 1. Generate QR Code (Web)
```
POST /api/auth/qr/generate
Headers: Authorization: Bearer {access_token}
Response: {
  session_id: string
  qr_code: string (JSON)
  expires_at: datetime
}
```

#### 2. Verify QR Code (Android)
```
POST /api/auth/qr/verify
Body: {
  session_id: string
}
Response: {
  success: boolean
  message: string
}
```

#### 3. Complete Login (Android)
```
POST /api/auth/qr/complete
Body: {
  session_id: string
  secret_token: string
}
Response: {
  success: boolean
  access_token: string
  token_type: "bearer"
  expires_in: number
  message: string
}
```

#### 4. Check Status (Web - Polling)
```
GET /api/auth/qr/status/{session_id}
Response: {
  status: "pending" | "verified" | "expired"
  verified_at: datetime | null
  user_email: string | null
}
```

## Database

Bảng `qr_login_sessions` lưu trữ các session QR code:
- `id` (UUID): session_id
- `secret_token`: token bí mật trong QR code
- `user_id`: ID người dùng
- `user_email`: Email người dùng
- `status`: "pending" | "verified" | "expired"
- `created_at`: Thời gian tạo
- `expires_at`: Thời gian hết hạn (5 phút)
- `verified_at`: Thời gian xác thực (null nếu chưa verify)

## Bảo mật

1. **Secret Token**: Mỗi QR code có một secret token ngẫu nhiên 32 bytes
2. **Thời gian hết hạn**: QR code tự động hết hạn sau 5 phút
3. **Một lần sử dụng**: Sau khi verify, QR code không thể dùng lại
4. **HTTPS**: Nên sử dụng HTTPS trong production
5. **Token validation**: Backend kiểm tra secret_token trước khi cấp access_token

## Troubleshooting

### Backend không khởi động
- Kiểm tra lỗi IndentationError trong `qr_login.py`
- Đảm bảo đã chạy migration SQL để tạo bảng `qr_login_sessions`

### Android app không quét được
- Kiểm tra quyền CAMERA trong AndroidManifest.xml
- Đảm bảo ML Kit Barcode Scanning đã được cài đặt
- Kiểm tra logcat để xem lỗi chi tiết

### Web không hiển thị QR code
- Kiểm tra console browser để xem lỗi
- Đảm bảo user đã đăng nhập (có access_token)
- Kiểm tra API endpoint `/api/auth/qr/generate` có hoạt động không

## Development Notes

### Chạy Migration SQL
```sql
-- Chạy file: backend/migrations/create_qr_login_sessions.sql
-- Trong Supabase SQL Editor hoặc psql
```

### Test QR Login
1. Đăng nhập trên web
2. Tạo QR code
3. Mở Android app và quét
4. Kiểm tra logs trên cả web và Android

### Debug
- **Backend logs**: Kiểm tra console khi gọi API
- **Android logs**: Sử dụng `adb logcat` hoặc Android Studio Logcat
- **Web console**: Mở DevTools > Console để xem logs

