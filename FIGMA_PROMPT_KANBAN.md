# PROMPT THIẾT KẾ FIGMA - GIAO DIỆN KANBAN VÀ LIST VIEW
## DỰA TRÊN GIAO DIỆN BITRIX24

---

## 🎯 MỤC TIÊU CHÍNH

**Thiết kế giao diện quản lý với Kanban và List view cho hệ thống quản lý tài chính, dựa trên design patterns của Bitrix24.**

### Yêu cầu cốt lõi:
1. ✅ **Giao diện Khách hàng** - Ưu tiên số 1, cần thiết kế chi tiết nhất
2. ✅ **Giao diện Kanban** cho TẤT CẢ 4 module: Khách hàng, Dự án, Báo giá, Hóa đơn
3. ✅ **Nút chuyển đổi View** rõ ràng, dễ nhận biết (Kanban ↔ List) ở mỗi module
4. ✅ **Quản lý trạng thái tùy chỉnh** - có thể thêm/sửa/xóa/sắp xếp trạng thái
5. ✅ **Thiết kế theo Bitrix24** - màu sắc, spacing, typography, interactions

---

## TỔNG QUAN DỰ ÁN
Hệ thống quản lý tài chính với các module: **Khách hàng, Dự án, Báo giá, Hóa đơn**. 

**YÊU CẦU CHÍNH:**
- **Giao diện Khách hàng** là ưu tiên hàng đầu - cần thiết kế chi tiết và chuyên nghiệp
- **TẤT CẢ các module** (Khách hàng, Dự án, Báo giá, Hóa đơn) đều phải có **giao diện Kanban** với khả năng quản lý trạng thái tùy chỉnh
- Mỗi module phải có **nút chuyển đổi view** rõ ràng giữa **Kanban** và **List view**
- **Thiết kế dựa trên giao diện và UX patterns của Bitrix24** để đảm bảo trải nghiệm quen thuộc và chuyên nghiệp

## TÓM TẮT YÊU CẦU CHÍNH

### 1. Giao diện Kanban Board
- Các cột trạng thái có thể tùy chỉnh (thêm, sửa, xóa, sắp xếp)
- Cards có **left border accent** theo màu trạng thái (đặc trưng Bitrix24)
- Drag & drop giữa các cột
- Header cột có background #F5F7F8, hiển thị tên + số lượng items

### 2. Giao diện List View
- Table với sticky header
- Hover state: Background #E8F4FD (màu Bitrix24)
- Checkbox để chọn nhiều items
- Pagination ở bottom

### 3. Nút chuyển đổi View
- 2 icon buttons cạnh nhau (Kanban | List)
- Active: Background #E8F4FD, icon #2066B0
- Inactive: Transparent, icon #535C69

### 4. Quản lý Trạng thái
- Modal để thêm/sửa/xóa trạng thái
- Màu sắc theo palette Bitrix24
- Có thể sắp xếp thứ tự cột (drag & drop)

### 5. Modules cần thiết kế (TẤT CẢ đều có Kanban + List View)

**⚠️ QUAN TRỌNG:** Tất cả 4 module sau đều phải có đầy đủ:
- Giao diện Kanban với các cột trạng thái có thể tùy chỉnh
- Giao diện List view với table
- Nút chuyển đổi view (Kanban ↔ List) ở header bar

- **Khách hàng** (ƯU TIÊN): 
  - Trạng thái mặc định: Tiềm năng, Hoạt động, Ngừng hoạt động
  - Có thể thêm/sửa/xóa trạng thái tùy chỉnh
  - Card hiển thị: Avatar, Tên, Mã KH, Email, SĐT, Loại, Hạn mức tín dụng
  
- **Dự án**: 
  - Trạng thái mặc định: Lập kế hoạch, Đang hoạt động, Tạm dừng, Hoàn thành, Đã hủy
  - Card hiển thị: Mã dự án, Tên, Khách hàng, Người quản lý, Ngân sách, Tiến độ (progress bar)
  
- **Báo giá**: 
  - Trạng thái mặc định: Nháp, Đã gửi, Đã xem, Đã chấp nhận, Từ chối, Hết hạn, Đã đóng
  - Card hiển thị: Số báo giá, Dự án, Khách hàng, Tổng tiền, Hạn hiệu lực
  
- **Hóa đơn**: 
  - Trạng thái mặc định: Nháp, Đã gửi, Chờ thanh toán, Đã thanh toán, Quá hạn, Đã hủy
  - Card hiển thị: Số hóa đơn, Dự án, Khách hàng, Tổng tiền, Hạn thanh toán, Trạng thái thanh toán

---

## THAM KHẢO BITRIX24 - DESIGN INSPIRATION

### Đặc điểm Giao diện Bitrix24
- **Header Bar**: Thanh công cụ phẳng, màu trắng/nền xám nhạt, các nút icon rõ ràng
- **Kanban Board**: 
  - Cột trạng thái có header màu xám nhạt (#F5F7F8), border mỏng
  - Cards có shadow nhẹ, border radius 4-6px
  - Màu sắc trạng thái được hiển thị ở viền trái của card (left border accent)
  - Khoảng cách giữa các cột: 12-16px
- **List View**: 
  - Table với header màu xám nhạt, sticky header khi scroll
  - Hover state: Background màu xanh nhạt (#E8F4FD)
  - Checkbox ở cột đầu tiên
  - Actions menu (3 dots) ở cột cuối
- **Color Palette Bitrix24**:
  - Primary Blue: #2FC6F6 hoặc #2066B0
  - Success Green: #9ECF00
  - Warning Yellow: #FFA900
  - Error Red: #FF5752
  - Background: #F5F7F8, #FFFFFF
  - Text: #535C69, #000000
- **Typography**: 
  - Font: Segoe UI hoặc Roboto
  - Size: 13-14px cho body text
  - Font-weight: 400 (regular), 600 (semibold) cho headers
- **Icons**: 
  - Style: Outline icons, size 16-18px
  - Màu: #535C69 (gray) cho inactive, #2066B0 (blue) cho active
- **Buttons**:
  - Primary: Background màu xanh (#2066B0), text trắng, border-radius 2-3px
  - Secondary: Background trắng, border xám, text xám đậm
  - Height: 28-32px
  - Padding: 8-12px horizontal

### Pattern Bitrix24 cần áp dụng:
1. **View Toggle**: Icon buttons cạnh nhau (Kanban icon | List icon), active state có background màu xanh nhạt
2. **Status Columns**: Header cột có background #F5F7F8, text màu #535C69, font-weight 600, **thanh tên trạng thái dạng thẻ có mũi nhọn chìa ra bên phải giống Bitrix24 (tab với góc phải vát nhọn)**
3. **Card Design**: 
   - Left border accent (4px) theo màu trạng thái
   - Padding: 12px
   - Hover: Shadow tăng nhẹ, cursor pointer
4. **Filter Bar**: 
   - Nằm dưới header, background trắng
   - Các filter chips có border, có thể xóa
5. **Quick Actions**: 
   - Menu dropdown khi click vào card
   - Icons + text labels
   - Divider giữa các nhóm actions

---

## YÊU CẦU THIẾT KẾ

### 1. GIAO DIỆN KANBAN BOARD

#### 1.1. Layout Tổng Quan (Theo Bitrix24)
- **Header Bar**: 
  - Background: Trắng (#FFFFFF) hoặc xám nhạt (#F5F7F8)
  - Tiêu đề module (Khách hàng / Dự án / Báo giá / Hóa đơn) - Font size: 18-20px, font-weight: 600
  - **Nút chuyển đổi view** (Bitrix24 style):
    - 2 icon buttons cạnh nhau: Kanban icon (4 cột) | List icon (dòng)
    - Active: Background #E8F4FD, icon color #2066B0
    - Inactive: Background transparent, icon color #535C69
    - Border: 1px solid #D5D7DB (khi inactive)
    - Border-radius: 2px
    - Padding: 8px 12px
  - Nút "Thêm mới" (+): 
    - Primary button style Bitrix24: Background #2066B0, text trắng
    - Icon + Text "Thêm mới"
    - Height: 32px
  - Bộ lọc (Filter icon): 
    - Icon button, có badge số lượng filter đang active
    - Dropdown menu với các filter options
  - Tìm kiếm (Search bar): 
    - Width: 250-300px
    - Border: 1px solid #D5D7DB
    - Border-radius: 2px
    - Placeholder: "Tìm kiếm..."
    - Icon search bên trái
  - Thống kê tổng quan: 
    - Badge số lượng items theo trạng thái (optional, có thể ẩn)
    - Màu xám nhạt, text nhỏ

#### 1.2. Kanban Board Structure (Bitrix24 Style)
- **Container**: 
  - Background: #F5F7F8 hoặc #FFFFFF
  - Horizontal Scroll: Board có thể scroll ngang để xem nhiều cột trạng thái
  - Padding: 16px
- **Các Cột Trạng thái** (Theo Bitrix24): 
  - Width: 280-300px (fixed)
  - Background: Trắng (#FFFFFF)
  - Border: 1px solid #E1E3E5
  - Border-radius: 4px
  - Margin-right: 12px
  - **Header cột**:
    - Background: #F5F7F8
    - Padding: 12px 16px
    - Border-bottom: 1px solid #E1E3E5
    - Tên trạng thái: Font-weight 600, size 13-14px, color #535C69, **hiển thị trong 1 thẻ (pill) có mũi nhọn chìa ra bên phải giống Bitrix24, tạo cảm giác như 1 tab stage**
    - Số lượng items: Badge màu xám (#9CA3AF), size 12px, margin-left 8px
    - Icon menu (3 dots) bên phải để quản lý cột
  - **Body cột**:
    - Padding: 8px
    - Min-height: 200px
    - Max-height: calc(100vh - 300px)
    - Overflow-y: auto
  - **Footer cột**:
    - Nút "+ Thêm" ở cuối mỗi cột
    - Style: Text link màu #2066B0, padding 8px
    - Hover: Background #E8F4FD
  - Có thể kéo thả (drag & drop) items giữa các cột
  - Khi drag: Card có opacity 0.5, shadow tăng
  - Khi hover vào cột đích: Border highlight màu xanh (#2066B0)

#### 1.3. Card Design (Items trong Kanban - Bitrix24 Style)

**⚠️ LƯU Ý:** Card design này áp dụng cho TẤT CẢ các module (Khách hàng, Dự án, Báo giá, Hóa đơn)

- **Kích thước**: 
  - Width: 100% (fit trong cột, trừ padding)
  - Height: Auto (tùy nội dung)
  - Border radius: 4px (theo Bitrix24)
  - Shadow: 0 1px 3px rgba(0,0,0,0.1)
  - Margin-bottom: 8px

- **Màu sắc Card** (Bitrix24):
  - Background: White (#FFFFFF)
  - Border: 1px solid #E1E3E5
  - **Left border accent**: 4px solid theo màu trạng thái (đặc trưng Bitrix24 - BẮT BUỘC)
  - Hover: 
    - Border color: #2066B0
    - Shadow: 0 2px 8px rgba(32, 102, 176, 0.15)
    - Cursor: pointer
  - Active/Dragging: Opacity 0.6

- **Nội dung Card - Khách hàng** (ƯU TIÊN):
  - **Padding**: 12px
  - **Header**: 
    - Avatar khách hàng (có thể là chữ cái đầu hoặc icon) - Size: 40px, border-radius: 50%
    - Tên khách hàng: Font-weight 600, size 14px, color #000000
    - Loại (Cá nhân/Công ty): Badge nhỏ, background #F5F7F8
    - Menu actions (3 dots) ở góc phải trên - Color #9CA3AF
  - **Body**:
    - Mã khách hàng: Color #9CA3AF, size 12px, margin-top 4px
    - Email: Size 13px, color #535C69, icon email nhỏ bên trái
    - Số điện thoại: Size 13px, color #535C69, icon phone nhỏ bên trái
    - Hạn mức tín dụng: Font-weight 600, size 13px, color #000000 (nếu có)
    - Tags/Labels (nếu có): 
      - Background #F5F7F8, border 1px solid #E1E3E5
      - Padding: 4px 8px, border-radius: 2px
      - Size: 11-12px
  - **Footer**:
    - Border-top: 1px solid #F5F7F8
    - Padding-top: 8px
    - Ngày tạo/Cập nhật: Size 11px, color #9CA3AF
    - User avatar (người phụ trách): Size 20px, border-radius: 50%

- **Nội dung Card - Dự án**:
  - **Header**: Icon dự án + Tên dự án (font-weight 600)
  - **Body**: Mã dự án, Khách hàng (link), Người quản lý (avatar nhỏ), Ngân sách, Tiến độ (progress bar)
  - **Footer**: Ngày bắt đầu/kết thúc, User avatar

- **Nội dung Card - Báo giá**:
  - **Header**: Icon báo giá + Số báo giá (font-weight 600)
  - **Body**: Dự án (link), Khách hàng, Tổng tiền (font-weight 600), Hạn hiệu lực
  - **Footer**: Ngày tạo, Nhân viên phụ trách

- **Nội dung Card - Hóa đơn**:
  - **Header**: Icon hóa đơn + Số hóa đơn (font-weight 600)
  - **Body**: Dự án (link), Khách hàng, Tổng tiền (font-weight 600), Hạn thanh toán
  - **Footer**: Trạng thái thanh toán (badge), Ngày tạo

#### 1.4. Trạng thái Mặc định (Màu sắc theo Bitrix24)

**Khách hàng:**
- Tiềm năng (Prospect) - #2FC6F6 (Bitrix Blue)
- Hoạt động (Active) - #9ECF00 (Bitrix Green)
- Ngừng hoạt động (Inactive) - #9CA3AF (Gray)
- Có thể thêm trạng thái tùy chỉnh

**Dự án:**
- Lập kế hoạch (Planning) - #9CA3AF (Gray)
- Đang hoạt động (Active) - #9ECF00 (Green)
- Tạm dừng (On Hold) - #FFA900 (Yellow)
- Hoàn thành (Completed) - #2066B0 (Dark Blue)
- Đã hủy (Cancelled) - #FF5752 (Red)

**Báo giá:**
- Nháp (Draft) - #9CA3AF (Gray)
- Đã gửi (Sent) - #2FC6F6 (Blue)
- Đã xem (Viewed) - #A855F7 (Purple - custom)
- Đã chấp nhận (Accepted) - #9ECF00 (Green)
- Từ chối (Declined) - #FF5752 (Red)
- Hết hạn (Expired) - #FFA900 (Yellow)
- Đã đóng (Closed) - #6B7280 (Dark Gray)

**Hóa đơn:**
- Nháp (Draft) - #9CA3AF (Gray)
- Đã gửi (Sent) - #2FC6F6 (Blue)
- Chờ thanh toán (Pending) - #FFA900 (Yellow)
- Đã thanh toán (Paid) - #9ECF00 (Green)
- Quá hạn (Overdue) - #FF5752 (Red)
- Đã hủy (Cancelled) - #6B7280 (Dark Gray)

**Lưu ý**: Màu sắc này sẽ được dùng cho:
- Left border accent của card (4px)
- Background của header cột (nhạt hơn 80% opacity)
- Badge trạng thái trong card

#### 1.5. Tính năng Tùy chỉnh Trạng thái (Bitrix24 Style)
- **Nút "Quản lý trạng thái"** ở header:
  - Icon settings/gear
  - Text: "Quản lý trạng thái"
  - Style: Secondary button (border, transparent background)
  - Position: Bên phải header, sau nút filter
- **Modal/Drawer** (Theo Bitrix24):
  - **Modal Style**:
    - Width: 600px (desktop)
    - Background: White
    - Border-radius: 4px
    - Shadow: 0 10px 40px rgba(0,0,0,0.15)
  - **Header Modal**:
    - Background: #F5F7F8
    - Padding: 16px 20px
    - Title: "Quản lý trạng thái" - Font-size 18px, font-weight 600
    - Close button (X): Góc phải trên, color #535C69
  - **Body Modal**:
    - Padding: 20px
    - Danh sách trạng thái hiện tại:
      - Mỗi item: Card style với left border accent
      - Hiển thị: Màu sắc (color picker), tên, icon
      - Actions: Edit (icon), Delete (icon) - màu đỏ khi hover
      - Có thể drag & drop để sắp xếp thứ tự
    - Nút "Thêm trạng thái mới":
      - Style: Primary button Bitrix24
      - Icon + Text
  - **Form Thêm/Sửa** (Inline hoặc trong modal riêng):
    - Tên trạng thái: Input field, placeholder "Nhập tên trạng thái"
    - Màu sắc: Color picker với các màu preset Bitrix24 + custom
    - Icon: Icon picker hoặc dropdown (optional)
    - Mô tả: Textarea (optional)
  - **Footer Modal**:
    - Border-top: 1px solid #E1E3E5
    - Padding: 16px 20px
    - Buttons: "Hủy" (secondary) và "Lưu" (primary) - align right
  - Xóa trạng thái: 
    - Có cảnh báo modal confirm
    - Hiển thị số lượng items sẽ bị ảnh hưởng
    - Buttons: "Hủy" và "Xóa" (màu đỏ)

---

### 2. GIAO DIỆN LIST VIEW

#### 2.1. Layout (Bitrix24 List View Style)
- **Header**: Giống Kanban (có nút chuyển đổi view)
- **Filter Bar** (Nếu có):
  - Background: White
  - Border-bottom: 1px solid #E1E3E5
  - Padding: 12px 16px
  - Filter chips: Có thể xóa, background #F5F7F8
- **Table/List** (Bitrix24 Style):
  - Background: White
  - **Table Header**:
    - Background: #F5F7F8
    - Sticky khi scroll
    - Border-bottom: 2px solid #E1E3E5
    - Height: 40px
    - Text: Font-weight 600, size 13px, color #535C69
    - Có thể click để sort (icon arrow up/down)
  - **Table Rows**:
    - Height: 48-52px
    - Border-bottom: 1px solid #F5F7F8
    - Hover: Background #E8F4FD (Bitrix24 hover color)
    - Selected: Background #D1E7F5
  - Có thể sắp xếp theo cột (click header)
  - Có checkbox ở cột đầu tiên để chọn nhiều items
  - **Pagination** (Bitrix24 style):
    - Position: Bottom right
    - Style: Page numbers + Previous/Next buttons
    - Background: White
    - Border: 1px solid #E1E3E5
    - Active page: Background #2066B0, text white
  - **Bulk Actions** (Khi chọn nhiều items):
    - Bar xuất hiện ở bottom với các actions: Xóa, Export, etc.
    - Background: #2066B0, text white

#### 2.2. Table Columns

**Khách hàng:**
- Checkbox
- Avatar + Tên
- Mã khách hàng
- Email
- Số điện thoại
- Loại (Cá nhân/Công ty)
- Hạn mức tín dụng
- Trạng thái (badge)
- Ngày tạo
- Actions (Xem, Sửa, Xóa)

**Dự án:**
- Checkbox
- Mã dự án + Tên
- Khách hàng
- Người quản lý
- Ngày bắt đầu - Kết thúc
- Ngân sách
- Tiến độ (progress bar)
- Trạng thái
- Ưu tiên
- Actions

**Báo giá:**
- Checkbox
- Số báo giá
- Dự án
- Khách hàng
- Tổng tiền
- Trạng thái
- Hạn hiệu lực
- Ngày tạo
- Nhân viên phụ trách
- Actions

**Hóa đơn:**
- Checkbox
- Số hóa đơn
- Dự án
- Khách hàng
- Tổng tiền
- Trạng thái
- Trạng thái thanh toán
- Hạn thanh toán
- Actions

---

### 3. NÚT CHUYỂN ĐỔI VIEW (Bitrix24 Style) - BẮT BUỘC

**⚠️ QUAN TRỌNG:** Nút này PHẢI có ở TẤT CẢ các module (Khách hàng, Dự án, Báo giá, Hóa đơn) và phải nổi bật, dễ nhận biết.

#### 3.1. Design - Icon Buttons (Theo Bitrix24)

**Thiết kế chính**:
- **2 icon buttons cạnh nhau** (không có border giữa, tạo thành 1 group button)
- **Kanban Icon**: Icon 4 cột (grid/columns) - Icon phổ biến: 4 hình chữ nhật dọc
- **List Icon**: Icon dòng (list/rows) - Icon phổ biến: 3 dòng ngang
- **Size**: Height 32px, width 40px mỗi button (tổng width: 80px)
- **Border**: 1px solid #D5D7DB (chung cho cả group, tạo thành 1 khối)
- **Border-radius**: 
  - Button trái (Kanban): 2px 0 0 2px
  - Button phải (List): 0 2px 2px 0
- **Active state** (View đang được chọn):
  - Background: #E8F4FD (Bitrix24 active background - màu xanh nhạt)
  - Icon color: #2066B0 (Bitrix24 blue - màu xanh đậm)
  - Border color: #2066B0
  - Font-weight: 600 (nếu có text)
- **Inactive state** (View không được chọn):
  - Background: Transparent hoặc white (#FFFFFF)
  - Icon color: #535C69 (gray)
  - Border color: #D5D7DB
- **Hover state** (khi hover vào button inactive):
  - Background: #F5F7F8 (xám nhạt)
  - Icon color: #2066B0 (chuyển sang xanh)
  - Cursor: pointer
- **Spacing**: Gap 0px giữa 2 buttons (dính liền nhau)
- **Transition**: Smooth transition 200ms khi chuyển đổi state

**Vị trí trong Header Bar**: 
- **BẮT BUỘC** phải có ở header bar của mỗi module
- Vị trí: Bên phải header, sau tiêu đề module
- Thứ tự: [Tiêu đề] → [View Toggle Buttons] → [Filter] → [Search] → [Thêm mới]
- Margin-left: 16px (từ tiêu đề)
- Margin-right: 16px (đến filter/search)

**Visual States cần thiết kế**:
1. **Kanban Active + List Inactive**: Kanban button có background xanh nhạt, List button trắng
2. **List Active + Kanban Inactive**: List button có background xanh nhạt, Kanban button trắng
3. **Hover states**: Cả 2 buttons đều có hover state riêng
4. **Loading state**: Khi đang chuyển đổi view, có thể hiển thị spinner nhỏ

**Alternative (Nếu cần text)**:
- Có thể thêm text "Kanban" và "Danh sách" dưới icon (height button tăng lên ~44px)
- Hoặc chỉ text, không icon (nhưng ưu tiên icon buttons vì tiết kiệm không gian)
- Nếu dùng text: Font-size 12px, color theo state (active: #2066B0, inactive: #535C69)

**Accessibility**:
- ARIA label: "Chuyển sang xem Kanban" / "Chuyển sang xem danh sách"
- Keyboard support: Tab để focus, Enter/Space để chọn
- Focus state: Border outline màu #2066B0, 2px

---

### 4. DESIGN SYSTEM (Bitrix24 Based)

#### 4.1. Màu sắc (Bitrix24 Color Palette)
- **Primary Blue**: #2066B0 (Dark Blue - buttons, links)
- **Primary Blue Light**: #2FC6F6 (Light Blue - accents)
- **Primary Blue Hover**: #E8F4FD (Hover backgrounds)
- **Success Green**: #9ECF00
- **Warning Yellow**: #FFA900
- **Error Red**: #FF5752
- **Background Colors**:
  - Main Background: #F5F7F8
  - Card/Content Background: #FFFFFF
  - Hover Background: #E8F4FD
  - Selected Background: #D1E7F5
- **Border Colors**:
  - Light: #E1E3E5
  - Medium: #D5D7DB
  - Dark: #9CA3AF
- **Text Colors**:
  - Primary: #000000
  - Secondary: #535C69
  - Tertiary: #9CA3AF
  - Disabled: #D1D5DB
- **Status Colors** (cho left border accent):
  - Blue: #2FC6F6
  - Green: #9ECF00
  - Yellow: #FFA900
  - Red: #FF5752
  - Gray: #9CA3AF
  - Purple: #A855F7 (custom)

#### 4.2. Typography (Bitrix24 Style)
- **Font Family**: 
  - Primary: Segoe UI (Windows) hoặc Roboto (Web)
  - Fallback: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif
- **Font Sizes**:
  - H1/Page Title: 20px, font-weight 600
  - H2/Section Title: 18px, font-weight 600
  - H3/Card Title: 14px, font-weight 600
  - Body: 13-14px, font-weight 400
  - Small/Helper: 11-12px, font-weight 400
- **Line Height**: 
  - Headings: 1.2
  - Body: 1.5
  - Small: 1.4

#### 4.3. Spacing (Bitrix24)
- Base unit: 4px
- **Padding**:
  - Cards: 12px
  - Buttons: 8px 12px (vertical horizontal)
  - Inputs: 8px 12px
  - Modal: 20px
- **Gaps**:
  - Giữa cards: 8px
  - Giữa cột Kanban: 12px
  - Giữa elements trong card: 8px
- **Margins**:
  - Section spacing: 16px
  - Component spacing: 12px

#### 4.4. Icons (Bitrix24 Style)
- **Style**: Outline icons (không fill)
- **Library**: 
  - Bitrix24 icon set (nếu có)
  - Hoặc Material Icons Outline / Feather Icons
- **Sizes**: 
  - Small: 16px
  - Medium: 18px
  - Large: 20px
  - XLarge: 24px
- **Colors**:
  - Default: #535C69
  - Active: #2066B0
  - Hover: #2066B0
  - Disabled: #D1D5DB

#### 4.5. Shadows (Bitrix24)
- **Card**: 0 1px 3px rgba(0,0,0,0.1)
- **Card Hover**: 0 2px 8px rgba(32, 102, 176, 0.15)
- **Modal**: 0 10px 40px rgba(0,0,0,0.15)
- **Dropdown**: 0 4px 12px rgba(0,0,0,0.1)

#### 4.6. Border Radius (Bitrix24)
- **Buttons**: 2px
- **Cards**: 4px
- **Inputs**: 2px
- **Modals**: 4px
- **Badges/Tags**: 2px
- **Avatars**: 50% (circle)

#### 4.7. Buttons (Bitrix24 Style)
- **Primary Button**:
  - Background: #2066B0
  - Text: White
  - Height: 32px
  - Padding: 8px 16px
  - Border-radius: 2px
  - Font-size: 13px
  - Hover: Background #1a4d8a
- **Secondary Button**:
  - Background: White
  - Text: #535C69
  - Border: 1px solid #D5D7DB
  - Height: 32px
  - Padding: 8px 16px
  - Hover: Background #F5F7F8
- **Icon Button**:
  - Size: 32px x 32px
  - Padding: 8px
  - Border-radius: 2px
  - Hover: Background #F5F7F8

---

### 5. RESPONSIVE DESIGN

#### 5.1. Desktop (≥1024px)
- Kanban: Hiển thị 4-5 cột cùng lúc
- List: Full table với tất cả columns

#### 5.2. Tablet (768px - 1023px)
- Kanban: 2-3 cột cùng lúc, scroll ngang
- List: Một số columns ẩn, có thể expand

#### 5.3. Mobile (<768px)
- Kanban: 1 cột, scroll dọc (chuyển thành list dọc)
- List: Card layout thay vì table

---

### 6. INTERACTIONS & ANIMATIONS

#### 6.1. Drag & Drop
- Card được kéo: Opacity giảm, scale nhỏ lại
- Cột đích: Highlight border khi hover
- Drop animation: Smooth transition

#### 6.2. View Switching
- Transition: Fade hoặc slide animation (300ms)
- Loading state: Skeleton screens khi đang chuyển

#### 6.3. Hover States
- Cards: Border color change, shadow increase
- Buttons: Background color change
- Icons: Color change

---

### 7. MODAL/DRAWER QUẢN LÝ TRẠNG THÁI

#### 7.1. Layout
- **Header**: 
  - Tiêu đề "Quản lý trạng thái"
  - Nút đóng (X)
- **Body**:
  - Danh sách trạng thái hiện tại (có thể drag & drop để sắp xếp)
  - Mỗi item: Màu sắc, tên, icon, nút sửa/xóa
  - Nút "Thêm trạng thái mới"
- **Footer**:
  - Nút "Hủy" và "Lưu"

#### 7.2. Form Thêm/Sửa Trạng thái
- Tên trạng thái (input)
- Màu sắc (color picker)
- Icon (icon picker hoặc dropdown)
- Mô tả (optional)

---

### 8. STATES & FEEDBACK

#### 8.1. Empty States
- Kanban: "Chưa có items trong trạng thái này"
- List: "Chưa có dữ liệu"

#### 8.2. Loading States
- Skeleton screens cho cards/rows
- Spinner khi đang tải

#### 8.3. Error States
- Toast notifications
- Inline error messages

---

### 9. ACCESSIBILITY

- Keyboard navigation support
- ARIA labels cho các interactive elements
- Focus states rõ ràng
- Color contrast đạt WCAG AA

---

### 10. PROTOTYPE REQUIREMENTS

- **Interactive Prototype** với:
  - Chuyển đổi giữa Kanban và List view
  - Drag & drop cards (nếu có thể)
  - Mở/đóng modal quản lý trạng thái
  - Hover states
  - Responsive breakpoints

---

## DELIVERABLES

**⚠️ YÊU CẦU BẮT BUỘC:** Tất cả deliverables phải có cho CẢ 4 MODULE (Khách hàng, Dự án, Báo giá, Hóa đơn)

1. **Design File** (.fig):
   - **Module Khách hàng** (ƯU TIÊN):
     - Desktop Kanban view (chi tiết)
     - Desktop List view (chi tiết)
     - Mobile Kanban view
     - Mobile List view
     - Modal quản lý trạng thái khách hàng
     - Card mẫu khách hàng (various states)
   - **Module Dự án**:
     - Desktop Kanban view
     - Desktop List view
     - Modal quản lý trạng thái dự án
   - **Module Báo giá**:
     - Desktop Kanban view
     - Desktop List view
     - Modal quản lý trạng thái báo giá
   - **Module Hóa đơn**:
     - Desktop Kanban view
     - Desktop List view
     - Modal quản lý trạng thái hóa đơn
   - **Component library** (dùng chung):
     - View toggle buttons (Kanban/List) - các states
     - Kanban cards (various types)
     - Table rows (List view)
     - Status badges
     - Buttons (Primary, Secondary, Icon)
     - Inputs, Modals, Dropdowns
     - Icons set

2. **Prototype** (Interactive):
   - Chuyển đổi giữa Kanban và List view (cho tất cả modules)
   - Drag & drop cards giữa các cột (nếu Figma hỗ trợ)
   - Mở/đóng modal quản lý trạng thái
   - Hover states trên cards và buttons
   - Click vào card để xem chi tiết (optional)
   - Responsive breakpoints (Desktop → Tablet → Mobile)

3. **Design Specs** (Export từ Figma):
   - Spacing system (4px grid)
   - Color palette (Bitrix24 based)
   - Typography scale
   - Component specifications (sizes, padding, margins)
   - Icon library reference

---

## NOTES & REFERENCES

### Tham khảo Bitrix24
- **Website**: https://www.bitrix24.com
- **Demo**: Xem các module CRM, Tasks, Projects trong Bitrix24 để hiểu rõ pattern
- **Key Features cần áp dụng**:
  - Kanban board với drag & drop mượt mà
  - List view với sticky header
  - Quick actions menu
  - Filter system
  - Status management
  - Color coding cho trạng thái

### Yêu cầu thiết kế
- **Giữ consistency** với design system Bitrix24
- **Ưu tiên UX**: Dễ sử dụng, trực quan, quen thuộc với người dùng Bitrix24
- **Performance**: Tối ưu cho số lượng items lớn (virtual scrolling nếu cần)
- **Accessibility**: Đảm bảo keyboard navigation, screen reader support
- **Responsive**: Hoạt động tốt trên mobile/tablet
- **Dark mode**: Có thể thiết kế thêm (optional, nhưng ưu tiên light mode trước)

### Checklist cho Designer

**⚠️ QUAN TRỌNG:** Checklist này áp dụng cho TẤT CẢ 4 MODULE

**Giao diện Khách hàng (ƯU TIÊN):**
- [ ] Header bar với view toggle buttons (Kanban/List) - Bitrix24 style
- [ ] Kanban board với cột trạng thái có thể tùy chỉnh (Tiềm năng, Hoạt động, Ngừng hoạt động)
- [ ] Cards khách hàng có left border accent theo màu trạng thái
- [ ] Card hiển thị đầy đủ: Avatar, Tên, Mã KH, Email, SĐT, Loại, Hạn mức tín dụng
- [ ] List view với sticky header và hover states (#E8F4FD)
- [ ] Table columns đầy đủ cho khách hàng
- [ ] Modal quản lý trạng thái khách hàng
- [ ] Filter bar (optional)
- [ ] Responsive breakpoints (Desktop, Tablet, Mobile)

**Giao diện Dự án:**
- [ ] Header bar với view toggle buttons
- [ ] Kanban board với cột trạng thái (Lập kế hoạch, Đang hoạt động, Tạm dừng, Hoàn thành, Đã hủy)
- [ ] Cards dự án có left border accent + progress bar
- [ ] List view với table đầy đủ columns
- [ ] Modal quản lý trạng thái dự án

**Giao diện Báo giá:**
- [ ] Header bar với view toggle buttons
- [ ] Kanban board với cột trạng thái (Nháp, Đã gửi, Đã xem, Đã chấp nhận, Từ chối, Hết hạn, Đã đóng)
- [ ] Cards báo giá có left border accent
- [ ] List view với table đầy đủ columns
- [ ] Modal quản lý trạng thái báo giá

**Giao diện Hóa đơn:**
- [ ] Header bar với view toggle buttons
- [ ] Kanban board với cột trạng thái (Nháp, Đã gửi, Chờ thanh toán, Đã thanh toán, Quá hạn, Đã hủy)
- [ ] Cards hóa đơn có left border accent
- [ ] List view với table đầy đủ columns
- [ ] Modal quản lý trạng thái hóa đơn

**Component Library:**
- [ ] View toggle buttons (tất cả states: active, inactive, hover, focus)
- [ ] Kanban cards (various types cho từng module)
- [ ] Table rows (List view)
- [ ] Status badges với màu sắc Bitrix24
- [ ] Buttons (Primary, Secondary, Icon)
- [ ] Inputs, Modals, Dropdowns
- [ ] Icons set (Kanban, List, Filter, Search, Settings, etc.)

**Prototype:**
- [ ] Interactive prototype với chuyển đổi view (tất cả modules)
- [ ] Hover states
- [ ] Modal interactions
- [ ] Responsive breakpoints demo

