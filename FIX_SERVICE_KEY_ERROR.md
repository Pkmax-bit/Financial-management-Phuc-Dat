# Hướng dẫn sửa lỗi "Không có quyền tạo tài khoản người dùng"

## Nguyên nhân

Lỗi này xảy ra khi `SUPABASE_SERVICE_KEY` trong file `.env` không đúng hoặc không có quyền `service_role` để tạo user trong Supabase Auth.

## Cách kiểm tra và sửa

### Bước 1: Kiểm tra Service Key trong file .env

1. Mở file `backend/.env` (hoặc `backend/env.example` nếu chưa có `.env`)
2. Tìm dòng `SUPABASE_SERVICE_KEY=`
3. Đảm bảo giá trị không phải là:
   - `"your_supabase_service_key_here"`
   - Rỗng hoặc không có

### Bước 2: Lấy Service Role Key từ Supabase Dashboard

1. Đăng nhập vào [Supabase Dashboard](https://app.supabase.com)
2. Chọn project của bạn
3. Vào **Settings** > **API**
4. Tìm phần **Project API keys**
5. **Copy `service_role` key** (KHÔNG phải `anon` key)
   - `service_role` key có quyền admin, có thể tạo user
   - `anon` key chỉ có quyền hạn chế, không thể tạo user

### Bước 3: Cập nhật file .env

1. Mở file `backend/.env`
2. Cập nhật dòng:
   ```env
   SUPABASE_SERVICE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlvdXJfcHJvamVjdF9yZWYiLCJyb2xlIjoic2VydmljZV9yb2xlIiwiaWF0IjoxNjE2MjM5MDIyLCJleHAiOjE5Nzc4MTUwMjJ9.your_service_role_key_here"
   ```
   (Thay bằng service_role key thực tế của bạn)

3. **Lưu file**

### Bước 4: Khởi động lại Backend

1. Dừng backend (nếu đang chạy)
2. Khởi động lại backend:
   ```bash
   # Windows
   cd backend
   python main.py
   
   # Hoặc nếu dùng uvicorn
   uvicorn main:app --reload
   ```

### Bước 5: Kiểm tra lại

1. Thử tạo nhân viên mới từ frontend
2. Nếu vẫn lỗi, kiểm tra console log của backend để xem thông báo lỗi chi tiết

## Lưu ý quan trọng

⚠️ **KHÔNG BAO GIỜ** commit file `.env` lên Git vì nó chứa thông tin nhạy cảm!

⚠️ **Service Role Key** có quyền admin, chỉ dùng ở backend, không dùng ở frontend!

⚠️ Nếu bạn đang dùng key mặc định trong `config.py`, hãy tạo file `.env` và cấu hình lại!

## Kiểm tra Service Key có đúng không

Backend sẽ tự động kiểm tra:
- Service key có được cấu hình không
- Service key có quyền `service_role` không
- Service key có hợp lệ không

Nếu có lỗi, bạn sẽ nhận được thông báo chi tiết trong console log của backend.

## Troubleshooting

### Lỗi: "SUPABASE_SERVICE_KEY chưa được cấu hình"
→ Kiểm tra file `.env` có tồn tại và có dòng `SUPABASE_SERVICE_KEY=` không

### Lỗi: "SUPABASE_SERVICE_KEY không có quyền service_role"
→ Bạn đang dùng `anon` key thay vì `service_role` key. Lấy lại từ Supabase Dashboard.

### Lỗi: "SUPABASE_SERVICE_KEY không hợp lệ"
→ Key bị sai format hoặc đã hết hạn. Lấy lại key mới từ Supabase Dashboard.

### Lỗi: "Permission error" hoặc "Forbidden"
→ Service key không có quyền tạo user. Đảm bảo bạn đang dùng `service_role` key.

