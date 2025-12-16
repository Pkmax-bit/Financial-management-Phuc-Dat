# 🧪 KỊCH BẢN TEST TẤT CẢ CÁC CHỨC NĂNG - 3 ĐỢT

## 📋 Tổng quan

Kịch bản test được chia thành **3 đợt** để đảm bảo kiểm tra toàn diện tất cả các chức năng của hệ thống quản lý tài chính.

**Thời gian dự kiến:**
- **Đợt 1**: 2-3 ngày
- **Đợt 2**: 3-4 ngày  
- **Đợt 3**: 2-3 ngày
- **Tổng cộng**: 7-10 ngày

---

## 🎯 ĐỢT 1: CÁC CHỨC NĂNG CƠ BẢN VÀ NỀN TẢNG
**Mục tiêu**: Kiểm tra các chức năng nền tảng, xác thực, quản lý người dùng và dữ liệu cơ bản

### 📌 1.1. Authentication & User Management

#### Test Case 1.1.1: Đăng ký tài khoản mới
- **Mục đích**: Kiểm tra chức năng đăng ký người dùng mới
- **Bước thực hiện**:
  1. Truy cập `/register`
  2. Điền thông tin:
     - Email: `test@example.com`
     - Password: `Test123!@#`
     - Full Name: `Nguyễn Văn Test`
     - Role: `employee`
  3. Nhấn "Đăng ký"
- **Kết quả mong đợi**:
  - ✅ Tài khoản được tạo thành công
  - ✅ Nhận được thông báo xác nhận
  - ✅ Tự động chuyển đến trang đăng nhập hoặc dashboard
- **API**: `POST /api/auth/register`

#### Test Case 1.1.2: Đăng nhập
- **Mục đích**: Kiểm tra chức năng đăng nhập
- **Bước thực hiện**:
  1. Truy cập `/login`
  2. Nhập email và password đã đăng ký
  3. Nhấn "Đăng nhập"
- **Kết quả mong đợi**:
  - ✅ Đăng nhập thành công
  - ✅ Nhận được JWT token
  - ✅ Chuyển đến dashboard
  - ✅ Session được lưu
- **API**: `POST /api/auth/login`

#### Test Case 1.1.3: Đăng nhập với thông tin sai
- **Mục đích**: Kiểm tra xử lý lỗi khi đăng nhập sai
- **Bước thực hiện**:
  1. Truy cập `/login`
  2. Nhập email hoặc password sai
  3. Nhấn "Đăng nhập"
- **Kết quả mong đợi**:
  - ✅ Hiển thị thông báo lỗi rõ ràng
  - ✅ Không cho phép đăng nhập
  - ✅ Form không bị reset

#### Test Case 1.1.4: Đăng xuất
- **Mục đích**: Kiểm tra chức năng đăng xuất
- **Bước thực hiện**:
  1. Đăng nhập thành công
  2. Nhấn nút "Đăng xuất" hoặc menu logout
- **Kết quả mong đợi**:
  - ✅ Đăng xuất thành công
  - ✅ Session bị xóa
  - ✅ Chuyển về trang đăng nhập
- **API**: `POST /api/auth/logout`

#### Test Case 1.1.5: Lấy thông tin người dùng hiện tại
- **Mục đích**: Kiểm tra API lấy thông tin user
- **Bước thực hiện**:
  1. Đăng nhập thành công
  2. Gọi API lấy thông tin user
- **Kết quả mong đợi**:
  - ✅ Trả về đầy đủ thông tin user
  - ✅ Bao gồm role, permissions
- **API**: `GET /api/auth/me`

#### Test Case 1.1.6: Cập nhật thông tin người dùng
- **Mục đích**: Kiểm tra cập nhật profile
- **Bước thực hiện**:
  1. Đăng nhập
  2. Truy cập trang profile hoặc settings
  3. Cập nhật thông tin (tên, email, v.v.)
  4. Lưu thay đổi
- **Kết quả mong đợi**:
  - ✅ Cập nhật thành công
  - ✅ Thông tin được lưu vào database
  - ✅ UI cập nhật ngay lập tức
- **API**: `PUT /api/auth/me`

#### Test Case 1.1.7: Đổi mật khẩu
- **Mục đích**: Kiểm tra chức năng đổi mật khẩu
- **Bước thực hiện**:
  1. Đăng nhập
  2. Truy cập `/change-password`
  3. Nhập mật khẩu cũ và mật khẩu mới
  4. Xác nhận mật khẩu mới
  5. Lưu thay đổi
- **Kết quả mong đợi**:
  - ✅ Đổi mật khẩu thành công
  - ✅ Có thể đăng nhập với mật khẩu mới
  - ✅ Không thể đăng nhập với mật khẩu cũ

#### Test Case 1.1.8: Quên mật khẩu
- **Mục đích**: Kiểm tra chức năng reset password
- **Bước thực hiện**:
  1. Truy cập `/forgot-password`
  2. Nhập email đã đăng ký
  3. Nhấn "Gửi email reset"
- **Kết quả mong đợi**:
  - ✅ Nhận được email reset password
  - ✅ Link reset hợp lệ
  - ✅ Có thể đặt lại mật khẩu

---

### 📌 1.2. Customer Management

#### Test Case 1.2.1: Tạo khách hàng mới
- **Mục đích**: Kiểm tra tạo khách hàng
- **Bước thực hiện**:
  1. Đăng nhập với role Admin/Sales
  2. Truy cập `/customers`
  3. Nhấn "Tạo khách hàng"
  4. Điền thông tin:
     - Tên: `Công ty ABC`
     - Loại: `company`
     - Email: `contact@abc.com`
     - Số điện thoại: `0901234567`
     - Địa chỉ: `123 Đường ABC, Quận 1, TP.HCM`
     - Credit limit: `100000000`
     - Payment terms: `30 days`
  5. Nhấn "Lưu"
- **Kết quả mong đợi**:
  - ✅ Khách hàng được tạo với mã tự động (CUS001, CUS002...)
  - ✅ Hiển thị trong danh sách
  - ✅ Có thể xem chi tiết
- **API**: `POST /api/customers`

#### Test Case 1.2.2: Xem danh sách khách hàng
- **Mục đích**: Kiểm tra hiển thị danh sách
- **Bước thực hiện**:
  1. Truy cập `/customers`
  2. Xem danh sách khách hàng
- **Kết quả mong đợi**:
  - ✅ Hiển thị đầy đủ thông tin
  - ✅ Có phân trang nếu nhiều
  - ✅ Có tìm kiếm, lọc
- **API**: `GET /api/customers`

#### Test Case 1.2.3: Xem chi tiết khách hàng
- **Mục đích**: Kiểm tra trang chi tiết
- **Bước thực hiện**:
  1. Từ danh sách, click vào một khách hàng
  2. Xem trang chi tiết
- **Kết quả mong đợi**:
  - ✅ Hiển thị đầy đủ thông tin
  - ✅ Hiển thị danh sách dự án liên quan
  - ✅ Hiển thị lịch sử giao dịch
- **API**: `GET /api/customers/{id}`

#### Test Case 1.2.4: Cập nhật thông tin khách hàng
- **Mục đích**: Kiểm tra chỉnh sửa
- **Bước thực hiện**:
  1. Mở chi tiết khách hàng
  2. Nhấn "Chỉnh sửa"
  3. Sửa thông tin (ví dụ: đổi số điện thoại)
  4. Lưu
- **Kết quả mong đợi**:
  - ✅ Cập nhật thành công
  - ✅ Thông tin mới hiển thị ngay
- **API**: `PUT /api/customers/{id}`

#### Test Case 1.2.5: Xóa khách hàng
- **Mục đích**: Kiểm tra xóa (nếu có)
- **Bước thực hiện**:
  1. Mở chi tiết khách hàng không có dự án
  2. Nhấn "Xóa"
  3. Xác nhận xóa
- **Kết quả mong đợi**:
  - ✅ Có cảnh báo nếu có dự án liên quan
  - ✅ Xóa thành công nếu không có ràng buộc
- **API**: `DELETE /api/customers/{id}`

#### Test Case 1.2.6: Tìm kiếm khách hàng
- **Mục đích**: Kiểm tra tìm kiếm
- **Bước thực hiện**:
  1. Truy cập `/customers`
  2. Nhập từ khóa vào ô tìm kiếm
  3. Xem kết quả
- **Kết quả mong đợi**:
  - ✅ Tìm kiếm theo tên, email, mã
  - ✅ Kết quả hiển thị ngay lập tức
  - ✅ Highlight từ khóa tìm kiếm

#### Test Case 1.2.7: Lọc khách hàng theo loại
- **Mục đích**: Kiểm tra bộ lọc
- **Bước thực hiện**:
  1. Truy cập `/customers`
  2. Chọn filter theo loại (individual/company/government)
  3. Xem kết quả
- **Kết quả mong đợi**:
  - ✅ Chỉ hiển thị khách hàng đúng loại
  - ✅ Có thể kết hợp nhiều filter

---

### 📌 1.3. Employee Management

#### Test Case 1.3.1: Tạo nhân viên mới
- **Mục đích**: Kiểm tra tạo nhân viên
- **Bước thực hiện**:
  1. Đăng nhập với role Admin
  2. Truy cập `/employees`
  3. Nhấn "Tạo nhân viên"
  4. Điền thông tin:
     - Họ tên: `Trần Văn B`
     - Email: `tranvanb@example.com`
     - Số điện thoại: `0907654321`
     - Phòng ban: Chọn từ dropdown
     - Chức vụ: Chọn từ dropdown
     - Ngày vào làm: `01/01/2024`
  5. Lưu
- **Kết quả mong đợi**:
  - ✅ Nhân viên được tạo
  - ✅ Liên kết với user account (nếu có)
  - ✅ Hiển thị trong danh sách
- **API**: `POST /api/employees`

#### Test Case 1.3.2: Xem danh sách nhân viên
- **Mục đích**: Kiểm tra danh sách
- **Bước thực hiện**:
  1. Truy cập `/employees`
  2. Xem danh sách
- **Kết quả mong đợi**:
  - ✅ Hiển thị đầy đủ thông tin
  - ✅ Có phân trang
  - ✅ Có tìm kiếm, lọc theo phòng ban
- **API**: `GET /api/employees`

#### Test Case 1.3.3: Xem chi tiết nhân viên
- **Mục đích**: Kiểm tra trang chi tiết
- **Bước thực hiện**:
  1. Click vào một nhân viên
  2. Xem thông tin chi tiết
- **Kết quả mong đợi**:
  - ✅ Hiển thị thông tin đầy đủ
  - ✅ Hiển thị dự án đang tham gia
  - ✅ Hiển thị lịch sử công việc
- **API**: `GET /api/employees/{id}`

#### Test Case 1.3.4: Cập nhật thông tin nhân viên
- **Mục đích**: Kiểm tra chỉnh sửa
- **Bước thực hiện**:
  1. Mở chi tiết nhân viên
  2. Nhấn "Chỉnh sửa"
  3. Sửa thông tin (ví dụ: đổi phòng ban)
  4. Lưu
- **Kết quả mong đợi**:
  - ✅ Cập nhật thành công
  - ✅ Thông tin mới hiển thị ngay
- **API**: `PUT /api/employees/{id}`

#### Test Case 1.3.5: Import nhân viên từ Excel
- **Mục đích**: Kiểm tra import Excel
- **Bước thực hiện**:
  1. Truy cập `/employees`
  2. Nhấn "Import từ Excel"
  3. Chọn file Excel đúng format
  4. Upload và xác nhận
- **Kết quả mong đợi**:
  - ✅ Import thành công
  - ✅ Hiển thị preview trước khi import
  - ✅ Báo lỗi nếu format sai
- **API**: `POST /api/employee-excel/import`

---

### 📌 1.4. Dashboard

#### Test Case 1.4.1: Xem Dashboard tổng quan
- **Mục đích**: Kiểm tra dashboard chính
- **Bước thực hiện**:
  1. Đăng nhập
  2. Truy cập `/dashboard`
  3. Xem các widget và biểu đồ
- **Kết quả mong đợi**:
  - ✅ Hiển thị tổng quan tài chính
  - ✅ Biểu đồ doanh thu, chi phí
  - ✅ Thống kê dự án, khách hàng
  - ✅ Dữ liệu real-time
- **API**: `GET /api/dashboard`

#### Test Case 1.4.2: Lọc Dashboard theo thời gian
- **Mục đích**: Kiểm tra filter thời gian
- **Bước thực hiện**:
  1. Trên dashboard, chọn khoảng thời gian (tháng/quý/năm)
  2. Xem dữ liệu cập nhật
- **Kết quả mong đợi**:
  - ✅ Dữ liệu được lọc đúng
  - ✅ Biểu đồ cập nhật ngay
  - ✅ Có thể chọn custom date range

#### Test Case 1.4.3: Xem chi tiết từ widget
- **Mục đích**: Kiểm tra drill-down
- **Bước thực hiện**:
  1. Click vào một widget trên dashboard
  2. Xem trang chi tiết
- **Kết quả mong đợi**:
  - ✅ Chuyển đến trang chi tiết tương ứng
  - ✅ Hiển thị dữ liệu đầy đủ hơn

---

### 📌 1.5. Phân quyền và Bảo mật

#### Test Case 1.5.1: Kiểm tra phân quyền theo role
- **Mục đích**: Đảm bảo mỗi role chỉ thấy đúng chức năng
- **Bước thực hiện**:
  1. Đăng nhập với role `customer`
  2. Kiểm tra menu và chức năng hiển thị
  3. Thử truy cập các route không được phép
  4. Lặp lại với các role khác (admin, sales, accountant, v.v.)
- **Kết quả mong đợi**:
  - ✅ Menu chỉ hiển thị đúng chức năng
  - ✅ Không thể truy cập route không được phép
  - ✅ API trả về 403 Forbidden nếu không có quyền

#### Test Case 1.5.2: Kiểm tra JWT token expiration
- **Mục đích**: Đảm bảo token hết hạn được xử lý đúng
- **Bước thực hiện**:
  1. Đăng nhập
  2. Đợi token hết hạn (hoặc thay đổi token thủ công)
  3. Thực hiện một API call
- **Kết quả mong đợi**:
  - ✅ Nhận được 401 Unauthorized
  - ✅ Tự động redirect về login
  - ✅ Có thể refresh token

---

## 🎯 ĐỢT 2: QUẢN LÝ DỰ ÁN VÀ BÁN HÀNG
**Mục tiêu**: Kiểm tra các chức năng nghiệp vụ chính: dự án, báo giá, hóa đơn, ngân sách

### 📌 2.1. Project Management

#### Test Case 2.1.1: Tạo dự án mới
- **Mục đích**: Kiểm tra tạo dự án
- **Bước thực hiện**:
  1. Đăng nhập với role Admin/Sales
  2. Truy cập `/projects`
  3. Nhấn "Tạo dự án"
  4. Điền thông tin:
     - Tên dự án: `Xây dựng nhà phố ABC`
     - Khách hàng: Chọn từ dropdown
     - Project Manager: Chọn nhân viên
     - Ngày bắt đầu: `01/01/2024`
     - Ngày kết thúc: `30/06/2024`
     - Ngân sách: `500000000`
     - Mô tả: `Dự án xây dựng nhà phố 3 tầng`
  5. Lưu
- **Kết quả mong đợi**:
  - ✅ Dự án được tạo với mã tự động (PRJ001...)
  - ✅ Liên kết với khách hàng
  - ✅ Hiển thị trong danh sách
- **API**: `POST /api/projects`

#### Test Case 2.1.2: Xem danh sách dự án
- **Mục đích**: Kiểm tra danh sách
- **Bước thực hiện**:
  1. Truy cập `/projects`
  2. Xem danh sách
- **Kết quả mong đợi**:
  - ✅ Hiển thị đầy đủ thông tin
  - ✅ Có filter theo trạng thái, khách hàng
  - ✅ Có tìm kiếm
- **API**: `GET /api/projects`

#### Test Case 2.1.3: Xem chi tiết dự án
- **Mục đích**: Kiểm tra trang chi tiết
- **Bước thực hiện**:
  1. Click vào một dự án
  2. Xem trang chi tiết `/projects/{id}`
- **Kết quả mong đợi**:
  - ✅ Hiển thị thông tin đầy đủ
  - ✅ Có các tab: Overview, Expenses, Timeline, Team, Reports
  - ✅ Hiển thị tiến độ dự án
- **API**: `GET /api/projects/{id}`

#### Test Case 2.1.4: Cập nhật thông tin dự án
- **Mục đích**: Kiểm tra chỉnh sửa
- **Bước thực hiện**:
  1. Mở chi tiết dự án
  2. Nhấn "Chỉnh sửa"
  3. Sửa thông tin (ví dụ: cập nhật ngân sách)
  4. Lưu
- **Kết quả mong đợi**:
  - ✅ Cập nhật thành công
  - ✅ Thông tin mới hiển thị ngay
- **API**: `PUT /api/projects/{id}`

#### Test Case 2.1.5: Quản lý team dự án
- **Mục đích**: Kiểm tra thêm/xóa thành viên
- **Bước thực hiện**:
  1. Mở chi tiết dự án
  2. Vào tab "Team"
  3. Nhấn "Thêm thành viên"
  4. Chọn nhân viên và vai trò
  5. Lưu
- **Kết quả mong đợi**:
  - ✅ Thành viên được thêm
  - ✅ Hiển thị trong danh sách team
  - ✅ Có thể xóa thành viên
- **API**: `POST /api/project-team/{project_id}/members`

#### Test Case 2.1.6: Cập nhật trạng thái dự án
- **Mục đích**: Kiểm tra workflow trạng thái
- **Bước thực hiện**:
  1. Mở chi tiết dự án
  2. Thay đổi trạng thái (planning → in_progress → completed)
  3. Lưu
- **Kết quả mong đợi**:
  - ✅ Trạng thái được cập nhật
  - ✅ Timeline được cập nhật
  - ✅ Gửi thông báo cho team

#### Test Case 2.1.7: Xem Kanban board dự án
- **Mục đích**: Kiểm tra Kanban view
- **Bước thực hiện**:
  1. Truy cập `/projects/kanban`
  2. Xem các dự án theo cột trạng thái
- **Kết quả mong đợi**:
  - ✅ Hiển thị dự án theo cột
  - ✅ Có thể kéo thả để đổi trạng thái
  - ✅ Hiển thị thông tin tóm tắt

---

### 📌 2.2. Sales & Quotes

#### Test Case 2.2.1: Tạo báo giá mới
- **Mục đích**: Kiểm tra tạo báo giá
- **Bước thực hiện**:
  1. Đăng nhập với role Admin/Sales
  2. Truy cập `/sales/quotes`
  3. Nhấn "Tạo báo giá"
  4. Điền thông tin:
     - Khách hàng: Chọn từ dropdown
     - Dự án: Chọn từ dropdown
     - Ngày báo giá: `01/01/2024`
     - Ngày hết hạn: `15/01/2024`
  5. Thêm sản phẩm/dịch vụ:
     - Tên: `Vật liệu xây dựng`
     - Số lượng: `100`
     - Đơn giá: `1000000`
     - Thuế suất: `10%`
  6. Lưu
- **Kết quả mong đợi**:
  - ✅ Báo giá được tạo với mã tự động (QUO001...)
  - ✅ Tổng tiền được tính tự động
  - ✅ Liên kết với dự án và khách hàng
- **API**: `POST /api/sales/quotes`

#### Test Case 2.2.2: Xem danh sách báo giá
- **Mục đích**: Kiểm tra danh sách
- **Bước thực hiện**:
  1. Truy cập `/sales/quotes`
  2. Xem danh sách
- **Kết quả mong đợi**:
  - ✅ Hiển thị đầy đủ thông tin
  - ✅ Có filter theo trạng thái, khách hàng
  - ✅ Hiển thị tổng giá trị
- **API**: `GET /api/sales/quotes`

#### Test Case 2.2.3: Xem chi tiết báo giá
- **Mục đích**: Kiểm tra trang chi tiết
- **Bước thực hiện**:
  1. Click vào một báo giá
  2. Xem trang chi tiết `/sales/quotes/{id}`
- **Kết quả mong đợi**:
  - ✅ Hiển thị đầy đủ thông tin
  - ✅ Hiển thị danh sách items
  - ✅ Có nút "Gửi cho khách hàng"
  - ✅ Có nút "Chuyển thành hóa đơn" (nếu đã duyệt)

#### Test Case 2.2.4: Gửi báo giá cho khách hàng
- **Mục đích**: Kiểm tra gửi email
- **Bước thực hiện**:
  1. Mở chi tiết báo giá
  2. Nhấn "Gửi cho khách hàng"
  3. Xác nhận
- **Kết quả mong đợi**:
  - ✅ Email được gửi
  - ✅ Trạng thái chuyển sang "Sent"
  - ✅ Khách hàng nhận được link xem báo giá

#### Test Case 2.2.5: Duyệt báo giá (Customer view)
- **Mục đích**: Kiểm tra quy trình duyệt
- **Bước thực hiện**:
  1. Đăng nhập với role Customer
  2. Truy cập link báo giá hoặc `/approve-quote/{quoteId}`
  3. Xem chi tiết báo giá
  4. Nhấn "Chấp nhận" hoặc "Từ chối"
- **Kết quả mong đợi**:
  - ✅ Trạng thái được cập nhật
  - ✅ Gửi thông báo cho Sales
  - ✅ Có thể chuyển thành hóa đơn nếu duyệt
- **API**: `PUT /api/sales/quotes/{id}/approve`

#### Test Case 2.2.6: Import báo giá từ Excel/PDF
- **Mục đích**: Kiểm tra import
- **Bước thực hiện**:
  1. Truy cập `/sales/upload-quote`
  2. Upload file Excel hoặc PDF
  3. Xem preview
  4. Xác nhận import
- **Kết quả mong đợi**:
  - ✅ Parse file thành công
  - ✅ Hiển thị preview
  - ✅ Có thể chỉnh sửa trước khi lưu
- **API**: `POST /api/sales/quotes/analyze-excel-ai`

#### Test Case 2.2.7: Chuyển báo giá thành hóa đơn
- **Mục đích**: Kiểm tra convert quote to invoice
- **Bước thực hiện**:
  1. Mở báo giá đã được duyệt
  2. Nhấn "Tạo hóa đơn"
  3. Xác nhận
- **Kết quả mong đợi**:
  - ✅ Hóa đơn được tạo tự động
  - ✅ Copy toàn bộ thông tin từ báo giá
  - ✅ Liên kết với báo giá gốc
- **API**: `POST /api/sales/quotes/{id}/convert-to-invoice`

---

### 📌 2.3. Invoice Management

#### Test Case 2.3.1: Tạo hóa đơn mới
- **Mục đích**: Kiểm tra tạo hóa đơn
- **Bước thực hiện**:
  1. Truy cập `/sales/invoices`
  2. Nhấn "Tạo hóa đơn"
  3. Điền thông tin tương tự báo giá
  4. Lưu
- **Kết quả mong đợi**:
  - ✅ Hóa đơn được tạo với mã tự động (INV001...)
  - ✅ Có thể tạo từ báo giá hoặc tạo mới
- **API**: `POST /api/sales/invoices`

#### Test Case 2.3.2: Xem danh sách hóa đơn
- **Mục đích**: Kiểm tra danh sách
- **Bước thực hiện**:
  1. Truy cập `/sales/invoices`
  2. Xem danh sách
- **Kết quả mong đợi**:
  - ✅ Hiển thị đầy đủ thông tin
  - ✅ Có filter theo trạng thái thanh toán
  - ✅ Hiển thị số tiền còn nợ
- **API**: `GET /api/sales/invoices`

#### Test Case 2.3.3: Xem chi tiết hóa đơn
- **Mục đích**: Kiểm tra trang chi tiết
- **Bước thực hiện**:
  1. Click vào một hóa đơn
  2. Xem trang chi tiết `/sales/invoices/{id}`
- **Kết quả mong đợi**:
  - ✅ Hiển thị đầy đủ thông tin
  - ✅ Có thể in hoặc xuất PDF
  - ✅ Hiển thị lịch sử thanh toán

#### Test Case 2.3.4: Ghi nhận thanh toán
- **Mục đích**: Kiểm tra ghi nhận payment
- **Bước thực hiện**:
  1. Mở chi tiết hóa đơn
  2. Nhấn "Ghi nhận thanh toán"
  3. Điền thông tin:
     - Số tiền: `10000000`
     - Ngày thanh toán: `15/01/2024`
     - Phương thức: `Bank transfer`
  4. Lưu
- **Kết quả mong đợi**:
  - ✅ Thanh toán được ghi nhận
  - ✅ Số tiền còn nợ được cập nhật
  - ✅ Trạng thái tự động chuyển sang "Paid" nếu đủ
- **API**: `POST /api/sales/invoices/{id}/payments`

#### Test Case 2.3.5: Gửi hóa đơn cho khách hàng
- **Mục đích**: Kiểm tra gửi email
- **Bước thực hiện**:
  1. Mở chi tiết hóa đơn
  2. Nhấn "Gửi cho khách hàng"
  3. Xác nhận
- **Kết quả mong đợi**:
  - ✅ Email được gửi với PDF đính kèm
  - ✅ Trạng thái chuyển sang "Sent"

---

### 📌 2.4. Budgeting

#### Test Case 2.4.1: Tạo ngân sách dự án
- **Mục đích**: Kiểm tra tạo budget
- **Bước thực hiện**:
  1. Truy cập `/expenses` hoặc trang budgeting
  2. Chọn dự án
  3. Nhấn "Tạo ngân sách"
  4. Phân bổ chi phí theo danh mục:
     - Vật liệu: `200000000` (40%)
     - Nhân công: `175000000` (35%)
     - Máy móc: `75000000` (15%)
     - Chi phí khác: `50000000` (10%)
  5. Lưu
- **Kết quả mong đợi**:
  - ✅ Ngân sách được tạo
  - ✅ Tổng ngân sách = tổng các hạng mục
  - ✅ Có thể xem trong chi tiết dự án
- **API**: `POST /api/budgeting/budgets`

#### Test Case 2.4.2: Xem ngân sách dự án
- **Mục đích**: Kiểm tra hiển thị
- **Bước thực hiện**:
  1. Mở chi tiết dự án
  2. Vào tab "Budget" hoặc "Expenses"
  3. Xem ngân sách
- **Kết quả mong đợi**:
  - ✅ Hiển thị ngân sách theo danh mục
  - ✅ Hiển thị phần trăm phân bổ
  - ✅ So sánh với chi phí thực tế

#### Test Case 2.4.3: Cập nhật ngân sách
- **Mục đích**: Kiểm tra chỉnh sửa
- **Bước thực hiện**:
  1. Mở ngân sách dự án
  2. Nhấn "Chỉnh sửa"
  3. Điều chỉnh số tiền các hạng mục
  4. Lưu
- **Kết quả mong đợi**:
  - ✅ Cập nhật thành công
  - ✅ Tự động tính lại tổng và phần trăm
- **API**: `PUT /api/budgeting/budgets/{id}`

---

## 🎯 ĐỢT 3: CHI PHÍ, BÁO CÁO VÀ TÍNH NĂNG NÂNG CAO
**Mục tiêu**: Kiểm tra quản lý chi phí, báo cáo, tasks, AI và các tính năng nâng cao

### 📌 3.1. Expense Management

#### Test Case 3.1.1: Tạo chi phí thường (Company Expense)
- **Mục đích**: Kiểm tra tạo chi phí công ty
- **Bước thực hiện**:
  1. Đăng nhập với role Admin/Accountant
  2. Truy cập `/expenses`
  3. Nhấn "Tạo chi phí"
  4. Điền thông tin:
     - Mô tả: `Mua vật liệu văn phòng`
     - Số tiền: `5000000`
     - Ngày: `15/01/2024`
     - Loại: `Office Supplies`
     - Nhà cung cấp: Chọn hoặc tạo mới
     - Hóa đơn/Chứng từ: Upload file
  5. Lưu
- **Kết quả mong đợi**:
  - ✅ Chi phí được tạo
  - ✅ Hiển thị trong danh sách
  - ✅ Có thể upload file đính kèm
- **API**: `POST /api/expenses/expenses`

#### Test Case 3.1.2: Tạo chi phí dự án (Planned)
- **Mục đích**: Kiểm tra tạo chi phí kế hoạch
- **Bước thực hiện**:
  1. Mở chi tiết dự án
  2. Vào tab "Expenses" → "Planned"
  3. Nhấn "Tạo chi phí kế hoạch"
  4. Điền thông tin tương tự
  5. Lưu
- **Kết quả mong đợi**:
  - ✅ Chi phí kế hoạch được tạo
  - ✅ Liên kết với dự án
  - ✅ Có thể phân bổ theo đối tượng chi phí
- **API**: `POST /api/project-expenses/quotes`

#### Test Case 3.1.3: Tạo chi phí dự án (Actual)
- **Mục đích**: Kiểm tra tạo chi phí thực tế
- **Bước thực hiện**:
  1. Mở chi tiết dự án
  2. Vào tab "Expenses" → "Actual"
  3. Nhấn "Tạo chi phí thực tế"
  4. Điền thông tin
  5. Lưu
- **Kết quả mong đợi**:
  - ✅ Chi phí thực tế được tạo
  - ✅ Tự động so sánh với chi phí kế hoạch
  - ✅ Cảnh báo nếu vượt ngân sách
- **API**: `POST /api/project-expenses`

#### Test Case 3.1.4: Tạo chi phí con (Child Expense)
- **Mục đích**: Kiểm tra phân cấp cha/con
- **Bước thực hiện**:
  1. Mở danh sách chi phí
  2. Chọn một chi phí cha (không có id_parent)
  3. Nhấn nút "+" để tạo chi phí con
  4. Điền thông tin
  5. Lưu
- **Kết quả mong đợi**:
  - ✅ Chi phí con được tạo
  - ✅ Tự động tạo snapshot của chi phí cha
  - ✅ Hiển thị phân cấp trong danh sách
- **API**: `POST /api/expenses/expenses` (với id_parent)

#### Test Case 3.1.5: Khôi phục chi phí cha từ snapshot
- **Mục đích**: Kiểm tra restore
- **Bước thực hiện**:
  1. Mở danh sách chi phí
  2. Tìm chi phí cha đã có chi phí con
  3. Nhấn nút "Quay lại" (Restore)
  4. Xác nhận
- **Kết quả mong đợi**:
  - ✅ Chi phí cha được khôi phục về trạng thái trước khi tạo con
  - ✅ Snapshot được đánh dấu đã restore
  - ✅ Lịch sử snapshot vẫn được giữ
- **API**: `POST /api/expense-restore/restore-parent/{parent_id}`

#### Test Case 3.1.6: Tính toán tự động đối tượng chi phí
- **Mục đích**: Kiểm tra auto-calculate
- **Bước thực hiện**:
  1. Tạo chi phí dự án với invoice_items
  2. Nhấn "Tính toán tự động"
  3. Xem kết quả phân bổ
- **Kết quả mong đợi**:
  - ✅ Tính toán theo components_pct
  - ✅ Phân bổ đúng vào các đối tượng chi phí
  - ✅ Có thể chỉnh sửa sau khi tính
- **API**: `POST /api/project-expenses/calculate-expense-objects`

#### Test Case 3.1.7: Xem lịch sử snapshot
- **Mục đích**: Kiểm tra history
- **Bước thực hiện**:
  1. Mở chi phí cha có snapshot
  2. Nhấn icon lịch sử
  3. Xem danh sách snapshot
- **Kết quả mong đợi**:
  - ✅ Hiển thị tất cả snapshot
  - ✅ Hiển thị thời gian tạo, restore
  - ✅ Có thể xem chi tiết từng snapshot
- **API**: `GET /api/expense-restore/history/{parent_id}`

#### Test Case 3.1.8: Quản lý đối tượng chi phí (Expense Objects)
- **Mục đích**: Kiểm tra CRUD expense objects
- **Bước thực hiện**:
  1. Truy cập `/expense-objects`
  2. Xem danh sách
  3. Tạo mới một đối tượng
  4. Chỉnh sửa
  5. Xóa (nếu không có chi phí liên quan)
- **Kết quả mong đợi**:
  - ✅ CRUD hoạt động đúng
  - ✅ Hiển thị trong dropdown khi tạo chi phí
- **API**: `GET/POST/PUT/DELETE /api/expense-objects`

---

### 📌 3.2. Reports & Analytics

#### Test Case 3.2.1: Báo cáo dự án chi tiết
- **Mục đích**: Kiểm tra báo cáo dự án
- **Bước thực hiện**:
  1. Truy cập `/reports/projects-detailed`
  2. Chọn dự án
  3. Xem báo cáo
- **Kết quả mong đợi**:
  - ✅ So sánh ngân sách vs thực tế
  - ✅ Phân tích lợi nhuận
  - ✅ Chi phí theo danh mục
  - ✅ Timeline chi phí
- **API**: `GET /api/reports/projects-detailed/{project_id}`

#### Test Case 3.2.2: Export báo cáo ra Excel
- **Mục đích**: Kiểm tra export
- **Bước thực hiện**:
  1. Mở báo cáo dự án chi tiết
  2. Nhấn "Xuất Excel"
  3. Tải file về
- **Kết quả mong đợi**:
  - ✅ File Excel được tạo
  - ✅ Bao gồm đầy đủ dữ liệu
  - ✅ Format đẹp, có header, footer
  - ✅ Bao gồm planned và actual expenses với chi tiết

#### Test Case 3.2.3: Báo cáo P&L (Profit & Loss)
- **Mục đích**: Kiểm tra báo cáo kết quả kinh doanh
- **Bước thực hiện**:
  1. Truy cập `/reports/pl-report`
  2. Chọn khoảng thời gian
  3. Xem báo cáo
- **Kết quả mong đợi**:
  - ✅ Hiển thị doanh thu, chi phí
  - ✅ Tính lợi nhuận
  - ✅ Có drill-down
- **API**: `GET /api/reports/financial/pl-report`

#### Test Case 3.2.4: Bảng cân đối kế toán (Balance Sheet)
- **Mục đích**: Kiểm tra balance sheet
- **Bước thực hiện**:
  1. Truy cập `/reports/balance-sheet`
  2. Chọn ngày báo cáo
  3. Xem báo cáo
- **Kết quả mong đợi**:
  - ✅ Hiển thị tài sản, nợ, vốn chủ sở hữu
  - ✅ Tổng tài sản = Tổng nợ + Vốn
  - ✅ Có drill-down
- **API**: `GET /api/reports/financial/balance-sheet`

#### Test Case 3.2.5: Báo cáo lưu chuyển tiền tệ (Cash Flow)
- **Mục đích**: Kiểm tra cash flow
- **Bước thực hiện**:
  1. Truy cập `/reports/cash-flow-vietnamese`
  2. Chọn khoảng thời gian
  3. Xem báo cáo
- **Kết quả mong đợi**:
  - ✅ Hiển thị dòng tiền vào/ra
  - ✅ Phân loại theo hoạt động
  - ✅ Tính tổng dòng tiền ròng
- **API**: `GET /api/reports/financial/cash-flow-vietnamese`

#### Test Case 3.2.6: Báo cáo doanh thu theo khách hàng
- **Mục đích**: Kiểm tra sales by customer
- **Bước thực hiện**:
  1. Truy cập `/reports/sales-by-customer`
  2. Chọn khoảng thời gian
  3. Xem báo cáo
- **Kết quả mong đợi**:
  - ✅ Hiển thị doanh thu theo từng khách hàng
  - ✅ Có biểu đồ so sánh
  - ✅ Có thể export
- **API**: `GET /api/reports/sales/sales-by-customer`

#### Test Case 3.2.7: Báo cáo chi phí theo nhà cung cấp
- **Mục đích**: Kiểm tra expenses by vendor
- **Bước thực hiện**:
  1. Truy cập báo cáo chi phí theo vendor
  2. Chọn khoảng thời gian
  3. Xem báo cáo
- **Kết quả mong đợi**:
  - ✅ Hiển thị chi phí theo vendor
  - ✅ Có biểu đồ
  - ✅ Có thể export
- **API**: `GET /api/reports/expenses/expenses-by-vendor`

#### Test Case 3.2.8: Sổ cái tổng hợp (General Ledger)
- **Mục đích**: Kiểm tra general ledger
- **Bước thực hiện**:
  1. Truy cập `/reports/general-ledger`
  2. Chọn tài khoản và khoảng thời gian
  3. Xem báo cáo
- **Kết quả mong đợi**:
  - ✅ Hiển thị tất cả giao dịch
  - ✅ Tính số dư
  - ✅ Có thể export
- **API**: `GET /api/reports/accountant/general-ledger`

#### Test Case 3.2.9: So sánh chi phí (Expense Comparison)
- **Mục đích**: Kiểm tra so sánh planned vs actual
- **Bước thực hiện**:
  1. Truy cập `/expense-comparison`
  2. Chọn dự án hoặc tất cả
  3. Xem báo cáo so sánh
- **Kết quả mong đợi**:
  - ✅ So sánh chi phí kế hoạch vs thực tế
  - ✅ Tính chênh lệch và phần trăm
  - ✅ Cảnh báo vượt ngân sách
  - ✅ Biểu đồ trực quan

---

### 📌 3.3. Project Timeline

#### Test Case 3.3.1: Xem timeline dự án
- **Mục đích**: Kiểm tra timeline
- **Bước thực hiện**:
  1. Truy cập `/projects/timeline/{projectId}`
  2. Xem timeline
- **Kết quả mong đợi**:
  - ✅ Hiển thị timeline theo thời gian
  - ✅ Có hình ảnh minh họa
  - ✅ Hiển thị tiến độ
- **API**: `GET /api/project-timeline/{project_id}`

#### Test Case 3.3.2: Thêm mốc thời gian (Timeline Entry)
- **Mục đích**: Kiểm tra thêm entry
- **Bước thực hiện**:
  1. Mở timeline dự án
  2. Nhấn "Thêm mốc thời gian"
  3. Điền thông tin:
     - Ngày: `20/01/2024`
     - Mô tả: `Hoàn thành xây móng`
     - Upload hình ảnh
  4. Lưu
- **Kết quả mong đợi**:
  - ✅ Entry được thêm
  - ✅ Hình ảnh được upload
  - ✅ Hiển thị trên timeline
- **API**: `POST /api/project-timeline/{project_id}/entries`

#### Test Case 3.3.3: Khách hàng xem timeline
- **Mục đích**: Kiểm tra customer view
- **Bước thực hiện**:
  1. Đăng nhập với role Customer
  2. Truy cập timeline dự án của mình
  3. Xem tiến độ
- **Kết quả mong đợi**:
  - ✅ Customer chỉ thấy dự án của mình
  - ✅ Có thể xem hình ảnh
  - ✅ Có thể bình luận (nếu có)

---

### 📌 3.4. Task Management

#### Test Case 3.4.1: Tạo nhiệm vụ mới
- **Mục đích**: Kiểm tra tạo task
- **Bước thực hiện**:
  1. Truy cập `/tasks`
  2. Nhấn "Tạo nhiệm vụ"
  3. Điền thông tin:
     - Tiêu đề: `Kiểm tra chất lượng vật liệu`
     - Mô tả: `Kiểm tra và nghiệm thu vật liệu nhập kho`
     - Dự án: Chọn dự án
     - Người được giao: Chọn nhân viên
     - Ngày hết hạn: `25/01/2024`
     - Độ ưu tiên: `High`
  4. Lưu
- **Kết quả mong đợi**:
  - ✅ Task được tạo
  - ✅ Hiển thị trong danh sách
  - ✅ Gửi thông báo cho người được giao
- **API**: `POST /api/tasks`

#### Test Case 3.4.2: Xem danh sách nhiệm vụ
- **Mục đích**: Kiểm tra danh sách
- **Bước thực hiện**:
  1. Truy cập `/tasks`
  2. Xem danh sách
- **Kết quả mong đợi**:
  - ✅ Hiển thị đầy đủ thông tin
  - ✅ Có filter theo trạng thái, dự án, người được giao
  - ✅ Có tìm kiếm
- **API**: `GET /api/tasks`

#### Test Case 3.4.3: Xem chi tiết nhiệm vụ
- **Mục đích**: Kiểm tra trang chi tiết
- **Bước thực hiện**:
  1. Click vào một task
  2. Xem trang chi tiết `/tasks/{taskId}`
- **Kết quả mong đợi**:
  - ✅ Hiển thị đầy đủ thông tin
  - ✅ Có checklist (nếu có)
  - ✅ Có bình luận
  - ✅ Có file đính kèm

#### Test Case 3.4.4: Cập nhật trạng thái task
- **Mục đích**: Kiểm tra workflow
- **Bước thực hiện**:
  1. Mở chi tiết task
  2. Thay đổi trạng thái (todo → in_progress → done)
  3. Lưu
- **Kết quả mong đợi**:
  - ✅ Trạng thái được cập nhật
  - ✅ Gửi thông báo
  - ✅ Cập nhật tiến độ dự án (nếu liên quan)

#### Test Case 3.4.5: Thêm checklist vào task
- **Mục đích**: Kiểm tra checklist
- **Bước thực hiện**:
  1. Mở chi tiết task
  2. Vào tab "Checklist"
  3. Thêm các mục checklist
  4. Đánh dấu hoàn thành từng mục
- **Kết quả mong đợi**:
  - ✅ Checklist được lưu
  - ✅ Có thể đánh dấu hoàn thành
  - ✅ Tự động tính phần trăm hoàn thành

#### Test Case 3.4.6: Thêm bình luận vào task
- **Mục đích**: Kiểm tra comments
- **Bước thực hiện**:
  1. Mở chi tiết task
  2. Vào tab "Comments"
  3. Viết bình luận
  4. Gửi
- **Kết quả mong đợi**:
  - ✅ Bình luận được thêm
  - ✅ Hiển thị thời gian và người comment
  - ✅ Gửi thông báo cho người liên quan

#### Test Case 3.4.7: Upload file đính kèm
- **Mục đích**: Kiểm tra attachments
- **Bước thực hiện**:
  1. Mở chi tiết task
  2. Vào tab "Attachments"
  3. Upload file
  4. Xác nhận
- **Kết quả mong đợi**:
  - ✅ File được upload
  - ✅ Có thể tải về
  - ✅ Hiển thị thông tin file
- **API**: `POST /api/task-attachments`

#### Test Case 3.4.8: Xem Kanban board tasks
- **Mục đích**: Kiểm tra Kanban view
- **Bước thực hiện**:
  1. Truy cập `/kanban`
  2. Xem tasks theo cột trạng thái
- **Kết quả mong đợi**:
  - ✅ Hiển thị tasks theo cột
  - ✅ Có thể kéo thả để đổi trạng thái
  - ✅ Filter theo dự án, người được giao

---

### 📌 3.5. AI Features

#### Test Case 3.5.1: AI Assistant Chat
- **Mục đích**: Kiểm tra AI chat
- **Bước thực hiện**:
  1. Truy cập `/ai-assistant` hoặc `/chat`
  2. Gửi câu hỏi: "Tổng chi phí dự án PRJ001 là bao nhiêu?"
  3. Xem phản hồi
- **Kết quả mong đợi**:
  - ✅ AI trả lời chính xác
  - ✅ Có thể hỏi về dữ liệu trong hệ thống
  - ✅ Lịch sử chat được lưu
- **API**: `POST /api/chat`

#### Test Case 3.5.2: AI Phân tích chi phí
- **Mục đích**: Kiểm tra AI analysis
- **Bước thực hiện**:
  1. Truy cập `/ai-analysis`
  2. Chọn dự án hoặc khoảng thời gian
  3. Nhấn "Phân tích"
  4. Xem kết quả
- **Kết quả mong đợi**:
  - ✅ AI phân tích chi phí
  - ✅ Đưa ra nhận xét và đề xuất
  - ✅ Có thể export báo cáo

#### Test Case 3.5.3: AI Đọc hình ảnh hóa đơn
- **Mục đích**: Kiểm tra OCR/AI image reader
- **Bước thực hiện**:
  1. Truy cập `/ai-image-reader`
  2. Upload hình ảnh hóa đơn
  3. Nhấn "Đọc"
  4. Xem kết quả extract
- **Kết quả mong đợi**:
  - ✅ Extract thông tin từ hình ảnh
  - ✅ Tự động điền form
  - ✅ Có thể chỉnh sửa trước khi lưu

#### Test Case 3.5.4: AI Phân tích báo giá từ Excel/PDF
- **Mục đích**: Kiểm tra AI quote analysis
- **Bước thực hiện**:
  1. Truy cập `/sales/upload-quote`
  2. Upload file Excel hoặc PDF
  3. Xem AI phân tích và extract
  4. Xác nhận import
- **Kết quả mong đợi**:
  - ✅ AI đọc và extract thông tin
  - ✅ Tạo quote items tự động
  - ✅ Có thể chỉnh sửa

---

### 📌 3.6. Notifications

#### Test Case 3.6.1: Xem danh sách thông báo
- **Mục đích**: Kiểm tra notifications
- **Bước thực hiện**:
  1. Đăng nhập
  2. Click icon thông báo (bell)
  3. Xem danh sách
- **Kết quả mong đợi**:
  - ✅ Hiển thị thông báo mới và cũ
  - ✅ Đánh dấu đã đọc/chưa đọc
  - ✅ Có thể filter
- **API**: `GET /api/notifications`

#### Test Case 3.6.2: Đánh dấu đã đọc
- **Mục đích**: Kiểm tra mark as read
- **Bước thực hiện**:
  1. Mở danh sách thông báo
  2. Click vào một thông báo chưa đọc
  3. Xem chi tiết
- **Kết quả mong đợi**:
  - ✅ Tự động đánh dấu đã đọc
  - ✅ Badge số lượng giảm
- **API**: `PUT /api/notifications/{id}/read`

#### Test Case 3.6.3: Đánh dấu tất cả đã đọc
- **Mục đích**: Kiểm tra mark all read
- **Bước thực hiện**:
  1. Mở danh sách thông báo
  2. Nhấn "Đánh dấu tất cả đã đọc"
- **Kết quả mong đợi**:
  - ✅ Tất cả thông báo được đánh dấu đã đọc
  - ✅ Badge về 0
- **API**: `PUT /api/notifications/read-all`

#### Test Case 3.6.4: Xóa thông báo
- **Mục đích**: Kiểm tra delete
- **Bước thực hiện**:
  1. Mở danh sách thông báo
  2. Nhấn nút xóa trên một thông báo
  3. Xác nhận
- **Kết quả mong đợi**:
  - ✅ Thông báo bị xóa
  - ✅ Không còn hiển thị trong danh sách
- **API**: `DELETE /api/notifications/{id}`

#### Test Case 3.6.5: Real-time notifications
- **Mục đích**: Kiểm tra real-time
- **Bước thực hiện**:
  1. Mở hệ thống
  2. Tạo một action sẽ trigger notification (ví dụ: tạo task, gửi quote)
  3. Xem notification xuất hiện ngay
- **Kết quả mong đợi**:
  - ✅ Notification xuất hiện ngay lập tức
  - ✅ Không cần refresh trang
  - ✅ Có sound/visual alert

---

### 📌 3.7. System Feedback

#### Test Case 3.7.1: Gửi phản hồi hệ thống
- **Mục đích**: Kiểm tra feedback
- **Bước thực hiện**:
  1. Truy cập `/system/feedback`
  2. Nhấn "Gửi phản hồi"
  3. Điền thông tin:
     - Loại: `Bug` hoặc `Feature Request`
     - Tiêu đề: `Lỗi khi export Excel`
     - Mô tả: `Chi tiết lỗi...`
     - Screenshot (nếu có)
  4. Gửi
- **Kết quả mong đợi**:
  - ✅ Feedback được gửi
  - ✅ Lưu vào database
  - ✅ Admin có thể xem và xử lý
- **API**: `POST /api/system-feedback`

#### Test Case 3.7.2: Xem danh sách feedback (Admin)
- **Mục đích**: Kiểm tra quản lý feedback
- **Bước thực hiện**:
  1. Đăng nhập với role Admin
  2. Truy cập `/system/feedback/management`
  3. Xem danh sách
- **Kết quả mong đợi**:
  - ✅ Hiển thị tất cả feedback
  - ✅ Có filter theo loại, trạng thái
  - ✅ Có thể cập nhật trạng thái (new → in_progress → resolved)

---

### 📌 3.8. Products & Services

#### Test Case 3.8.1: Quản lý danh mục sản phẩm
- **Mục đích**: Kiểm tra product categories
- **Bước thực hiện**:
  1. Truy cập quản lý sản phẩm
  2. Xem danh mục
  3. Tạo mới danh mục
  4. Chỉnh sửa
  5. Xóa (nếu không có sản phẩm)
- **Kết quả mong đợi**:
  - ✅ CRUD hoạt động đúng
  - ✅ Hiển thị trong dropdown khi tạo quote
- **API**: `GET/POST/PUT/DELETE /api/sales/product-categories`

#### Test Case 3.8.2: Quản lý sản phẩm/dịch vụ
- **Mục đích**: Kiểm tra products
- **Bước thực hiện**:
  1. Truy cập quản lý sản phẩm
  2. Xem danh sách
  3. Tạo mới sản phẩm
  4. Chỉnh sửa
  5. Xóa
- **Kết quả mong đợi**:
  - ✅ CRUD hoạt động đúng
  - ✅ Có thể thêm vào quote/invoice
- **API**: `GET/POST/PUT/DELETE /api/sales/products`

#### Test Case 3.8.3: Import sản phẩm từ Excel
- **Mục đích**: Kiểm tra import
- **Bước thực hiện**:
  1. Truy cập quản lý sản phẩm
  2. Nhấn "Import từ Excel"
  3. Upload file
  4. Xem preview
  5. Xác nhận import
- **Kết quả mong đợi**:
  - ✅ Import thành công
  - ✅ Báo lỗi nếu format sai
- **API**: `POST /api/product-import/import`

---

### 📌 3.9. Purchase Orders & Expense Claims

#### Test Case 3.9.1: Tạo đơn đặt hàng (Purchase Order)
- **Mục đích**: Kiểm tra PO
- **Bước thực hiện**:
  1. Truy cập quản lý PO
  2. Nhấn "Tạo đơn đặt hàng"
  3. Điền thông tin
  4. Lưu
- **Kết quả mong đợi**:
  - ✅ PO được tạo
  - ✅ Có workflow phê duyệt
- **API**: `POST /api/purchase-orders`

#### Test Case 3.9.2: Tạo yêu cầu chi phí (Expense Claim)
- **Mục đích**: Kiểm tra expense claim
- **Bước thực hiện**:
  1. Truy cập quản lý expense claims
  2. Nhấn "Tạo yêu cầu"
  3. Điền thông tin và upload hóa đơn
  4. Gửi phê duyệt
- **Kết quả mong đợi**:
  - ✅ Claim được tạo
  - ✅ Gửi cho manager phê duyệt
  - ✅ Sau khi duyệt, tự động tạo expense
- **API**: `POST /api/expense-claims`

---

### 📌 3.10. Journal Entries & Accounting

#### Test Case 3.10.1: Tạo bút toán (Journal Entry)
- **Mục đích**: Kiểm tra journal entries
- **Bước thực hiện**:
  1. Truy cập quản lý journal entries
  2. Nhấn "Tạo bút toán"
  3. Điền thông tin:
     - Ngày: `20/01/2024`
     - Mô tả: `Điều chỉnh chi phí`
     - Nợ: Tài khoản A, số tiền X
     - Có: Tài khoản B, số tiền X
  4. Lưu
- **Kết quả mong đợi**:
  - ✅ Journal entry được tạo
  - ✅ Tổng Nợ = Tổng Có
  - ✅ Hiển thị trong General Ledger
- **API**: `POST /api/accounting/journal-entries`

#### Test Case 3.10.2: Xem danh sách journal entries
- **Mục đích**: Kiểm tra danh sách
- **Bước thực hiện**:
  1. Truy cập quản lý journal entries
  2. Xem danh sách
  3. Filter theo ngày, tài khoản
- **Kết quả mong đợi**:
  - ✅ Hiển thị đầy đủ
  - ✅ Có thể filter, tìm kiếm
- **API**: `GET /api/accounting/journal-entries`

---

## 📊 TỔNG KẾT VÀ CHECKLIST

### ✅ Checklist Đợt 1: Cơ bản và Nền tảng
- [ ] Authentication & User Management (8 test cases)
- [ ] Customer Management (7 test cases)
- [ ] Employee Management (5 test cases)
- [ ] Dashboard (3 test cases)
- [ ] Phân quyền và Bảo mật (2 test cases)
- **Tổng: 25 test cases**

### ✅ Checklist Đợt 2: Quản lý Dự án và Bán hàng
- [ ] Project Management (7 test cases)
- [ ] Sales & Quotes (7 test cases)
- [ ] Invoice Management (5 test cases)
- [ ] Budgeting (3 test cases)
- **Tổng: 22 test cases**

### ✅ Checklist Đợt 3: Chi phí, Báo cáo và Nâng cao
- [ ] Expense Management (8 test cases)
- [ ] Reports & Analytics (9 test cases)
- [ ] Project Timeline (3 test cases)
- [ ] Task Management (8 test cases)
- [ ] AI Features (4 test cases)
- [ ] Notifications (5 test cases)
- [ ] System Feedback (2 test cases)
- [ ] Products & Services (3 test cases)
- [ ] Purchase Orders & Expense Claims (2 test cases)
- [ ] Journal Entries & Accounting (2 test cases)
- **Tổng: 46 test cases**

### 📈 Tổng cộng: **93 test cases**

---

## 🎯 HƯỚNG DẪN THỰC HIỆN

### 1. Chuẩn bị môi trường test
- ✅ Database có dữ liệu test
- ✅ Backend API đang chạy
- ✅ Frontend đang chạy
- ✅ Có tài khoản test cho các role khác nhau

### 2. Thực hiện test
- ✅ Test theo thứ tự từng đợt
- ✅ Ghi lại kết quả (Pass/Fail)
- ✅ Chụp screenshot nếu có lỗi
- ✅ Ghi lại bug report chi tiết

### 3. Báo cáo kết quả
- ✅ Tổng hợp kết quả từng đợt
- ✅ Liệt kê các bug phát hiện
- ✅ Đánh giá mức độ nghiêm trọng
- ✅ Đề xuất ưu tiên fix

---

## 📝 GHI CHÚ

- **Test Cases có thể mở rộng**: Tùy theo phát hiện trong quá trình test, có thể thêm các test case mới
- **Regression Testing**: Sau khi fix bug, cần test lại các chức năng liên quan
- **Performance Testing**: Nên test với dữ liệu lớn để kiểm tra hiệu năng
- **Security Testing**: Kiểm tra các lỗ hổng bảo mật (SQL injection, XSS, v.v.)
- **Cross-browser Testing**: Test trên các trình duyệt khác nhau (Chrome, Firefox, Safari, Edge)

---

**Ngày tạo**: {{ current_date }}
**Phiên bản**: 1.0
**Người tạo**: AI Assistant





