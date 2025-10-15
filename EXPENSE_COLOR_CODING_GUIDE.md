# Hướng dẫn phân biệt màu sắc chi phí dự án

## Tổng quan
Hệ thống đã được cập nhật để phân biệt rõ ràng giữa chi phí cha (parent expenses) và chi phí con (child expenses) thông qua màu sắc và giao diện.

## Phân biệt màu sắc

### 🏢 Chi phí cha (Parent Expenses)
- **Màu chính**: Xám đậm (`text-gray-900`)
- **Màu phụ**: Xám nhạt (`text-gray-500`, `text-gray-400`)
- **Background**: Trắng (`bg-white`)
- **Icon**: Thư mục màu xanh (`Folder` với `text-blue-500`)
- **Số tiền**: 
  - Kế hoạch: Xanh dương (`text-blue-600`)
  - Thực tế: Xanh lá (`text-green-600`)

### 📄 Chi phí con (Child Expenses)
- **Màu chính**: Cam đậm (`text-orange-700`)
- **Màu phụ**: Cam vừa (`text-orange-600`, `text-orange-400`)
- **Background**: Cam nhạt (`bg-orange-50`)
- **Icon**: File màu cam (`FileText` với `text-orange-500`)
- **Số tiền**: Cam (`text-orange-600`)

## Cấu trúc phân cấp

### Level 0 (Chi phí cha)
```
📁 Chi phí dự án ABC
├── Màu: Xám đậm
├── Background: Trắng
├── Icon: Thư mục xanh
└── Có thể mở rộng/thu gọn
```

### Level 1+ (Chi phí con)
```
📄 Chi phí con 1
├── Màu: Cam đậm
├── Background: Cam nhạt
├── Icon: File cam
└── Thụt lề 24px × level
```

## Lợi ích của việc phân biệt màu sắc

### 1. **Dễ nhận biết cấp độ**
- Người dùng có thể nhanh chóng phân biệt chi phí cha và con
- Hiểu rõ cấu trúc phân cấp của dự án

### 2. **Cải thiện UX**
- Giảm thời gian tìm kiếm thông tin
- Tăng khả năng đọc và hiểu dữ liệu
- Hỗ trợ navigation trong cây chi phí

### 3. **Quản lý hiệu quả**
- Dễ dàng theo dõi chi phí tổng thể vs chi tiết
- Phân biệt rõ ràng giữa kế hoạch và thực tế
- Hỗ trợ ra quyết định nhanh chóng

## Cách sử dụng

### Xem danh sách chi phí
1. **Chi phí cha** hiển thị với màu xám, background trắng
2. **Chi phí con** hiển thị với màu cam, background cam nhạt
3. Sử dụng nút mở rộng/thu gọn để xem chi tiết

### Tạo chi phí mới
1. Chọn chi phí cha làm parent
2. Chi phí con sẽ tự động có màu cam
3. Hệ thống tự động indent theo cấp độ

### Chỉnh sửa chi phí
1. Chi phí cha: Màu xám, có thể chỉnh sửa thông tin tổng thể
2. Chi phí con: Màu cam, chỉnh sửa chi tiết cụ thể

## Tùy chỉnh màu sắc

### Thay đổi màu chi phí con
```css
/* Trong file CSS hoặc Tailwind config */
.child-expense {
  color: #ea580c; /* Orange-600 */
  background-color: #fff7ed; /* Orange-50 */
}

.child-expense-icon {
  color: #f97316; /* Orange-500 */
}
```

### Thay đổi màu chi phí cha
```css
.parent-expense {
  color: #111827; /* Gray-900 */
  background-color: #ffffff; /* White */
}

.parent-expense-icon {
  color: #3b82f6; /* Blue-500 */
}
```

## Lưu ý quan trọng

1. **Tính nhất quán**: Màu sắc được áp dụng nhất quán trên toàn hệ thống
2. **Accessibility**: Đảm bảo độ tương phản đủ cao cho người dùng
3. **Responsive**: Màu sắc hoạt động tốt trên mọi kích thước màn hình
4. **Performance**: Không ảnh hưởng đến hiệu suất hiển thị

## Troubleshooting

### Màu sắc không hiển thị đúng
- Kiểm tra Tailwind CSS đã được load
- Đảm bảo class names đúng
- Refresh trang để cập nhật styles

### Không phân biệt được cấp độ
- Kiểm tra `expense.level` có giá trị đúng không
- Đảm bảo logic phân cấp hoạt động chính xác
- Kiểm tra dữ liệu `id_parent` trong database

### Icon không hiển thị
- Kiểm tra Lucide React icons đã được import
- Đảm bảo icon names đúng
- Kiểm tra CSS classes cho màu sắc
