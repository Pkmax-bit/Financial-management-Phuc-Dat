# Hướng dẫn Xuất báo cáo PDF và Excel

## 🎯 Tổng quan

Hệ thống báo cáo dự án hỗ trợ xuất báo cáo ra 2 định dạng:
- **PDF** - Báo cáo chuyên nghiệp với format chuẩn, có bảng biểu và thống kê
- **Excel** - Dữ liệu chi tiết với nhiều sheets, dễ phân tích và xử lý

---

## 📄 Xuất PDF

### Đặc điểm:
- Format báo cáo chuẩn, chuyên nghiệp
- Có header, footer, và pagination
- Bảng biểu được định dạng đẹp mắt
- Màu sắc phân biệt rõ ràng
- Sẵn sàng in hoặc chia sẻ

### Cấu trúc báo cáo PDF:

```
┌─────────────────────────────────────────────────┐
│        BÁO CÁO DỰ ÁN CHI TIẾT                  │
│        Ngày xuất: 10/10/2025                    │
├─────────────────────────────────────────────────┤
│                                                 │
│  THÔNG TIN DỰ ÁN                               │
│  Tên dự án: Website ABC                         │
│  Mã dự án: PRJ001                               │
│  Khách hàng: Công ty XYZ                        │
│  Trạng thái: Đang hoạt động                     │
│                                                 │
│  TÓM TẮT TÀI CHÍNH                              │
│  Tổng hóa đơn: 150,000,000 ₫ (2 chưa TT)      │
│  Tổng chi phí: 80,000,000 ₫                    │
│  Lợi nhuận: 70,000,000 ₫ ✓                     │
│  Biên lợi nhuận: 46.7%                          │
│                                                 │
│  CHI TIẾT HÓA ĐƠN                               │
│  ┌────────┬──────────┬──────────┬─────┬───┐    │
│  │ Số HĐ  │ Mô tả    │ Số tiền  │ TT  │...│    │
│  ├────────┼──────────┼──────────┼─────┼───┤    │
│  │ HD001  │ Giai đ1  │ 50M      │ Đã  │...│    │
│  │ HD002  │ Giai đ2  │ 30M      │ Chưa│...│    │
│  └────────┴──────────┴──────────┴─────┴───┘    │
│                                                 │
│  CHI TIẾT CHI PHÍ DỰ ÁN                         │
│  ┌────────┬──────────┬──────────┬─────┬───┐    │
│  │ Mã CP  │ Mô tả    │ Số tiền  │ TT  │...│    │
│  └────────┴──────────┴──────────┴─────┴───┘    │
│                                                 │
├─────────────────────────────────────────────────┤
│     Trang 1/2 - Hệ thống Quản lý Tài chính     │
└─────────────────────────────────────────────────┘
```

### Tính năng:
- ✅ Header với tiêu đề và ngày xuất
- ✅ Thông tin dự án đầy đủ
- ✅ Tóm tắt tài chính với màu sắc
- ✅ Bảng hóa đơn với headers màu xanh
- ✅ Bảng chi phí với headers màu đỏ
- ✅ Footer với số trang và brand
- ✅ Multi-page support
- ✅ In được trực tiếp

### Cách sử dụng:
1. Vào trang chi tiết dự án
2. Click nút **"Xuất PDF"** (màu đỏ)
3. File PDF sẽ tự động download
4. Tên file: `Bao_cao_du_an_[MÃ_DỰ_ÁN]_[TIMESTAMP].pdf`

---

## 📊 Xuất Excel

### Đặc điểm:
- 4 sheets riêng biệt cho từng loại dữ liệu
- Dữ liệu đầy đủ, dễ filter và sort
- Có công thức tính tổng
- Column width tự động
- Dễ import vào các hệ thống khác

### Cấu trúc file Excel:

#### **Sheet 1: Tóm tắt**
```
┌────────────────────────────────────────┐
│ BÁO CÁO DỰ ÁN CHI TIẾT                │
│ Ngày xuất: 10/10/2025                  │
│                                        │
│ THÔNG TIN DỰ ÁN                        │
│ Tên dự án:        Website ABC          │
│ Mã dự án:         PRJ001               │
│ Khách hàng:       Công ty XYZ          │
│ Trạng thái:       Đang hoạt động       │
│                                        │
│ TÓM TẮT TÀI CHÍNH                      │
│ Tổng hóa đơn:              150,000,000 │
│   - Chưa thanh toán:                 2 │
│   - Thanh toán 1 phần:               1 │
│ Tổng chi phí:               80,000,000 │
│ Lợi nhuận:                  70,000,000 │
│ Biên lợi nhuận (%):               46.7 │
│                                        │
│ PHÂN TÍCH                              │
│ Số lượng hóa đơn:                    5 │
│ Số lượng chi phí:                    8 │
└────────────────────────────────────────┘
```

#### **Sheet 2: Hóa đơn**
```
┌─────────┬──────────────┬──────────┬──────────┬────────────┬────────┐
│ DANH SÁCH HÓA ĐƠN                                                  │
├─────────┼──────────────┼──────────┼──────────┼────────────┼────────┤
│ Số HĐ   │ Mô tả        │ Số tiền  │ Trạng thái│ Thanh toán│ Ngày   │
├─────────┼──────────────┼──────────┼──────────┼────────────┼────────┤
│ HD001   │ Giai đoạn 1  │50,000,000│ Đã gửi   │ Đã TT      │1/10/25 │
│ HD002   │ Giai đoạn 2  │30,000,000│ Đã gửi   │ Chưa TT    │5/10/25 │
│ HD003   │ Giai đoạn 3  │70,000,000│ Đã gửi   │ TT 1 phần  │8/10/25 │
├─────────┼──────────────┼──────────┼──────────┼────────────┼────────┤
│         │              │          │          │            │        │
│ TỔNG CỘNG:            │150,000,000│          │            │        │
└─────────┴──────────────┴──────────┴──────────┴────────────┴────────┘
```

#### **Sheet 3: Chi phí**
```
┌─────────┬────────────────────┬──────────┬──────────┬────────┐
│ DANH SÁCH CHI PHÍ DỰ ÁN                                   │
├─────────┼────────────────────┼──────────┼──────────┼────────┤
│ Mã CP   │ Mô tả              │ Số tiền  │ Trạng thái│ Ngày  │
├─────────┼────────────────────┼──────────┼──────────┼────────┤
│ CP001   │ Vật liệu xây dựng  │20,000,000│ Đã duyệt │1/10/25 │
│ CP002   │ Nhân công          │15,000,000│ Đã duyệt │2/10/25 │
│ CP003   │ Thiết bị           │10,000,000│ Đã duyệt │3/10/25 │
├─────────┼────────────────────┼──────────┼──────────┼────────┤
│         │                    │          │          │        │
│ TỔNG CỘNG:                   │80,000,000│          │        │
└─────────┴────────────────────┴──────────┴──────────┴────────┘
```

#### **Sheet 4: Báo giá** (nếu có)
```
┌─────────┬──────────────┬──────────┬──────────┬────────┐
│ DANH SÁCH BÁO GIÁ                                      │
├─────────┼──────────────┼──────────┼──────────┼────────┤
│ Số BG   │ Mô tả        │ Số tiền  │ Trạng thái│ Ngày  │
├─────────┼──────────────┼──────────┼──────────┼────────┤
│ BG001   │ Báo giá ban đầu│90,000,000│Chấp nhận│1/9/25│
└─────────┴──────────────┴──────────┴──────────┴────────┘
```

### Tính năng:
- ✅ 4 sheets độc lập
- ✅ Headers rõ ràng
- ✅ Dữ liệu đầy đủ
- ✅ Tổng cộng tự động
- ✅ Column width tối ưu
- ✅ Dễ filter và phân tích
- ✅ Có thể import vào ERP

### Cách sử dụng:
1. Vào trang chi tiết dự án
2. Click nút **"Xuất Excel"** (màu xanh)
3. File Excel sẽ tự động download
4. Tên file: `Bao_cao_du_an_[MÃ_DỰ_ÁN]_[TIMESTAMP].xlsx`

---

## 🎨 Giao diện Buttons

### Vị trí:
Ở cuối trang chi tiết báo cáo, sau phần tóm tắt

### Design:
```
┌─────────────────────────────────────────────┐
│  [🔴 Xuất PDF]    [🟢 Xuất Excel]           │
│   Màu đỏ          Màu xanh lá               │
└─────────────────────────────────────────────┘
```

### Hover effects:
- PDF button: `bg-red-600 hover:bg-red-700`
- Excel button: `bg-green-600 hover:bg-green-700`

---

## 🔧 Công nghệ sử dụng

### PDF Export:
- **jsPDF** - Thư viện tạo PDF trong browser
- **jsPDF-AutoTable** - Plugin tạo bảng biểu chuyên nghiệp
- Font: Helvetica (tiêu chuẩn)
- Layout: A4 Portrait

### Excel Export:
- **xlsx (SheetJS)** - Thư viện Excel mạnh mẽ nhất
- Format: `.xlsx` (Excel 2007+)
- Multi-sheet support
- Auto column width

---

## 📋 Dữ liệu được xuất

### Trong cả PDF và Excel:
1. **Thông tin dự án**
   - Tên dự án
   - Mã dự án
   - Khách hàng
   - Trạng thái

2. **Tóm tắt tài chính**
   - Tổng hóa đơn
   - Số hóa đơn chưa thanh toán
   - Số hóa đơn thanh toán 1 phần
   - Tổng chi phí
   - Lợi nhuận
   - Biên lợi nhuận

3. **Chi tiết hóa đơn**
   - Số hóa đơn
   - Mô tả
   - Số tiền
   - Trạng thái
   - Trạng thái thanh toán
   - Ngày tạo

4. **Chi tiết chi phí**
   - Mã chi phí
   - Mô tả
   - Số tiền
   - Trạng thái
   - Ngày chi

5. **Báo giá** (nếu có)
   - Số báo giá
   - Mô tả
   - Số tiền
   - Trạng thái
   - Ngày tạo

---

## 🎯 Use Cases

### Trường hợp 1: Báo cáo cho khách hàng
**Dùng: PDF**
- Chuyên nghiệp, dễ đọc
- In ra được đẹp
- Gửi email trực tiếp

### Trường hợp 2: Phân tích nội bộ
**Dùng: Excel**
- Filter, sort dữ liệu
- Tạo pivot tables
- So sánh nhiều dự án

### Trường hợp 3: Lưu trữ hồ sơ
**Dùng: Cả hai**
- PDF cho lưu trữ chính thức
- Excel cho tra cứu nhanh

### Trường hợp 4: Import vào ERP
**Dùng: Excel**
- Format chuẩn
- Dễ mapping fields
- Có thể chỉnh sửa trước khi import

---

## 💡 Tips & Best Practices

### PDF:
1. ✅ Kiểm tra trước khi gửi khách hàng
2. ✅ Lưu file với tên rõ ràng
3. ✅ In thử nếu cần bản cứng
4. ⚠️ Không chỉnh sửa được sau khi xuất

### Excel:
1. ✅ Mở file để verify dữ liệu
2. ✅ Có thể thêm analysis riêng
3. ✅ Backup trước khi chỉnh sửa
4. ✅ Sử dụng cho báo cáo định kỳ

---

## 🔍 Troubleshooting

### Vấn đề: File không download
**Giải pháp:**
- Kiểm tra popup blocker
- Thử browser khác
- Clear cache và thử lại

### Vấn đề: PDF hiển thị lỗi font
**Giải pháp:**
- Dùng PDF reader mới nhất
- Font Helvetica là tiêu chuẩn, luôn có sẵn

### Vấn đề: Excel không mở được
**Giải pháp:**
- Cần Excel 2007 trở lên
- Hoặc dùng Google Sheets
- Hoặc LibreOffice Calc

### Vấn đề: Dữ liệu không đầy đủ
**Giải pháp:**
- Kiểm tra kết nối database
- Reload trang và thử lại
- Kiểm tra console log

---

## 🚀 Tính năng tương lai

- [ ] Tùy chỉnh template PDF
- [ ] Chọn columns để xuất Excel
- [ ] Email báo cáo tự động
- [ ] Lên lịch xuất báo cáo định kỳ
- [ ] Export nhiều dự án cùng lúc
- [ ] Watermark cho PDF
- [ ] Password protect cho files
- [ ] Export ra Google Drive/Dropbox

---

## 📞 Hỗ trợ

Nếu gặp vấn đề khi xuất báo cáo:
1. Kiểm tra console log (F12)
2. Screenshot lỗi
3. Liên hệ team support

---

**Phiên bản:** 1.0.0  
**Ngày tạo:** 10/10/2025  
**Thư viện:**
- jsPDF v2.5.1
- jsPDF-AutoTable v3.8.2
- xlsx v0.18.5

