# Tóm tắt về Tax Rate (Thuế suất) trong Báo giá và Hóa đơn

## 📍 VỊ TRÍ LƯU TRỮ

### 1. **Khi lưu báo giá**
- **Bảng**: `quote_items`
- **Field**: `tax_rate DECIMAL(5,2) DEFAULT 0.0`
- **Vị trí code**: `frontend/src/components/sales/CreateQuoteSidebarFullscreen.tsx`
  - Line 2501: `tax_rate: item.tax_rate ?? formData.tax_rate ?? 10`
  - Lưu vào database khi insert quote_items

### 2. **Khi duyệt báo giá tạo hóa đơn tự động**
- **Bảng**: `invoice_items`
- **Field**: `tax_rate DECIMAL(5,2) DEFAULT 0.0`
- **Vị trí code**: `backend/routers/sales.py`
  - Function: `create_invoice_from_quote` (line 847)
  - Line 939: `"tax_rate": q_item.get("tax_rate", quote.get("tax_rate", 10.0))`
  - ✅ **ĐÃ SỬA**: Copy tax_rate từ quote_items sang invoice_items

### 3. **Khi chuyển đổi báo giá thành hóa đơn (convert)**
- **Bảng**: `invoice_items`
- **Vị trí code**: 
  - **Backend**: `backend/routers/sales.py`
    - Function: `convert_quote_to_invoice` (line 2115)
    - Line 2175: `"tax_rate": item.get("tax_rate", quote.get("tax_rate", 10.0))`
    - ✅ **ĐÃ SỬA**: Copy tax_rate từ quote_items sang invoice_items
  - **Frontend**: `frontend/src/components/sales/QuotesTab.tsx`
    - Function: `convertToInvoice` (line 745)
    - Line 868: `tax_rate: item.tax_rate ?? quote.tax_rate ?? 10`
    - ✅ **ĐÃ SỬA**: Copy tax_rate từ quote_items sang invoice_items

## 🔄 LUỒNG DỮ LIỆU

### Khi tạo báo giá:
```
User nhập tax_rate cho từng item
  ↓
Lưu vào quote_items.tax_rate
  ↓
Database: quote_items có tax_rate cho mỗi item
```

### Khi duyệt báo giá (approve):
```
Quote được approve
  ↓
Backend: create_invoice_from_quote()
  ↓
Đọc quote_items (có tax_rate)
  ↓
Tạo invoice_items với tax_rate từ quote_items
  ↓
Database: invoice_items có tax_rate cho mỗi item
```

### Khi chuyển đổi báo giá thành hóa đơn (convert):
```
User click "Chuyển thành hóa đơn"
  ↓
Backend: convert_quote_to_invoice() hoặc Frontend: convertToInvoice()
  ↓
Đọc quote_items (có tax_rate)
  ↓
Tạo invoice_items với tax_rate từ quote_items
  ↓
Database: invoice_items có tax_rate cho mỗi item
```

## ✅ CÁC THAY ĐỔI ĐÃ THỰC HIỆN

1. **Backend `create_invoice_from_quote`** (line 939)
   - Thêm: `"tax_rate": q_item.get("tax_rate", quote.get("tax_rate", 10.0))`
   - Copy tax_rate từ quote_item, fallback về quote.tax_rate, mặc định 10.0

2. **Backend `convert_quote_to_invoice`** (line 2175)
   - Thêm: `"tax_rate": item.get("tax_rate", quote.get("tax_rate", 10.0))`
   - Copy tax_rate từ quote_item, fallback về quote.tax_rate, mặc định 10.0

3. **Frontend `convertToInvoice`** (line 868)
   - Thêm: `tax_rate: item.tax_rate ?? quote.tax_rate ?? 10`
   - Copy tax_rate từ quote_item, fallback về quote.tax_rate, mặc định 10

## 📊 DATABASE SCHEMA

### quote_items table:
```sql
CREATE TABLE quote_items (
    ...
    tax_rate DECIMAL(5,2) DEFAULT 0.0,
    ...
);
```

### invoice_items table:
```sql
CREATE TABLE invoice_items (
    ...
    tax_rate DECIMAL(5,2) DEFAULT 0.0,
    ...
);
```

## 🎯 KẾT QUẢ

✅ **Tax_rate được lưu đúng vị trí**:
- Báo giá: `quote_items.tax_rate`
- Hóa đơn: `invoice_items.tax_rate`

✅ **Tax_rate được copy khi tạo hóa đơn từ báo giá**:
- Khi duyệt báo giá (approve): ✅ Đã sửa
- Khi chuyển đổi (convert): ✅ Đã sửa (cả backend và frontend)

✅ **Logic tính thuế**:
- Mỗi item có tax_rate riêng
- Tổng thuế = tổng (item.total_price * item.tax_rate / 100) của tất cả items
- Giống nhau cho cả báo giá và hóa đơn

