# Hướng dẫn Lịch sử Thanh toán

## Lịch sử thanh toán ghi nhận những gì?

Khi thanh toán hóa đơn, hệ thống sẽ tự động ghi lại **lịch sử thanh toán** vào bảng `payments` với các thông tin sau:

### 1. Thông tin cơ bản
- **Số thanh toán** (`payment_number`): Mã số duy nhất cho mỗi lần thanh toán (VD: PAY-20250101-ABC12345)
- **ID thanh toán** (`id`): UUID duy nhất
- **Ngày thanh toán** (`payment_date`): Ngày thực hiện thanh toán

### 2. Thông tin số tiền
- **Số tiền thanh toán** (`amount`): Số tiền đã thanh toán (có thể là một phần hoặc toàn bộ)
- **Loại tiền tệ** (`currency`): Mặc định là VND

### 3. Phương thức thanh toán
- **Phương thức** (`payment_method`): 
  - `cash` - Tiền mặt
  - `bank_transfer` - Chuyển khoản
  - `card` - Thẻ
  - `check` - Séc
  - `digital_wallet` - Ví điện tử
  - `other` - Khác

### 4. Thông tin tham chiếu
- **Mã tham chiếu** (`reference_number`): Mã giao dịch, số tham chiếu (VD: REF123456, số giao dịch ngân hàng)
- **Ghi chú** (`notes`): Ghi chú về thanh toán (tùy chọn)

### 5. Liên kết với hóa đơn và khách hàng
- **ID Hóa đơn** (`invoice_id`): Liên kết với hóa đơn được thanh toán
- **ID Khách hàng** (`customer_id`): Khách hàng thực hiện thanh toán

### 6. Trạng thái và người xử lý
- **Trạng thái** (`status`): 
  - `completed` - Đã hoàn thành (mặc định khi ghi nhận)
  - `pending` - Đang chờ
  - `failed` - Thất bại
  - `cancelled` - Đã hủy
  - `refunded` - Đã hoàn tiền
- **Người tạo** (`created_by`): User ID của người ghi nhận thanh toán
- **Người xử lý** (`processed_by`): User ID của người xử lý thanh toán
- **Thời gian xử lý** (`processed_at`): Timestamp khi thanh toán được xử lý

### 7. Timestamps
- **Ngày tạo** (`created_at`): Thời gian tạo record
- **Ngày cập nhật** (`updated_at`): Thời gian cập nhật lần cuối

## Khi nào lịch sử thanh toán được ghi lại?

Lịch sử thanh toán được **tự động ghi lại** khi:

1. **Ghi nhận thanh toán qua PaymentModal**:
   - User click "Ghi nhận thanh toán" trên hóa đơn
   - Nhập số tiền, chọn phương thức thanh toán
   - Hệ thống tự động tạo record trong bảng `payments`

2. **Ghi nhận thanh toán qua API**:
   - Gọi API `PUT /api/sales/invoices/{invoice_id}/payment`
   - Backend tự động tạo payment record

## Các trường hợp thanh toán

### 1. Thanh toán toàn bộ
- Số tiền = Số tiền còn lại của hóa đơn
- Trạng thái hóa đơn → `paid`
- Payment status → `completed`

### 2. Thanh toán một phần
- Số tiền < Số tiền còn lại của hóa đơn
- Trạng thái hóa đơn → `partial`
- Payment status → `completed`
- Có thể thanh toán nhiều lần cho cùng một hóa đơn

### 3. Thanh toán tùy chỉnh
- User nhập số tiền bất kỳ (không vượt quá số tiền còn lại)
- Hệ thống tự động tính toán và cập nhật trạng thái

## Xem lịch sử thanh toán ở đâu?

### 1. Trong Sales Center > Phương thức thanh toán
- Xem tất cả dự án với trạng thái thanh toán
- Click "Xem chi tiết" để xem:
  - Lịch sử thanh toán của dự án
  - Danh sách hóa đơn

### 2. Trong tab Payments (nếu có)
- Xem tất cả các thanh toán đã ghi nhận
- Lọc theo trạng thái, phương thức, khách hàng

### 3. Trong chi tiết hóa đơn
- Xem các lần thanh toán của hóa đơn cụ thể

## Lưu ý quan trọng

1. **Mỗi lần thanh toán tạo 1 record mới**: Nếu thanh toán nhiều lần cho cùng một hóa đơn, mỗi lần sẽ tạo một record riêng trong bảng `payments`

2. **Không thể xóa lịch sử**: Lịch sử thanh toán là dữ liệu quan trọng, không nên xóa. Nếu cần hủy, nên tạo record mới với status = `cancelled` hoặc `refunded`

3. **Tự động cập nhật hóa đơn**: Khi ghi nhận thanh toán, hệ thống tự động:
   - Cập nhật `paid_amount` của hóa đơn
   - Cập nhật `payment_status` (paid/partial/pending)
   - Cập nhật `status` của hóa đơn

4. **Tự động tạo bút toán kế toán**: Nếu có cấu hình journal service, hệ thống sẽ tự động tạo bút toán kế toán cho mỗi thanh toán

## Ví dụ

### Thanh toán lần 1:
```
Hóa đơn: INV-001
Tổng tiền: 10,000,000 VND
Thanh toán: 5,000,000 VND (Chuyển khoản)
Mã tham chiếu: REF123456
→ Tạo payment record với amount = 5,000,000
→ Hóa đơn: paid_amount = 5,000,000, payment_status = partial
```

### Thanh toán lần 2:
```
Hóa đơn: INV-001
Còn lại: 5,000,000 VND
Thanh toán: 5,000,000 VND (Tiền mặt)
→ Tạo payment record mới với amount = 5,000,000
→ Hóa đơn: paid_amount = 10,000,000, payment_status = paid
```

## Kiểm tra lịch sử thanh toán

Để kiểm tra xem lịch sử thanh toán có được ghi lại đúng không:

```sql
-- Xem tất cả thanh toán
SELECT 
    payment_number,
    invoice_id,
    amount,
    payment_method,
    payment_date,
    reference_number,
    status,
    created_at
FROM payments
ORDER BY created_at DESC;

-- Xem thanh toán của một hóa đơn cụ thể
SELECT *
FROM payments
WHERE invoice_id = 'your-invoice-id'
ORDER BY payment_date DESC;
```

