# 🎯 Trung tâm Hỗ trợ - Support Center

## 📋 Tổng quan

Trung tâm Hỗ trợ là một hệ thống toàn diện cung cấp hướng dẫn, video, FAQ và hỗ trợ trực tiếp cho tất cả các chức năng trong hệ thống quản lý tài chính.

## 🚀 Tính năng chính

### 1. **Hướng dẫn theo Module**
- **Bán hàng**: Hướng dẫn tạo hóa đơn, quản lý thanh toán, báo cáo doanh thu
- **Chi phí**: Quản lý chi phí, ngân sách, hóa đơn nhà cung cấp, đề nghị hoàn ứng
- **Nhân sự**: Quản lý nhân viên, phòng ban, chức vụ
- **Dự án**: Tạo dự án, quản lý nhiệm vụ, theo dõi tiến độ

### 2. **Hướng dẫn Nhanh**
- Bắt đầu sử dụng hệ thống (15 phút)
- Thực hiện giao dịch bán hàng đầu tiên (10 phút)
- Ghi nhận chi phí đầu tiên (8 phút)

### 3. **Video Hướng dẫn**
- Tổng quan hệ thống (5:30)
- Hướng dẫn Bán hàng (8:15)
- Quản lý Chi phí (7:45)
- Báo cáo & Phân tích (6:20)

### 4. **Câu hỏi Thường gặp (FAQ)**
- Tìm kiếm thông minh
- Phân loại theo module
- Câu trả lời chi tiết

### 5. **Liên hệ Hỗ trợ**
- Chat trực tuyến
- Email hỗ trợ
- Điện thoại
- Giờ làm việc

## 🛠️ Cách sử dụng

### **Truy cập từ Sidebar**
1. Mở sidebar bên trái
2. Cuộn xuống cuối danh sách
3. Nhấn "Trung tâm Hỗ trợ"

### **Truy cập từ Dashboard**
1. Vào trang Dashboard
2. Nhấn nút "Hỗ trợ" ở góc phải header

### **Truy cập trực tiếp**
- URL: `/support`

## 📁 Cấu trúc Files

```
frontend/src/
├── components/
│   ├── SupportCenter.tsx          # Component chính
│   ├── SupportCenterButton.tsx   # Button tích hợp sidebar
│   ├── SupportBanner.tsx          # Banner thông báo
│   └── QuickHelp.tsx             # Hỗ trợ nhanh
├── app/
│   └── support/
│       └── page.tsx               # Trang Support độc lập
└── components/
    └── Navigation.tsx             # Đã tích hợp Support Center
```

## 🎨 Giao diện

### **Layout chính**
- **Sidebar trái**: Navigation menu
- **Nội dung chính**: Tab content động
- **Responsive**: Tối ưu cho mọi thiết bị

### **Các Tab**
1. **Tổng quan**: Giới thiệu và quick links
2. **Theo Module**: Hướng dẫn chi tiết từng chức năng
3. **Hướng dẫn nhanh**: Các bước cơ bản
4. **Video**: Video minh họa
5. **FAQ**: Câu hỏi thường gặp
6. **Liên hệ**: Thông tin hỗ trợ

## 🔧 Tích hợp

### **Vào Navigation**
```tsx
// Đã tích hợp sẵn trong Navigation.tsx
<SupportCenterButton />
```

### **Vào Dashboard**
```tsx
// Button hỗ trợ trong header
<button onClick={() => router.push('/support')}>
  <HelpCircle className="h-4 w-4" />
  Hỗ trợ
</button>
```

### **Support Banner**
```tsx
<SupportBanner 
  variant="info"
  title="Cần hỗ trợ?"
  message="Truy cập Trung tâm Hỗ trợ để xem hướng dẫn chi tiết."
/>
```

### **Quick Help**
```tsx
<QuickHelp 
  module="Bán hàng"
  title="Cần hỗ trợ?"
  items={customItems}
/>
```

## 📊 Dữ liệu

### **Modules**
```typescript
const modules = [
  {
    id: 'sales',
    name: 'Bán hàng',
    icon: DollarSign,
    color: 'blue',
    description: 'Quản lý bán hàng, hóa đơn, thanh toán',
    guides: [...],
    quickActions: [...]
  }
]
```

### **Quick Guides**
```typescript
const quickGuides = [
  {
    id: 'getting-started',
    title: 'Bắt đầu sử dụng hệ thống',
    description: 'Hướng dẫn cơ bản để bắt đầu',
    steps: [...],
    estimatedTime: '15 phút'
  }
]
```

### **FAQs**
```typescript
const faqs = [
  {
    id: 1,
    question: "Làm thế nào để tạo tài khoản người dùng mới?",
    answer: "Vào mục Nhân sự > Quản lý Nhân viên...",
    category: "Nhân sự",
    module: "employees"
  }
]
```

## 🎯 Lợi ích

### **Cho Người dùng**
- ✅ Hướng dẫn chi tiết từng bước
- ✅ Video minh họa trực quan
- ✅ FAQ giải đáp nhanh
- ✅ Hỗ trợ trực tiếp 24/7
- ✅ Tìm kiếm thông minh

### **Cho Quản trị viên**
- ✅ Giảm tải hỗ trợ
- ✅ Tự động hóa hướng dẫn
- ✅ Theo dõi vấn đề phổ biến
- ✅ Cập nhật dễ dàng

### **Cho Doanh nghiệp**
- ✅ Tăng hiệu quả sử dụng
- ✅ Giảm thời gian đào tạo
- ✅ Nâng cao trải nghiệm người dùng
- ✅ Tiết kiệm chi phí hỗ trợ

## 🔄 Cập nhật

### **Thêm Module mới**
1. Cập nhật `modules` array trong `SupportCenter.tsx`
2. Thêm guides và quickActions
3. Cập nhật navigation

### **Thêm FAQ mới**
1. Thêm vào `faqs` array
2. Cập nhật search functionality
3. Test với các từ khóa

### **Thêm Video mới**
1. Thêm vào `videoTutorials` array
2. Upload video file
3. Cập nhật thumbnail

## 🚀 Roadmap

### **Phase 1** ✅
- [x] Component chính SupportCenter
- [x] Tích hợp vào Navigation
- [x] Trang Support độc lập
- [x] FAQ với search
- [x] Video tutorials

### **Phase 2** 🔄
- [ ] Chat trực tuyến
- [ ] Ticket system
- [ ] Knowledge base
- [ ] User feedback

### **Phase 3** 📋
- [ ] AI chatbot
- [ ] Screen recording
- [ ] Multi-language
- [ ] Analytics

## 📞 Hỗ trợ

Nếu bạn cần hỗ trợ về Support Center:

- **Email**: support@company.com
- **Phone**: +84 123 456 789
- **Hours**: Mon-Fri 8:00-17:00, Sat 8:00-12:00

---

**🎉 Support Center đã sẵn sàng phục vụ!**
