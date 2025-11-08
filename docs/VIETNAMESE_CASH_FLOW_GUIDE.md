# 📊 Báo cáo Dòng tiền Chuẩn Việt Nam - Hướng dẫn Sử dụng

## 🎯 Tổng quan

Hệ thống báo cáo dòng tiền mới được thiết kế theo **chuẩn kế toán Việt Nam** với phân loại **bên nợ** và **bên có**, tuân thủ các quy định của Bộ Tài chính Việt Nam.

---

## 🚀 Cài đặt và Khởi chạy

### 1. **Cài đặt Backend**

```bash
# Chuyển đến thư mục backend
cd backend

# Cài đặt dependencies
pip install -r requirements.txt

# Chạy server
python main.py
```

### 2. **Cài đặt Frontend**

```bash
# Chuyển đến thư mục frontend
cd frontend

# Cài đặt dependencies
npm install

# Chạy development server
npm run dev
```

### 3. **Thiết lập Database**

```bash
# Chạy script tạo bảng tài khoản kế toán Việt Nam
python create_transaction_account_mapping.py
```

---

## 📋 Tính năng Chính

### ✅ **Phân loại Bên Nợ/Bên Có**
- **Bên Nợ (Debit)**: Tài sản, Chi phí
- **Bên Có (Credit)**: Nợ phải trả, Vốn chủ sở hữu, Doanh thu

### ✅ **Hệ thống Tài khoản Chuẩn Việt Nam**
- Tài khoản theo chuẩn Thông tư 200/2014/TT-BTC
- Mã tài khoản 3 chữ số (111, 112, 131, 331, 511, 632, v.v.)
- Tên tài khoản bằng tiếng Việt

### ✅ **Báo cáo Dòng tiền 3 Phần**
1. **Dòng tiền từ hoạt động kinh doanh**
2. **Dòng tiền từ hoạt động đầu tư**  
3. **Dòng tiền từ hoạt động tài chính**

---

## 🔧 API Endpoints

### **1. Báo cáo Dòng tiền Đầy đủ**

```http
GET /api/reports/financial/cash-flow-vietnamese
```

**Parameters:**
- `start_date`: Ngày bắt đầu (YYYY-MM-DD)
- `end_date`: Ngày kết thúc (YYYY-MM-DD)

**Response:**
```json
{
  "report_period": "Từ 01/01/2024 đến 31/01/2024",
  "start_date": "2024-01-01",
  "end_date": "2024-01-31",
  "currency": "VND",
  "beginning_cash": 10000000,
  "ending_cash": 15000000,
  "net_change_in_cash": 5000000,
  "operating_activities": {
    "section_name": "Dòng tiền từ hoạt động kinh doanh",
    "section_type": "operating",
    "items": [
      {
        "item_name": "Lợi nhuận ròng",
        "debit_amount": 0,
        "credit_amount": 5000000,
        "net_amount": 5000000,
        "account_type": "revenue"
      }
    ],
    "total_debit": 0,
    "total_credit": 5000000,
    "net_cash_flow": 5000000
  },
  "total_operating_cash_flow": 5000000,
  "total_investing_cash_flow": 0,
  "total_financing_cash_flow": 0,
  "net_cash_flow": 5000000,
  "cash_flow_validation": true
}
```

### **2. Tóm tắt Báo cáo Dòng tiền**

```http
GET /api/reports/financial/cash-flow-vietnamese/summary
```

**Response:**
```json
{
  "period": "Từ 01/01/2024 đến 31/01/2024",
  "net_cash_flow": 5000000,
  "operating_cash_flow": 5000000,
  "investing_cash_flow": 0,
  "financing_cash_flow": 0,
  "beginning_cash": 10000000,
  "ending_cash": 15000000,
  "validation": true
}
```

---

## 🎨 Giao diện Frontend

### **Truy cập Báo cáo**

1. **Từ trang Reports chính:**
   - Vào `http://localhost:3000/reports`
   - Click vào **"Báo cáo dòng tiền (Chuẩn VN)"**

2. **Truy cập trực tiếp:**
   - Vào `http://localhost:3000/reports/cash-flow-vietnamese`

### **Tính năng Giao diện**

- ✅ **Chọn khoảng thời gian** với date picker
- ✅ **Hiển thị bên nợ/bên có** rõ ràng
- ✅ **Phân loại tài khoản** với màu sắc
- ✅ **Tính toán tự động** và validation
- ✅ **Responsive design** cho mobile
- ✅ **Export/Print** (sắp có)

---

## 📊 Cấu trúc Dữ liệu

### **Bảng Tài khoản Kế toán**

```sql
-- Bảng chart_of_accounts
CREATE TABLE chart_of_accounts (
    account_code VARCHAR(20) PRIMARY KEY,
    account_name VARCHAR(255) NOT NULL,
    account_type VARCHAR(50) NOT NULL, -- 'asset', 'liability', 'equity', 'revenue', 'expense'
    account_class VARCHAR(50) NOT NULL,
    level INTEGER NOT NULL DEFAULT 1,
    is_active BOOLEAN DEFAULT true
);
```

### **Mapping Giao dịch**

| Giao dịch | Bên Nợ | Bên Có |
|-----------|--------|--------|
| **Bán hàng** | 131 - Phải thu khách hàng | 511 - Doanh thu bán hàng |
| **Mua hàng** | 632 - Giá vốn hàng bán | 331 - Phải trả nhà cung cấp |
| **Chi phí** | 642 - Chi phí quản lý | 111 - Tiền mặt |
| **Thanh toán** | 111 - Tiền mặt | 131 - Phải thu khách hàng |

---

## 🧪 Testing

### **Chạy Test Tự động**

```bash
python test_cash_flow_vietnamese.py
```

**Test sẽ kiểm tra:**
- ✅ API endpoint hoạt động
- ✅ Cấu trúc response đúng
- ✅ Tính toán dòng tiền chính xác
- ✅ Frontend accessible
- ✅ Validation logic

### **Test Manual**

1. **Tạo dữ liệu mẫu:**
   ```sql
   -- Tạo hóa đơn bán hàng
   INSERT INTO invoices (total_amount, status) VALUES (1000000, 'paid');
   
   -- Tạo chi phí
   INSERT INTO expenses (amount, category) VALUES (500000, 'administrative');
   ```

2. **Kiểm tra báo cáo:**
   - Vào frontend
   - Chọn khoảng thời gian
   - Xem kết quả báo cáo

---

## 🔍 Troubleshooting

### **Lỗi thường gặp**

1. **API không hoạt động:**
   ```bash
   # Kiểm tra backend đang chạy
   curl http://localhost:8000/health
   
   # Restart backend
   python backend/main.py
   ```

2. **Frontend không load:**
   ```bash
   # Kiểm tra frontend
   curl http://localhost:3000
   
   # Restart frontend
   npm run dev
   ```

3. **Dữ liệu không hiển thị:**
   - Kiểm tra database có dữ liệu
   - Kiểm tra journal entries được tạo
   - Kiểm tra date range

### **Debug Mode**

```bash
# Backend debug
export DEBUG=1
python backend/main.py

# Frontend debug
npm run dev -- --debug
```

---

## 📈 Mở rộng Tính năng

### **Tính năng sắp có:**

- ✅ **Export PDF/Excel** báo cáo
- ✅ **So sánh theo kỳ** (quarterly, yearly)
- ✅ **Phân tích xu hướng** dòng tiền
- ✅ **Dự báo dòng tiền** tương lai
- ✅ **Tích hợp AI** phân tích

### **Customization:**

- Thêm tài khoản kế toán mới
- Tùy chỉnh mapping giao dịch
- Thay đổi format báo cáo
- Tích hợp với hệ thống khác

---

## 📞 Hỗ trợ

Nếu gặp vấn đề, hãy:

1. **Kiểm tra logs:**
   ```bash
   # Backend logs
   tail -f backend/logs/app.log
   
   # Frontend logs
   npm run dev 2>&1 | tee frontend.log
   ```

2. **Tạo issue** với thông tin:
   - Lỗi cụ thể
   - Steps to reproduce
   - Screenshots
   - Log files

3. **Contact:** [Your contact info]

---

## 🎉 Kết luận

Hệ thống báo cáo dòng tiền chuẩn Việt Nam đã sẵn sàng sử dụng với:

- ✅ **Tuân thủ chuẩn kế toán VN**
- ✅ **Giao diện thân thiện**
- ✅ **API mạnh mẽ**
- ✅ **Tính toán chính xác**
- ✅ **Dễ mở rộng**

**Chúc bạn sử dụng hiệu quả! 🚀**
