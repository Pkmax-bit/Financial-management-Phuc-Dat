# Hướng dẫn thêm chức vụ Admin cho phòng ban Quản lý

## Cách 1: Sử dụng SQL Script (Khuyến nghị)

1. Mở Supabase Dashboard
2. Vào **SQL Editor**
3. Copy và paste nội dung file `scripts/sql/add_admin_position.sql`
4. Nhấn **Run** để thực thi

Script sẽ:
- Tự động tìm phòng ban "Quản lý" (theo code "MGMT" hoặc name "Quản lý")
- Kiểm tra xem chức vụ Admin đã tồn tại chưa
- Tạo chức vụ Admin mới nếu chưa có
- Hiển thị kết quả sau khi tạo

## Cách 2: Sử dụng Python Script

1. Đảm bảo đã cài đặt dependencies:
```bash
pip install supabase python-dotenv
```

2. Đảm bảo file `.env` có các biến:
```
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_service_key
```

3. Chạy script:
```bash
python scripts/create/add_admin_position.py
```

## Cách 3: Tạo qua UI

1. Đăng nhập vào hệ thống với quyền Admin hoặc Manager
2. Vào trang **Quản lý nhân viên** (`/employees`)
3. Nhấn nút **"Tạo chức vụ"**
4. Điền thông tin:
   - **Tên chức vụ**: Admin
   - **Phòng ban**: Chọn "Quản lý"
   - **Mô tả**: Quản trị viên hệ thống - Phòng Quản lý
   - **Lương tối thiểu**: 30000000
   - **Lương tối đa**: 60000000
5. Nhấn **"Tạo chức vụ"**

## Thông tin chức vụ Admin

- **Tên**: Admin
- **Mã**: POS-MGMT-ADMIN (hoặc POS-MGMT-ADMIN-001, 002... nếu trùng)
- **Phòng ban**: Quản lý (MGMT)
- **Mô tả**: Quản trị viên hệ thống - Phòng Quản lý
- **Lương**: 30,000,000 - 60,000,000 VNĐ
- **Trạng thái**: Hoạt động

## Lưu ý

- Script sẽ tự động kiểm tra và tránh tạo trùng
- Nếu chức vụ Admin đã tồn tại, script sẽ thông báo và không tạo mới
- Đảm bảo phòng ban "Quản lý" đã được tạo trước khi chạy script

