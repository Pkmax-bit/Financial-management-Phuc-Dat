# Demo: Phân biệt màu sắc chi phí dự án

## Mô tả
Demo này minh họa cách hệ thống phân biệt màu sắc giữa chi phí cha và chi phí con trong giao diện quản lý chi phí dự án.

## Cấu trúc demo

### Chi phí cha (Parent Expenses)
```
📁 Chi phí dự án ABC - 10,000,000 VND
├── Màu: Xám đậm (#111827)
├── Background: Trắng (#ffffff)
├── Icon: Thư mục xanh (#3b82f6)
└── Có thể mở rộng/thu gọn
```

### Chi phí con (Child Expenses)
```
📄 Chi phí con 1 - 3,000,000 VND
├── Màu: Cam đậm (#ea580c)
├── Background: Cam nhạt (#fff7ed)
├── Icon: File cam (#f97316)
└── Thụt lề 24px

📄 Chi phí con 2 - 2,000,000 VND
├── Màu: Cam đậm (#ea580c)
├── Background: Cam nhạt (#fff7ed)
├── Icon: File cam (#f97316)
└── Thụt lề 24px
```

## Bảng so sánh

| Thuộc tính | Chi phí cha | Chi phí con |
|------------|-------------|-------------|
| **Màu chính** | Xám đậm | Cam đậm |
| **Màu phụ** | Xám nhạt | Cam vừa |
| **Background** | Trắng | Cam nhạt |
| **Icon** | Thư mục xanh | File cam |
| **Số tiền** | Xanh dương/lá | Cam |
| **Indent** | 0px | 24px × level |

## Code implementation

### CSS Classes
```css
/* Chi phí cha */
.parent-expense {
  color: #111827; /* Gray-900 */
  background-color: #ffffff; /* White */
}

.parent-expense-icon {
  color: #3b82f6; /* Blue-500 */
}

/* Chi phí con */
.child-expense {
  color: #ea580c; /* Orange-700 */
  background-color: #fff7ed; /* Orange-50 */
}

.child-expense-icon {
  color: #f97316; /* Orange-500 */
}
```

### React Component Logic
```jsx
// Phân biệt màu sắc dựa trên level
const getExpenseStyles = (expense) => {
  const isChild = expense.level && expense.level > 0;
  
  return {
    textColor: isChild ? 'text-orange-700' : 'text-gray-900',
    backgroundColor: isChild ? 'bg-orange-50' : 'bg-white',
    iconColor: isChild ? 'text-orange-500' : 'text-blue-500',
    amountColor: isChild ? 'text-orange-600' : 'text-blue-600'
  };
};
```

## Lợi ích

### 1. **Nhận biết nhanh**
- Phân biệt ngay lập tức giữa chi phí cha và con
- Hiểu rõ cấu trúc phân cấp

### 2. **Cải thiện UX**
- Giảm thời gian tìm kiếm
- Tăng khả năng đọc dữ liệu
- Hỗ trợ navigation

### 3. **Quản lý hiệu quả**
- Theo dõi chi phí tổng thể vs chi tiết
- Ra quyết định nhanh chóng
- Phân tích dữ liệu dễ dàng

## Sử dụng trong thực tế

### Tạo chi phí mới
1. Chọn chi phí cha làm parent
2. Chi phí con tự động có màu cam
3. Hệ thống tự động indent

### Chỉnh sửa chi phí
1. Chi phí cha: Màu xám, chỉnh sửa tổng thể
2. Chi phí con: Màu cam, chỉnh sửa chi tiết

### Xem báo cáo
1. Phân biệt rõ ràng cấp độ chi phí
2. Hiểu cấu trúc dự án
3. Phân tích hiệu quả

## Kết luận

Việc phân biệt màu sắc giữa chi phí cha và con giúp:
- **Cải thiện UX**: Dễ nhận biết và sử dụng
- **Tăng hiệu quả**: Quản lý chi phí tốt hơn
- **Hỗ trợ ra quyết định**: Phân tích dữ liệu chính xác
- **Tính nhất quán**: Giao diện thống nhất
