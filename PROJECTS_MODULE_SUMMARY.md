# 📊 Projects Module - Tóm tắt Triển khai

## 🎯 Mục tiêu
Module Projects được thiết kế để theo dõi lợi nhuận của từng dự án bằng cách tổng hợp tất cả **doanh thu** (từ Invoices, Sales Receipts) và **chi phí** (từ Bills, Expenses, Time Entries) liên quan đến dự án đó.

## 🏗️ Kiến trúc Hệ thống

### Database Schema
- **Bảng chính**: `projects` - Lưu trữ thông tin dự án
- **Liên kết**: Các bảng `invoices`, `sales_receipts`, `expenses`, `bills`, `time_entries` đều có trường `project_id`
- **Quan hệ**: Projects liên kết với Customers và Employees

### Model Design
```python
class Project(BaseModel):
    id: str
    project_code: str
    name: str
    description: Optional[str]
    customer_id: Optional[str]
    manager_id: Optional[str]
    start_date: date
    end_date: Optional[date]
    budget: Optional[float]
    status: ProjectStatus
    priority: ProjectPriority
    progress: float
    billing_type: str  # fixed, hourly, milestone
    hourly_rate: Optional[float]
```

## 🚀 API Endpoints

### 1. CRUD Operations
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| `GET` | `/api/projects` | Lấy danh sách tất cả dự án |
| `POST` | `/api/projects` | Tạo dự án mới |
| `GET` | `/api/projects/{id}` | Lấy thông tin dự án cụ thể |
| `PUT` | `/api/projects/{id}` | Cập nhật dự án |
| `PUT` | `/api/projects/{id}/status` | Cập nhật trạng thái dự án |

### 2. Time Tracking
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| `GET` | `/api/projects/{id}/time-entries` | Lấy time entries của dự án |
| `POST` | `/api/projects/{id}/time-entries` | Tạo time entry mới |

### 3. Analytics & Reports
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| `GET` | `/api/projects/{id}/profitability` | Tính toán lợi nhuận dự án |
| `GET` | `/api/projects/{id}/dashboard` | Dashboard dự án |
| `GET` | `/api/projects/{id}/detailed-report` | Báo cáo chi tiết dự án |
| `GET` | `/api/projects/profitability/comparison` | So sánh lợi nhuận các dự án |
| `GET` | `/api/projects/stats/overview` | Thống kê tổng quan |

## 💰 Tính toán Lợi nhuận

### Doanh thu (Revenue)
- **Invoices**: Tổng giá trị hóa đơn đã tạo
- **Sales Receipts**: Tổng giá trị biên lai bán hàng
- **Paid Revenue**: Doanh thu đã thực sự nhận được

### Chi phí (Costs)
- **Labor Costs**: Chi phí nhân công (hours × hourly_rate)
- **Expenses**: Chi phí trực tiếp của dự án
- **Bills**: Hóa đơn từ nhà cung cấp

### Chỉ số Lợi nhuận
- **Gross Profit**: Doanh thu - Chi phí
- **Net Profit**: Doanh thu đã nhận - Chi phí
- **Profit Margin**: (Lợi nhuận / Doanh thu) × 100%
- **Budget Variance**: Ngân sách - Chi phí thực tế

## 📈 Báo cáo và Phân tích

### 1. Project Profitability API
```json
{
  "project_id": "uuid",
  "project_name": "Project Name",
  "revenue": {
    "total": 100000,
    "paid": 80000,
    "outstanding": 20000,
    "breakdown": {
      "invoices": {...},
      "sales_receipts": {...}
    }
  },
  "costs": {
    "total": 70000,
    "breakdown": {
      "labor": {...},
      "expenses": {...},
      "bills": {...}
    }
  },
  "profitability": {
    "gross_profit": 30000,
    "net_profit": 10000,
    "gross_profit_margin": 30.0,
    "net_profit_margin": 12.5
  }
}
```

### 2. Projects Comparison API
- So sánh lợi nhuận của tất cả dự án
- Sắp xếp theo profit margin, total profit, revenue, costs
- Thống kê tổng quan: dự án có lãi, dự án lỗ
- Xác định dự án có lợi nhuận cao nhất/thấp nhất

### 3. Project Dashboard
- Metrics tháng hiện tại
- Hoạt động gần đây
- Thành viên team
- Tiến độ dự án

## 🔗 Tích hợp với Modules khác

### Sales Module
- **Invoices**: Tự động liên kết với dự án qua `project_id`
- **Sales Receipts**: Tương tự như invoices
- **Revenue Tracking**: Theo dõi doanh thu theo dự án

### Expenses Module
- **Expenses**: Chi phí trực tiếp của dự án
- **Bills**: Hóa đơn từ nhà cung cấp cho dự án
- **Cost Tracking**: Theo dõi chi phí theo dự án

### Time Tracking
- **Time Entries**: Ghi nhận giờ làm việc cho dự án
- **Labor Costs**: Tính toán chi phí nhân công
- **Productivity Metrics**: Đo lường hiệu suất

## 🛠️ Cách sử dụng

### 1. Tạo Dự án
```python
project_data = {
    "project_code": "PROJ-2024-001",
    "name": "Website Development",
    "customer_id": "customer-uuid",
    "manager_id": "employee-uuid",
    "start_date": "2024-01-01",
    "end_date": "2024-06-30",
    "budget": 500000,
    "priority": "high",
    "billing_type": "fixed"
}
```

### 2. Liên kết Giao dịch
- Khi tạo Invoice: thêm `project_id`
- Khi tạo Expense: thêm `project_id`
- Khi tạo Time Entry: thêm `project_id`

### 3. Theo dõi Lợi nhuận
```python
# Lấy báo cáo lợi nhuận
GET /api/projects/{project_id}/profitability

# So sánh tất cả dự án
GET /api/projects/profitability/comparison?sort_by=profit_margin&sort_order=desc
```

## 📊 Dashboard và Báo cáo

### Project Dashboard
- Tổng quan dự án
- Metrics tháng hiện tại
- Hoạt động gần đây
- Thành viên team

### Detailed Report
- Báo cáo chi tiết với tất cả giao dịch
- Phân tích tài chính đầy đủ
- Thông tin stakeholders
- Timeline dự án

### Comparison Report
- So sánh hiệu suất các dự án
- Xếp hạng theo lợi nhuận
- Thống kê tổng quan
- Phân tích xu hướng

## 🧪 Testing

Sử dụng script `test_projects_api.py` để test tất cả endpoints:

```bash
python test_projects_api.py
```

Script sẽ test:
- CRUD operations
- Profitability calculations
- Time entries
- Status updates
- Comparison reports

## 🎯 Lợi ích

1. **Theo dõi Lợi nhuận**: Biết chính xác dự án nào có lãi/lỗ
2. **Quản lý Ngân sách**: So sánh ngân sách vs chi phí thực tế
3. **Phân tích Hiệu suất**: Xác định dự án hiệu quả nhất
4. **Báo cáo Chi tiết**: Báo cáo đầy đủ cho stakeholders
5. **Tích hợp Hoàn chỉnh**: Liên kết với tất cả modules khác

## 🔮 Tính năng Tương lai

- **Project Templates**: Mẫu dự án có sẵn
- **Resource Planning**: Lập kế hoạch tài nguyên
- **Risk Management**: Quản lý rủi ro dự án
- **Advanced Analytics**: Phân tích nâng cao với AI
- **Mobile App**: Ứng dụng di động cho quản lý dự án

---

**Module Projects đã được triển khai hoàn chỉnh với đầy đủ tính năng theo dõi lợi nhuận tương tự QuickBooks!** 🎉
