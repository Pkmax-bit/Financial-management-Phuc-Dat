# Hướng dẫn cấu hình OpenAI API Key

## Bước 1: Lấy API Key từ OpenAI

1. Truy cập: https://platform.openai.com/api-keys
2. Đăng nhập vào tài khoản OpenAI của bạn
3. Click "Create new secret key"
4. Đặt tên cho key (ví dụ: "Financial Management App")
5. Copy API key (chỉ hiển thị 1 lần, hãy lưu lại ngay)

## Bước 2: Thêm API Key vào project

### Cách 1: Tạo file `.env.local` (Khuyến nghị)

1. Trong thư mục `frontend`, tạo file `.env.local` (nếu chưa có)
2. Thêm dòng sau vào file:

```env
OPENAI_API_KEY="sk-your-api-key-here"
```

**Lưu ý:** 
- Thay `sk-your-api-key-here` bằng API key thực tế của bạn
- Không có khoảng trắng xung quanh dấu `=`
- Giữ nguyên dấu ngoặc kép `"`

### Cách 2: Thêm vào file `.env.local` hiện có

Nếu bạn đã có file `.env.local`, chỉ cần thêm dòng sau:

```env
# OpenAI API Configuration
OPENAI_API_KEY="sk-your-api-key-here"
```

## Bước 3: Khởi động lại server

Sau khi thêm API key, bạn cần khởi động lại Next.js development server:

1. Dừng server hiện tại (Ctrl + C)
2. Chạy lại: `npm run dev` (trong thư mục frontend)

## Bước 4: Kiểm tra

1. Mở trang Sales → Tab "Import Excel với AI"
2. Upload một file Excel báo giá
3. Nếu cấu hình đúng, AI sẽ phân tích file và hiển thị kết quả

## Xử lý lỗi

### Lỗi: "OpenAI API key not configured"
- Kiểm tra file `.env.local` có tồn tại trong thư mục `frontend`
- Kiểm tra tên biến là `OPENAI_API_KEY` (chính xác)
- Đảm bảo đã khởi động lại server sau khi thêm key

### Lỗi: "OpenAI API error: 401"
- API key không đúng hoặc đã hết hạn
- Kiểm tra lại API key trên https://platform.openai.com/api-keys

### Lỗi: "OpenAI API error: 429"
- Đã vượt quá giới hạn rate limit
- Kiểm tra usage trên https://platform.openai.com/usage
- Nâng cấp plan nếu cần

## Bảo mật

⚠️ **QUAN TRỌNG:**
- **KHÔNG** commit file `.env.local` lên Git
- File `.env.local` đã được thêm vào `.gitignore` để bảo vệ API key
- Chỉ chia sẻ API key với người cần thiết
- Nếu API key bị lộ, hãy xóa và tạo key mới ngay lập tức

## Sử dụng Azure OpenAI (Tùy chọn)

Nếu bạn sử dụng Azure OpenAI thay vì OpenAI trực tiếp:

```env
OPENAI_API_KEY="your-azure-api-key"
OPENAI_BASE_URL="https://your-resource-name.openai.azure.com"
```

## Chi phí

- OpenAI tính phí theo số tokens sử dụng
- Xem chi tiết pricing: https://openai.com/pricing
- Monitor usage: https://platform.openai.com/usage

