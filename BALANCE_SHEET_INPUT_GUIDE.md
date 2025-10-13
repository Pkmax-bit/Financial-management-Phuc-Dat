# 📊 Hướng dẫn nhập dữ liệu cho Bảng cân đối tài chính

## 🎯 Tóm tắt
Để tạo bảng cân đối tài chính, bạn cần nhập dữ liệu vào 4 bảng chính:

---

## 📋 1. KHÁCH HÀNG (Customers)

### Trường bắt buộc:
- **Tên khách hàng** - Tên công ty/khách hàng
- **Email** - Email liên hệ
- **Số điện thoại** - Số điện thoại
- **Địa chỉ** - Địa chỉ khách hàng

### Cách nhập:
1. Vào **Khách hàng** → **Thêm mới**
2. Nhập thông tin khách hàng
3. Lưu lại

---

## 📋 2. NHÀ CUNG CẤP (Vendors)

### Trường bắt buộc:
- **Tên nhà cung cấp** - Tên công ty nhà cung cấp
- **Email** - Email liên hệ
- **Số điện thoại** - Số điện thoại
- **Địa chỉ** - Địa chỉ nhà cung cấp

### Cách nhập:
1. Vào **Nhà cung cấp** → **Thêm mới**
2. Nhập thông tin nhà cung cấp
3. Lưu lại

---

## 📋 3. DỰ ÁN (Projects)

### Trường bắt buộc:
- **Mã dự án** - Mã dự án (VD: PRJ-001)
- **Tên dự án** - Tên dự án
- **Khách hàng** - Chọn khách hàng đã tạo
- **Ngày bắt đầu** - Ngày bắt đầu dự án
- **Ngân sách** - Số tiền ngân sách dự án (VND)

### Trường tùy chọn:
- **Chi phí thực tế** - Chi phí thực tế đã chi
- **Trạng thái** - Trạng thái dự án
- **Mô tả** - Mô tả dự án

### Cách nhập:
1. Vào **Dự án** → **Thêm mới**
2. Nhập thông tin dự án
3. **Quan trọng**: Nhập **Ngân sách** để tính tài sản
4. Lưu lại

---

## 📋 4. HÓA ĐƠN BÁN HÀNG (Invoices)

### Trường bắt buộc:
- **Số hóa đơn** - Số hóa đơn (VD: INV-001)
- **Khách hàng** - Chọn khách hàng
- **Dự án** - Chọn dự án (tùy chọn)
- **Ngày phát hành** - Ngày tạo hóa đơn
- **Tổng tiền** - Tổng tiền hóa đơn (VND)
- **Số tiền đã thanh toán** - Số tiền đã nhận (VND)

### Trường tùy chọn:
- **Ngày đến hạn** - Ngày thanh toán
- **Trạng thái thanh toán** - pending/partial/paid
- **Thuế suất** - % thuế
- **Ghi chú** - Ghi chú

### Cách nhập:
1. Vào **Bán hàng** → **Hóa đơn** → **Thêm mới**
2. Nhập thông tin hóa đơn
3. **Quan trọng**: Nhập **Tổng tiền** và **Số tiền đã thanh toán**
4. Lưu lại

---

## 📋 5. HÓA ĐƠN NHÀ CUNG CẤP (Bills)

### Trường bắt buộc:
- **Số hóa đơn** - Số hóa đơn (VD: BILL-001)
- **Nhà cung cấp** - Chọn nhà cung cấp
- **Dự án** - Chọn dự án (tùy chọn)
- **Ngày phát hành** - Ngày tạo hóa đơn
- **Số tiền** - Tổng tiền hóa đơn (VND)
- **Số tiền đã thanh toán** - Số tiền đã trả (VND)

### Trường tùy chọn:
- **Ngày đến hạn** - Ngày thanh toán
- **Trạng thái** - pending/partial/paid
- **Mô tả** - Mô tả hóa đơn

### Cách nhập:
1. Vào **Mua hàng** → **Hóa đơn nhà cung cấp** → **Thêm mới**
2. Nhập thông tin hóa đơn
3. **Quan trọng**: Nhập **Số tiền** và **Số tiền đã thanh toán**
4. Lưu lại

---

## 📋 6. CHI PHÍ (Expenses)

### Trường bắt buộc:
- **Mã chi phí** - Mã chi phí (VD: EXP-001)
- **Mô tả** - Mô tả chi phí
- **Số tiền** - Số tiền chi phí (VND)
- **Ngày chi phí** - Ngày phát sinh chi phí
- **Trạng thái** - pending/approved/paid

### Trường tùy chọn:
- **Dự án** - Chọn dự án liên quan
- **Nhân viên** - Người tạo chi phí
- **Loại chi phí** - travel/meals/supplies/other
- **Hóa đơn** - Link hóa đơn

### Cách nhập:
1. Vào **Chi phí** → **Thêm mới**
2. Nhập thông tin chi phí
3. **Quan trọng**: Nhập **Số tiền** và **Trạng thái**
4. Lưu lại

---

## 🧮 Cách tính toán tự động

### TÀI SẢN (Assets):
- **Tiền mặt** = Tổng tiền đã nhận từ hóa đơn - Tổng chi phí
- **Phải thu khách hàng** = Tổng hóa đơn chưa thanh toán
- **Hàng tồn kho** = 10% ngân sách dự án
- **Tài sản cố định** = 20% ngân sách dự án

### NỢ PHẢI TRẢ (Liabilities):
- **Phải trả nhà cung cấp** = Tổng hóa đơn nhà cung cấp chưa thanh toán
- **Nợ dài hạn** = 30% ngân sách dự án

### VỐN CHỦ SỞ HỮU (Equity):
- **Vốn chủ sở hữu** = Tổng tài sản - Tổng nợ phải trả

---

## 🚀 Quy trình nhập dữ liệu

### Bước 1: Tạo Khách hàng
1. Vào **Khách hàng** → **Thêm mới**
2. Nhập: Tên, Email, Số điện thoại, Địa chỉ
3. Lưu lại

### Bước 2: Tạo Nhà cung cấp
1. Vào **Nhà cung cấp** → **Thêm mới**
2. Nhập: Tên, Email, Số điện thoại, Địa chỉ
3. Lưu lại

### Bước 3: Tạo Dự án
1. Vào **Dự án** → **Thêm mới**
2. Nhập: Mã dự án, Tên dự án, Khách hàng, Ngày bắt đầu
3. **Quan trọng**: Nhập **Ngân sách** (VD: 10,000,000 VND)
4. Lưu lại

### Bước 4: Tạo Hóa đơn bán hàng
1. Vào **Bán hàng** → **Hóa đơn** → **Thêm mới**
2. Nhập: Số hóa đơn, Khách hàng, Ngày phát hành
3. **Quan trọng**: Nhập **Tổng tiền** (VD: 5,000,000 VND)
4. **Quan trọng**: Nhập **Số tiền đã thanh toán** (VD: 3,000,000 VND)
5. Lưu lại

### Bước 5: Tạo Hóa đơn nhà cung cấp
1. Vào **Mua hàng** → **Hóa đơn nhà cung cấp** → **Thêm mới**
2. Nhập: Số hóa đơn, Nhà cung cấp, Ngày phát hành
3. **Quan trọng**: Nhập **Số tiền** (VD: 2,000,000 VND)
4. **Quan trọng**: Nhập **Số tiền đã thanh toán** (VD: 1,000,000 VND)
5. Lưu lại

### Bước 6: Tạo Chi phí
1. Vào **Chi phí** → **Thêm mới**
2. Nhập: Mã chi phí, Mô tả, Số tiền, Ngày chi phí
3. **Quan trọng**: Nhập **Số tiền** (VD: 500,000 VND)
4. **Quan trọng**: Chọn **Trạng thái** (approved/paid)
5. Lưu lại

### Bước 7: Xem Bảng cân đối
1. Vào **Báo cáo** → **Bảng cân đối tài chính**
2. Chọn ngày báo cáo
3. Xem kết quả tự động

---

## 📊 Ví dụ dữ liệu mẫu

### Tạo 1 khách hàng:
- Tên: "Công ty ABC"
- Email: "contact@abc.com"
- Số điện thoại: "0123456789"
- Địa chỉ: "123 Đường ABC, Quận 1, TP.HCM"

### Tạo 1 dự án:
- Mã dự án: "PRJ-001"
- Tên dự án: "Website Development"
- Khách hàng: Chọn "Công ty ABC"
- Ngày bắt đầu: "2024-01-01"
- **Ngân sách: 10,000,000 VND**

### Tạo 1 hóa đơn:
- Số hóa đơn: "INV-001"
- Khách hàng: Chọn "Công ty ABC"
- Ngày phát hành: "2024-12-01"
- **Tổng tiền: 5,000,000 VND**
- **Số tiền đã thanh toán: 3,000,000 VND**

### Kết quả bảng cân đối:
- **Tài sản**: 8,000,000 VND
  - Tiền mặt: 2,500,000 VND
  - Phải thu: 2,000,000 VND
  - Hàng tồn kho: 1,000,000 VND
  - Tài sản cố định: 2,000,000 VND
- **Nợ phải trả**: 3,000,000 VND
- **Vốn chủ sở hữu**: 5,000,000 VND

---

## ⚠️ Lưu ý quan trọng

1. **Ngày tháng**: Đảm bảo ngày không vượt quá ngày báo cáo
2. **Số tiền**: Nhập đúng định dạng số (không có dấu phẩy)
3. **Trạng thái**: Sử dụng đúng giá trị (pending/partial/paid)
4. **Liên kết**: Đảm bảo chọn đúng khách hàng, nhà cung cấp
5. **Cân bằng**: Hệ thống tự động đảm bảo Assets = Liabilities + Equity

---

## 🎯 Mục tiêu

Sau khi nhập đủ dữ liệu, bạn sẽ có:
- ✅ Bảng cân đối tài chính hoàn chỉnh
- ✅ Tài sản, nợ phải trả, vốn chủ sở hữu
- ✅ Cân bằng kế toán tự động
- ✅ Báo cáo chuyên nghiệp
