# 📊 Hướng dẫn nhập dữ liệu cho Bảng cân đối tài chính

## 🎯 Tổng quan
Bảng cân đối tài chính được tạo tự động từ 4 nguồn dữ liệu chính:
- **Invoices** (Hóa đơn) → Tài sản ngắn hạn (Tiền mặt, Phải thu)
- **Bills** (Hóa đơn nhà cung cấp) → Nợ phải trả
- **Projects** (Dự án) → Tài sản dài hạn, Hàng tồn kho, Nợ dài hạn
- **Expenses** (Chi phí) → Giảm tiền mặt

---

## 📋 1. INVOICES (Hóa đơn bán hàng)

### Trường bắt buộc:
- **`invoice_number`** - Số hóa đơn (VD: "INV-001")
- **`customer_id`** - ID khách hàng (UUID)
- **`issue_date`** - Ngày phát hành (YYYY-MM-DD)
- **`total_amount`** - Tổng tiền hóa đơn (số)
- **`paid_amount`** - Số tiền đã thanh toán (số)

### Trường tùy chọn:
- **`payment_status`** - Trạng thái thanh toán ("pending", "partial", "paid")
- **`due_date`** - Ngày đến hạn
- **`subtotal`** - Tiền trước thuế
- **`tax_rate`** - Thuế suất (%)
- **`tax_amount`** - Số tiền thuế

### Ví dụ:
```json
{
  "invoice_number": "INV-2024-001",
  "customer_id": "123e4567-e89b-12d3-a456-426614174000",
  "issue_date": "2024-12-01",
  "total_amount": 5000000,
  "paid_amount": 3000000,
  "payment_status": "partial"
}
```

---

## 📋 2. BILLS (Hóa đơn nhà cung cấp)

### Trường bắt buộc:
- **`bill_number`** - Số hóa đơn (VD: "BILL-001")
- **`vendor_id`** - ID nhà cung cấp (UUID)
- **`issue_date`** - Ngày phát hành (YYYY-MM-DD)
- **`amount`** - Tổng tiền hóa đơn (số)
- **`paid_amount`** - Số tiền đã thanh toán (số)

### Trường tùy chọn:
- **`status`** - Trạng thái ("pending", "partial", "paid")
- **`due_date`** - Ngày đến hạn
- **`description`** - Mô tả

### Ví dụ:
```json
{
  "bill_number": "BILL-2024-001",
  "vendor_id": "123e4567-e89b-12d3-a456-426614174001",
  "issue_date": "2024-12-05",
  "amount": 2000000,
  "paid_amount": 1000000,
  "status": "partial"
}
```

---

## 📋 3. PROJECTS (Dự án)

### Trường bắt buộc:
- **`project_code`** - Mã dự án (VD: "PRJ-001")
- **`name`** - Tên dự án
- **`customer_id`** - ID khách hàng (UUID)
- **`start_date`** - Ngày bắt đầu (YYYY-MM-DD)
- **`budget`** - Ngân sách dự án (số)

### Trường tùy chọn:
- **`actual_cost`** - Chi phí thực tế (số)
- **`status`** - Trạng thái ("planning", "active", "completed")
- **`end_date`** - Ngày kết thúc
- **`description`** - Mô tả dự án

### Ví dụ:
```json
{
  "project_code": "PRJ-2024-001",
  "name": "Website Development",
  "customer_id": "123e4567-e89b-12d3-a456-426614174000",
  "start_date": "2024-11-01",
  "budget": 10000000,
  "actual_cost": 8000000,
  "status": "active"
}
```

---

## 📋 4. EXPENSES (Chi phí)

### Trường bắt buộc:
- **`expense_code`** - Mã chi phí (VD: "EXP-001")
- **`description`** - Mô tả chi phí
- **`amount`** - Số tiền chi phí (số)
- **`expense_date`** - Ngày chi phí (YYYY-MM-DD)
- **`status`** - Trạng thái ("pending", "approved", "paid")

### Trường tùy chọn:
- **`category`** - Loại chi phí ("travel", "meals", "supplies")
- **`employee_id`** - ID nhân viên (UUID)
- **`project_id`** - ID dự án (UUID)
- **`receipt_url`** - Link hóa đơn

### Ví dụ:
```json
{
  "expense_code": "EXP-2024-001",
  "description": "Office supplies",
  "amount": 500000,
  "expense_date": "2024-12-10",
  "status": "paid",
  "category": "supplies"
}
```

---

## 🧮 Cách tính toán Bảng cân đối

### TÀI SẢN (Assets):
1. **Tiền mặt** = Tổng paid_amount từ invoices - Tổng amount từ expenses
2. **Phải thu khách hàng** = Tổng (total_amount - paid_amount) từ invoices
3. **Hàng tồn kho** = 10% tổng budget từ projects
4. **Tài sản cố định** = 20% tổng budget từ projects

### NỢ PHẢI TRẢ (Liabilities):
1. **Phải trả nhà cung cấp** = Tổng (amount - paid_amount) từ bills
2. **Nợ ngắn hạn** = Chi phí thực tế vượt ngân sách dự án
3. **Nợ dài hạn** = 30% tổng budget từ projects

### VỐN CHỦ SỞ HỮU (Equity):
- **Vốn chủ sở hữu** = Tổng tài sản - Tổng nợ phải trả

---

## 🚀 Cách nhập dữ liệu

### Bước 1: Tạo Khách hàng
1. Vào **Khách hàng** → **Thêm mới**
2. Nhập thông tin khách hàng
3. Lưu lại để lấy `customer_id`

### Bước 2: Tạo Nhà cung cấp
1. Vào **Nhà cung cấp** → **Thêm mới**
2. Nhập thông tin nhà cung cấp
3. Lưu lại để lấy `vendor_id`

### Bước 3: Tạo Dự án
1. Vào **Dự án** → **Thêm mới**
2. Nhập thông tin dự án với `budget`
3. Lưu lại để lấy `project_id`

### Bước 4: Tạo Hóa đơn bán hàng
1. Vào **Bán hàng** → **Hóa đơn**
2. Nhập thông tin hóa đơn với `total_amount` và `paid_amount`
3. Lưu lại

### Bước 5: Tạo Hóa đơn nhà cung cấp
1. Vào **Mua hàng** → **Hóa đơn nhà cung cấp**
2. Nhập thông tin hóa đơn với `amount` và `paid_amount`
3. Lưu lại

### Bước 6: Tạo Chi phí
1. Vào **Chi phí** → **Thêm mới**
2. Nhập thông tin chi phí với `amount`
3. Lưu lại

### Bước 7: Xem Bảng cân đối
1. Vào **Báo cáo** → **Bảng cân đối tài chính**
2. Chọn ngày báo cáo
3. Xem kết quả tự động

---

## ⚠️ Lưu ý quan trọng

1. **Ngày tháng**: Đảm bảo `issue_date`, `expense_date` không vượt quá ngày báo cáo
2. **Số tiền**: Nhập đúng định dạng số (không có dấu phẩy)
3. **Trạng thái**: Sử dụng đúng giá trị enum
4. **ID liên kết**: Đảm bảo `customer_id`, `vendor_id` tồn tại
5. **Cân bằng**: Hệ thống tự động đảm bảo Assets = Liabilities + Equity

---

## 📊 Ví dụ dữ liệu mẫu

### Tạo 1 khách hàng:
```json
{
  "customer_code": "CUST-001",
  "name": "Công ty ABC",
  "email": "contact@abc.com",
  "phone": "0123456789"
}
```

### Tạo 1 dự án:
```json
{
  "project_code": "PRJ-001",
  "name": "Website Development",
  "customer_id": "customer_id_from_above",
  "start_date": "2024-01-01",
  "budget": 10000000
}
```

### Tạo 1 hóa đơn:
```json
{
  "invoice_number": "INV-001",
  "customer_id": "customer_id_from_above",
  "issue_date": "2024-12-01",
  "total_amount": 5000000,
  "paid_amount": 3000000
}
```

Sau khi nhập đủ dữ liệu, bảng cân đối sẽ tự động hiển thị với:
- **Tài sản**: 8,000,000 VND (3,000,000 tiền mặt + 2,000,000 phải thu + 1,000,000 hàng tồn kho + 2,000,000 tài sản cố định)
- **Nợ phải trả**: 3,000,000 VND (nợ dài hạn từ dự án)
- **Vốn chủ sở hữu**: 5,000,000 VND
