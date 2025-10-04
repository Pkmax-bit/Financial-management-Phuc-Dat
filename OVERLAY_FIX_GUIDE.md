# Hướng dẫn sửa View Overlay không che giao diện danh sách báo giá

## Vấn đề đã được khắc phục

### Trước khi sửa:
- Modal hướng dẫn sử dụng `fixed inset-0` che toàn màn hình
- Không có overlay trong suốt
- Người dùng không thể thấy danh sách báo giá phía sau

### Sau khi sửa:
- Modal hướng dẫn hiển thị như sidebar bên phải
- Có overlay trong suốt (`bg-black bg-opacity-25`)
- Người dùng vẫn có thể thấy danh sách báo giá phía sau
- Có thể click vào overlay để đóng modal

## Các thay đổi đã thực hiện

### 1. **Thay đổi vị trí modal**
```tsx
// Trước:
<div className="absolute left-0 top-0 h-full w-96 bg-white shadow-xl overflow-y-auto">

// Sau:
<div className="absolute right-0 top-0 h-full w-96 bg-white shadow-xl overflow-y-auto">
```

### 2. **Thêm overlay trong suốt**
```tsx
// Trước:
<div className="absolute inset-0" onClick={() => setShowHelpModal(false)}></div>

// Sau:
<div className="absolute inset-0 bg-black bg-opacity-25" onClick={() => setShowHelpModal(false)}></div>
```

### 3. **Giảm z-index**
```tsx
// Trước:
<div className="fixed inset-0 z-50 overflow-hidden">

// Sau:
<div className="fixed inset-0 z-40 overflow-hidden">
```

## Cấu trúc overlay hiện tại

### 1. **Help Modal (Modal hướng dẫn)**
- **Vị trí**: Bên phải màn hình
- **Kích thước**: 384px (w-96) chiều rộng, toàn chiều cao
- **Overlay**: Trong suốt 25% (`bg-black bg-opacity-25`)
- **Z-index**: 40
- **Tương tác**: Click overlay để đóng

### 2. **Conversion Success Modal (Modal thông báo chuyển đổi)**
- **Vị trí**: Giữa màn hình
- **Kích thước**: Tối đa 2xl, responsive
- **Overlay**: Trong suốt 50% (`bg-black bg-opacity-50`)
- **Z-index**: 50
- **Tương tác**: Click overlay để đóng

### 3. **Create Quote Sidebar**
- **Vị trí**: Bên trái màn hình (component riêng)
- **Kích thước**: Sidebar width
- **Overlay**: Có overlay riêng
- **Z-index**: Theo component

## Lợi ích của việc sửa đổi

### 1. **Trải nghiệm người dùng tốt hơn**
- Người dùng vẫn có thể thấy danh sách báo giá
- Không bị "mất" context khi mở modal hướng dẫn
- Có thể so sánh thông tin trong modal với danh sách

### 2. **Thiết kế nhất quán**
- Help modal hiển thị như sidebar (giống CreateQuoteSidebar)
- Conversion modal hiển thị như popup (phù hợp với thông báo)
- Z-index được sắp xếp hợp lý

### 3. **Tương tác linh hoạt**
- Click overlay để đóng modal
- Có thể đóng bằng nút X
- Không bị "kẹt" trong modal

## Screenshot mô tả

### Trước khi sửa:
```
┌─────────────────────────────────────────────────────────┐
│ [Modal che toàn màn hình]                              │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ 📚 Hướng dẫn sử dụng Báo giá              [X]     │ │
│ │                                                     │ │
│ │ Nội dung hướng dẫn...                               │ │
│ │                                                     │ │
│ │ [Không thấy danh sách báo giá phía sau]            │ │
│ └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

### Sau khi sửa:
```
┌─────────────────────────────────────────────────────────┐
│ Danh sách báo giá (vẫn hiển thị)    │ 📚 Hướng dẫn    │
│ ┌─────────────────────────────────┐ │ ┌─────────────┐ │
│ │ QUOTE-001 - Khách A             │ │ │ 📚 Hướng    │ │
│ │ QUOTE-002 - Khách B             │ │ │ dẫn sử      │ │
│ │ QUOTE-003 - Khách C             │ │ │ dụng       │ │
│ │ ...                             │ │ │             │ │
│ │ [Có thể thấy danh sách]         │ │ │ Nội dung... │ │
│ └─────────────────────────────────┘ │ └─────────────┘ │
└─────────────────────────────────────────────────────────┘
```

## Code mẫu

### Help Modal (đã sửa):
```tsx
{showHelpModal && (
  <div className="fixed inset-0 z-40 overflow-hidden">
    <div className="absolute inset-0 bg-black bg-opacity-25" onClick={() => setShowHelpModal(false)}></div>
    <div className="absolute right-0 top-0 h-full w-96 bg-white shadow-xl overflow-y-auto">
      {/* Nội dung modal */}
    </div>
  </div>
)}
```

### Conversion Success Modal (đã tối ưu):
```tsx
{showConversionSuccess && conversionData && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
      {/* Nội dung modal */}
    </div>
  </div>
)}
```

## Kiểm tra và test

### 1. **Test Help Modal**
- [ ] Mở modal hướng dẫn
- [ ] Kiểm tra danh sách báo giá vẫn hiển thị phía sau
- [ ] Click overlay để đóng modal
- [ ] Click nút X để đóng modal

### 2. **Test Conversion Modal**
- [ ] Chuyển đổi báo giá thành hóa đơn
- [ ] Kiểm tra modal thông báo hiển thị đúng
- [ ] Click overlay để đóng modal
- [ ] Click nút "Xem hóa đơn" để điều hướng

### 3. **Test Z-index**
- [ ] Mở help modal (z-40)
- [ ] Mở conversion modal (z-50)
- [ ] Kiểm tra conversion modal hiển thị trên help modal

## Kết luận

Việc sửa đổi overlay đã giải quyết vấn đề che giao diện danh sách báo giá:

- ✅ **Help modal**: Hiển thị như sidebar bên phải, không che danh sách
- ✅ **Conversion modal**: Hiển thị như popup giữa màn hình, phù hợp với thông báo
- ✅ **Z-index**: Được sắp xếp hợp lý (help: 40, conversion: 50)
- ✅ **Overlay**: Có overlay trong suốt, click để đóng
- ✅ **UX**: Người dùng vẫn thấy được context và có thể tương tác linh hoạt

Giờ đây view overlay không còn che giao diện danh sách báo giá, mang lại trải nghiệm người dùng tốt hơn.
