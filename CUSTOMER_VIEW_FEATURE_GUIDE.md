# Hướng dẫn tính năng "View khách hàng"

## 🎯 **Tổng quan tính năng**

Tính năng "View khách hàng" cho phép xem thông tin chi tiết về khách hàng và timeline hình ảnh của các công trình. Đây là một công cụ mạnh mẽ để theo dõi tiến độ dự án và quản lý mối quan hệ khách hàng.

## 🚀 **Tính năng chính**

### **1. Danh sách khách hàng**
- Hiển thị tất cả khách hàng với thống kê cơ bản
- Tìm kiếm khách hàng theo tên, email, công ty
- Lọc dự án theo trạng thái (tất cả, đang hoạt động, hoàn thành, chờ xử lý)
- Chế độ xem lưới và danh sách

### **2. Thông tin chi tiết khách hàng**
- **Thông tin liên hệ**: Email, điện thoại, địa chỉ
- **Thống kê dự án**: Tổng dự án, tiến độ trung bình, tổng ngân sách
- **Danh sách dự án**: Chi tiết từng dự án với tiến độ và trạng thái

### **3. Timeline công trình**
- **Timeline entries**: Các mốc thời gian quan trọng
- **Hình ảnh**: Gallery hình ảnh từ timeline
- **Tệp đính kèm**: Tài liệu và hình ảnh liên quan
- **Bộ lọc**: Theo loại (cột mốc, cập nhật, vấn đề, cuộc họp)

## 📁 **Cấu trúc file**

### **Frontend Components:**
```
frontend/src/
├── app/customer-view/
│   └── page.tsx                    # Trang chính View khách hàng
└── components/customer-view/
    ├── CustomerInfo.tsx           # Component thông tin khách hàng
    └── ProjectTimelineGallery.tsx # Component timeline và gallery
```

### **Backend API:**
```
backend/routers/
└── customer_view.py               # API endpoints cho customer view
```

## 🔧 **API Endpoints**

### **1. Lấy danh sách khách hàng với thống kê**
```http
GET /api/customers
```
**Response:**
```json
[
  {
    "id": "customer-id",
    "name": "Công ty ABC",
    "email": "contact@abc.com",
    "phone": "0123456789",
    "address": "123 Đường ABC, TP.HCM",
    "company": "ABC Construction",
    "projects_count": 3,
    "total_projects_value": 1500000000,
    "created_at": "2024-01-15",
    "updated_at": "2024-01-15"
  }
]
```

### **2. Lấy thông tin chi tiết khách hàng**
```http
GET /api/customers/{customer_id}
```
**Response:**
```json
{
  "id": "customer-id",
  "name": "Công ty ABC",
  "email": "contact@abc.com",
  "phone": "0123456789",
  "address": "123 Đường ABC, TP.HCM",
  "company": "ABC Construction",
  "projects": [
    {
      "id": "project-id",
      "name": "Dự án nhà ở ABC",
      "project_code": "ABC-001",
      "status": "active",
      "progress": 75,
      "start_date": "2024-01-01",
      "end_date": "2024-06-30",
      "budget": 500000000,
      "actual_cost": 375000000,
      "manager_name": "Nguyễn Văn A"
    }
  ],
  "projects_count": 1,
  "total_budget": 500000000,
  "total_actual_cost": 375000000,
  "average_progress": 75
}
```

### **3. Lấy dự án của khách hàng**
```http
GET /api/customers/{customer_id}/projects
```

### **4. Lấy timeline của khách hàng**
```http
GET /api/customers/{customer_id}/timeline
```
**Response:**
```json
[
  {
    "id": "timeline-id",
    "title": "Khởi công dự án",
    "description": "Bắt đầu thi công dự án nhà ở ABC",
    "date": "2024-01-01",
    "type": "milestone",
    "status": "completed",
    "created_by": "Nguyễn Văn A",
    "attachments": [
      {
        "id": "attachment-id",
        "name": "ground-breaking.jpg",
        "url": "https://supabase.co/storage/...",
        "type": "image",
        "size": 1024000,
        "uploaded_at": "2024-01-01T08:00:00Z"
      }
    ]
  }
]
```

### **5. Lấy hình ảnh timeline**
```http
GET /api/customers/{customer_id}/timeline/images
```

### **6. Lấy thống kê khách hàng**
```http
GET /api/customers/{customer_id}/statistics
```

## 🎨 **Giao diện người dùng**

### **1. Layout chính**
- **Sidebar**: Danh sách khách hàng với tìm kiếm và lọc
- **Nội dung chính**: Thông tin chi tiết và timeline
- **Responsive**: Tự động điều chỉnh theo kích thước màn hình

### **2. Customer Info Component**
- **Header**: Tên khách hàng, công ty, thống kê tổng quan
- **Thông tin liên hệ**: Email, điện thoại, địa chỉ
- **Thống kê dự án**: Số dự án, tiến độ trung bình, ngân sách
- **Danh sách dự án**: Chi tiết từng dự án với thanh tiến độ

### **3. Project Timeline Gallery**
- **Timeline entries**: Các mốc thời gian với loại và trạng thái
- **Attachments**: Tệp đính kèm với preview và download
- **Image gallery**: Xem hình ảnh với modal fullscreen
- **Filters**: Lọc theo loại timeline và tìm kiếm

## 🔍 **Tính năng tìm kiếm và lọc**

### **Tìm kiếm khách hàng:**
- Theo tên khách hàng
- Theo email
- Theo tên công ty

### **Lọc dự án:**
- Tất cả dự án
- Đang hoạt động
- Hoàn thành
- Chờ xử lý

### **Lọc timeline:**
- Tất cả loại
- Cột mốc (milestone)
- Cập nhật (update)
- Vấn đề (issue)
- Cuộc họp (meeting)

## 📱 **Responsive Design**

### **Desktop (lg+):**
- Layout 3 cột: Sidebar + Customer Info + Timeline
- Grid view cho timeline entries
- Full image gallery

### **Tablet (md):**
- Layout 2 cột: Sidebar + Main content
- Responsive grid cho timeline
- Optimized image viewing

### **Mobile (sm):**
- Layout 1 cột: Stacked components
- List view cho timeline
- Touch-friendly controls

## 🖼️ **Image Gallery Features**

### **Image Modal:**
- Fullscreen image viewing
- Navigation between images
- Image counter
- Keyboard navigation (arrow keys)

### **Image Management:**
- Preview thumbnails
- Download functionality
- File size display
- Upload date tracking

## 📊 **Statistics Dashboard**

### **Customer Statistics:**
- Tổng số dự án
- Tổng ngân sách
- Chi phí thực tế
- Tiến độ trung bình
- Số dự án đang hoạt động
- Số dự án hoàn thành

### **Timeline Statistics:**
- Tổng số mục timeline
- Số hình ảnh
- Phân loại theo loại
- Phân loại theo trạng thái

## 🔒 **Security & Permissions**

### **Authentication:**
- JWT token required
- User role validation
- Session management

### **Data Access:**
- Row Level Security (RLS)
- Customer data isolation
- Project access control

## 🚀 **Performance Optimizations**

### **Frontend:**
- Lazy loading cho images
- Virtual scrolling cho large lists
- Debounced search
- Optimized re-renders

### **Backend:**
- Database indexing
- Query optimization
- Caching strategies
- Pagination support

## 📈 **Future Enhancements**

### **Planned Features:**
- Export timeline to PDF
- Email notifications
- Real-time updates
- Advanced analytics
- Mobile app integration

### **Potential Improvements:**
- AI-powered insights
- Automated reporting
- Integration with external tools
- Advanced filtering options

## 🎯 **Usage Examples**

### **1. Xem thông tin khách hàng**
1. Truy cập "View khách hàng" từ sidebar
2. Chọn khách hàng từ danh sách
3. Xem thông tin chi tiết và dự án

### **2. Xem timeline công trình**
1. Chọn khách hàng
2. Scroll xuống phần "Timeline công trình"
3. Lọc theo loại timeline
4. Click vào hình ảnh để xem fullscreen

### **3. Tìm kiếm khách hàng**
1. Sử dụng thanh tìm kiếm
2. Nhập tên, email hoặc công ty
3. Kết quả sẽ được lọc tự động

### **4. Lọc dự án**
1. Chọn khách hàng
2. Sử dụng dropdown "Lọc dự án"
3. Chọn trạng thái muốn xem

## 🎉 **Kết luận**

Tính năng "View khách hàng" cung cấp một giao diện trực quan và mạnh mẽ để:
- **Quản lý khách hàng**: Xem thông tin chi tiết và thống kê
- **Theo dõi dự án**: Monitor tiến độ và trạng thái
- **Timeline công trình**: Xem lịch sử và hình ảnh dự án
- **Phân tích dữ liệu**: Thống kê và báo cáo chi tiết

**Tính năng này giúp cải thiện đáng kể việc quản lý mối quan hệ khách hàng và theo dõi tiến độ dự án!** 🚀
