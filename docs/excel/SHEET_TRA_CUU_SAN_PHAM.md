# 📋 Sheet Tra Cứu Sản Phẩm - Quick Start

## ⭐ Tính năng mới

File Excel mẫu cho **upload sản phẩm** giờ có **Sheet 2: "Tra cứu nhanh"** với:

### 🏷️ Loại sản phẩm (Product Categories)
- Tất cả loại sản phẩm có trong database
- Tên + Mô tả đầy đủ
- Dữ liệu THỰC, không phải mẫu

### 💰 Đối tượng chi phí (Expense Objects)
- Tất cả đối tượng chi phí trong hệ thống
- Tên + Mô tả + Cấp độ
- Dùng để làm vật tư sản phẩm

---

## 🚀 Cách sử dụng

### 1. Download template
```
GET /api/product-import/download-template
```
Cần đăng nhập (Admin/Manager/Accountant)

### 2. Mở file Excel
File có 4 sheets:
1. **Mẫu sản phẩm** - Điền dữ liệu ở đây
2. **Tra cứu nhanh** ⭐ MỚI - Xem loại sản phẩm & đối tượng chi phí
3. **Hướng dẫn các cột** - Giải thích từng cột
4. **Hướng dẫn chi tiết** - Quy trình từng bước

### 3. Xem sheet "Tra cứu nhanh"
- Xem loại sản phẩm có sẵn (từ database)
- Xem đối tượng chi phí có sẵn (từ database)
- Copy/paste tên khi điền form

### 4. Điền dữ liệu vào "Mẫu sản phẩm"
- Chọn loại sản phẩm từ sheet "Tra cứu nhanh"
- Hoặc nhập tên mới (tự động tạo)
- Upload file

---

## 📝 Ví dụ

### Sheet "Tra cứu nhanh" chứa:

#### Loại sản phẩm
| Tên loại sản phẩm | Mô tả |
|-------------------|-------|
| Nội thất văn phòng | Bàn ghế, tủ văn phòng |
| Nội thất phòng khách | Sofa, bàn trà, kệ tivi |
| Vật liệu xây dựng | Gạch, xi măng, sắt thép |
| ... | ... |

#### Đối tượng chi phí
| Tên đối tượng chi phí | Mô tả | Cấp độ |
|-----------------------|-------|--------|
| Vật tư trực tiếp | Chi phí vật tư sử dụng trực tiếp | Cấp 1 |
| Gỗ nguyên liệu | Gỗ các loại dùng cho sản xuất | Cấp 2 |
| Sơn và vecni | Vật tư hoàn thiện bề mặt | Cấp 2 |
| ... | ... | ... |

---

## 🎯 Lợi ích

✅ Xem tất cả loại sản phẩm trong một chỗ  
✅ Không cần vào UI để tra cứu  
✅ Copy/paste nhanh, tránh typo  
✅ Hiểu rõ đối tượng chi phí để làm vật tư  
✅ Dữ liệu thực từ database, luôn cập nhật  

---

## 🔗 Tài liệu chi tiết

- **Hướng dẫn đầy đủ:** [HUONG_DAN_EXCEL_SAN_PHAM.md](HUONG_DAN_EXCEL_SAN_PHAM.md)
- **Test tool:** [test_product_excel.html](test_product_excel.html)
- **Code:** [backend/routers/product_import.py](backend/routers/product_import.py)

---

## 💡 Tips

1. Mở sheet "Tra cứu nhanh" trước khi điền form
2. Copy tên loại sản phẩm để tránh lỗi chính tả
3. Nếu cần loại mới, chỉ việc nhập tên mới vào cột category_name
4. Đối tượng chi phí giúp phân loại vật tư trong báo cáo
5. **Đơn vị đo:** Diện tích/thể tích (m², m³), chiều cao/dài/sâu (mm)

---

**Cập nhật:** 2025-11-11  
**Tác giả:** AI Assistant  
**Version:** 1.0

