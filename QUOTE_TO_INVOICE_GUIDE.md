# Hướng dẫn chuyển báo giá sang hóa đơn

## Tổng quan
Chức năng chuyển báo giá sang hóa đơn cho phép bạn tạo hóa đơn từ báo giá đã được chấp nhận hoặc đã gửi.

## Cách sử dụng

### 1. Điều kiện để chuyển báo giá
- Báo giá phải có trạng thái: `accepted`, `sent`, hoặc `viewed`
- Không thể chuyển báo giá đã bị từ chối (`declined`)
- Không thể chuyển báo giá đã hết hạn (`expired`)
- Không thể chuyển báo giá đã được chuyển rồi (`closed`, `converted`)

### 2. Quy trình chuyển đổi

#### Bước 1: Chọn báo giá
- Vào tab "Báo giá" trong module Sales
- Tìm báo giá muốn chuyển thành hóa đơn
- Kiểm tra trạng thái báo giá (phải là accepted, sent, hoặc viewed)

#### Bước 2: Thực hiện chuyển đổi
- Nhấn nút "Chuyển thành hóa đơn" (biểu tượng $)
- Hệ thống sẽ tự động:
  - Tạo số hóa đơn mới (format: INV-YYYYMMDD-XXXXXX)
  - Sao chép thông tin từ báo giá
  - Tính toán ngày đáo hạn (30 ngày từ ngày phát hành)
  - Tạo hóa đơn với trạng thái "draft"
  - Cập nhật trạng thái báo giá thành "closed"

#### Bước 3: Xác nhận
- Hệ thống hiển thị thông báo thành công với:
  - Số hóa đơn mới
  - Tổng tiền
  - Ngày đáo hạn
  - Hướng dẫn xem hóa đơn trong tab "Hóa đơn"

## Thông tin được sao chép

### Từ báo giá sang hóa đơn:
- ✅ Thông tin khách hàng (`customer_id`)
- ✅ Thông tin dự án (`project_id`) - nếu có
- ✅ Liên kết với báo giá gốc (`quote_id`)
- ✅ Ngày phát hành (`issue_date`)
- ✅ Tổng tiền (`subtotal`, `tax_amount`, `total_amount`)
- ✅ Thuế suất (`tax_rate`)
- ✅ Tiền tệ (`currency`)
- ✅ Danh sách sản phẩm/dịch vụ (`items`)
- ✅ Ghi chú (`notes`)
- ✅ Người tạo (`created_by`)

### Thông tin mới được tạo:
- 🆕 Số hóa đơn (`invoice_number`)
- 🆕 Ngày đáo hạn (`due_date`) - 30 ngày từ ngày phát hành
- 🆕 Trạng thái hóa đơn (`status: 'draft'`)
- 🆕 Trạng thái thanh toán (`payment_status: 'pending'`)
- 🆕 Số tiền đã thanh toán (`paid_amount: 0.0`)

## Trạng thái báo giá sau khi chuyển

| Trạng thái trước | Trạng thái sau | Mô tả |
|------------------|----------------|-------|
| `accepted` | `closed` | Báo giá đã được chấp nhận và chuyển thành hóa đơn |
| `sent` | `closed` | Báo giá đã gửi và chuyển thành hóa đơn |
| `viewed` | `closed` | Báo giá đã được xem và chuyển thành hóa đơn |

## Xử lý lỗi

### Lỗi thường gặp:
1. **"Báo giá này đã được chuyển thành hóa đơn rồi"**
   - Nguyên nhân: Báo giá đã có trạng thái `closed` hoặc `converted`
   - Giải pháp: Kiểm tra lại trạng thái báo giá

2. **"Không thể chuyển báo giá đã bị từ chối"**
   - Nguyên nhân: Báo giá có trạng thái `declined`
   - Giải pháp: Tạo báo giá mới hoặc liên hệ khách hàng

3. **"Không thể chuyển báo giá đã hết hạn"**
   - Nguyên nhân: Báo giá có trạng thái `expired`
   - Giải pháp: Tạo báo giá mới với thời hạn mới

4. **"Không thể tạo hóa đơn"**
   - Nguyên nhân: Lỗi database hoặc dữ liệu không hợp lệ
   - Giải pháp: Kiểm tra kết nối database và thử lại

## Lưu ý quan trọng

1. **Một báo giá chỉ có thể chuyển thành một hóa đơn**
2. **Sau khi chuyển, báo giá sẽ có trạng thái "closed"**
3. **Hóa đơn được tạo với trạng thái "draft" - cần gửi riêng**
4. **Ngày đáo hạn mặc định là 30 ngày từ ngày phát hành**
5. **Tất cả thông tin tài chính được sao chép chính xác**

## Tích hợp với module khác

- **Tab Hóa đơn**: Hóa đơn mới sẽ xuất hiện trong danh sách hóa đơn
- **Báo cáo**: Hóa đơn được tính vào báo cáo doanh thu
- **Khách hàng**: Thông tin khách hàng được giữ nguyên
- **Dự án**: Liên kết dự án được duy trì (nếu có)
