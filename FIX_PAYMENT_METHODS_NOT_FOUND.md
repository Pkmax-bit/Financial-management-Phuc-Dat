# Hướng dẫn sửa lỗi "Not Found" cho Phương thức thanh toán

## Vấn đề
Lỗi `Console ApiError: Not Found` khi truy cập tab "Phương thức thanh toán" trong Sales Center.

## Nguyên nhân
Backend chưa được restart sau khi thêm các API endpoint mới cho phương thức thanh toán.

## Giải pháp

### Bước 1: Restart Backend

**Windows:**
```bash
cd backend
# Dừng backend hiện tại (Ctrl+C nếu đang chạy)
# Sau đó chạy lại:
python main.py
# Hoặc nếu dùng uvicorn trực tiếp:
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**Hoặc sử dụng file batch:**
```bash
restart_backend.bat
```

### Bước 2: Kiểm tra API Endpoint

Sau khi restart, kiểm tra xem API có hoạt động không:

1. Mở trình duyệt và truy cập: `http://localhost:8000/docs`
2. Tìm endpoint: `GET /api/sales/payment-methods/projects`
3. Thử gọi API để xem có lỗi không

### Bước 3: Kiểm tra Logs

Xem logs của backend để tìm lỗi cụ thể:
- Nếu có lỗi import hoặc syntax, sẽ hiển thị trong console
- Nếu có lỗi database, sẽ hiển thị trong response

## Vị trí của Phương thức thanh toán

### 1. Trong Sales Center (Vị trí chính)
- **Đường dẫn**: Sales Center > Tab "Phương thức thanh toán"
- **URL**: `/sales?tab=payment-methods`
- **Chức năng**: 
  - Hiển thị tất cả dự án với trạng thái thanh toán
  - Xem lịch sử thanh toán của từng dự án
  - Xem phương thức thanh toán và hóa đơn

### 2. Trong Báo cáo Dự án (Có thể thêm sau)
- **Đường dẫn**: Reports > Projects Detailed > [Project ID]
- **URL**: `/reports/projects-detailed/[projectId]`
- **Lưu ý**: Hiện tại chưa có phần phương thức thanh toán trong báo cáo dự án chi tiết. Có thể thêm sau nếu cần.

### 3. Trong Chi tiết Dự án
- **Đường dẫn**: Projects > [Project ID]
- **URL**: `/projects/[id]`
- **Lưu ý**: Hiện tại chưa có phần phương thức thanh toán trong trang chi tiết dự án. Có thể thêm sau nếu cần.

## Cách truy cập Phương thức thanh toán

1. Vào **Sales Center** (menu bên trái)
2. Click tab **"Phương thức thanh toán"** (nằm giữa "Phiếu Thu" và "Khách hàng")
3. Xem danh sách dự án với:
   - Trạng thái thanh toán (Đã thanh toán / Thanh toán một nửa / Chưa thanh toán)
   - Tổng giá trị, Đã thu, Còn lại
4. Click **"Xem chi tiết"** để xem:
   - Lịch sử thanh toán
   - Danh sách hóa đơn
   - Phương thức thanh toán

## Kiểm tra sau khi restart

1. Mở frontend và vào Sales Center
2. Click tab "Phương thức thanh toán"
3. Nếu vẫn lỗi, mở Developer Tools (F12) > Console để xem lỗi chi tiết
4. Kiểm tra Network tab để xem request/response

## Lưu ý

- Đảm bảo backend đang chạy trên port 8000 (hoặc port đã cấu hình)
- Đảm bảo frontend đang gọi đúng API URL (kiểm tra trong `.env.local`)
- Nếu vẫn lỗi, kiểm tra authentication token có hợp lệ không

