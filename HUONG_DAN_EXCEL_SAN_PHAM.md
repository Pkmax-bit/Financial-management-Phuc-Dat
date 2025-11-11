# 📦 Hướng dẫn Import/Export Excel Sản phẩm

## ✨ Tính năng nâng cấp - Sheet tra cứu nhanh!

Chức năng Excel sản phẩm đã được nâng cấp với:
- ✅ Template với **5 sheets** đầy đủ
- ✅ **Sheet "Tra cứu nhanh"** - Xem loại sản phẩm và đối tượng chi phí ⭐ MỚI!
- ✅ Lấy dữ liệu thực từ database
- ✅ Tự động tạo loại sản phẩm mới khi import
- ✅ Hướng dẫn chi tiết từng bước
- ✅ Authentication required (Admin/Manager/Accountant)

> **⚠️ LƯU Ý QUAN TRỌNG - ĐƠN VỊ ĐO:**
> - **Diện tích:** m² (mét vuông) - số thập phân
> - **Thể tích:** m³ (mét khối) - số thập phân
> - **Chiều cao, chiều dài, chiều sâu:** mm (milimét) - số nguyên
> - Ví dụ: Chiều cao 800 = 800mm = 0.8m

---

## 🚀 Khởi động nhanh

### Bước 1: Khởi động Backend
```bash
cd backend
python -m uvicorn main:app --reload
```

Backend chạy trên: **http://localhost:8000**

### Bước 2: Đăng nhập hệ thống
```bash
# Mở trình duyệt
http://localhost:3000/login

# Đăng nhập với tài khoản có quyền Admin/Manager/Accountant
```

### Bước 3: Truy cập trang sản phẩm
```
http://localhost:3000/products
# Click nút "Import Excel" hoặc "Download Template"
```

---

## 📋 API Endpoints

### 1. Download Template (PROTECTED - Cần đăng nhập)

**Endpoint:**
```
GET /api/product-import/download-template
```

**Headers:**
```
Authorization: Bearer <token>
```

**Response:** File Excel với 5 sheets
1. **Mẫu sản phẩm** - Template với dữ liệu mẫu
2. **Tra cứu nhanh** - ⭐ Loại sản phẩm + Đối tượng chi phí (từ database)
3. **Hướng dẫn các cột** - Giải thích từng cột
4. **Hướng dẫn chi tiết** - Quy trình từng bước

**Test trực tiếp:**
```bash
# Browser (cần đăng nhập trước)
http://localhost:8000/api/product-import/download-template

# PowerShell với token
$token = "your-token-here"
$headers = @{"Authorization" = "Bearer $token"}
Invoke-WebRequest -Uri "http://localhost:8000/api/product-import/download-template" -Headers $headers -OutFile "product_template.xlsx"
```

### 2. Preview Excel (PROTECTED - Xem trước trước khi import)

**Endpoint:**
```
POST /api/product-import/preview-excel
```

**Headers:**
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Response:**
```json
{
  "products": [...],
  "total_count": 10,
  "valid_count": 8,
  "error_count": 2
}
```

### 3. Import Excel (PROTECTED - Import sản phẩm)

**Endpoint:**
```
POST /api/product-import/import-excel
```

**Response:**
```json
{
  "message": "Import hoàn thành. Đã import 8/10 sản phẩm",
  "imported_count": 8,
  "total_count": 10,
  "errors": ["Dòng 3: Giá sản phẩm phải lớn hơn 0"],
  "success": true
}
```

---

## 📝 Cấu trúc File Excel

### Sheet 1: "Mẫu sản phẩm"

| Tên * | Giá * | Đơn vị * | Mô tả | Diện tích | Thể tích | Chiều cao | Chiều dài | Chiều sâu | Loại sản phẩm |
|-------|-------|----------|-------|-----------|----------|-----------|-----------|-----------|---------------|
| Bàn gỗ cao cấp | 2500000 | cái | Bàn gỗ sồi tự nhiên | 2.5 | 0.8 | 800 | 1500 | 800 | Nội thất văn phòng |

**Cột bắt buộc (*):**
- Tên sản phẩm (name)
- Giá (price) - Phải > 0, không có dấu phẩy
- Đơn vị (unit) - ví dụ: cái, kg, m, m², bộ, thùng

**Cột tùy chọn:**
- Mô tả (description)
- Diện tích (area) - m²
- Thể tích (volume) - m³
- Chiều cao (height) - mm
- Chiều dài (length) - mm
- Chiều sâu (depth) - mm
- Loại sản phẩm (category_name) - Xem sheet "Tra cứu nhanh"

### Sheet 2: "Tra cứu nhanh" ⭐ MỚI!

**Sheet này chứa thông tin THỰC từ database!**

#### 🏷️ Loại sản phẩm (Product Categories)

| Tên loại sản phẩm | Mô tả |
|-------------------|-------|
| Nội thất văn phòng | Bàn ghế, tủ văn phòng |
| Nội thất phòng khách | Sofa, bàn trà, kệ tivi |
| Nội thất phòng ngủ | Giường, tủ quần áo, bàn trang điểm |
| ... | ... |

#### 💰 Đối tượng chi phí (Expense Objects)

| Tên đối tượng chi phí | Mô tả | Cấp độ |
|-----------------------|-------|--------|
| Vật tư trực tiếp | Chi phí vật tư sử dụng trực tiếp cho sản phẩm | Cấp 1 |
| Nhân công trực tiếp | Chi phí lao động trực tiếp sản xuất | Cấp 1 |
| Chi phí sản xuất chung | Chi phí chung không trực tiếp | Cấp 1 |
| Gỗ nguyên liệu | Gỗ các loại dùng cho sản xuất | Cấp 2 |
| Sơn và vecni | Vật tư hoàn thiện bề mặt | Cấp 2 |
| ... | ... | ... |

**⭐ Ưu điểm:**
- ✅ Dữ liệu THỰC từ database (không phải mẫu cứng)
- ✅ Xem tất cả loại sản phẩm có sẵn
- ✅ Biết các đối tượng chi phí để làm vật tư
- ✅ Không cần đăng nhập vào hệ thống để tra cứu
- ✅ Copy/paste nhanh khi điền form

**📌 Ghi chú:**
1. **Loại sản phẩm**: Chọn từ danh sách trên hoặc nhập tên mới
2. Nếu nhập loại sản phẩm mới, hệ thống sẽ **tự động tạo**
3. **Đối tượng chi phí**: Dùng để phân loại chi phí trong báo cáo và làm vật tư sản phẩm
4. **Cấp độ**: Cấp 1 = cha, Cấp 2 = con, Cấp 3 = con con...

---

## 🎯 Workflow hoàn chỉnh

```
1. Đăng nhập vào hệ thống
   ↓
2. Truy cập trang sản phẩm
   ↓
3. Download template Excel
   ↓
4. Mở file Excel
   ↓
5. Xem sheet "Tra cứu nhanh"
   - Xem loại sản phẩm có sẵn
   - Xem đối tượng chi phí
   ↓
6. Xem sheet "Hướng dẫn các cột"
   - Hiểu ý nghĩa từng cột
   ↓
7. Điền thông tin vào sheet "Mẫu sản phẩm"
   - Xóa dòng ví dụ
   - Nhập sản phẩm của bạn
   - Chọn loại sản phẩm từ sheet "Tra cứu nhanh"
   ↓
8. Lưu file
   ↓
9. Preview trước khi import (tùy chọn)
   ↓
10. Upload và import
   ↓
11. Kiểm tra kết quả
   - Xem danh sách sản phẩm mới
   - Xử lý lỗi nếu có
```

---

## 🔧 Cách lấy Token

### Cách 1: Từ localStorage (F12)
```javascript
// Mở Console (F12) trong trình duyệt
localStorage.getItem('token')

// Copy token và dùng trong API calls
```

### Cách 2: Đăng nhập trong Frontend
```
1. Mở http://localhost:3000/login
2. Đăng nhập với tài khoản Admin/Manager/Accountant
3. Token tự động lưu trong localStorage
4. Sử dụng tính năng import trong UI
```

---

## 📂 Cấu trúc Code

```
backend/
  └── routers/
      └── product_import.py           ← Router chính
          ├── download_template()     ← Download template với lookup data
          ├── preview_excel()         ← Preview trước khi import
          └── import_excel()          ← Import sản phẩm vào database

frontend/
  └── src/
      └── components/
          └── products/
              └── ProductImport.tsx   ← Component import Excel

HUONG_DAN_EXCEL_SAN_PHAM.md          ← File này
```

---

## 🐛 Troubleshooting

### Lỗi: "Not authenticated" hoặc "Unauthorized"

**Nguyên nhân:** 
- Chưa đăng nhập
- Token đã hết hạn
- Không có quyền (phải là Admin/Manager/Accountant)

**Giải pháp:**
1. Đăng xuất và đăng nhập lại
2. Đảm bảo role đúng (không phải employee, worker, customer)
3. Kiểm tra token:
```javascript
// F12 > Console
localStorage.getItem('token')
```

---

### Lỗi: "Thiếu các cột bắt buộc"

**Nguyên nhân:** File Excel không đúng cấu trúc

**Giải pháp:**
1. Download lại file mẫu mới
2. Đảm bảo đang điền vào sheet "Mẫu sản phẩm"
3. Không xóa header row
4. Các cột bắt buộc phải có dữ liệu: name, price, unit

---

### Lỗi: "Giá sản phẩm phải lớn hơn 0"

**Nguyên nhân:** Giá không hợp lệ

**Giải pháp:**
1. Giá phải là số dương
2. Không có dấu phẩy hoặc ký tự đặc biệt
3. Ví dụ đúng: 2500000 (không phải 2,500,000 hoặc 2.500.000)
4. **Kích thước:** Chiều cao/dài/sâu dùng mm (ví dụ: 800 = 800mm)

---

### Lỗi: "Could not read Excel file"

**Nguyên nhân:** File Excel bị lỗi hoặc sai định dạng

**Giải pháp:**
1. Lưu file với định dạng .xlsx (không phải .xls cũ)
2. Mở file bằng Excel và lưu lại
3. Đảm bảo sheet "Mẫu sản phẩm" tồn tại
4. Thử lại với file template mới

---

## ✅ Checklist hoàn chỉnh

### Trước khi import:
- [ ] Backend đang chạy trên http://localhost:8000
- [ ] Đã đăng nhập với quyền Admin/Manager/Accountant
- [ ] Download file template thành công
- [ ] File Excel có 5 sheets
- [ ] Sheet "Tra cứu nhanh" hiển thị loại sản phẩm và đối tượng chi phí
- [ ] Đã xem sheet "Hướng dẫn các cột" để hiểu ý nghĩa các trường

### Khi điền dữ liệu:
- [ ] Điền vào sheet "Mẫu sản phẩm"
- [ ] Xóa dòng ví dụ trước khi nhập dữ liệu thật
- [ ] Tên sản phẩm không để trống
- [ ] Giá là số dương, không có dấu phẩy
- [ ] Đơn vị hợp lệ (cái, kg, m, m²...)
- [ ] Loại sản phẩm chọn từ sheet "Tra cứu nhanh" (hoặc tạo mới)
- [ ] **Diện tích, thể tích:** Số thập phân (m², m³)
- [ ] **Chiều cao, chiều dài, chiều sâu:** Số nguyên (mm - milimét)

### Sau khi import:
- [ ] Xem kết quả import (success/error count)
- [ ] Kiểm tra danh sách sản phẩm trong UI
- [ ] Xử lý các lỗi nếu có
- [ ] Verify sản phẩm được tạo đúng loại

---

## 💡 Tips & Tricks

### 1. Sử dụng Sheet "Tra cứu nhanh" hiệu quả
- Mở sheet này trước khi điền form
- Copy/paste tên loại sản phẩm để tránh typo
- Xem đối tượng chi phí để hiểu cách phân loại vật tư

### 2. Import theo lô
- Nên import từng nhóm sản phẩm cùng loại
- Preview trước để kiểm tra lỗi
- Sửa lỗi và import lại nếu cần

### 3. Tạo loại sản phẩm mới
- Có thể nhập tên loại mới vào cột category_name
- Hệ thống tự động tạo loại mới
- Tên loại nên rõ ràng, dễ hiểu

### 4. Đo lường kích thước
- Diện tích, thể tích, chiều cao... là TÙY CHỌN
- Chỉ điền nếu cần thiết cho sản phẩm
- **Diện tích, thể tích:** Số thập phân (ví dụ: 2.5 không phải 2,5)
- **Chiều cao, chiều dài, chiều sâu:** Số nguyên milimét (ví dụ: 800 = 800mm = 0.8m)

---

## 📞 Support

Nếu vẫn gặp vấn đề:

1. **Check backend logs:** Xem terminal đang chạy backend
2. **Check browser console:** F12 → Console tab
3. **Verify token:** localStorage.getItem('token')
4. **Check file format:** Đảm bảo file .xlsx và có đúng cấu trúc
5. **Read documentation:** File này!

---

## 🎉 Kết luận

Chức năng Excel sản phẩm đã được **nâng cấp** với:
- ✅ Sheet "Tra cứu nhanh" với dữ liệu thực từ database
- ✅ Xem loại sản phẩm và đối tượng chi phí trong một nơi
- ✅ Tự động tạo loại sản phẩm mới khi import
- ✅ Hướng dẫn chi tiết từng bước
- ✅ Preview trước khi import để kiểm tra

**Bạn có thể:**
- Download template với thông tin thực từ database
- Tra cứu loại sản phẩm và đối tượng chi phí dễ dàng
- Import hàng loạt sản phẩm một cách an toàn
- Tạo loại sản phẩm mới tự động

**Happy importing!** 🚀

