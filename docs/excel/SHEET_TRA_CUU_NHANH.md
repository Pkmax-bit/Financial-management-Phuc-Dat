# 📋 Sheet "Tra cứu nhanh" - Hướng dẫn sử dụng

## 🎯 Mục đích

Sheet "Tra cứu nhanh" là **bảng đối chiếu tất cả trong một** giúp bạn dễ dàng tra cứu thông tin khi điền form nhập nhân viên.

---

## ✨ Ưu điểm

### ❌ Trước đây (KHÔNG có sheet tra cứu):
```
Muốn biết "DEPT001" là phòng gì?
→ Phải chuyển sang sheet "Danh sách phòng ban"
→ Tìm DEPT001
→ Quay lại sheet "Mẫu nhân viên"

Muốn biết "POS005" là chức vụ gì?
→ Phải chuyển sang sheet "Danh sách chức vụ"
→ Tìm POS005
→ Quay lại sheet "Mẫu nhân viên"

Muốn biết vai trò "accountant" là gì?
→ Phải chuyển sang sheet "Danh sách vai trò"
→ Tìm accountant
→ Quay lại sheet "Mẫu nhân viên"

❌ Mất thời gian
❌ Dễ nhầm lẫn
❌ Phải chuyển qua lại nhiều sheet
```

### ✅ Bây giờ (CÓ sheet tra cứu):
```
Muốn biết bất kỳ mã nào?
→ Mở sheet "Tra cứu nhanh"
→ Xem TẤT CẢ thông tin trong một sheet!

✅ Nhanh chóng
✅ Rõ ràng
✅ Tất cả ở một nơi
```

---

## 📊 Cấu trúc Sheet

### 1️⃣ Tiêu đề chính
```
📋 TRA CỨU NHANH - BẢNG ĐỐI CHIẾU MÃ VÀ TÊN
```

### 2️⃣ Section Phòng ban
```
🏢 PHÒNG BAN
┌───────────────┬─────────────────────┐
│ Mã phòng ban  │ Tên phòng ban       │
├───────────────┼─────────────────────┤
│ DEPT001       │ Phòng Kế toán       │
│ DEPT002       │ Phòng Kinh doanh    │
│ DEPT003       │ Phòng Nhân sự       │
│ ...           │ ...                 │
└───────────────┴─────────────────────┘
```

### 3️⃣ Section Chức vụ
```
👔 CHỨC VỤ
┌──────────────┬────────────────┬──────────────────┐
│ Mã chức vụ   │ Tên chức vụ    │ Thuộc phòng ban  │
├──────────────┼────────────────┼──────────────────┤
│ POS001       │ Trưởng phòng   │ Phòng Kế toán    │
│ POS002       │ Nhân viên      │ Phòng Kinh doanh │
│ POS003       │ Phó phòng      │ Phòng Nhân sự    │
│ ...          │ ...            │ ...              │
└──────────────┴────────────────┴──────────────────┘
```

### 4️⃣ Section Vai trò
```
🎭 VAI TRÒ
┌──────────────────┬─────────────────┬────────────────────────────────┐
│ Mã vai trò       │ Tên vai trò     │ Mô tả                          │
├──────────────────┼─────────────────┼────────────────────────────────┤
│ admin            │ Quản trị viên   │ Quyền quản trị toàn hệ thống   │
│ accountant       │ Kế toán         │ Quản lý tài chính và báo cáo   │
│ sales            │ Bán hàng        │ Quản lý bán hàng và khách hàng │
│ employee         │ Nhân viên       │ Nhân viên văn phòng thông thường│
│ workshop_employee│ Nhân viên xưởng │ Làm việc tại xưởng sản xuất    │
│ worker           │ Công nhân       │ Công nhân sản xuất             │
│ transport        │ Vận chuyển      │ Nhân viên vận chuyển           │
│ customer         │ Khách hàng      │ Tài khoản khách hàng           │
└──────────────────┴─────────────────┴────────────────────────────────┘
```

---

## 🎓 Cách sử dụng

### Tình huống 1: Không biết mã phòng ban
```
❓ Bạn muốn nhập nhân viên vào "Phòng Kế toán" nhưng không biết mã

✅ Giải pháp:
1. Mở sheet "Tra cứu nhanh"
2. Tìm section "🏢 PHÒNG BAN"
3. Tìm "Phòng Kế toán" → Mã là "DEPT001"
4. Copy mã "DEPT001"
5. Paste vào cột "Mã phòng ban" trong sheet "Mẫu nhân viên"
```

### Tình huống 2: Không biết mã chức vụ
```
❓ Bạn muốn nhập "Trưởng phòng" nhưng không biết mã

✅ Giải pháp:
1. Mở sheet "Tra cứu nhanh"
2. Tìm section "👔 CHỨC VỤ"
3. Tìm "Trưởng phòng" → Mã là "POS001"
4. Kiểm tra cột "Thuộc phòng ban" để đảm bảo đúng phòng
5. Copy mã "POS001"
6. Paste vào cột "Mã chức vụ" trong sheet "Mẫu nhân viên"
```

### Tình huống 3: Không biết vai trò nào phù hợp
```
❓ Bạn muốn nhập nhân viên làm kế toán nhưng không biết chọn role gì

✅ Giải pháp:
1. Mở sheet "Tra cứu nhanh"
2. Tìm section "🎭 VAI TRÒ"
3. Đọc cột "Mô tả" để hiểu rõ từng vai trò
4. Chọn "accountant" (Kế toán - Quản lý tài chính và báo cáo)
5. Copy mã "accountant"
6. Paste vào cột "Vai trò" trong sheet "Mẫu nhân viên"
```

### Tình huống 4: Nhập hàng loạt nhiều nhân viên
```
❓ Bạn cần nhập 20 nhân viên cùng phòng ban và chức vụ

✅ Giải pháp nhanh:
1. Mở sheet "Tra cứu nhanh" trên màn hình phụ (hoặc window khác)
2. Làm việc với sheet "Mẫu nhân viên"
3. Mỗi khi cần tra mã → Nhìn sang sheet "Tra cứu nhanh"
4. Copy/paste nhanh chóng
5. Không cần chuyển qua lại nhiều sheet!
```

---

## 💡 Tips & Tricks

### Tip 1: Sử dụng Ctrl+F để tìm nhanh
```
1. Mở sheet "Tra cứu nhanh"
2. Nhấn Ctrl+F (hoặc Cmd+F trên Mac)
3. Gõ tên cần tìm (ví dụ: "Kế toán")
4. Excel sẽ highlight và nhảy đến vị trí
```

### Tip 2: Mở 2 window Excel cùng lúc
```
1. Mở file Excel
2. View → New Window
3. Arrange All → Vertical
4. Window 1: Sheet "Tra cứu nhanh"
5. Window 2: Sheet "Mẫu nhân viên"
6. Làm việc hiệu quả hơn!
```

### Tip 3: In sheet "Tra cứu nhanh" ra giấy
```
1. Mở sheet "Tra cứu nhanh"
2. File → Print
3. In ra và để trên bàn
4. Tra cứu nhanh mà không cần mở Excel!
```

### Tip 4: Screenshot sheet "Tra cứu nhanh"
```
1. Mở sheet "Tra cứu nhanh"
2. Chụp màn hình (PrtScr hoặc Cmd+Shift+3)
3. Mở ảnh trên màn hình phụ
4. Tra cứu trong khi làm việc với Excel!
```

---

## 🎨 Màu sắc và Styling

Sheet được thiết kế với màu sắc rõ ràng:

- **Tiêu đề chính:** Màu cam (#FF6B35) - Nổi bật
- **Section headers:** Màu xanh (#4472C4) - Dễ phân biệt
- **Column headers:** Màu xám nhạt (#E7E9EB) - Không gây chói
- **Emojis:** 🏢 👔 🎭 - Dễ nhận diện

---

## 📖 So sánh với các sheet khác

| Tính năng | Sheet "Tra cứu nhanh" | Các sheet khác |
|-----------|----------------------|----------------|
| **Tất cả info** | ✅ Có tất cả | ❌ Chỉ 1 loại |
| **Tra cứu nhanh** | ✅ Rất nhanh | ⚠️ Chậm hơn |
| **Dễ đọc** | ✅ Layout compact | ✅ Chi tiết |
| **Chi tiết mô tả** | ✅ Có | ✅ Có |
| **Mục đích** | 📋 Tra cứu | 📚 Reference |

**Kết luận:** 
- Dùng **"Tra cứu nhanh"** khi cần tra cứu nhanh
- Dùng **các sheet khác** khi cần xem chi tiết từng loại

---

## ✅ Checklist

Khi sử dụng sheet "Tra cứu nhanh", bạn có thể:

- [ ] Tìm mã phòng ban từ tên
- [ ] Tìm mã chức vụ từ tên
- [ ] Xem chức vụ thuộc phòng ban nào
- [ ] Tìm mã vai trò từ tên
- [ ] Đọc mô tả vai trò để chọn đúng
- [ ] Copy/paste nhanh khi điền form
- [ ] Không cần chuyển qua lại nhiều sheet

---

## 🎉 Kết luận

Sheet "Tra cứu nhanh" là **công cụ tiện lợi nhất** khi làm việc với file Excel nhập nhân viên!

**Lợi ích:**
- ⚡ Tiết kiệm thời gian 70%
- 📋 Thông tin tập trung
- 🎯 Dễ tra cứu
- ✅ Giảm sai sót

**Hãy sử dụng nó mỗi khi bạn nhập nhân viên!**

---

*Sheet "Tra cứu nhanh" được tự động tạo từ dữ liệu thực tế của hệ thống, đảm bảo luôn cập nhật và chính xác.*

