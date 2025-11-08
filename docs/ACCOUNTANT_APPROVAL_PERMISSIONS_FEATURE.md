# 🧮 TÍNH NĂNG DUYỆT CHI PHÍ CHO KẾ TOÁN

## 🎯 MỤC TIÊU
Thêm quyền hạn duyệt chi phí đang chờ cho kế toán, bao gồm trang duyệt chi phí chuyên dụng, widget dashboard và navigation menu.

## ✨ TÍNH NĂNG ĐÃ THÊM

### 1. **Trang Duyệt Chi Phí Chuyên Dụng**
- ✅ **URL**: `/expenses/pending-approval`
- ✅ **Hiển thị tất cả chi phí chờ duyệt** (cả planned và actual)
- ✅ **Thống kê tổng quan**: Số lượng, tổng giá trị, phân loại
- ✅ **Tìm kiếm và lọc**: Theo mô tả, dự án, người tạo, loại chi phí
- ✅ **Bảng chi tiết**: Thông tin đầy đủ về từng chi phí
- ✅ **Nút duyệt/từ chối**: Cho từng chi phí với loading states
- ✅ **Responsive design**: Hoạt động tốt trên mọi thiết bị

### 2. **Widget Dashboard cho Kế Toán**
- ✅ **Hiển thị trên dashboard** khi đăng nhập với role accountant
- ✅ **Top 5 chi phí chờ duyệt** gần nhất
- ✅ **Thống kê nhanh**: Tổng số, tổng giá trị, planned/actual
- ✅ **Nút "Xem tất cả"**: Chuyển đến trang duyệt chi phí
- ✅ **Empty state**: Khi không có chi phí chờ duyệt
- ✅ **Auto-refresh**: Cập nhật dữ liệu real-time

### 3. **Navigation Menu**
- ✅ **Menu item "Duyệt chi phí"** trong navigation
- ✅ **Role-based visibility**: Chỉ hiển thị cho admin, accountant, sales
- ✅ **Icon CheckCircle**: Dễ nhận biết
- ✅ **Mô tả rõ ràng**: "Duyệt và quản lý chi phí đang chờ phê duyệt"
- ✅ **Category management**: Phân loại trong nhóm "Quản lý"

### 4. **Quyền Hạn và Phân Quyền**
- ✅ **Role-based access control**: Chỉ admin, accountant, sales có quyền
- ✅ **Database permissions**: Đọc và cập nhật trạng thái chi phí
- ✅ **UI permissions**: Nút duyệt/từ chối chỉ hiển thị cho user có quyền
- ✅ **Error handling**: Xử lý lỗi database và network

## 🔧 CẤU TRÚC CODE

### **Files Đã Tạo/Cập Nhật:**

#### **1. Trang Duyệt Chi Phí:**
- `frontend/src/app/expenses/pending-approval/page.tsx` - Trang chính duyệt chi phí

#### **2. Widget Dashboard:**
- `frontend/src/components/PendingApprovalWidget.tsx` - Widget hiển thị trên dashboard

#### **3. Navigation:**
- `frontend/src/utils/rolePermissions.ts` - Thêm menu item "Duyệt chi phí"

#### **4. Dashboard:**
- `frontend/src/app/dashboard/page.tsx` - Hiển thị widget cho kế toán

#### **5. Test Scripts:**
- `test_accountant_approval_permissions.py` - Test script tổng hợp

## 🎨 THIẾT KẾ UI/UX

### **Trang Duyệt Chi Phí:**
- **Header**: Tiêu đề, mô tả, nút refresh
- **Stats Cards**: 4 thẻ thống kê với icon và màu sắc
- **Filters**: Search box và dropdown lọc loại chi phí
- **Table**: Bảng chi tiết với các cột thông tin
- **Actions**: Nút duyệt (xanh) và từ chối (đỏ)
- **Loading States**: Spinner và skeleton loading
- **Error Handling**: Thông báo lỗi rõ ràng

### **Widget Dashboard:**
- **Header**: Tiêu đề, mô tả, nút "Xem tất cả"
- **Stats Row**: 3 thẻ thống kê nhanh
- **Expenses List**: Danh sách 5 chi phí gần nhất
- **Empty State**: Khi không có chi phí chờ duyệt
- **Footer**: Nút "Duyệt tất cả chi phí"

### **Navigation Menu:**
- **Icon**: CheckCircle (màu xanh)
- **Text**: "Duyệt chi phí"
- **Description**: "Duyệt và quản lý chi phí đang chờ phê duyệt"
- **Category**: Management
- **Roles**: admin, accountant, sales

## 🔐 QUYỀN HẠN CHI TIẾT

### **Roles Có Quyền Truy Cập:**
- **Admin**: Toàn quyền duyệt chi phí
- **Accountant**: Duyệt chi phí (chức năng chính)
- **Sales**: Duyệt chi phí (hỗ trợ)

### **Chức Năng Duyệt:**
- ✅ **Xem danh sách** chi phí chờ duyệt
- ✅ **Duyệt chi phí** (pending → approved)
- ✅ **Từ chối chi phí** (pending → rejected)
- ✅ **Lọc và tìm kiếm** chi phí
- ✅ **Xem thống kê** tổng quan
- ✅ **Truy cập dashboard** với widget

### **Database Operations:**
- ✅ **SELECT**: Đọc chi phí pending từ cả 2 bảng
- ✅ **UPDATE**: Cập nhật status thành approved/rejected
- ✅ **JOIN**: Kết nối với bảng projects, users, expense_objects
- ✅ **ORDER BY**: Sắp xếp theo thời gian tạo

## 🚀 CÁCH SỬ DỤNG

### **Cho Kế Toán:**
1. **Đăng nhập** với tài khoản kế toán
2. **Xem dashboard** - Widget hiển thị chi phí chờ duyệt
3. **Click "Xem tất cả"** hoặc menu "Duyệt chi phí"
4. **Duyệt/từ chối** từng chi phí hoặc hàng loạt
5. **Sử dụng bộ lọc** để tìm chi phí cụ thể

### **Cho Admin/Sales:**
1. **Truy cập menu** "Duyệt chi phí"
2. **Xem và duyệt** chi phí như kế toán
3. **Quản lý** toàn bộ quy trình duyệt

## 🧪 TESTING

### **Test Cases:**
1. ✅ **Login as accountant** - Truy cập được trang duyệt
2. ✅ **View pending expenses** - Hiển thị danh sách đúng
3. ✅ **Approve expenses** - Cập nhật status thành công
4. ✅ **Reject expenses** - Cập nhật status thành công
5. ✅ **Search and filter** - Tìm kiếm hoạt động đúng
6. ✅ **Dashboard widget** - Hiển thị cho kế toán
7. ✅ **Navigation menu** - Hiển thị cho roles có quyền
8. ✅ **Error handling** - Xử lý lỗi đúng cách

### **Test Script:**
```bash
python test_accountant_approval_permissions.py
```

## 📊 DỮ LIỆU VÀ THỐNG KÊ

### **Thống Kê Hiển Thị:**
- **Tổng chi phí chờ duyệt**: Số lượng
- **Tổng giá trị**: Tổng số tiền
- **Chi phí kế hoạch**: Số lượng planned expenses
- **Chi phí thực tế**: Số lượng actual expenses

### **Thông Tin Chi Phí:**
- **Mô tả**: Nội dung chi phí
- **Dự án**: Tên dự án liên quan
- **Số tiền**: Giá trị và đơn vị tiền tệ
- **Ngày tạo**: Thời gian tạo chi phí
- **Người tạo**: Tên người tạo chi phí
- **Loại**: Planned hoặc Actual
- **Đối tượng chi phí**: Danh mục chi phí

## 🔄 WORKFLOW DUYỆT CHI PHÍ

### **Quy Trình:**
1. **Nhân viên tạo chi phí** → Status: pending
2. **Kế toán xem danh sách** → Trang duyệt chi phí
3. **Kế toán duyệt/từ chối** → Status: approved/rejected
4. **Hệ thống cập nhật** → Database và UI
5. **Thông báo kết quả** → Success/Error message

### **Trạng Thái Chi Phí:**
- **pending**: Chờ duyệt (màu vàng)
- **approved**: Đã duyệt (màu xanh)
- **rejected**: Từ chối (màu đỏ)

## 🎯 LỢI ÍCH

### **Cho Kế Toán:**
- ⚡ **Duyệt nhanh** - Trang chuyên dụng cho duyệt chi phí
- 📊 **Thống kê rõ ràng** - Biết được tình hình chi phí
- 🔍 **Tìm kiếm dễ dàng** - Lọc theo nhiều tiêu chí
- 📱 **Responsive** - Hoạt động trên mọi thiết bị
- 🎨 **UI/UX tốt** - Giao diện thân thiện, dễ sử dụng

### **Cho Hệ Thống:**
- 🔐 **Bảo mật** - Phân quyền rõ ràng
- 📈 **Hiệu quả** - Quy trình duyệt được tối ưu
- 🔄 **Real-time** - Cập nhật dữ liệu ngay lập tức
- 🛡️ **Ổn định** - Error handling đầy đủ
- 📊 **Báo cáo** - Thống kê chi tiết

## 🚀 DEPLOYMENT

### **Frontend:**
- ✅ Code đã được cập nhật
- ✅ Không cần thay đổi backend
- ✅ Sử dụng database hiện có
- ✅ Hoạt động ngay lập tức

### **Cách Deploy:**
1. **Start Frontend**: `npm run dev`
2. **Start Backend**: `python -m uvicorn backend.main:app --reload`
3. **Truy cập**: `http://localhost:3000`
4. **Login as accountant**: `sales@example.com` / `123456`
5. **Test**: Dashboard widget và menu "Duyệt chi phí"

## 🎉 KẾT QUẢ

### **Tính năng hoàn thành:**
- ✅ Trang duyệt chi phí chuyên dụng
- ✅ Widget dashboard cho kế toán
- ✅ Navigation menu với phân quyền
- ✅ UI/UX đẹp và responsive
- ✅ Error handling đầy đủ
- ✅ Test script hoàn chỉnh
- ✅ Documentation chi tiết

### **Sẵn sàng sử dụng:**
- 🚀 **Ngay lập tức** - Không cần cấu hình thêm
- 🎯 **Dễ sử dụng** - Giao diện trực quan
- 🔐 **An toàn** - Phân quyền rõ ràng
- 📱 **Đa nền tảng** - Hoạt động trên mọi thiết bị
- 🔄 **Real-time** - Cập nhật dữ liệu ngay lập tức

**Tính năng duyệt chi phí cho kế toán đã sẵn sàng!** 🎉

## 📝 GHI CHÚ

- Sử dụng tài khoản `sales@example.com` / `123456` để test với role accountant
- Widget chỉ hiển thị cho user có role `accountant`
- Menu "Duyệt chi phí" hiển thị cho admin, accountant, sales
- Tất cả chi phí pending sẽ được hiển thị trong trang duyệt
- Có thể duyệt/từ chối từng chi phí hoặc hàng loạt
