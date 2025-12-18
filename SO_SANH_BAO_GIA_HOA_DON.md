# So sánh tính năng và giao diện: Báo giá vs Hóa đơn

## 📋 TỔNG QUAN

### ✅ ĐÃ CÓ TRONG CẢ HAI
- Form tạo/chỉnh sửa
- Chọn khách hàng từ danh sách
- Chọn dự án từ danh sách
- Thêm sản phẩm tự do
- Chọn sản phẩm từ danh sách
- Modal chọn sản phẩm với tìm kiếm
- Hiển thị/Ẩn cột
- EditableNumberCell (chỉnh sửa số trực tiếp)
- Tính toán tổng tiền tự động
- Thuế suất, giảm giá
- Ghi chú và điều khoản
- Tour hướng dẫn (Shepherd.js)
- Auto-calc dimensions (tự tính diện tích/thể tích)
- Adjustment rules (logic điều chỉnh vật tư)
- Baseline fields (baseline_area, baseline_volume)
- Components block (hiển thị vật tư)
- Truncate "Thành tiền" và "Đơn giá" còn 15 ký tự
- Logic: chỉnh "Thành tiền" không ảnh hưởng "Đơn giá", nhưng chỉnh "Đơn giá" ảnh hưởng "Thành tiền"

---

## 🔴 CHỈ CÓ TRONG BÁO GIÁ

### 1. **Form Fields - Thông tin cơ bản**
- ✅ **Nhân viên tạo báo giá** (dropdown chọn employee)
  - Hiển thị: "Nhân viên tạo báo giá"
  - Dropdown với danh sách employees
  - Bắt buộc khi submit
  - Validation: `if (!formData.created_by) throw new Error('Vui lòng chọn nhân viên tạo báo giá')`

- ✅ **Tạo khách hàng mới** (form inline)
  - Hiển thị khi chưa chọn khách hàng
  - Form đầy đủ: Loại khách hàng, Tên, Địa chỉ, Thành phố, Quốc gia, SĐT, Email, Mã số thuế, Hạn mức tín dụng, Điều khoản thanh toán, Ghi chú
  - Tự động tạo customer khi submit
  - Auto-generate customer code

- ✅ **Tạo dự án mới** (form inline)
  - Hiển thị khi chưa chọn dự án
  - Tên dự án (auto-generate từ customer name + address)
  - **Nhóm nhiệm vụ** (dropdown chọn task group)
  - Tự động tạo project và task khi submit
  - Auto-generate project code

- ✅ **Ngày hết hạn** (valid_until)
  - Field riêng, khác với "Ngày đến hạn" của hóa đơn

- ✅ **Trạng thái** có thêm:
  - "Đã chấp nhận" (accepted)
  - "Đã từ chối" (declined)

### 2. **Tính năng điều chỉnh vật tư**
- ✅ **Nút "Áp dụng điều chỉnh"** (manualAdjustAll)
  - Button màu tím ở phần Items
  - Áp dụng điều chỉnh cho tất cả dòng
  - Hiển thị "Đang áp dụng..." khi đang xử lý

- ✅ **Nút "Quy tắc đã tải"** (showRulesDialog)
  - Button hiển thị số lượng rules đã load
  - Click mở dialog xem danh sách rules

- ✅ **Nút "Áp dụng điều chỉnh" cho từng dòng** (manualAdjustItem)
  - Button trong mỗi dòng sản phẩm
  - Áp dụng điều chỉnh cho dòng cụ thể

- ✅ **Dialog hiển thị quy tắc điều chỉnh** (showRulesDialog)
  - Modal hiển thị danh sách rules đã load
  - Hiển thị chi tiết: expense_object_id, dimension_type, change_direction, adjustment_value, etc.

### 3. **Phân tích lợi nhuận**
- ✅ **Kiểm tra tỷ lệ lợi nhuận thấp** (checkLowProfitItems)
  - Tính toán lợi nhuận cho mỗi item
  - Cảnh báo nếu tỷ lệ lợi nhuận < 10%
  - Dialog cảnh báo trước khi tạo báo giá (showProfitWarningDialog)

- ✅ **Hiển thị phân tích lợi nhuận trong Items**
  - Block "Phân tích lợi nhuận" trong mỗi dòng
  - Hiển thị: Tổng giá sản phẩm, Tổng giá vật tư, Lợi nhuận (số tiền), Tỷ lệ lợi nhuận (%)
  - Màu sắc theo tỷ lệ: < 0% (đỏ), < 10% (đỏ), < 15% (vàng), >= 15% (xanh)
  - Chi tiết từng vật tư trong block

- ✅ **Dialog cảnh báo lợi nhuận thấp** (showProfitWarningDialog)
  - Hiển thị danh sách sản phẩm có lỷ lệ lợi nhuận < 10%
  - Cho phép tiếp tục hoặc hủy

### 4. **Logic submit**
- ✅ **Validation created_by**
  - Bắt buộc chọn nhân viên trước khi submit

- ✅ **Tạo customer/project mới khi submit**
  - Tự động tạo customer nếu có newCustomer data
  - Tự động tạo project nếu có newProject data
  - Tự động tạo task trong task group nếu có selectedTaskGroupId
  - Hiển thị thông báo thành công với chi tiết đã tạo

- ✅ **Success message chi tiết**
  - Hiển thị thông báo đã tạo customer/project mới

---

## 🟡 CHỈ CÓ TRONG HÓA ĐƠN

### 1. **Form Fields - Thông tin cơ bản**
- ✅ **Loại hóa đơn** (invoice_type)
  - Hóa đơn thường (standard)
  - Hóa đơn proforma (proforma)
  - Hóa đơn tín dụng (credit)

- ✅ **Ngày đến hạn** (due_date)
  - Field riêng, khác với "Ngày hết hạn" của báo giá

- ✅ **Trạng thái thanh toán** (payment_status)
  - Chưa thanh toán (pending)
  - Thanh toán một phần (partial)
  - Đã thanh toán (paid)

- ✅ **Điều khoản thanh toán** (payment_terms)
  - Field riêng trong form

- ✅ **Trạng thái** có thêm:
  - "Đã thanh toán" (paid)
  - "Quá hạn" (overdue)

### 2. **Logic submit**
- ✅ **Gửi hóa đơn ngay** (sendImmediately)
  - Button "Gửi ngay" trong header
  - Gọi API `/api/sales/invoices/{id}/send` sau khi tạo

- ✅ **Auto lấy created_by từ user hiện tại**
  - Không cần chọn employee, tự động lấy từ auth user
  - Không có validation bắt buộc chọn employee

---

## ❌ CHƯA CÓ TRONG HÓA ĐƠN (CẦN THÊM)

### 1. **Form Fields - Thông tin cơ bản**
- ❌ **Nhân viên tạo hóa đơn** (dropdown chọn employee)
  - Hiện tại: tự động lấy từ user, không có UI chọn
  - Cần: Dropdown giống báo giá

- ❌ **Tạo khách hàng mới** (form inline)
  - Hiện tại: chỉ có dropdown chọn khách hàng có sẵn
  - Cần: Form tạo khách hàng mới khi chưa chọn

- ❌ **Tạo dự án mới** (form inline)
  - Hiện tại: chỉ có dropdown chọn dự án có sẵn
  - Cần: Form tạo dự án mới + chọn task group

### 2. **Tính năng điều chỉnh vật tư**
- ❌ **Nút "Áp dụng điều chỉnh"** (manualAdjustAll)
  - Logic đã có, nhưng chưa có UI button

- ❌ **Nút "Quy tắc đã tải"** (showRulesDialog)
  - Logic đã có, nhưng chưa có UI button

- ❌ **Nút "Áp dụng điều chỉnh" cho từng dòng** (manualAdjustItem)
  - Logic chưa có, cần thêm function manualAdjustItem

- ❌ **Dialog hiển thị quy tắc điều chỉnh** (showRulesDialog)
  - Logic đã có, nhưng chưa có UI dialog

### 3. **Phân tích lợi nhuận**
- ❌ **Kiểm tra tỷ lệ lợi nhuận thấp** (checkLowProfitItems)
  - Chưa có function

- ❌ **Hiển thị phân tích lợi nhuận trong Items**
  - Chưa có block hiển thị

- ❌ **Dialog cảnh báo lợi nhuận thấp** (showProfitWarningDialog)
  - Chưa có dialog

### 4. **Logic submit**
- ❌ **Validation created_by**
  - Hiện tại không bắt buộc (auto lấy từ user)
  - Có thể giữ nguyên hoặc thêm validation nếu có dropdown

- ❌ **Tạo customer/project mới khi submit**
  - Logic chưa có trong handleSubmit
  - Cần thêm giống báo giá

- ❌ **Success message chi tiết**
  - Hiện tại chỉ có thông báo đơn giản
  - Cần thêm chi tiết đã tạo customer/project

---

## 📊 TÓM TẮT

### Đã có trong cả hai (✅)
- 16 tính năng chính

### Chỉ có trong Báo giá (🔴)
- 12 tính năng (chủ yếu: employee dropdown, tạo customer/project, phân tích lợi nhuận, điều chỉnh vật tư UI)

### Chỉ có trong Hóa đơn (🟡)
- 5 tính năng (chủ yếu: payment fields, send immediately)

### Chưa có trong Hóa đơn (❌)
- 11 tính năng cần thêm (chủ yếu: employee dropdown, tạo customer/project UI, phân tích lợi nhuận, điều chỉnh vật tư UI)

---

## 🎯 ƯU TIÊN THÊM VÀO HÓA ĐƠN

### Priority 1 (Quan trọng)
1. ✅ Nhân viên tạo hóa đơn (dropdown)
2. ✅ Tạo khách hàng mới (form inline)
3. ✅ Tạo dự án mới (form inline + task group)
4. ✅ Tạo customer/project khi submit

### Priority 2 (Hữu ích)
5. ✅ Nút "Áp dụng điều chỉnh" (manualAdjustAll)
6. ✅ Nút "Quy tắc đã tải" (showRulesDialog)
7. ✅ Dialog hiển thị quy tắc
8. ✅ Nút "Áp dụng điều chỉnh" cho từng dòng

### Priority 3 (Nice to have)
9. ✅ Phân tích lợi nhuận trong Items
10. ✅ Kiểm tra và cảnh báo lợi nhuận thấp
11. ✅ Success message chi tiết

