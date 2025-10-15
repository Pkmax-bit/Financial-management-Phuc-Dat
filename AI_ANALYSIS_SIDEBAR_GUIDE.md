# 🧠 Hướng Dẫn Sử Dụng Sidebar cho Trang AI Analysis

## 📍 **Vị Trí Trang AI Analysis**

Trang AI Analysis nằm tại: `http://localhost:3000/ai-analysis`

## 🔧 **Cách Khởi Động**

### 1. Khởi động Frontend
```bash
cd frontend
npm run dev
```

### 2. Truy cập trang AI Analysis
- Mở trình duyệt
- Truy cập: `http://localhost:3000/ai-analysis`

## 🎛️ **Chức Năng Sidebar**

### ✅ **Sidebar Đã Có Sẵn**
Trang AI Analysis đã được tích hợp với `LayoutWithSidebar` component, bao gồm:

- **Thanh slide bar bên trái** với navigation menu
- **Nút toggle** để mở/đóng sidebar
- **Responsive design** cho mobile và desktop
- **User profile** và logout button

### 🎯 **Các Tính Năng Sidebar**

#### 1. **Navigation Menu**
- **Dashboard** - Trang chủ
- **Projects** - Quản lý dự án
- **Customers** - Quản lý khách hàng
- **Sales** - Bán hàng
- **Expenses** - Chi phí
- **Reports** - Báo cáo
- **AI Analysis** - Phân tích AI (trang hiện tại)

#### 2. **Tiến Độ Thi Công**
- **Tiến độ dự án (Khách hàng)** - Xem timeline
- **Cập nhật tiến độ (Nhân viên)** - Upload hình ảnh

#### 3. **Hỗ Trợ**
- **Support Center** - Trung tâm hỗ trợ

#### 4. **User Profile**
- Hiển thị tên user
- Role (Admin, Manager, Employee, Customer)
- Nút logout

### 🎮 **Cách Sử Dụng Sidebar**

#### **Desktop (màn hình lớn)**
- Sidebar hiển thị mặc định
- Click nút toggle (mũi tên) để ẩn/hiện
- Hover để xem tooltip

#### **Mobile (màn hình nhỏ)**
- Sidebar ẩn mặc định
- Click nút toggle để mở
- Click bên ngoài để đóng

### 🔧 **Troubleshooting**

#### **Sidebar Không Hiển Thị**
1. Kiểm tra console browser có lỗi không
2. Refresh trang (F5)
3. Kiểm tra CSS có bị conflict không
4. Kiểm tra responsive design

#### **Nút Toggle Không Hoạt Động**
1. Kiểm tra JavaScript console
2. Kiểm tra event handlers
3. Kiểm tra CSS transitions

#### **Navigation Không Hoạt Động**
1. Kiểm tra routing
2. Kiểm tra authentication
3. Kiểm tra permissions

### 📱 **Responsive Design**

#### **Breakpoints**
- **Mobile**: < 768px - Sidebar ẩn mặc định
- **Tablet**: 768px - 1024px - Sidebar có thể toggle
- **Desktop**: > 1024px - Sidebar hiển thị mặc định

#### **CSS Classes**
```css
/* Sidebar */
.sidebar-open { width: 16rem; }
.sidebar-closed { width: 0; }

/* Content */
.content-with-sidebar { margin-left: 16rem; }
.content-full { margin-left: 0; }

/* Responsive */
@media (max-width: 1024px) {
  .sidebar-desktop { display: block; }
  .sidebar-mobile { display: none; }
}
```

### 🎨 **Customization**

#### **Thay Đổi Màu Sắc**
```css
/* Sidebar background */
.sidebar { background-color: #ffffff; }

/* Active item */
.sidebar-item-active { background-color: #dbeafe; }

/* Hover effect */
.sidebar-item:hover { background-color: #f9fafb; }
```

#### **Thay Đổi Kích Thước**
```css
/* Sidebar width */
.sidebar-open { width: 20rem; } /* Tăng từ 16rem */

/* Content margin */
.content-with-sidebar { margin-left: 20rem; }
```

### 🚀 **Tính Năng Nâng Cao**

#### **Keyboard Shortcuts**
- **Ctrl + B**: Toggle sidebar
- **Escape**: Đóng sidebar (mobile)

#### **Auto-hide**
- Sidebar tự động ẩn khi click bên ngoài (mobile)
- Sidebar giữ nguyên trạng thái (desktop)

#### **Smooth Transitions**
- Animation mượt mà khi toggle
- Transition duration: 300ms
- Easing: ease-in-out

### 📋 **Checklist Kiểm Tra**

- [ ] Sidebar hiển thị khi load trang
- [ ] Nút toggle hoạt động
- [ ] Navigation items clickable
- [ ] User profile hiển thị đúng
- [ ] Logout button hoạt động
- [ ] Responsive design trên mobile
- [ ] Smooth transitions
- [ ] No console errors

### 🔍 **Debug Information**

#### **Console Commands**
```javascript
// Kiểm tra sidebar state
console.log('Sidebar open:', document.querySelector('.sidebar').classList.contains('sidebar-open'));

// Kiểm tra responsive
console.log('Screen width:', window.innerWidth);

// Kiểm tra navigation
console.log('Navigation items:', document.querySelectorAll('.nav-item').length);
```

#### **Common Issues**
1. **Sidebar không hiển thị**: Kiểm tra CSS và responsive classes
2. **Toggle không hoạt động**: Kiểm tra JavaScript event handlers
3. **Navigation không hoạt động**: Kiểm tra routing và authentication
4. **Mobile không responsive**: Kiểm tra CSS media queries

### 🎉 **Kết Luận**

Trang AI Analysis đã có đầy đủ sidebar với tất cả tính năng cần thiết:

- ✅ **Navigation menu** đầy đủ
- ✅ **Responsive design** cho mọi thiết bị
- ✅ **User profile** và authentication
- ✅ **Smooth animations** và transitions
- ✅ **Accessibility** và keyboard shortcuts

**Sidebar đã sẵn sàng để sử dụng!** 🚀


