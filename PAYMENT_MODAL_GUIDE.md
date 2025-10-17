# Hướng dẫn sử dụng PaymentModal - Tính năng thanh toán linh hoạt

## Tổng quan
PaymentModal là một tính năng mới cho phép người dùng linh hoạt trong việc thanh toán hóa đơn với các tùy chọn:
- **Toàn bộ**: Thanh toán toàn bộ số tiền còn lại
- **Một nửa**: Thanh toán một nửa số tiền còn lại  
- **Tùy chỉnh**: Nhập số tiền thanh toán theo ý muốn

## Các file đã được tạo/cập nhật

### 1. PaymentModal.tsx (Mới)
- **Vị trí**: `frontend/src/components/sales/PaymentModal.tsx`
- **Chức năng**: Modal thanh toán với các tùy chọn linh hoạt
- **Tính năng**:
  - 3 nút chọn loại thanh toán (Toàn bộ, Một nửa, Tùy chỉnh)
  - Input nhập số tiền tùy chỉnh
  - Chọn phương thức thanh toán
  - Nhập mã tham chiếu
  - Ghi chú
  - Validation số tiền
  - Xử lý lỗi

### 2. InvoicesTab.tsx (Đã cập nhật)
- **Vị trí**: `frontend/src/components/sales/InvoicesTab.tsx`
- **Thay đổi**:
  - Import PaymentModal
  - Thêm state quản lý PaymentModal
  - Thay thế nút thanh toán trực tiếp bằng PaymentModal
  - Thêm các hàm xử lý PaymentModal

## Cách sử dụng

### 1. Truy cập tính năng
1. Vào trang **Bán hàng** → **Hóa đơn**
2. Tìm hóa đơn có trạng thái "Chưa thanh toán" hoặc "Thanh toán một phần"
3. Click vào biểu tượng 💰 (DollarSign) trong cột "Thao tác"

### 2. Sử dụng PaymentModal
1. **Chọn loại thanh toán**:
   - Click "Toàn bộ" để thanh toán hết số tiền còn lại
   - Click "Một nửa" để thanh toán một nửa số tiền còn lại
   - Click "Tùy chỉnh" để nhập số tiền theo ý muốn

2. **Nhập thông tin**:
   - Số tiền thanh toán (tự động điền hoặc nhập thủ công)
   - Phương thức thanh toán (Tiền mặt, Thẻ, Chuyển khoản, v.v.)
   - Mã tham chiếu (tùy chọn)
   - Ghi chú (tùy chọn)

3. **Xác nhận thanh toán**:
   - Click "Ghi nhận thanh toán"
   - Hệ thống sẽ tự động cập nhật trạng thái hóa đơn
   - Tạo bút toán kế toán (nếu có)

## Tính năng chi tiết

### Validation
- Số tiền thanh toán phải > 0
- Số tiền thanh toán không được vượt quá số tiền còn lại
- Hiển thị số tiền tối đa có thể thanh toán

### Phương thức thanh toán
- Tiền mặt
- Thẻ
- Chuyển khoản
- Séc
- Ví điện tử
- Khác

### Xử lý sau thanh toán
- Cập nhật `paid_amount` của hóa đơn
- Cập nhật `payment_status` (paid/partial/pending)
- Cập nhật `status` của hóa đơn
- Tạo bút toán kế toán
- Hiển thị thông báo thành công

## API Endpoint
- **URL**: `PUT /api/sales/invoices/{invoice_id}/payment`
- **Body**:
  ```json
  {
    "payment_amount": 1000000,
    "payment_method": "cash",
    "payment_reference": "REF123456",
    "payment_date": "2024-01-15"
  }
  ```

## Lợi ích

### 1. Linh hoạt trong thanh toán
- Không bị giới hạn chỉ thanh toán toàn bộ
- Có thể thanh toán từng phần theo khả năng
- Dễ dàng quản lý dòng tiền

### 2. Trải nghiệm người dùng tốt
- Giao diện trực quan, dễ sử dụng
- Validation rõ ràng, tránh lỗi
- Thông báo kết quả rõ ràng

### 3. Quản lý kế toán chính xác
- Tự động tạo bút toán kế toán
- Theo dõi lịch sử thanh toán
- Báo cáo chính xác

## Troubleshooting

### Lỗi thường gặp
1. **"Số tiền thanh toán phải lớn hơn 0"**
   - Kiểm tra số tiền nhập vào
   - Đảm bảo không nhập số âm

2. **"Số tiền thanh toán không được vượt quá số tiền còn lại"**
   - Kiểm tra số tiền còn lại của hóa đơn
   - Điều chỉnh số tiền thanh toán

3. **"Có lỗi xảy ra khi ghi nhận thanh toán"**
   - Kiểm tra kết nối mạng
   - Kiểm tra backend có đang chạy không
   - Kiểm tra quyền truy cập

### Kiểm tra hệ thống
1. **Backend đang chạy**: `http://localhost:8000`
2. **API endpoint hoạt động**: `PUT /api/sales/invoices/{id}/payment`
3. **Database kết nối**: Kiểm tra Supabase connection

## Kế hoạch phát triển

### Tính năng có thể thêm
1. **Thanh toán định kỳ**: Tự động thanh toán theo lịch
2. **Ghi nhớ phương thức**: Lưu phương thức thanh toán ưa thích
3. **Tính năng hoàn tiền**: Xử lý hoàn tiền
4. **Báo cáo thanh toán**: Thống kê thanh toán theo thời gian
5. **Tích hợp ví điện tử**: Kết nối với các ví điện tử phổ biến

### Cải thiện UX
1. **Keyboard shortcuts**: Phím tắt cho các thao tác
2. **Auto-save**: Tự động lưu thông tin đang nhập
3. **Bulk payment**: Thanh toán nhiều hóa đơn cùng lúc
4. **Payment templates**: Mẫu thanh toán có sẵn

## Kết luận
PaymentModal đã được tích hợp thành công vào hệ thống, mang lại tính linh hoạt cao trong việc quản lý thanh toán hóa đơn. Tính năng này giúp người dùng dễ dàng xử lý các tình huống thanh toán khác nhau, từ thanh toán toàn bộ đến thanh toán từng phần, đáp ứng nhu cầu thực tế của doanh nghiệp.
