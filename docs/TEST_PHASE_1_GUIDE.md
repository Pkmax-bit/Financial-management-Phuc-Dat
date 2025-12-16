# 🧪 HƯỚNG DẪN TEST PHASE 1 - CÁC CHỨC NĂNG CƠ BẢN VÀ NỀN TẢNG

## 📋 Chuẩn bị trước khi test

### 1. Kiểm tra môi trường

#### Backend đang chạy
```bash
# Kiểm tra backend có đang chạy không
curl http://localhost:8000/health

# Hoặc mở trình duyệt:
# http://localhost:8000/docs (Swagger UI)
```

#### Frontend đang chạy
```bash
# Kiểm tra frontend có đang chạy không
# Mở trình duyệt: http://localhost:3000
```

#### Nếu chưa chạy, khởi động:
```bash
# Chạy cả backend và frontend
npm run dev

# Hoặc chạy riêng:
npm run dev:backend   # Terminal 1
npm run dev:frontend  # Terminal 2
```

### 2. Chuẩn bị dữ liệu test

- ✅ Database đã được setup (chạy `database/schema.sql` nếu chưa)
- ✅ Có ít nhất 1 tài khoản admin để test
- ✅ Có dữ liệu mẫu (departments, positions) để test employee

### 3. Mở các công cụ cần thiết

- ✅ **Browser**: Chrome/Firefox với DevTools mở (F12)
- ✅ **API Testing**: Postman hoặc dùng Swagger UI tại `http://localhost:8000/docs`
- ✅ **Checklist file**: Mở `docs/TEST_CHECKLIST_3_PHASES.md` để đánh dấu

---

## 🎯 BẮT ĐẦU TEST PHASE 1

### 📌 PHẦN 1: Authentication & User Management (8 test cases)

#### ✅ Test Case 1.1.1: Đăng ký tài khoản mới

**Bước thực hiện:**
1. Mở trình duyệt, truy cập: `http://localhost:3000/register`
2. Điền form:
   - Email: `testuser1@example.com`
   - Password: `Test123!@#`
   - Full Name: `Nguyễn Văn Test`
   - Role: Chọn `employee` (hoặc role phù hợp)
3. Nhấn nút "Đăng ký"

**Kiểm tra:**
- [ ] Form validation hoạt động (nếu để trống)
- [ ] Sau khi đăng ký, có thông báo thành công
- [ ] Tự động chuyển đến trang login hoặc dashboard
- [ ] Kiểm tra trong database: user đã được tạo trong bảng `users`

**Test API trực tiếp (nếu cần):**
```bash
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser1@example.com",
    "password": "Test123!@#",
    "full_name": "Nguyễn Văn Test",
    "role": "employee"
  }'
```

**Ghi chú:**
```
[Ghi lại kết quả, screenshot nếu có lỗi]
```

---

#### ✅ Test Case 1.1.2: Đăng nhập

**Bước thực hiện:**
1. Truy cập: `http://localhost:3000/login`
2. Nhập email và password đã đăng ký ở TC 1.1.1
3. Nhấn "Đăng nhập"

**Kiểm tra:**
- [ ] Đăng nhập thành công
- [ ] Chuyển đến dashboard (`/dashboard`)
- [ ] Kiểm tra trong DevTools → Application → Local Storage: có token
- [ ] Kiểm tra trong DevTools → Network: API `/api/auth/login` trả về 200 và có `access_token`

**Test API trực tiếp:**
```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser1@example.com",
    "password": "Test123!@#"
  }'
```

**Ghi chú:**
```
[Ghi lại kết quả]
```

---

#### ✅ Test Case 1.1.3: Đăng nhập với thông tin sai

**Bước thực hiện:**
1. Truy cập: `http://localhost:3000/login`
2. Nhập email hoặc password SAI
3. Nhấn "Đăng nhập"

**Kiểm tra:**
- [ ] Hiển thị thông báo lỗi rõ ràng (ví dụ: "Email hoặc mật khẩu không đúng")
- [ ] KHÔNG cho phép đăng nhập
- [ ] Form KHÔNG bị reset (email vẫn còn, chỉ password bị xóa)
- [ ] API trả về status code 401 hoặc 400

**Ghi chú:**
```
[Ghi lại thông báo lỗi hiển thị]
```

---

#### ✅ Test Case 1.1.4: Đăng xuất

**Bước thực hiện:**
1. Đăng nhập thành công (từ TC 1.1.2)
2. Tìm nút "Đăng xuất" (thường ở menu user hoặc sidebar)
3. Nhấn "Đăng xuất"

**Kiểm tra:**
- [ ] Đăng xuất thành công
- [ ] Chuyển về trang login (`/login`)
- [ ] Kiểm tra Local Storage: token đã bị xóa
- [ ] Nếu truy cập lại `/dashboard` → tự động redirect về login

**Test API:**
```bash
# Lấy token từ login trước
TOKEN="your_access_token_here"

curl -X POST http://localhost:8000/api/auth/logout \
  -H "Authorization: Bearer $TOKEN"
```

**Ghi chú:**
```
[Ghi lại kết quả]
```

---

#### ✅ Test Case 1.1.5: Lấy thông tin người dùng hiện tại

**Bước thực hiện:**
1. Đăng nhập thành công
2. Mở DevTools → Network tab
3. Xem request đến `/api/auth/me` (thường tự động gọi khi vào dashboard)

**Kiểm tra:**
- [ ] API trả về đầy đủ thông tin user
- [ ] Bao gồm: email, full_name, role, id
- [ ] Status code: 200

**Test API trực tiếp:**
```bash
TOKEN="your_access_token_here"

curl -X GET http://localhost:8000/api/auth/me \
  -H "Authorization: Bearer $TOKEN"
```

**Ghi chú:**
```
[Ghi lại response]
```

---

#### ✅ Test Case 1.1.6: Cập nhật thông tin người dùng

**Bước thực hiện:**
1. Đăng nhập thành công
2. Tìm trang profile/settings (có thể ở menu user → "Cài đặt" hoặc `/profile`)
3. Sửa thông tin (ví dụ: đổi tên từ "Nguyễn Văn Test" → "Nguyễn Văn Test Updated")
4. Nhấn "Lưu"

**Kiểm tra:**
- [ ] Cập nhật thành công, có thông báo
- [ ] Thông tin mới hiển thị ngay trên UI
- [ ] Kiểm tra database: thông tin đã được cập nhật
- [ ] Gọi lại `/api/auth/me` → thông tin mới

**Test API:**
```bash
TOKEN="your_access_token_here"

curl -X PUT http://localhost:8000/api/auth/me \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "Nguyễn Văn Test Updated"
  }'
```

**Ghi chú:**
```
[Ghi lại kết quả]
```

---

#### ✅ Test Case 1.1.7: Đổi mật khẩu

**Bước thực hiện:**
1. Đăng nhập thành công
2. Truy cập: `http://localhost:3000/change-password`
3. Điền form:
   - Mật khẩu cũ: `Test123!@#`
   - Mật khẩu mới: `NewPassword123!@#`
   - Xác nhận mật khẩu mới: `NewPassword123!@#`
4. Nhấn "Đổi mật khẩu"

**Kiểm tra:**
- [ ] Đổi mật khẩu thành công
- [ ] Có thể đăng nhập với mật khẩu mới
- [ ] KHÔNG thể đăng nhập với mật khẩu cũ
- [ ] Validation: nếu mật khẩu mới không khớp → báo lỗi

**Ghi chú:**
```
[Ghi lại kết quả]
```

---

#### ✅ Test Case 1.1.8: Quên mật khẩu

**Bước thực hiện:**
1. Truy cập: `http://localhost:3000/forgot-password`
2. Nhập email đã đăng ký: `testuser1@example.com`
3. Nhấn "Gửi email reset"

**Kiểm tra:**
- [ ] Hiển thị thông báo "Email đã được gửi" (hoặc tương tự)
- [ ] Kiểm tra email inbox (nếu có cấu hình email)
- [ ] Email có link reset password
- [ ] Link reset hợp lệ, có thể đặt lại mật khẩu

**Lưu ý:** Nếu chưa cấu hình email, có thể test bằng cách:
- Kiểm tra console/network xem API có được gọi không
- Kiểm tra database xem có lưu reset token không

**Ghi chú:**
```
[Ghi lại kết quả, có nhận được email không]
```

---

### 📌 PHẦN 2: Customer Management (7 test cases)

**Lưu ý:** Cần đăng nhập với role `admin` hoặc `sales` để test phần này.

#### ✅ Test Case 1.2.1: Tạo khách hàng mới

**Bước thực hiện:**
1. Đăng nhập với role admin/sales
2. Truy cập: `http://localhost:3000/customers`
3. Nhấn nút "Tạo khách hàng" (thường ở góc phải trên)
4. Điền form:
   - Tên: `Công ty ABC Test`
   - Loại: `company` (hoặc individual/government)
   - Email: `contact@abc-test.com`
   - Số điện thoại: `0901234567`
   - Địa chỉ: `123 Đường ABC, Quận 1, TP.HCM`
   - Credit limit: `100000000`
   - Payment terms: `30 days`
5. Nhấn "Lưu" hoặc "Tạo"

**Kiểm tra:**
- [ ] Khách hàng được tạo thành công
- [ ] Mã tự động được tạo (CUS001, CUS002, ...)
- [ ] Hiển thị trong danh sách ngay sau khi tạo
- [ ] Kiểm tra database: record đã được lưu

**Test API:**
```bash
TOKEN="your_access_token_here"

curl -X POST http://localhost:8000/api/customers \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Công ty ABC Test",
    "customer_type": "company",
    "email": "contact@abc-test.com",
    "phone": "0901234567",
    "address": "123 Đường ABC, Quận 1, TP.HCM",
    "credit_limit": 100000000,
    "payment_terms": "30 days"
  }'
```

**Ghi chú:**
```
[Ghi lại mã khách hàng được tạo]
```

---

#### ✅ Test Case 1.2.2: Xem danh sách khách hàng

**Bước thực hiện:**
1. Truy cập: `http://localhost:3000/customers`
2. Xem danh sách khách hàng

**Kiểm tra:**
- [ ] Hiển thị đầy đủ thông tin: tên, email, số điện thoại, loại
- [ ] Có phân trang nếu có nhiều khách hàng (>10-20 items)
- [ ] Có ô tìm kiếm
- [ ] Có filter (nếu có)
- [ ] Mỗi dòng có nút xem/sửa/xóa

**Test API:**
```bash
TOKEN="your_access_token_here"

curl -X GET "http://localhost:8000/api/customers?skip=0&limit=10" \
  -H "Authorization: Bearer $TOKEN"
```

**Ghi chú:**
```
[Tổng số khách hàng hiển thị: ___]
```

---

#### ✅ Test Case 1.2.3: Xem chi tiết khách hàng

**Bước thực hiện:**
1. Từ danh sách khách hàng, click vào một khách hàng
2. Xem trang chi tiết

**Kiểm tra:**
- [ ] Hiển thị đầy đủ thông tin khách hàng
- [ ] Có tab/section hiển thị danh sách dự án liên quan (nếu có)
- [ ] Có tab/section hiển thị lịch sử giao dịch (nếu có)
- [ ] Có nút "Chỉnh sửa" và "Xóa"

**Test API:**
```bash
TOKEN="your_access_token_here"
CUSTOMER_ID="id_của_khách_hàng"

curl -X GET "http://localhost:8000/api/customers/$CUSTOMER_ID" \
  -H "Authorization: Bearer $TOKEN"
```

**Ghi chú:**
```
[Ghi lại thông tin hiển thị]
```

---

#### ✅ Test Case 1.2.4: Cập nhật thông tin khách hàng

**Bước thực hiện:**
1. Mở chi tiết khách hàng (từ TC 1.2.3)
2. Nhấn nút "Chỉnh sửa" hoặc "Sửa"
3. Sửa thông tin (ví dụ: đổi số điện thoại từ `0901234567` → `0907654321`)
4. Nhấn "Lưu"

**Kiểm tra:**
- [ ] Cập nhật thành công, có thông báo
- [ ] Thông tin mới hiển thị ngay trên UI
- [ ] Kiểm tra database: thông tin đã được cập nhật

**Test API:**
```bash
TOKEN="your_access_token_here"
CUSTOMER_ID="id_của_khách_hàng"

curl -X PUT "http://localhost:8000/api/customers/$CUSTOMER_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "0907654321"
  }'
```

**Ghi chú:**
```
[Ghi lại kết quả]
```

---

#### ✅ Test Case 1.2.5: Xóa khách hàng

**Bước thực hiện:**
1. Tạo một khách hàng mới (không có dự án liên quan)
2. Mở chi tiết khách hàng
3. Nhấn nút "Xóa"
4. Xác nhận xóa (nếu có dialog)

**Kiểm tra:**
- [ ] Nếu khách hàng KHÔNG có dự án: xóa thành công
- [ ] Nếu khách hàng CÓ dự án: hiển thị cảnh báo, không cho xóa
- [ ] Sau khi xóa: khách hàng không còn trong danh sách

**Test API:**
```bash
TOKEN="your_access_token_here"
CUSTOMER_ID="id_của_khách_hàng"

curl -X DELETE "http://localhost:8000/api/customers/$CUSTOMER_ID" \
  -H "Authorization: Bearer $TOKEN"
```

**Ghi chú:**
```
[Ghi lại kết quả, có cảnh báo không]
```

---

#### ✅ Test Case 1.2.6: Tìm kiếm khách hàng

**Bước thực hiện:**
1. Truy cập: `http://localhost:3000/customers`
2. Nhập từ khóa vào ô tìm kiếm (ví dụ: "ABC")
3. Xem kết quả

**Kiểm tra:**
- [ ] Tìm kiếm theo tên: hoạt động
- [ ] Tìm kiếm theo email: hoạt động
- [ ] Tìm kiếm theo mã: hoạt động (nếu có)
- [ ] Kết quả hiển thị ngay lập tức (real-time search)
- [ ] Từ khóa được highlight trong kết quả (nếu có)

**Ghi chú:**
```
[Ghi lại từ khóa đã test và kết quả]
```

---

#### ✅ Test Case 1.2.7: Lọc khách hàng theo loại

**Bước thực hiện:**
1. Truy cập: `http://localhost:3000/customers`
2. Tìm bộ lọc (filter) theo loại khách hàng
3. Chọn một loại (individual/company/government)
4. Xem kết quả

**Kiểm tra:**
- [ ] Chỉ hiển thị khách hàng đúng loại đã chọn
- [ ] Có thể kết hợp nhiều filter (nếu có)
- [ ] Có thể reset filter

**Ghi chú:**
```
[Ghi lại các filter đã test]
```

---

### 📌 PHẦN 3: Employee Management (5 test cases)

**Lưu ý:** Cần đăng nhập với role `admin` để test phần này.

#### ✅ Test Case 1.3.1: Tạo nhân viên mới

**Bước thực hiện:**
1. Đăng nhập với role admin
2. Truy cập: `http://localhost:3000/employees`
3. Nhấn "Tạo nhân viên"
4. Điền form:
   - Họ tên: `Trần Văn B Test`
   - Email: `tranvanb@example.com`
   - Số điện thoại: `0907654321`
   - Phòng ban: Chọn từ dropdown (cần có dữ liệu trước)
   - Chức vụ: Chọn từ dropdown (cần có dữ liệu trước)
   - Ngày vào làm: `01/01/2024`
5. Lưu

**Kiểm tra:**
- [ ] Nhân viên được tạo thành công
- [ ] Hiển thị trong danh sách
- [ ] Có thể liên kết với user account (nếu có)

**Test API:**
```bash
TOKEN="your_access_token_here"

curl -X POST http://localhost:8000/api/employees \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "Trần Văn B Test",
    "email": "tranvanb@example.com",
    "phone": "0907654321",
    "department_id": 1,
    "position_id": 1,
    "hire_date": "2024-01-01"
  }'
```

**Ghi chú:**
```
[Ghi lại kết quả, có cần tạo department/position trước không]
```

---

#### ✅ Test Case 1.3.2: Xem danh sách nhân viên

**Bước thực hiện:**
1. Truy cập: `http://localhost:3000/employees`
2. Xem danh sách

**Kiểm tra:**
- [ ] Hiển thị đầy đủ thông tin
- [ ] Có phân trang
- [ ] Có tìm kiếm
- [ ] Có filter theo phòng ban

**Ghi chú:**
```
[Ghi lại kết quả]
```

---

#### ✅ Test Case 1.3.3: Xem chi tiết nhân viên

**Bước thực hiện:**
1. Click vào một nhân viên trong danh sách
2. Xem thông tin chi tiết

**Kiểm tra:**
- [ ] Hiển thị đầy đủ thông tin
- [ ] Hiển thị dự án đang tham gia (nếu có)
- [ ] Hiển thị lịch sử công việc (nếu có)

**Ghi chú:**
```
[Ghi lại kết quả]
```

---

#### ✅ Test Case 1.3.4: Cập nhật thông tin nhân viên

**Bước thực hiện:**
1. Mở chi tiết nhân viên
2. Nhấn "Chỉnh sửa"
3. Sửa thông tin (ví dụ: đổi phòng ban)
4. Lưu

**Kiểm tra:**
- [ ] Cập nhật thành công
- [ ] Thông tin mới hiển thị ngay

**Ghi chú:**
```
[Ghi lại kết quả]
```

---

#### ✅ Test Case 1.3.5: Import nhân viên từ Excel

**Bước thực hiện:**
1. Truy cập: `http://localhost:3000/employees`
2. Tìm nút "Import từ Excel" hoặc "Upload Excel"
3. Download template (nếu có)
4. Điền thông tin vào template
5. Upload file Excel
6. Xem preview (nếu có)
7. Xác nhận import

**Kiểm tra:**
- [ ] Import thành công
- [ ] Hiển thị preview trước khi import
- [ ] Báo lỗi nếu format sai
- [ ] Nhân viên được tạo trong danh sách

**Ghi chú:**
```
[Ghi lại kết quả, có lỗi gì không]
```

---

### 📌 PHẦN 4: Dashboard (3 test cases)

#### ✅ Test Case 1.4.1: Xem Dashboard tổng quan

**Bước thực hiện:**
1. Đăng nhập
2. Truy cập: `http://localhost:3000/dashboard`
3. Xem các widget và biểu đồ

**Kiểm tra:**
- [ ] Hiển thị tổng quan tài chính (doanh thu, chi phí, lợi nhuận)
- [ ] Có biểu đồ doanh thu, chi phí
- [ ] Thống kê dự án, khách hàng, nhân viên
- [ ] Dữ liệu real-time (không cần refresh)
- [ ] Không có lỗi trong console

**Test API:**
```bash
TOKEN="your_access_token_here"

curl -X GET http://localhost:8000/api/dashboard \
  -H "Authorization: Bearer $TOKEN"
```

**Ghi chú:**
```
[Ghi lại các widget hiển thị]
```

---

#### ✅ Test Case 1.4.2: Lọc Dashboard theo thời gian

**Bước thực hiện:**
1. Trên dashboard, tìm bộ lọc thời gian
2. Chọn khoảng thời gian (tháng/quý/năm)
3. Xem dữ liệu cập nhật

**Kiểm tra:**
- [ ] Dữ liệu được lọc đúng
- [ ] Biểu đồ cập nhật ngay
- [ ] Có thể chọn custom date range

**Ghi chú:**
```
[Ghi lại các filter đã test]
```

---

#### ✅ Test Case 1.4.3: Xem chi tiết từ widget

**Bước thực hiện:**
1. Trên dashboard, click vào một widget (ví dụ: "Tổng doanh thu")
2. Xem trang chi tiết

**Kiểm tra:**
- [ ] Chuyển đến trang chi tiết tương ứng
- [ ] Hiển thị dữ liệu đầy đủ hơn
- [ ] Có thể quay lại dashboard

**Ghi chú:**
```
[Ghi lại các widget đã click]
```

---

### 📌 PHẦN 5: Phân quyền và Bảo mật (2 test cases)

#### ✅ Test Case 1.5.1: Kiểm tra phân quyền theo role

**Bước thực hiện:**
1. Đăng nhập với role `customer`
2. Kiểm tra menu và chức năng hiển thị
3. Thử truy cập các route không được phép (ví dụ: `/employees`, `/customers`)
4. Lặp lại với các role khác: `admin`, `sales`, `accountant`

**Kiểm tra:**
- [ ] Menu chỉ hiển thị đúng chức năng theo role
- [ ] Không thể truy cập route không được phép (redirect về login hoặc 403)
- [ ] API trả về 403 Forbidden nếu không có quyền

**Ghi chú:**
```
[Ghi lại các role đã test và kết quả]
```

---

#### ✅ Test Case 1.5.2: Kiểm tra JWT token expiration

**Bước thực hiện:**
1. Đăng nhập thành công
2. Lấy token từ Local Storage
3. Đợi token hết hạn (hoặc thay đổi token thủ công trong Local Storage)
4. Thực hiện một API call (ví dụ: refresh trang dashboard)

**Kiểm tra:**
- [ ] Nhận được 401 Unauthorized
- [ ] Tự động redirect về login
- [ ] Có thể refresh token (nếu có cơ chế)

**Ghi chú:**
```
[Ghi lại kết quả, có tự động refresh token không]
```

---

## 📊 TỔNG KẾT PHASE 1

### Thống kê
- **Tổng số test cases**: 25
- **Đã hoàn thành**: ___ / 25
- **Pass**: ___
- **Fail**: ___
- **Tỷ lệ Pass**: ___%

### Bug phát hiện

| # | Test Case | Mô tả bug | Mức độ | Trạng thái |
|---|-----------|-----------|--------|------------|
| 1 | | | | |
| 2 | | | | |

### Ghi chú tổng hợp
```
[Ghi lại các vấn đề chung, cải tiến đề xuất]
```

---

## 🎯 BƯỚC TIẾP THEO

Sau khi hoàn thành Phase 1:
1. ✅ Tổng hợp kết quả test
2. ✅ Báo cáo bug cho dev team
3. ✅ Fix các bug critical trước khi chuyển sang Phase 2
4. ✅ Cập nhật checklist trong `TEST_CHECKLIST_3_PHASES.md`

---

**Người test**: _________________
**Ngày test**: _________________
**Phiên bản hệ thống**: _________________





