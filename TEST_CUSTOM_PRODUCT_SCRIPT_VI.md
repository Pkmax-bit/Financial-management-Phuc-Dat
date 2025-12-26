# Kịch bản Test: Tính năng Sản phẩm Tùy chỉnh (Custom Product)

Tài liệu này hướng dẫn chi tiết các bước kiểm tra hoạt động của hệ thống tùy chỉnh sản phẩm, từ bước cấu hình danh mục đến khi hoàn thiện sản phẩm.

---

## 1. Kiểm tra Cấu hình Thuộc tính (Custom Product Config)

Mục tiêu: Đảm bảo người dùng có thể tạo cấu trúc cho các sản phẩm tùy chỉnh.

### 1.1 Thêm Cột (Thuộc tính) mới
- **Các bước thực hiện:**
  1. Truy cập trang **Cấu hình Sản phẩm Tùy chỉnh**.
  2. Chọn một Danh mục sản phẩm (ví dụ: "Nội thất").
  3. Nhấn nút **"Thêm thuộc tính"** (Add Column).
  4. Nhập tên thuộc tính (ví dụ: "Chất liệu khung", "Màu sắc bề mặt").
  5. Nhập mô tả (không bắt buộc) và nhấn **"Thêm"**.
- **Kết quả mong đợi:**
  - Thuộc tính mới xuất hiện ngay lập tức trong danh sách của danh mục đó.
  - Thông báo "Đã thêm thuộc tính thành công!" hiển thị.

### 1.2 Thêm Dữ liệu cho Cột (Tùy chọn/Options)
- **Các bước thực hiện:**
  1. Nhấn vào thuộc tính vừa tạo để mở rộng danh sách tùy chọn.
  2. Nhấn nút **"Thêm tùy chọn"** (Add Option).
  3. Nhập các thông tin:
     - Tên tùy chọn (ví dụ: "Gỗ sồi", "Inox 304").
     - Giá đơn vị (ví dụ: 500,000 VND).
     - (Nếu có) Kích thước mặc định (Dài x Rộng x Cao).
  4. Nhấn **"Thêm"**.
- **Kết quả mong đợi:**
  - Tùy chọn mới hiển thị đúng giá tiền và tên.
  - Tổng số lượng tùy chọn trong tiêu đề cột được cập nhật.

---

## 2. Kiểm tra Quy trình Tạo Sản phẩm (Custom Product Builder)

Mục tiêu: Đảm bảo quy trình chọn lựa và tính toán giá trị sản phẩm hoạt động chính xác.

### 2.1 Khởi tạo và Chọn lựa cấu trúc
- **Các bước thực hiện:**
  1. Mở Modal **"Tạo sản phẩm tùy chỉnh"**.
  2. Nhập tên sản phẩm (ví dụ: "Bàn làm việc Sồi chân Inox").
  3. Kiểm tra danh sách các bước (cột) ở thanh bên trái.
  4. Nhấp chọn một Tùy chọn cho thuộc tính đầu tiên.
- **Kết quả mong đợi:**
  - Sau khi chọn, hệ thống tự động chuyển sang thuộc tính tiếp theo (Auto-advance).
  - Thuộc tính đã chọn có dấu tích xanh (Checkmark) và xuất hiện trong phần **"Tổng quan"** (Summary) bên phải.

### 2.2 Kiểm tra Tính toán và Lưu sản phẩm
- **Các bước thực hiện:**
  1. Hoàn tất việc chọn tất cả các thuộc tính bắt buộc.
  2. Kiểm tra phần **"Tổng cộng"** (Total Price): Phải bằng tổng giá của các tùy chọn đã chọn nhân với số lượng.
  3. Kiểm tra **"Kích thước tổng"**: Hệ thống lấy giá trị lớn nhất hoặc tổng hợp các kích thước từ các bộ phận đã chọn (tùy theo logic thiết lập).
  4. Nhấn nút **"Tạo sản phẩm"**.
- **Kết quả mong đợi:**
  - Modal đóng lại sau khi lưu thành công.
  - Sản phẩm mới xuất hiện trong danh sách báo giá hoặc hóa đơn với đầy đủ thông số cấu trúc đã chọn.

---

## 3. Các trường hợp lỗi cần lưu ý (Edge Cases)

- **Để trống thông tin:** Kiểm tra xem hệ thống có chặn khi không nhập tên thuộc tính hoặc tên tùy chọn hay không.
- **Giá bằng 0:** Kiểm tra xem hệ thống có cho phép tạo tùy chọn miễn phí không.
- **Sắp xếp kéo thả:** Kiểm tra việc thay đổi thứ tự các cột/danh mục bằng cách kéo thả có lưu lại sau khi tải lại trang không.
