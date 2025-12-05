# Hướng Dẫn Lấy Resend API Key

## 🔑 `RESEND_API_KEY` Là Gì?

`RESEND_API_KEY` là **mã xác thực** (API Key) để ứng dụng của bạn có thể gửi email thông qua dịch vụ Resend.

- `re_your_api_key_here` là **placeholder/ví dụ** - bạn cần thay bằng API key thực tế
- API key thực tế sẽ có dạng: `re_1234567890abcdefghijklmnopqrstuvwxyz` (bắt đầu với `re_`)

## 📝 Cách Lấy Resend API Key

### Bước 1: Đăng Ký Tài Khoản Resend

1. Truy cập: **https://resend.com**
2. Click nút **"Sign Up"** (hoặc "Get Started")
3. Đăng ký bằng email của bạn
4. Verify email (kiểm tra hộp thư và click link xác nhận)

### Bước 2: Đăng Nhập Vào Dashboard

1. Sau khi verify email, đăng nhập vào Resend
2. Bạn sẽ thấy Dashboard của Resend

### Bước 3: Tạo API Key

1. Trong Dashboard, tìm menu bên trái hoặc trên cùng
2. Click vào **"API Keys"** (hoặc "API")
3. Bạn sẽ thấy danh sách API Keys (nếu có) hoặc màn hình trống
4. Click nút **"Create API Key"** (hoặc "Add API Key")
5. Điền thông tin:
   - **Name**: Đặt tên dễ nhớ, ví dụ: `Render Production` hoặc `Financial Management App`
   - **Permission**: Chọn `Sending access` (chỉ cần quyền gửi email)
6. Click **"Add"** hoặc **"Create"**
7. **QUAN TRỌNG**: Resend sẽ hiển thị API key **CHỈ MỘT LẦN DUY NHẤT**
8. **Copy ngay** API key (bắt đầu với `re_`)
9. **Lưu lại** ở nơi an toàn (ví dụ: password manager)

### Bước 4: Sử Dụng API Key

Sau khi có API key, thêm vào Render Dashboard:

```
RESEND_API_KEY=re_1234567890abcdefghijklmnopqrstuvwxyz
```

**Lưu ý:** 
- Thay `re_1234567890abcdefghijklmnopqrstuvwxyz` bằng API key thực tế của bạn
- **KHÔNG** có dấu cách
- **KHÔNG** có dấu ngoặc kép `"` hoặc `'`

## 📸 Hình Ảnh Minh Họa

### Trong Resend Dashboard:

```
┌─────────────────────────────────────┐
│  Resend Dashboard                   │
├─────────────────────────────────────┤
│  [API Keys] ← Click vào đây        │
│  [Domains]                          │
│  [Emails]                           │
│  [Settings]                         │
└─────────────────────────────────────┘
```

### Khi Tạo API Key:

```
┌─────────────────────────────────────┐
│  Create API Key                     │
├─────────────────────────────────────┤
│  Name: [Render Production    ]      │
│  Permission: [Sending access ▼]     │
│                                     │
│  [Cancel]  [Create API Key]        │
└─────────────────────────────────────┘
```

### Sau Khi Tạo (CHỈ HIỂN THỊ MỘT LẦN):

```
┌─────────────────────────────────────┐
│  API Key Created!                   │
├─────────────────────────────────────┤
│  ⚠️ Copy this key now.              │
│  You won't be able to see it again!│
│                                     │
│  re_1234567890abcdefghijklmnop...   │
│  [Copy]                             │
│                                     │
│  [I've copied it]                  │
└─────────────────────────────────────┘
```

## ⚠️ Lưu Ý Quan Trọng

1. **API Key chỉ hiển thị một lần** - Nếu quên, phải tạo key mới
2. **Không chia sẻ API Key** - Giống như mật khẩu, phải giữ bí mật
3. **Không commit API Key lên GitHub** - Chỉ dùng trong environment variables
4. **Mỗi ứng dụng nên có API Key riêng** - Dễ quản lý và bảo mật

## 🔒 Bảo Mật

- API Key cho phép gửi email từ tài khoản Resend của bạn
- Nếu bị lộ, người khác có thể dùng để gửi email (tốn quota của bạn)
- Nếu nghi ngờ bị lộ, hãy **xóa key cũ** và tạo key mới ngay

## ❓ FAQ

### Q: Tôi không thấy nút "Create API Key"?
**A:** Đảm bảo bạn đã verify email và đăng nhập đúng tài khoản.

### Q: API Key có dạng gì?
**A:** Bắt đầu với `re_` theo sau là chuỗi ký tự dài (ví dụ: `re_abc123xyz...`)

### Q: Tôi quên copy API Key, làm sao?
**A:** Phải tạo API Key mới. Key cũ không thể xem lại được.

### Q: Có thể có nhiều API Key không?
**A:** Có, bạn có thể tạo nhiều API Key cho các mục đích khác nhau.

### Q: API Key có hết hạn không?
**A:** Không, nhưng bạn có thể xóa hoặc tạo mới bất cứ lúc nào.

## 📚 Tài Liệu Tham Khảo

- [Resend API Keys Documentation](https://resend.com/docs/api-reference/api-keys)
- [Resend Dashboard](https://resend.com/api-keys)

---

**Cập nhật lần cuối**: 2025-01-XX

