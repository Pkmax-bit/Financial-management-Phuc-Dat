# Hướng dẫn Báo cáo Dự án Chi tiết

## Tổng quan

Hệ thống báo cáo dự án chi tiết cung cấp giao diện phân tích toàn diện về kế hoạch và thực tế của từng dự án, bao gồm:
- Danh sách tổng quan các dự án
- Báo cáo chi tiết so sánh Kế hoạch vs Thực tế
- Biểu đồ trực quan hóa dữ liệu
- Tóm tắt và phân tích số liệu

## Cấu trúc

### 1. Trang Danh sách Báo cáo Dự án
**Đường dẫn:** `/reports/projects-detailed`

**Tính năng:**
- ✅ Hiển thị danh sách tất cả dự án với thông tin tổng quan
- ✅ Thống kê tổng hợp: Tổng dự án, Doanh thu, Chi phí, Lợi nhuận
- ✅ Tìm kiếm dự án theo tên, mã dự án, khách hàng
- ✅ Lọc theo trạng thái dự án
- ✅ Hiển thị thông tin cho mỗi dự án:
  - Thông tin cơ bản (tên, mã, khách hàng, trạng thái)
  - Kế hoạch (số báo giá, doanh thu dự kiến)
  - Thực tế (số hóa đơn, doanh thu thực tế)
  - Lợi nhuận và biên lợi nhuận
  - Số lượng chi phí
- ✅ Nút "Xem chi tiết" để truy cập báo cáo chi tiết

### 2. Trang Báo cáo Chi tiết Dự án
**Đường dẫn:** `/reports/projects-detailed/[projectId]`

**Layout 2 cột:**

#### Cột TRÁI - KẾ HOẠCH (Màu xanh dương)
- **Báo giá (Doanh thu dự kiến)**
  - Danh sách tất cả báo giá
  - Mã báo giá, mô tả, ngày tạo
  - Số tiền và trạng thái
  - Tổng doanh thu dự kiến

- **Chi phí dự kiến**
  - Tính toán dựa trên ngân sách dự án (70% budget)
  - Hiển thị lợi nhuận dự kiến

#### Cột PHẢI - THỰC TẾ (Màu xanh lá)
- **Hóa đơn (Doanh thu thực tế)**
  - Danh sách tất cả hóa đơn đã phát hành
  - Mã hóa đơn, mô tả, ngày tạo
  - Số tiền và trạng thái
  - Tổng doanh thu thực tế

- **Chi phí thực tế**
  - Danh sách chi phí đã phê duyệt
  - Mã chi phí, mô tả, số tiền
  - Tổng chi phí thực tế
  - Lợi nhuận thực tế
  - Chênh lệch với kế hoạch

### 3. Biểu đồ (Phía dưới)

#### Biểu đồ Cột - So sánh Kế hoạch vs Thực tế
- Hiển thị 3 chỉ số: Doanh thu, Chi phí, Lợi nhuận
- 2 cột màu: Xanh dương (Kế hoạch) và Xanh lá (Thực tế)
- Dễ dàng so sánh trực quan

#### Biểu đồ Tròn - Phân bổ Chi phí
- Phân loại chi phí theo danh mục:
  - Vật liệu (Materials)
  - Nhân công (Labor)
  - Thiết bị (Equipment)
  - Vận chuyển (Transport)
  - Khác (Other)
- Hiển thị tỷ lệ phần trăm và số tiền

### 4. Phần Tóm tắt

**Thẻ thống kê nhanh:**
- Tổng Doanh thu (từ hóa đơn)
- Tổng Chi phí (từ chi phí thực tế)
- Lợi nhuận ròng và biên lợi nhuận

**Nhận xét chi tiết:**
- Chênh lệch doanh thu (Thực tế - Kế hoạch)
- Chênh lệch chi phí (Thực tế - Kế hoạch)
- Chênh lệch lợi nhuận (Thực tế - Kế hoạch)

## Cách sử dụng

### Xem danh sách dự án:
1. Vào menu **Báo cáo** > **Báo cáo dự án**
2. Hoặc truy cập trực tiếp: `/reports/projects-detailed`
3. Sử dụng thanh tìm kiếm để lọc dự án
4. Chọn trạng thái để lọc theo tiêu chí

### Xem báo cáo chi tiết:
1. Từ danh sách, click nút **"Xem chi tiết"** trên dòng dự án
2. Xem thông tin so sánh 2 cột (Kế hoạch vs Thực tế)
3. Cuộn xuống để xem biểu đồ và tóm tắt
4. Click **"Xuất báo cáo PDF"** để in hoặc lưu

### Phân tích dữ liệu:
- **So sánh màu sắc:** 
  - Xanh dương = Kế hoạch
  - Xanh lá = Thực tế
  - Xanh (Profit > 0) / Đỏ (Profit < 0)

- **Đọc biểu đồ:**
  - Biểu đồ cột: So sánh trực tiếp giữa kế hoạch và thực tế
  - Biểu đồ tròn: Xem cơ cấu chi phí của dự án

## Công nghệ sử dụng

- **Frontend Framework:** Next.js 14 (App Router)
- **UI Components:** Tailwind CSS, Lucide Icons
- **Charting Library:** Chart.js 4.x + react-chartjs-2
- **Database:** Supabase (PostgreSQL)
- **State Management:** React Hooks (useState, useEffect)

## Cấu trúc File

```
frontend/src/app/reports/
├── projects-detailed/
│   ├── page.tsx                    # Trang danh sách
│   └── [projectId]/
│       └── page.tsx                # Trang chi tiết
└── page.tsx                        # Trang báo cáo chính (đã cập nhật)
```

## Dữ liệu nguồn

### Kế hoạch (Plan):
- **Doanh thu dự kiến:** Từ bảng `quotes` (status != 'rejected')
- **Chi phí dự kiến:** Tính toán từ `budget` của dự án (70% budget)

### Thực tế (Actual):
- **Doanh thu thực tế:** Từ bảng `invoices` (status != 'draft')
- **Chi phí thực tế:** Từ bảng `expenses` (status = 'approved')

## Các chỉ số tính toán

```javascript
// Doanh thu
planned_revenue = SUM(quotes.total_amount) WHERE status != 'rejected'
actual_revenue = SUM(invoices.total_amount) WHERE status != 'draft'

// Chi phí
planned_costs = project.budget * 0.7
actual_costs = SUM(expenses.amount) WHERE status = 'approved'

// Lợi nhuận
planned_profit = planned_revenue - planned_costs
actual_profit = actual_revenue - actual_costs

// Biên lợi nhuận
profit_margin = (actual_profit / actual_revenue) * 100

// Chênh lệch
revenue_variance = actual_revenue - planned_revenue
cost_variance = actual_costs - planned_costs
profit_variance = actual_profit - planned_profit
```

## Tính năng nổi bật

### 1. Giao diện trực quan 2 cột
- Dễ dàng so sánh Kế hoạch và Thực tế
- Màu sắc phân biệt rõ ràng
- Hiển thị chi tiết từng giao dịch

### 2. Biểu đồ động
- Tự động cập nhật khi có dữ liệu mới
- Responsive trên mọi thiết bị
- Tooltip hiển thị thông tin chi tiết

### 3. Tìm kiếm và lọc mạnh mẽ
- Tìm kiếm theo nhiều tiêu chí
- Lọc theo trạng thái
- Real-time filtering

### 4. Xuất báo cáo
- In trực tiếp (Print to PDF)
- Giữ nguyên format và biểu đồ
- Sẵn sàng chia sẻ với khách hàng

## Lưu ý quan trọng

1. **Dữ liệu thời gian thực:** Trang sẽ tự động tải dữ liệu mới nhất từ database
2. **Quyền truy cập:** Chỉ user có role phù hợp mới xem được báo cáo
3. **Performance:** Với dự án có nhiều giao dịch, có thể mất vài giây để tải
4. **Responsive:** Giao diện tối ưu cho cả desktop và mobile

## Tính năng có thể mở rộng

- [ ] Thêm lọc theo khoảng thời gian
- [ ] So sánh nhiều dự án cùng lúc
- [ ] Xuất Excel với dữ liệu chi tiết
- [ ] Thêm biểu đồ đường thời gian
- [ ] Email báo cáo định kỳ
- [ ] Dashboard widget cho từng dự án
- [ ] Cảnh báo khi vượt ngân sách

## Hỗ trợ

Nếu gặp vấn đề hoặc cần hỗ trợ, vui lòng liên hệ team phát triển hoặc tạo issue trên repository.

---

**Phiên bản:** 1.0.0  
**Ngày tạo:** Tháng 10, 2025  
**Tác giả:** Financial Management System Team

