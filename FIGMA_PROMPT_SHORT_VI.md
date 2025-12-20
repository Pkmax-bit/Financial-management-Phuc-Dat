# PROMPT NGẮN GỌN CHO FIGMA (Tiếng Việt)

## YÊU CẦU THIẾT KẾ

Thiết kế giao diện Kanban board và List view cho hệ thống quản lý tài chính với 4 module: Khách hàng, Dự án, Báo giá, Hóa đơn.

### 1. KANBAN BOARD
- Header: Tiêu đề, nút chuyển view (Kanban/List), nút thêm mới, tìm kiếm, bộ lọc
- Board: Scroll ngang, mỗi cột = 1 trạng thái
- Card: 280-320px width, có avatar/icon, tên, mã số, thông tin chính, tags, ngày, actions
- Màu sắc: White background, border gray, hover blue accent
- Drag & drop: Có thể kéo thả giữa các cột

### 2. LIST VIEW
- Header: Giống Kanban
- Table: Responsive, có thể sort, checkbox, pagination
- Columns: Tùy module (mã, tên, khách hàng, số tiền, trạng thái, ngày, actions)

### 3. NÚT CHUYỂN ĐỔI
- Toggle switch hoặc Tab buttons
- Vị trí: Header bar, bên phải tiêu đề
- Animation: Fade/slide 300ms

### 4. QUẢN LÝ TRẠNG THÁI
- Modal/Drawer: Danh sách trạng thái, thêm/sửa/xóa, sắp xếp
- Form: Tên, màu sắc, icon

### 5. TRẠNG THÁI MẶC ĐỊNH

**Khách hàng**: Tiềm năng (xanh dương), Hoạt động (xanh lá), Ngừng hoạt động (xám)

**Dự án**: Lập kế hoạch (xám), Đang hoạt động (xanh lá), Tạm dừng (vàng), Hoàn thành (xanh dương), Đã hủy (đỏ)

**Báo giá**: Nháp (xám), Đã gửi (xanh dương), Đã xem (tím), Đã chấp nhận (xanh lá), Từ chối (đỏ), Hết hạn (vàng), Đã đóng (xám)

**Hóa đơn**: Nháp (xám), Đã gửi (xanh dương), Chờ thanh toán (vàng), Đã thanh toán (xanh lá), Quá hạn (đỏ)

### 6. DESIGN SYSTEM
- Colors: Primary Blue (#2563EB), Success Green (#10B981), Warning Yellow (#F59E0B), Error Red (#EF4444)
- Typography: Inter, H2: 20px/600, Body: 14-16px/400
- Spacing: Base 4px, Card padding 16px, Gap 12-16px
- Shadows: Card 0 1px 3px rgba(0,0,0,0.1), Hover 0 4px 6px

### 7. RESPONSIVE
- Desktop: 4-5 cột Kanban, full table
- Tablet: 2-3 cột, table thu gọn
- Mobile: 1 cột dọc, card layout

### 8. INTERACTIONS
- Drag & drop: Opacity + scale khi kéo, highlight cột đích
- View switch: Fade/slide animation
- Hover: Border + shadow change

### DELIVERABLES
- Design file (.fig) với desktop/mobile views
- Interactive prototype
- Design specs (spacing, colors, typography)

