# Hướng Dẫn Chi Tiết Tất Cả Các Tour

Tài liệu này cung cấp hướng dẫn chi tiết từng bước, từng trường thông tin cho tất cả các tour đã được tạo trong hệ thống.

---

## Mục Lục

1. [Hướng dẫn tạo khách hàng](#1-hướng-dẫn-tạo-khách-hàng)
2. [Hướng dẫn tạo dự án](#2-hướng-dẫn-tạo-dự-án)
3. [Hướng dẫn tạo báo giá](#3-hướng-dẫn-tạo-báo-giá)
4. [Hướng dẫn tạo hóa đơn](#4-hướng-dẫn-tạo-hóa-đơn)
5. [Hướng dẫn tạo, sửa và gửi email báo giá](#5-hướng-dẫn-tạo-sửa-và-gửi-email-báo-giá)
6. [Hướng dẫn duyệt báo giá thành hóa đơn](#6-hướng-dẫn-duyệt-báo-giá-thành-hóa-đơn)
7. [Hướng dẫn tạo sản phẩm](#7-hướng-dẫn-tạo-sản-phẩm)
8. [Hướng dẫn tạo quy tắc điều chỉnh vật tư](#8-hướng-dẫn-tạo-quy-tắc-điều-chỉnh-vật-tư)
9. [Hướng dẫn tạo chi phí kế hoạch](#9-hướng-dẫn-tạo-chi-phí-kế-hoạch)
10. [Hướng dẫn tạo chi phí thực tế](#10-hướng-dẫn-tạo-chi-phí-thực-tế)
11. [Hướng dẫn duyệt chi phí kế hoạch thành chi phí thực tế](#11-hướng-dẫn-duyệt-chi-phí-kế-hoạch-thành-chi-phí-thực-tế)

---

## 1. Hướng Dẫn Tạo Khách Hàng

### Vị trí: Trang Quản Lý Khách Hàng (`/customers`)

### Cách bắt đầu:
- Tour tự động chạy khi lần đầu vào trang khách hàng
- Hoặc nhấn nút "Hướng dẫn" trong form tạo khách hàng

### Các bước chi tiết:

#### **Bước 1: Giới thiệu**
- **Mô tả**: Form này gồm 3 phần chính: Thông tin cơ bản, Thông tin tài chính và Thông tin bổ sung.
- **Vị trí**: Modal tạo khách hàng

#### **Bước 2: Thông tin cơ bản**
- **Các trường cần điền**:
  - **Mã khách hàng** (tự động tạo): Hệ thống tự động tạo mã khách hàng theo định dạng
  - **Loại khách hàng** (bắt buộc *): Chọn từ dropdown (Cá nhân, Doanh nghiệp, ...)
  - **Tên/Công ty** (bắt buộc *): Nhập tên khách hàng hoặc tên công ty
  - **Email**: Địa chỉ email liên hệ
  - **Điện thoại**: Số điện thoại liên hệ
  - **Địa chỉ**: Địa chỉ đầy đủ
  - **Mã số thuế**: Mã số thuế (nếu là doanh nghiệp)
- **Lưu ý**: Các trường có dấu * là bắt buộc

#### **Bước 3: Thông tin tài chính**
- **Các trường cần điền**:
  - **Hạn mức tín dụng (VND)**: Số tiền tối đa khách hàng có thể nợ
  - **Điều khoản thanh toán (số ngày)**: Số ngày được phép thanh toán sau khi nhận hóa đơn
- **Lưu ý**: Đây là thông tin quan trọng để quản lý công nợ

#### **Bước 4: Thông tin bổ sung**
- **Các trường cần điền**:
  - **Ghi chú**: Thêm ghi chú hoặc thông tin bổ sung về khách hàng
- **Lưu ý**: Phần này không bắt buộc nhưng có thể hữu ích cho việc quản lý sau này

#### **Bước 5: Hoàn tất**
- **Hành động**: Nhấn nút "Tạo khách hàng" để lưu
- **Kết quả**: Khách hàng mới sẽ xuất hiện trong danh sách ngay sau đó

---

## 2. Hướng Dẫn Tạo Dự Án

### Vị trí: Trang Quản Lý Dự Án (`/projects`)

### Cách bắt đầu:
- Tour tự động chạy khi lần đầu vào trang dự án
- Hoặc nhấn nút "Hướng dẫn" ở header trang

### Các bước chi tiết:

#### **Bước 1: Trung tâm Dự Án**
- **Mô tả**: Trang này giúp bạn quản lý tiến độ dự án, theo dõi số liệu và mở nhanh công cụ lập kế hoạch.
- **Vị trí**: Header trang dự án

#### **Bước 2: Hướng dẫn từng bước**
- **Mô tả**: Bạn có thể mở lại tour hướng dẫn bất cứ lúc nào bằng nút này.
- **Vị trí**: Nút "Hướng dẫn" ở header

#### **Bước 3: Số liệu tổng quan**
- **Mô tả**: Các thẻ chỉ số giúp bạn nắm tình trạng dự án trước khi tạo mới hoặc cập nhật.
- **Các chỉ số hiển thị**:
  - Tổng số dự án
  - Dự án đang hoạt động
  - Dự án đã hoàn thành
  - Dự án đang lập kế hoạch

#### **Bước 4: Tạo dự án mới**
- **Hành động**: Nhấn nút "Tạo dự án" để mở form
- **Vị trí**: Nút ở header hoặc trong danh sách

#### **Bước 5: Điền thông tin dự án**
- **Các trường cần điền**:
  - **Mã dự án**: Tự động tạo hoặc nhập thủ công
  - **Tên dự án** (bắt buộc *): Tên dự án
  - **Khách hàng** (bắt buộc *): Chọn khách hàng từ danh sách
  - **Đội ngũ**: Chọn nhân viên tham gia dự án
  - **Ngân sách**: Ngân sách dự án (VND)
  - **Trạng thái**: Chọn trạng thái (Lập kế hoạch, Đang hoạt động, ...)
  - **Tiến độ (%)**: Tiến độ hoàn thành dự án (0-100%)
  - **Ngày bắt đầu**: Ngày bắt đầu dự án
  - **Ngày kết thúc dự kiến**: Ngày dự kiến hoàn thành
  - **Mô tả**: Mô tả chi tiết về dự án

#### **Bước 6: Danh sách dự án**
- **Mô tả**: Sau khi lưu, dự án mới sẽ xuất hiện tại đây. Bạn có thể mở chi tiết, cập nhật tiến độ hoặc phân công đội ngũ.
- **Các thao tác có thể thực hiện**:
  - Xem chi tiết dự án
  - Cập nhật tiến độ
  - Phân công đội ngũ
  - Xóa dự án

---

## 3. Hướng Dẫn Tạo Báo Giá

### Vị trí: Trang Bán Hàng > Tab Báo Giá (`/sales`)

### Cách bắt đầu:
- Tour tự động chạy khi lần đầu mở form tạo báo giá
- Hoặc nhấn nút "Hướng dẫn" ở header form

### Các bước chi tiết:

#### **Bước 1: Giới thiệu**
- **Mô tả**: Form này giúp bạn tạo báo giá với tính năng tự động tính diện tích và điều chỉnh vật tư khi thay đổi kích thước sản phẩm.
- **Vị trí**: Header form tạo báo giá

#### **Bước 2: Thông tin cơ bản**
- **Các trường cần điền**:
  - **Số báo giá**: Nhập số báo giá (có thể tự động tạo)
  - **Khách hàng** (bắt buộc *): Chọn khách hàng từ danh sách
  - **Dự án** (tùy chọn): Chọn dự án liên quan (tự động tải khi chọn khách hàng)
  - **Ngày phát hành**: Ngày phát hành báo giá
  - **Ngày hết hạn**: Ngày hết hạn báo giá
  - **Ghi chú**: Ghi chú bổ sung
- **Lưu ý**: Hệ thống sẽ tự động tải danh sách dự án khi bạn chọn khách hàng

#### **Bước 3: Thêm sản phẩm**
- **Các cách thêm sản phẩm**:
  1. **Chọn từ danh sách**: Nhấn "Chọn từ danh sách" để chọn sản phẩm có sẵn
  2. **Thêm sản phẩm tự do**: Nhấn "Thêm sản phẩm tự do" để nhập thủ công
- **Thông tin sản phẩm cần điền**:
  - **Tên sản phẩm**: Tên sản phẩm
  - **Mô tả**: Mô tả chi tiết
  - **Số lượng**: Số lượng sản phẩm
  - **Đơn vị**: Đơn vị tính (cái, bộ, m², ...)
  - **Đơn giá**: Giá bán một đơn vị
  - **Thành tiền**: Tự động tính = Đơn giá × Số lượng × Diện tích
- **Lưu ý**: Bạn có thể thêm nhiều sản phẩm vào báo giá

#### **Bước 4: Nhập kích thước và diện tích**
- **Các trường cần điền**:
  - **Chiều dài (mm)**: Nhập chiều dài sản phẩm (đơn vị: mm)
  - **Chiều cao (mm)**: Nhập chiều cao sản phẩm (đơn vị: mm)
  - **Diện tích (m²)**: Tự động tính = (Chiều dài × Chiều cao) / 1,000,000
  - **Thể tích (m³)**: Tự động tính nếu có chiều sâu
  - **Chiều sâu (mm)**: Nhập chiều sâu (nếu cần)
- **Lưu ý**: 
  - Bạn có thể nhập trực tiếp diện tích nếu đã biết
  - Hệ thống tự động tính diện tích khi nhập chiều dài và chiều cao

#### **Bước 5: Quy tắc khi tăng diện tích**
- **Mô tả**: Khi bạn tăng diện tích sản phẩm, hệ thống sẽ tự động áp dụng quy tắc điều chỉnh vật tư
- **Cách hoạt động**:
  - Nếu diện tích tăng → số lượng vật tư có thể tăng hoặc giảm tùy theo quy tắc đã thiết lập
  - Quy tắc được áp dụng dựa trên phần trăm thay đổi hoặc giá trị tuyệt đối
  - Bạn có thể xem và quản lý các quy tắc trong mục "Quy tắc điều chỉnh vật tư"
- **Hành động**: Nhấn nút "Áp dụng điều chỉnh" để cập nhật số lượng vật tư ngay lập tức

#### **Bước 6: Tổng tiền và lưu**
- **Thông tin hiển thị**:
  - **Tổng tiền**: Tự động tính dựa trên đơn giá và diện tích
  - **Thuế VAT**: Tự động tính (nếu có)
  - **Tổng cộng**: Tổng tiền sau thuế
- **Các nút hành động**:
  - **Lưu nháp**: Lưu báo giá ở trạng thái nháp (có thể chỉnh sửa sau)
  - **Gửi ngay**: Lưu và gửi báo giá cho khách hàng ngay lập tức
- **Lưu ý**: Sau khi kiểm tra, nhấn "Lưu nháp" để lưu hoặc "Gửi ngay" để gửi báo giá cho khách hàng

---

## 4. Hướng Dẫn Tạo Hóa Đơn

### Vị trí: Trang Bán Hàng > Tab Hóa Đơn (`/sales`)

### Cách bắt đầu:
- Tour tự động chạy khi lần đầu mở form tạo hóa đơn
- Hoặc nhấn nút "Hướng dẫn" ở header form

### Các bước chi tiết:

#### **Bước 1: Giới thiệu**
- **Mô tả**: Form này giúp bạn tạo hóa đơn với tính năng tự động tính diện tích và điều chỉnh vật tư khi thay đổi kích thước sản phẩm.
- **Vị trí**: Header form tạo hóa đơn

#### **Bước 2: Thông tin cơ bản**
- **Các trường cần điền**:
  - **Số hóa đơn**: Nhập số hóa đơn (có thể tự động tạo)
  - **Khách hàng** (bắt buộc *): Chọn khách hàng từ danh sách
  - **Dự án** (tùy chọn): Chọn dự án liên quan (tự động tải khi chọn khách hàng)
  - **Loại hóa đơn**: Chọn loại (Tiêu chuẩn, ...)
  - **Ngày phát hành**: Ngày phát hành hóa đơn
  - **Ngày đến hạn**: Ngày đến hạn thanh toán
  - **Ghi chú**: Ghi chú bổ sung
- **Lưu ý**: Hệ thống sẽ tự động tải danh sách dự án khi bạn chọn khách hàng

#### **Bước 3: Thêm sản phẩm**
- **Các cách thêm sản phẩm**:
  1. **Chọn từ danh sách**: Nhấn "Chọn từ danh sách" để chọn sản phẩm có sẵn
  2. **Thêm sản phẩm tự do**: Nhấn "Thêm sản phẩm tự do" để nhập thủ công
- **Thông tin sản phẩm cần điền**:
  - **Tên sản phẩm**: Tên sản phẩm
  - **Mô tả**: Mô tả chi tiết
  - **Số lượng**: Số lượng sản phẩm
  - **Đơn vị**: Đơn vị tính (cái, bộ, m², ...)
  - **Đơn giá**: Giá bán một đơn vị
  - **Thành tiền**: Tự động tính = Đơn giá × Số lượng × Diện tích
- **Lưu ý**: Bạn có thể thêm nhiều sản phẩm vào hóa đơn

#### **Bước 4: Nhập kích thước và diện tích**
- **Các trường cần điền**:
  - **Chiều dài (mm)**: Nhập chiều dài sản phẩm (đơn vị: mm)
  - **Chiều cao (mm)**: Nhập chiều cao sản phẩm (đơn vị: mm)
  - **Diện tích (m²)**: Tự động tính = (Chiều dài × Chiều cao) / 1,000,000
  - **Thể tích (m³)**: Tự động tính nếu có chiều sâu
  - **Chiều sâu (mm)**: Nhập chiều sâu (nếu cần)
- **Lưu ý**: 
  - Bạn có thể nhập trực tiếp diện tích nếu đã biết
  - Hệ thống tự động tính diện tích khi nhập chiều dài và chiều cao

#### **Bước 5: Tổng tiền và lưu**
- **Thông tin hiển thị**:
  - **Tổng tiền**: Tự động tính dựa trên đơn giá và diện tích
  - **Thuế VAT**: Tự động tính (nếu có)
  - **Tổng cộng**: Tổng tiền sau thuế
- **Các nút hành động**:
  - **Lưu nháp**: Lưu hóa đơn ở trạng thái nháp (có thể chỉnh sửa sau)
  - **Gửi ngay**: Lưu và gửi hóa đơn cho khách hàng ngay lập tức
- **Lưu ý**: Sau khi kiểm tra, nhấn "Lưu nháp" để lưu hoặc "Gửi ngay" để gửi hóa đơn cho khách hàng

---

## 5. Hướng Dẫn Tạo, Sửa Và Gửi Email Báo Giá

### Vị trí: Trang Bán Hàng > Tab Báo Giá > Nhấn "Gửi" trên một báo giá

### Cách bắt đầu:
- Tour tự động chạy khi lần đầu mở modal email báo giá
- Hoặc nhấn nút "Hướng dẫn" ở header modal

### Các bước chi tiết:

#### **Bước 1: Giới thiệu**
- **Mô tả**: Form này giúp bạn xem trước, chỉnh sửa và gửi email báo giá cho khách hàng. Bạn có thể tùy chỉnh phương thức thanh toán, ghi chú, thông tin công ty và ngân hàng.
- **Vị trí**: Header modal email

#### **Bước 2: Xem trước email**
- **Mô tả**: Bên trái hiển thị preview email sẽ được gửi cho khách hàng. Preview sẽ tự động cập nhật khi bạn chỉnh sửa các thông tin bên phải.
- **Nội dung preview bao gồm**:
  - Logo công ty
  - Thông tin công ty
  - Thông tin khách hàng
  - Chi tiết báo giá (sản phẩm, số lượng, đơn giá, thành tiền)
  - Phương thức thanh toán
  - Ghi chú
  - Thông tin ngân hàng

#### **Bước 3: Chỉnh sửa phương thức thanh toán**
- **Các thao tác có thể thực hiện**:
  - **Thêm đợt thanh toán**: Nhấn nút "+" để thêm đợt mới
  - **Xóa đợt**: Nhấn nút "X" để xóa đợt
  - **Chỉnh sửa đợt**:
    - **Mô tả**: Mô tả đợt thanh toán (ví dụ: "Cọc đợt 1", "Còn lại")
    - **Số tiền**: Số tiền của đợt (VND)
    - **Đã nhận**: Đánh dấu nếu đã nhận tiền
- **Lưu ý**: Bạn có thể chỉnh sửa các đợt thanh toán, số tiền và đánh dấu đã nhận

#### **Bước 4: Chỉnh sửa ghi chú và thông tin**
- **Các phần có thể chỉnh sửa**:
  1. **Ghi chú mặc định (GHI CHÚ section)**:
     - Danh sách các ghi chú mặc định
     - Có thể bật/tắt từng ghi chú
  2. **Ghi chú bổ sung**:
     - Nhập ghi chú bổ sung (mỗi dòng là một bullet point)
  3. **Thông tin công ty**:
     - **Tên công ty**: Tên công ty
     - **Showroom**: Địa chỉ showroom
     - **Nhà máy**: Địa chỉ nhà máy
     - **Website**: Địa chỉ website
     - **Hotline**: Số điện thoại hotline
     - **Logo**: Upload logo công ty (URL hoặc file)
  4. **Thông tin ngân hàng**:
     - **Tên tài khoản**: Tên chủ tài khoản
     - **Số tài khoản**: Số tài khoản ngân hàng
     - **Ngân hàng**: Tên ngân hàng
     - **Chi nhánh**: Chi nhánh ngân hàng
  5. **Đính kèm file** (nếu cần):
     - Upload file đính kèm (PDF, Word, Excel, ...)

#### **Bước 5: Lưu chỉnh sửa**
- **Hành động**: Nhấn "Lưu chỉnh sửa" để lưu các thay đổi vào bản nháp
- **Lưu ý**: Bạn có thể quay lại chỉnh sửa sau

#### **Bước 6: Gửi email**
- **Hành động**: Sau khi kiểm tra preview và chỉnh sửa xong, nhấn "Gửi email" để gửi email báo giá cho khách hàng
- **Kết quả**: 
  - Email sẽ được gửi đến địa chỉ email của khách hàng đã đăng ký
  - Trạng thái báo giá sẽ được cập nhật thành "Đã gửi"
  - Thông báo xác nhận sẽ hiển thị

---

## 6. Hướng Dẫn Duyệt Báo Giá Thành Hóa Đơn

### Vị trí: Trang Bán Hàng > Tab Báo Giá (`/sales`)

### Cách bắt đầu:
- Tour tự động chạy khi có báo giá có trạng thái "Đã chấp nhận", "Đã gửi" hoặc "Đã xem"
- Hoặc nhấn nút "Hướng dẫn chuyển đổi" ở header tab báo giá

### Các bước chi tiết:

#### **Bước 1: Giới thiệu**
- **Mô tả**: Sau khi khách hàng chấp nhận báo giá, bạn có thể chuyển báo giá đó thành hóa đơn để tiến hành thanh toán.
- **Vị trí**: Header danh sách báo giá

#### **Bước 2: Nút chuyển thành hóa đơn** (nếu có báo giá đã chấp nhận)
- **Mô tả**: Khi báo giá có trạng thái "Đã chấp nhận", "Đã gửi" hoặc "Đã xem", bạn sẽ thấy nút "Chuyển thành hóa đơn" (biểu tượng $). Nhấn vào nút này để tạo hóa đơn từ báo giá.
- **Vị trí**: Cột hành động của báo giá trong danh sách
- **Lưu ý**: Chỉ báo giá có trạng thái phù hợp mới có nút này

#### **Bước 3: Quy trình chuyển đổi**
- **Mô tả**: Khi nhấn "Chuyển thành hóa đơn", hệ thống sẽ tự động:
  1. **Tạo hóa đơn mới**: Tạo hóa đơn mới với số hóa đơn tự động
  2. **Sao chép sản phẩm**: Tất cả sản phẩm và vật tư từ báo giá sẽ được sao chép sang hóa đơn
  3. **Cập nhật trạng thái**: Trạng thái báo giá sẽ được cập nhật thành "Đã đóng"
  4. **Hiển thị kết quả**: Bạn có thể xem hóa đơn mới trong tab "Hóa đơn"
- **Thông tin được sao chép**:
  - Thông tin khách hàng
  - Thông tin dự án
  - Tất cả sản phẩm và vật tư
  - Số tiền và thuế
  - Ghi chú

---

## 7. Hướng Dẫn Tạo Sản Phẩm

### Vị trí: Trang Bán Hàng > Tab Sản Phẩm (`/sales`)

### Cách bắt đầu:
- Tour tự động chạy khi lần đầu mở form tạo sản phẩm
- Hoặc nhấn nút "Hướng dẫn" ở header form

### Các bước chi tiết:

#### **Bước 1: Giới thiệu**
- **Mô tả**: Form này giúp bạn tạo sản phẩm mới với đầy đủ thông tin: loại sản phẩm, tên, giá, kích thước và vật tư cấu thành.
- **Vị trí**: Header form tạo sản phẩm

#### **Bước 2: Thông tin cơ bản**
- **Các trường cần điền**:
  - **Loại sản phẩm** (bắt buộc *): Chọn loại sản phẩm từ danh sách
  - **Tên sản phẩm** (bắt buộc *): Nhập tên sản phẩm
  - **Đơn giá**: Nhập giá bán của sản phẩm (VND)
  - **Đơn vị**: Đơn vị tính (cái, bộ, m², ...)
  - **Mô tả**: Mô tả chi tiết về sản phẩm
- **Lưu ý**: 
  - Thành tiền = Đơn giá × Diện tích (tự động tính khi nhập kích thước)
  - Ít nhất phải điền Loại sản phẩm và Tên sản phẩm

#### **Bước 3: Kích thước sản phẩm**
- **Các trường cần điền** (tùy chọn):
  - **Diện tích (m²)**: Tự động tính từ Chiều cao × Dài
  - **Thể tích (m³)**: Tự động tính từ Chiều cao × Dài × Sâu
  - **Chiều cao (mm)**: Nhập chiều cao sản phẩm
  - **Dài (mm)**: Nhập chiều dài sản phẩm
  - **Sâu (mm)**: Nhập chiều sâu sản phẩm (nếu cần)
- **Lưu ý**: 
  - Hệ thống tự động tính diện tích và thể tích khi bạn nhập các kích thước
  - Có thể để trống nếu sản phẩm không có kích thước

#### **Bước 4: Vật tư (đối tượng chi phí)**
- **Các thao tác**:
  - **Chọn đối tượng chi phí**: Chọn đối tượng chi phí cấp 3 từ danh sách
  - **Nhập thông tin vật tư**:
    - **Đơn vị**: Đơn vị tính của vật tư
    - **Đơn giá**: Giá một đơn vị vật tư
    - **Số lượng**: Số lượng vật tư cần cho sản phẩm
  - **Thêm dòng**: Nhấn "Thêm dòng" để thêm vật tư khác
  - **Xóa dòng**: Nhấn "Xóa" để xóa vật tư không cần thiết
- **Lưu ý**: 
  - Thành tiền = Đơn giá × Số lượng (tự động tính)
  - Phần này là tùy chọn, nhưng nên điền để quản lý chi phí tốt hơn

#### **Bước 5: Tạo sản phẩm**
- **Hành động**: Sau khi điền đầy đủ thông tin (ít nhất Loại sản phẩm và Tên sản phẩm), nhấn "Tạo sản phẩm" để lưu
- **Kết quả**: 
  - Sản phẩm sẽ được thêm vào danh sách
  - Có thể sử dụng khi tạo báo giá hoặc hóa đơn

---

## 8. Hướng Dẫn Tạo Quy Tắc Điều Chỉnh Vật Tư

### Vị trí: Trang Bán Hàng > Tab Quy Tắc Điều Chỉnh Vật Tư (`/sales`)

### Cách bắt đầu:
- Tour tự động chạy khi lần đầu vào trang quy tắc
- Hoặc nhấn nút "Hướng dẫn tạo quy tắc" ở header

### Các bước chi tiết:

#### **Bước 1: Giới thiệu**
- **Mô tả**: Quy tắc điều chỉnh vật tư giúp tự động điều chỉnh số lượng/giá vật tư khi kích thước sản phẩm thay đổi. Ví dụ: Khi diện tích tăng 10%, vật tư A tăng 5%.
- **Vị trí**: Header trang quy tắc

#### **Bước 2: Thêm quy tắc mới**
- **Hành động**: Nhấn nút "Thêm quy tắc" để tạo quy tắc mới
- **Kết quả**: Một dòng mới sẽ xuất hiện ở đầu bảng để bạn điền thông tin

#### **Bước 3: Thông tin cơ bản**
- **Các trường cần điền**:
  - **Vật tư** (bắt buộc *): Chọn vật tư sẽ được điều chỉnh (đối tượng chi phí cấp 3)
  - **Loại sản phẩm** (tùy chọn): Chọn loại sản phẩm áp dụng (để trống = áp dụng cho tất cả)
  - **Kích thước** (bắt buộc *): Chọn loại kích thước theo dõi:
    - Diện tích (m²)
    - Thể tích (m³)
    - Chiều cao (mm)
    - Dài (mm)
    - Sâu (mm)
    - Số lượng

#### **Bước 4: Cài đặt thay đổi**
- **Các trường cần điền**:
  - **Loại thay đổi** (bắt buộc *): 
    - **Phần trăm (%)**: Điều chỉnh theo phần trăm thay đổi
    - **Tuyệt đối**: Điều chỉnh theo giá trị tuyệt đối
  - **Ngưỡng** (bắt buộc *): Giá trị ngưỡng để kích hoạt quy tắc
    - Ví dụ: 10 = 10% (nếu loại là Phần trăm) hoặc 5m² (nếu loại là Tuyệt đối)
  - **Chiều thay đổi** (bắt buộc *):
    - **Tăng**: Chỉ áp dụng khi kích thước tăng
    - **Giảm**: Chỉ áp dụng khi kích thước giảm
    - **Cả hai**: Áp dụng cho cả tăng và giảm

#### **Bước 5: Cài đặt điều chỉnh**
- **Các trường cần điền**:
  - **Cách điều chỉnh** (bắt buộc *):
    - **Phần trăm**: Áp dụng % vào số lượng vật tư
    - **Tuyệt đối**: Cộng/trừ trực tiếp vào số lượng
  - **Giá trị điều chỉnh** (bắt buộc *): Giá trị áp dụng (có thể âm để giảm)
    - Ví dụ: 5 = tăng 5% (nếu cách là Phần trăm) hoặc +5 (nếu cách là Tuyệt đối)
  - **Tối đa điều chỉnh (%)** (tùy chọn): Giới hạn tối đa cho điều chỉnh phần trăm
  - **Tối đa điều chỉnh (abs)** (tùy chọn): Giới hạn tối đa cho điều chỉnh tuyệt đối

#### **Bước 6: Thông tin bổ sung**
- **Các trường cần điền**:
  - **Ưu tiên** (tùy chọn): Số nhỏ hơn = ưu tiên cao hơn (khi có nhiều quy tắc)
  - **Tên** (tùy chọn): Tên quy tắc (để dễ nhận biết)
  - **Mô tả** (tùy chọn): Mô tả chi tiết quy tắc
  - **Kích hoạt** (bắt buộc *): Bật/tắt quy tắc (checkbox)

#### **Bước 7: Lưu quy tắc**
- **Hành động**: 
  - Nhấn nút "Lưu" (✓) để lưu quy tắc
  - Nhấn "Xóa" (🗑️) để xóa quy tắc không cần thiết
- **Kết quả**: 
  - Quy tắc sẽ tự động áp dụng khi tạo báo giá nếu điều kiện được thỏa mãn
  - Quy tắc được lưu vào database và có thể chỉnh sửa sau

---

## 9. Hướng Dẫn Tạo Chi Phí Kế Hoạch

### Vị trí: Trang Chi Phí > Tab Chi Phí Dự Án > Nhấn "Thêm chi phí kế hoạch"

### Cách bắt đầu:
- Tour tự động chạy khi lần đầu mở form tạo chi phí kế hoạch
- Hoặc nhấn nút "Hướng dẫn" ở header form

### Các bước chi tiết:

#### **Bước 1: Giới thiệu**
- **Mô tả**: Chi phí kế hoạch là chi phí dự kiến cho dự án, giúp bạn lập kế hoạch và theo dõi ngân sách. Form này cho phép bạn tạo chi phí kế hoạch với đầy đủ thông tin về dự án, đối tượng chi phí và số tiền.
- **Vị trí**: Header form tạo chi phí kế hoạch

#### **Bước 2: Thông tin cơ bản**
- **Các trường cần điền**:
  - **Dự án** (bắt buộc *): Chọn dự án từ danh sách
  - **Nhân viên**: Tự động điền nhân viên đang đăng nhập
  - **Chi phí cha** (tùy chọn): Chọn chi phí kế hoạch cha nếu có (để tạo cấu trúc phân cấp)
    - Cấp cha: Chi phí chính (Cấp: 1)
    - Cấp con: Chi phí chi tiết (Cấp: 2+)
  - **Loại chi phí**: Kế hoạch (đã tự động chọn, không thể thay đổi)
  - **Ngày chi phí** (bắt buộc *): Chọn ngày phát sinh chi phí
  - **Vai trò**: Tự động điền vai trò của nhân viên
  - **Mô tả** (bắt buộc *): Mô tả chi tiết về chi phí

#### **Bước 3: Đối tượng chi phí**
- **Các thao tác**:
  - **Chọn đối tượng chi phí**: Nhấn vào ô chọn để mở danh sách đối tượng chi phí
  - **Chọn nhiều**: Chọn một hoặc nhiều đối tượng chi phí để phân bổ ngân sách
  - **Tự động tải**: Hệ thống sẽ tự động tải đối tượng chi phí từ báo giá nếu có
- **Lưu ý**: 
  - Bạn có thể chọn đối tượng chi phí cấp 1, 2, hoặc 3
  - Có thể chọn nhiều đối tượng để phân bổ chi phí

#### **Bước 4: Phân bổ số tiền**
- **Các cách phân bổ**:
  1. **Phân bổ theo tỷ lệ phần trăm**: Nhập % cho từng đối tượng chi phí
  2. **Phân bổ theo số tiền cụ thể**: Nhập số tiền trực tiếp cho từng đối tượng
- **Thông tin hiển thị**:
  - Bảng chi tiết hóa đơn với các cột:
    - STT
    - Tên sản phẩm
    - Mô tả
    - Đơn giá
    - Số lượng
    - Đơn vị
    - Thành tiền
    - Các cột đối tượng chi phí (%, Số lượng, Đơn giá, VND)
    - Tổng phân bổ
- **Thao tác**:
  - Nhập số tiền cho từng đối tượng chi phí đã chọn
  - Tổng số tiền sẽ được tự động tính
  - Có thể thêm hóa đơn/đơn hàng từ báo giá nếu có

#### **Bước 5: Lưu chi phí kế hoạch**
- **Hành động**: 
  - Kiểm tra lại các thông tin đã nhập
  - Nhấn nút "Tạo chi phí kế hoạch" để lưu
- **Kết quả**: 
  - Chi phí kế hoạch sẽ được thêm vào dự án
  - Có thể được duyệt sau để chuyển thành chi phí thực tế
  - Bạn có thể xem chi phí kế hoạch trong danh sách chi phí dự án

---

## 10. Hướng Dẫn Tạo Chi Phí Thực Tế

### Vị trí: Trang Chi Phí > Tab Chi Phí Dự Án > Nhấn "Thêm chi phí thực tế"

### Cách bắt đầu:
- Tour tự động chạy khi lần đầu mở form tạo chi phí thực tế
- Hoặc nhấn nút "Hướng dẫn" ở header form

### Các bước chi tiết:

#### **Bước 1: Giới thiệu**
- **Mô tả**: Chi phí thực tế là chi phí đã phát sinh trong quá trình thực hiện dự án. Form này cho phép bạn tạo chi phí thực tế với đầy đủ thông tin về dự án, đối tượng chi phí và số tiền đã chi.
- **Vị trí**: Header form tạo chi phí thực tế

#### **Bước 2: Thông tin cơ bản**
- **Các trường cần điền**:
  - **Dự án** (bắt buộc *): Chọn dự án từ danh sách
  - **Nhân viên**: Tự động điền nhân viên đang đăng nhập
  - **Chi phí cha** (tùy chọn): Chọn chi phí thực tế cha nếu có (để tạo cấu trúc phân cấp)
    - Cấp cha: Chi phí chính (Cấp: 1)
    - Cấp con: Chi phí chi tiết (Cấp: 2+)
  - **Loại chi phí**: Thực tế (đã tự động chọn, không thể thay đổi)
  - **Ngày chi phí** (bắt buộc *): Chọn ngày phát sinh chi phí
  - **Vai trò**: Tự động điền vai trò của nhân viên
  - **Cập nhật chi phí đã có** (tùy chọn): Có thể chọn chi phí thực tế đã có để cập nhật
  - **Mô tả** (bắt buộc *): Mô tả chi tiết về chi phí

#### **Bước 3: Đối tượng chi phí**
- **Các thao tác**:
  - **Chọn đối tượng chi phí**: Nhấn vào ô chọn để mở danh sách đối tượng chi phí
  - **Chọn nhiều**: Chọn một hoặc nhiều đối tượng chi phí để phân bổ chi phí thực tế
  - **Tự động tải**: Hệ thống sẽ tự động tải đối tượng chi phí từ hóa đơn nếu có
- **Lưu ý**: 
  - Bạn có thể chọn đối tượng chi phí cấp 1, 2, hoặc 3
  - Có thể chọn nhiều đối tượng để phân bổ chi phí

#### **Bước 4: Phân bổ số tiền**
- **Các cách phân bổ**:
  1. **Phân bổ theo tỷ lệ phần trăm**: Nhập % cho từng đối tượng chi phí
  2. **Phân bổ theo số tiền cụ thể**: Nhập số tiền trực tiếp cho từng đối tượng
- **Thông tin hiển thị**:
  - Bảng chi tiết hóa đơn với các cột:
    - STT
    - Tên sản phẩm
    - Mô tả
    - Đơn giá
    - Số lượng
    - Đơn vị
    - Thành tiền
    - Các cột đối tượng chi phí (%, Số lượng, Đơn giá, VND)
    - Tổng phân bổ
- **Thao tác**:
  - Nhập số tiền thực tế đã chi cho từng đối tượng chi phí đã chọn
  - Tổng số tiền sẽ được tự động tính
  - Có thể thêm hóa đơn/đơn hàng từ hóa đơn nếu có

#### **Bước 5: Lưu chi phí thực tế**
- **Hành động**: 
  - Kiểm tra lại các thông tin đã nhập
  - Nhấn nút "Tạo chi phí thực tế" để lưu
- **Kết quả**: 
  - Chi phí thực tế sẽ được thêm vào dự án
  - Có thể được duyệt sau
  - Bạn có thể xem chi phí thực tế trong danh sách chi phí dự án

---

## 11. Hướng Dẫn Duyệt Chi Phí Kế Hoạch Thành Chi Phí Thực Tế

### Vị trí: Trang Chi Phí > Tab Chi Phí Dự Án > Tab "Kế hoạch"

### Cách bắt đầu:
- Tour tự động chạy khi có chi phí kế hoạch có trạng thái "Chờ duyệt" (pending)
- Hoặc nhấn nút "Hướng dẫn duyệt" ở header (chỉ hiển thị khi ở tab "Kế hoạch")

### Các bước chi tiết:

#### **Bước 1: Giới thiệu**
- **Mô tả**: Sau khi tạo chi phí kế hoạch, bạn có thể duyệt nó để chuyển thành chi phí thực tế. Khi duyệt, tất cả thông tin từ chi phí kế hoạch sẽ được sao chép sang chi phí thực tế.
- **Vị trí**: Header danh sách chi phí

#### **Bước 2: Nút duyệt chi phí** (nếu có chi phí pending)
- **Mô tả**: Khi chi phí kế hoạch có trạng thái "Chờ duyệt" (pending), bạn sẽ thấy nút duyệt (biểu tượng ✓ màu xanh lá). Nhấn vào nút này để duyệt chi phí kế hoạch thành chi phí thực tế.
- **Vị trí**: Cột hành động của chi phí trong danh sách
- **Lưu ý**: 
  - Chỉ chi phí có trạng thái "pending" mới có nút này
  - Chỉ người dùng có quyền (admin, accountant, manager, Supplier, vận chuyển, nhân công) mới thấy nút này

#### **Bước 3: Quy trình duyệt**
- **Mô tả**: Khi nhấn nút duyệt, hệ thống sẽ tự động:
  1. **Tạo chi phí thực tế mới**: Tạo chi phí thực tế mới từ chi phí kế hoạch
  2. **Sao chép thông tin**: Tất cả thông tin sẽ được sao chép:
     - Dự án
     - Đối tượng chi phí
     - Số tiền
     - Hóa đơn/đơn hàng
     - Ghi chú
  3. **Cập nhật trạng thái**: Trạng thái chi phí kế hoạch sẽ được cập nhật thành "Đã duyệt"
  4. **Hiển thị kết quả**: 
     - Chi phí thực tế sẽ xuất hiện trong tab "Thực tế"
     - Bạn có thể so sánh chi phí kế hoạch và thực tế trong tab "Tất cả"
- **Lưu ý**: 
  - Quá trình này không thể hoàn tác
  - Chi phí kế hoạch vẫn giữ nguyên trong danh sách với trạng thái "Đã duyệt"

---

## Tổng Kết

Tất cả các tour đều có các đặc điểm chung:

1. **Tự động chạy**: Tour tự động chạy khi lần đầu sử dụng tính năng
2. **Nút hướng dẫn**: Có nút "Hướng dẫn" để mở lại tour bất cứ lúc nào
3. **Lưu trạng thái**: Trạng thái hoàn thành tour được lưu trong localStorage
4. **Hủy bỏ**: Có thể bỏ qua tour bất cứ lúc nào
5. **Điều hướng**: Có thể quay lại bước trước hoặc chuyển sang bước tiếp theo

### Lưu ý chung:
- Các trường có dấu * là bắt buộc
- Hệ thống tự động tính toán nhiều giá trị (diện tích, thành tiền, tổng tiền, ...)
- Có thể chỉnh sửa sau khi lưu (tùy theo quyền)
- Tất cả tour đều có cleanup khi component unmount

---

**Ngày tạo**: 2024
**Phiên bản**: 1.0

