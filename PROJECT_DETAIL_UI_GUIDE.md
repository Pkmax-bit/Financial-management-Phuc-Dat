# 🎯 Hướng dẫn Giao diện Chi tiết Dự án

## 📋 Tổng quan

Giao diện chi tiết dự án mới được thiết kế để hiển thị thông tin tài chính một cách trực quan và thân thiện với người dùng. Hệ thống bao gồm các tính năng phân tích chi phí và doanh thu kế hoạch vs thực tế.

## 🚀 Tính năng chính

### 1. **Dashboard Tài chính Tổng quan**
- So sánh chi phí và doanh thu kế hoạch vs thực tế
- Biểu đồ trực quan với progress bars
- Phân tích biên lợi nhuận
- Timeline tài chính theo tháng

### 2. **Phân tích Chi phí Chi tiết**
- Phân bổ chi phí theo danh mục:
  - 👥 **Nhân công**: Chi phí lao động từ time entries
  - 📦 **Vật liệu**: Chi phí vật liệu (sẽ được mở rộng)
  - 🏢 **Chi phí chung**: Overhead costs
  - 📋 **Khác**: Expenses và bills
- Biểu đồ pie chart và bar chart
- Danh sách chi tiết các khoản chi phí
- Trạng thái thanh toán

### 3. **Phân tích Doanh thu Chi tiết**
- Phân bổ doanh thu theo nguồn:
  - 📄 **Hóa đơn**: Revenue từ invoices
  - 🧾 **Biên lai bán hàng**: Revenue từ sales receipts
  - 📊 **Khác**: Các nguồn doanh thu khác
- Thống kê trạng thái thanh toán
- Lọc và tìm kiếm doanh thu
- Biểu đồ trực quan

## 🎨 Giao diện Người dùng

### **Navigation Tabs**
- **📊 Tổng quan**: Thông tin cơ bản về dự án
- **💰 Tài chính**: Dashboard tài chính tổng quan
- **📉 Chi phí**: Phân tích chi phí chi tiết
- **📈 Doanh thu**: Phân tích doanh thu chi tiết
- **📅 Timeline**: Lịch sử tài chính theo thời gian
- **👥 Đội ngũ**: Quản lý thành viên (sẽ phát triển)
- **📁 Tài liệu**: Quản lý tài liệu (sẽ phát triển)

### **Responsive Design**
- ✅ Hoạt động tốt trên desktop, tablet, mobile
- ✅ Giao diện thân thiện với màu sắc trực quan
- ✅ Animations và transitions mượt mà
- ✅ Hover effects và interactive elements

## 🔧 Cách sử dụng

### **Truy cập Giao diện**

1. **Từ danh sách dự án:**
   - Vào trang `/projects`
   - Click vào icon biểu đồ (📊) trên mỗi dự án
   - Sẽ mở trang chi tiết trong tab mới

2. **Truy cập trực tiếp:**
   - URL: `/projects/{project-id}/detail`
   - Thay `{project-id}` bằng ID thực của dự án

### **Sử dụng các tính năng**

#### **Dashboard Tài chính**
- Xem tổng quan doanh thu, chi phí, lợi nhuận
- So sánh kế hoạch vs thực tế
- Theo dõi biên lợi nhuận
- Xem timeline tài chính

#### **Phân tích Chi phí**
- Chuyển đổi giữa view biểu đồ và danh sách
- Xem chi phí theo danh mục
- Theo dõi trạng thái thanh toán
- Thêm chi phí mới (quick action)

#### **Phân tích Doanh thu**
- Xem doanh thu theo nguồn
- Lọc theo loại (hóa đơn, biên lai, khác)
- Theo dõi trạng thái thanh toán
- Tạo hóa đơn/biên lai mới (quick action)

## 🛠️ API Endpoints

### **Financial Dashboard**
```
GET /api/projects/{project_id}/financial-dashboard
```
Trả về dữ liệu dashboard tài chính tổng quan

### **Cost Breakdown**
```
GET /api/projects/{project_id}/cost-breakdown
```
Trả về phân tích chi phí chi tiết

### **Revenue Analysis**
```
GET /api/projects/{project_id}/revenue-analysis
```
Trả về phân tích doanh thu chi tiết

## 📊 Cấu trúc Dữ liệu

### **Financial Dashboard Response**
```json
{
  "project_id": "uuid",
  "project_name": "string",
  "planned_revenue": 1000000,
  "actual_revenue": 950000,
  "planned_costs": 700000,
  "actual_costs": 750000,
  "profit_margin_planned": 30.0,
  "profit_margin_actual": 21.05,
  "cost_breakdown": {
    "labor": 400000,
    "materials": 100000,
    "overhead": 150000,
    "other": 100000
  },
  "revenue_breakdown": {
    "invoices": 800000,
    "sales_receipts": 150000,
    "other": 0
  },
  "monthly_data": [...]
}
```

### **Cost Breakdown Response**
```json
{
  "project_id": "uuid",
  "breakdown": {
    "labor": 400000,
    "materials": 100000,
    "overhead": 150000,
    "other": 100000
  },
  "items": [
    {
      "id": "uuid",
      "category": "labor",
      "description": "Chi phí nhân công",
      "amount": 50000,
      "date": "2024-01-15",
      "status": "approved",
      "vendor": "Nguyễn Văn A"
    }
  ]
}
```

### **Revenue Analysis Response**
```json
{
  "project_id": "uuid",
  "breakdown": {
    "invoices": 800000,
    "sales_receipts": 150000,
    "other": 0
  },
  "items": [
    {
      "id": "uuid",
      "type": "invoice",
      "description": "Hóa đơn tháng 1",
      "amount": 200000,
      "date": "2024-01-15",
      "status": "paid",
      "customer": "Công ty ABC"
    }
  ]
}
```

## 🎯 Lợi ích

### **Cho Quản lý Dự án**
- ✅ Tổng quan tài chính dự án một cách trực quan
- ✅ So sánh kế hoạch vs thực tế dễ dàng
- ✅ Phát hiện sớm các vấn đề tài chính
- ✅ Báo cáo chi tiết cho stakeholders

### **Cho Kế toán**
- ✅ Theo dõi chi phí theo danh mục
- ✅ Quản lý doanh thu theo nguồn
- ✅ Trạng thái thanh toán rõ ràng
- ✅ Dữ liệu chính xác cho báo cáo

### **Cho Ban Giám đốc**
- ✅ Dashboard tổng quan hiệu quả
- ✅ Phân tích lợi nhuận chi tiết
- ✅ Timeline tài chính theo thời gian
- ✅ Dữ liệu hỗ trợ quyết định

## 🔮 Phát triển Tương lai

### **Tính năng sắp tới**
- 📊 **Biểu đồ nâng cao**: Chart.js integration
- 📱 **Mobile app**: React Native version
- 🤖 **AI Insights**: Phân tích tự động
- 📧 **Email reports**: Tự động gửi báo cáo
- 🔔 **Alerts**: Cảnh báo vượt ngân sách

### **Tích hợp**
- 💳 **Payment gateways**: Thanh toán trực tuyến
- 📊 **BI tools**: Power BI, Tableau
- 🔗 **ERP systems**: SAP, Oracle
- ☁️ **Cloud storage**: AWS, Azure

## 🆘 Hỗ trợ

Nếu gặp vấn đề với giao diện mới:

1. **Kiểm tra Console**: F12 → Console tab
2. **Kiểm tra Network**: F12 → Network tab
3. **Liên hệ IT Support**: support@company.com
4. **Documentation**: `/docs` endpoint

---

**🎉 Chúc bạn sử dụng giao diện mới hiệu quả!**

