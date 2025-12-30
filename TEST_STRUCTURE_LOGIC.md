# 🎯 Kịch bản Test Logic Tổ hợp Thuộc tính Sản phẩm

## 📋 Tổng quan
**Mục đích:** Kiểm tra logic tổ hợp thuộc tính mới theo nguyên tắc "thuộc tính 1 (danh mục 1) - thuộc tính 1 (danh mục 2)"

**Ngày test:** [Ngày hiện tại]
**Tester:** [Tên người test]
**Trình duyệt:** Chrome/Firefox/Edge

---

## 🔧 Điều kiện tiên quyết

### 1. Tài khoản đăng nhập
- **Username:** admin_test (hoặc tài khoản admin bất kỳ)
- **Password:** [password của tài khoản admin]

### 2. Data cần có sẵn
- **Danh mục chính:** Loại tủ bếp (có thuộc tính: Tủ bếp trên, tủ bếp dưới)
- **Danh mục thường:**
  - Loại nhôm (có thuộc tính: Nhôm lá ghép lớn, Nhôm lá ghép nhỏ)
  - Loại tay nắm (có thuộc tính: Tay nắm âm, Tay nắm cnc)
  - Loại kính (có thuộc tính: Kính 4 ly)
  - Bộ phận (có thuộc tính: [các thuộc tính bộ phận])

### 3. Truy cập hệ thống
```
URL: http://localhost:3000
Port: 3000 (development server đang chạy)
```

---

## 🧪 Các bước test

### Bước 1: Đăng nhập hệ thống
1. Mở trình duyệt và truy cập `http://localhost:3000`
2. Nhập thông tin đăng nhập:
   - Username: `admin_test`
   - Password: `[password]`
3. Click "Đăng nhập"
4. **Kết quả mong đợi:** Đăng nhập thành công, hiển thị dashboard

### Bước 2: Truy cập trang quản lý cấu trúc
1. Từ menu bên trái, click vào **"Quản lý Sản phẩm"** > **"Quản lý Cấu trúc"**
2. Hoặc truy cập trực tiếp: `http://localhost:3000/sales/structures`
3. **Kết quả mong đợi:** Hiển thị trang "Quản lý Cấu trúc Đặt tên"

### Bước 3: Tạo cấu trúc mới
1. Click nút **"Thêm cấu trúc"** (nút màu xanh có icon +)
2. **Kết quả mong đợi:** Hiển thị form tạo cấu trúc mới

### Bước 4: Cấu hình tên và mô tả
1. **Tên cấu trúc:** `Test Tổ hợp Thuộc tính`
2. **Mô tả cấu trúc:** `Test logic tổ hợp thuộc tính từ nhiều danh mục khác nhau`
3. **Kết quả mong đợi:** Form chấp nhận input

### Bước 5: Chọn danh mục chính
1. Trong phần **"📂 Danh mục chính"**, chọn **"Loại tủ bếp"**
2. **Kết quả mong đợi:**
   - Danh mục được chọn thành công
   - Hiển thị phần "🌿 Danh mục thường"

### Bước 6: Chọn danh mục thường
1. Trong phần **"🌿 Danh mục thường"**, chọn các danh mục sau:
   - ✅ **Loại nhôm**
   - ✅ **Loại tay nắm**
   - ✅ **Loại kính**
   - ✅ **Bộ phận**
2. **Kết quả mong đợi:**
   - Các danh mục được chọn và hiển thị trong "Đã chọn:"
   - Hiển thị phần "🔗 Cấu trúc hoàn chỉnh"

### Bước 7: Kiểm tra cấu trúc danh mục
1. Trong phần **"🔗 Cấu trúc hoàn chỉnh"** > **"Cấu trúc danh mục:"**
2. **Kết quả mong đợi:** Hiển thị
   ```
   Loại tủ bếp - Loại nhôm - Loại tay nắm - Loại kính - Bộ phận
   ```

### Bước 8: Kiểm tra thuộc tính được tổ hợp
1. Trong phần **"Thuộc tính sẽ được tổ hợp:"**
2. **Kết quả mong đợi:**
   - Hiển thị danh sách thuộc tính theo thứ tự
   - Text mô tả: "⭐ Thuộc tính chính | Thuộc tính sẽ được tổ hợp theo từng danh mục"

### Bước 9: Kiểm tra preview tổ hợp
1. Trong phần **"👀 Xem trước cấu trúc"** > **"Tên sản phẩm:"**
2. **Kết quả mong đợi:** Hiển thị các tổ hợp như:
   ```
   Tủ bếp trên - Nhôm lá ghép lớn - Tay nắm âm - Kính 4 ly - [Thuộc tính bộ phận đầu tiên]
   Tủ bếp trên - Nhôm lá ghép lớn - Tay nắm cnc - Kính 4 ly - [Thuộc tính bộ phận đầu tiên]
   Tủ bếp trên - Nhôm lá ghép nhỏ - Tay nắm âm - Kính 4 ly - [Thuộc tính bộ phận đầu tiên]
   ```

### Bước 10: Kiểm tra logic và ví dụ
1. Trong phần mô tả dưới preview
2. **Kết quả mong đợi:**
   - **Logic:** "Tổ hợp thuộc tính từ các danh mục khác nhau"
   - **Ví dụ:** "Thuộc tính 1 (danh mục chính) - Thuộc tính 1 (danh mục thường)"

### Bước 11: Lưu cấu trúc
1. Click nút **"💾 Lưu cấu trúc"**
2. **Kết quả mong đợi:**
   - Cấu trúc được lưu thành công
   - Hiển thị thông báo "Lưu cấu trúc thành công"
   - Quay về danh sách cấu trúc

### Bước 12: Xác minh cấu trúc đã lưu
1. Trong danh sách cấu trúc, tìm cấu trúc **"Test Tổ hợp Thuộc tính"**
2. Click vào cấu trúc để xem chi tiết
3. **Kết quả mong đợi:**
   - Hiển thị đúng thông tin đã cấu hình
   - Preview ví dụ hiển thị đúng logic tổ hợp

---

## ✅ Tiêu chí Pass/Fail

### ✅ **PASS** khi:
- [ ] Đăng nhập thành công
- [ ] Có thể tạo cấu trúc mới
- [ ] Chọn được tất cả danh mục cần thiết
- [ ] Preview hiển thị đúng logic tổ hợp (không phải ghép tất cả thành 1 chuỗi)
- [ ] Mô tả logic đúng: "Tổ hợp thuộc tính từ các danh mục khác nhau"
- [ ] Lưu cấu trúc thành công
- [ ] Cấu trúc xuất hiện trong danh sách

### ❌ **FAIL** khi:
- [ ] Preview vẫn hiển thị logic cũ (ghép tất cả thuộc tính)
- [ ] Text mô tả vẫn là "Tự động tổ hợp tất cả thuộc tính"
- [ ] Không lưu được cấu trúc
- [ ] Có lỗi JavaScript trong console

---

## 🔍 Troubleshooting

### Nếu vẫn thấy logic cũ:
1. **Hard refresh:** `Ctrl + F5`
2. **Clear cache:** `Ctrl + Shift + Delete` > Clear browsing data
3. **Incognito mode:** `Ctrl + Shift + N`

### Nếu có lỗi:
1. Check **Browser Console** (F12 > Console)
2. Check **Network tab** xem có lỗi API không
3. Restart development server nếu cần

---

## 📝 Ghi chú test
- **Thời gian test:** [Ghi thời gian bắt đầu và kết thúc]
- **Kết quả:** [PASS/FAIL]
- **Vấn đề gặp phải:** [Mô tả nếu có]
- **Screenshot:** [Đính kèm nếu cần]

---

## 🎯 Test Case ID
**TC_STRUCTURE_COMBINATION_001** - Test logic tổ hợp thuộc tính từ nhiều danh mục






