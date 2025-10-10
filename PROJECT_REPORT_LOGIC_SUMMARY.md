# Logic Tính toán Báo cáo Dự án - Tóm tắt

## 🎯 Mục đích

Hệ thống báo cáo dự án tính toán lợi nhuận dựa trên **dữ liệu thực tế** từ:
- ✅ **Hóa đơn** (Invoices) - Doanh thu thực tế
- ✅ **Chi phí dự án đã duyệt** (Project Expenses - approved) - Chi phí thực tế

**Báo giá** và **Chi phí dự án quote** chỉ dùng để **hiển thị so sánh** ở trang chi tiết, KHÔNG dùng tính lợi nhuận cuối.

---

## 📊 Logic tính toán

### 1. Trang Danh sách (`/reports/projects-detailed`)

```javascript
// DOANH THU THỰC TẾ (từ Hóa đơn)
actual_revenue = SUM(invoices.total_amount)
WHERE project_id = [project_id]
  AND status IN ['sent', 'paid', 'partial']

// CHI PHÍ THỰC TẾ (từ Chi phí dự án đã duyệt)
actual_costs = SUM(project_expenses.amount)
WHERE project_id = [project_id]
  AND status = 'approved'

// LỢI NHUẬN
actual_profit = actual_revenue - actual_costs

// BIÊN LỢI NHUẬN (%)
profit_margin = (actual_profit / actual_revenue) * 100
```

### 2. Trang Chi tiết (`/reports/projects-detailed/[projectId]`)

#### Phần THỰC TẾ (Bên phải - Màu xanh lá)
```javascript
// DOANH THU (Hóa đơn)
actual_revenue = SUM(invoices.total_amount)
WHERE status IN ['sent', 'paid', 'partial']

// CHI PHÍ (Chi phí dự án đã duyệt)
actual_costs = SUM(project_expenses.amount)
WHERE status = 'approved'

// LỢI NHUẬN CUỐI CÙNG
actual_profit = actual_revenue - actual_costs
```

#### Phần KẾ HOẠCH (Bên trái - Màu xanh dương)
```javascript
// CHỈ ĐỂ HIỂN THỊ SO SÁNH - KHÔNG DÙNG TÍNH LỢI NHUẬN

// Doanh thu dự kiến (từ Báo giá)
planned_revenue = SUM(quotes.total_amount)
WHERE status != 'rejected'

// Chi phí dự kiến
planned_costs = project.budget * 0.7

// Lợi nhuận dự kiến (chỉ để so sánh)
planned_profit = planned_revenue - planned_costs
```

---

## 🗂️ Cấu trúc Bảng Database

### Bảng sử dụng cho TÍNH LỢI NHUẬN:

#### 1. `invoices` - Hóa đơn (Doanh thu thực tế)
```sql
SELECT id, invoice_number, total_amount, status, created_at
FROM invoices
WHERE project_id = ?
  AND status IN ('sent', 'paid', 'partial')
```

#### 2. `project_expenses` - Chi phí dự án (Chi phí thực tế)
```sql
SELECT id, expense_code, amount, description, status, expense_date
FROM project_expenses
WHERE project_id = ?
  AND status = 'approved'
```

### Bảng chỉ để SO SÁNH (không tính lợi nhuận):

#### 3. `quotes` - Báo giá (Kế hoạch doanh thu)
```sql
SELECT id, quote_number, total_amount, status
FROM quotes
WHERE project_id = ?
  AND status != 'rejected'
```

#### 4. `project_expenses_quote` - Chi phí dự án báo giá (Kế hoạch chi phí)
```sql
SELECT id, amount, description
FROM project_expenses_quote
WHERE project_id = ?
  AND status != 'rejected'
```

---

## 📋 Ví dụ Minh họa

### Dự án: "Xây dựng Website ABC"

#### Dữ liệu:
- **Hóa đơn (Invoices):**
  - HD001: 50,000,000 VND (paid)
  - HD002: 30,000,000 VND (sent)
  - **Tổng: 80,000,000 VND** ✅

- **Chi phí dự án (Project Expenses - approved):**
  - CP001: 20,000,000 VND (vật liệu)
  - CP002: 15,000,000 VND (nhân công)
  - CP003: 10,000,000 VND (thiết bị)
  - **Tổng: 45,000,000 VND** ✅

- **Báo giá (Quotes) - chỉ để so sánh:**
  - BG001: 90,000,000 VND
  - **Tổng: 90,000,000 VND** (không dùng tính lợi nhuận)

#### Tính toán:

```
Lợi nhuận = Hóa đơn - Chi phí dự án
          = 80,000,000 - 45,000,000
          = 35,000,000 VND ✅

Biên lợi nhuận = (35,000,000 / 80,000,000) * 100
                = 43.75% ✅
```

---

## 🎨 Giao diện Hiển thị

### Trang Danh sách:

| Dự án | Khách hàng | Trạng thái | Hóa đơn | Chi phí | Lợi nhuận | Biên LN |
|-------|------------|------------|---------|---------|-----------|---------|
| Website ABC | Công ty XYZ | 🟢 Active | 🔵 80M (2 HĐ) | 🔴 45M (3 CP) | 🟢 35M (Lãi) | 🟢 43.8% |

### Trang Chi tiết - Layout 2 cột:

```
┌──────────────────────────────────────────────────────────────┐
│                       BÁO CÁO DỰ ÁN                          │
├──────────────────────────┬───────────────────────────────────┤
│  🔵 KẾ HOẠCH             │  🟢 THỰC TẾ                       │
│  (Chỉ để so sánh)       │  (Dùng tính lợi nhuận)           │
├──────────────────────────┼───────────────────────────────────┤
│  📄 Báo giá              │  📄 Hóa đơn                       │
│  90,000,000 VND          │  80,000,000 VND ✅                │
│                          │  (2 hóa đơn)                      │
├──────────────────────────┼───────────────────────────────────┤
│  💰 Chi phí dự kiến      │  💰 Chi phí dự án (Đã duyệt)     │
│  63,000,000 VND          │  45,000,000 VND ✅                │
│  (70% ngân sách)         │  (3 chi phí)                      │
├──────────────────────────┼───────────────────────────────────┤
│  📊 Lợi nhuận dự kiến    │  📊 Lợi nhuận thực tế            │
│  27,000,000 VND          │  35,000,000 VND ✅                │
│                          │  = 80M - 45M                      │
└──────────────────────────┴───────────────────────────────────┘

📈 Biểu đồ so sánh
📊 Tóm tắt
```

---

## ⚡ Trạng thái Quan trọng

### Hóa đơn (Invoices):

**Trường `status`:**
- ✅ **sent** - Đã gửi (được tính)
- ✅ **paid** - Đã thanh toán đầy đủ (được tính)
- ❌ **draft** - Nháp (KHÔNG tính)

**Trường `payment_status`:** (chỉ để theo dõi, không dùng filter)
- pending - Chưa thanh toán
- partial - Thanh toán một phần
- paid - Đã thanh toán đầy đủ

### Chi phí dự án (Project Expenses):
- ✅ **approved** - Đã duyệt (được tính)
- ❌ **pending** - Chờ duyệt (KHÔNG tính)
- ❌ **draft** - Nháp (KHÔNG tính)
- ❌ **rejected** - Từ chối (KHÔNG tính)

---

## 🔍 Kiểm tra Dữ liệu

### Query kiểm tra Doanh thu:
```sql
SELECT 
  p.name AS project_name,
  COUNT(i.id) AS invoice_count,
  SUM(i.total_amount) AS total_revenue
FROM projects p
LEFT JOIN invoices i ON p.id = i.project_id
WHERE i.status IN ('sent', 'paid', 'partial')
GROUP BY p.id, p.name;
```

### Query kiểm tra Chi phí:
```sql
SELECT 
  p.name AS project_name,
  COUNT(pe.id) AS expense_count,
  SUM(pe.amount) AS total_costs
FROM projects p
LEFT JOIN project_expenses pe ON p.id = pe.project_id
WHERE pe.status = 'approved'
GROUP BY p.id, p.name;
```

### Query kiểm tra Lợi nhuận:
```sql
SELECT 
  p.name AS project_name,
  COALESCE(SUM(i.total_amount), 0) AS revenue,
  COALESCE(SUM(pe.amount), 0) AS costs,
  COALESCE(SUM(i.total_amount), 0) - COALESCE(SUM(pe.amount), 0) AS profit
FROM projects p
LEFT JOIN invoices i ON p.id = i.project_id 
  AND i.status IN ('sent', 'paid', 'partial')
LEFT JOIN project_expenses pe ON p.id = pe.project_id 
  AND pe.status = 'approved'
GROUP BY p.id, p.name;
```

---

## 📝 Lưu ý Quan trọng

1. **Chỉ chi phí DỰ ÁN được tính:** Dùng bảng `project_expenses`, KHÔNG dùng `expenses` (chi phí chung)

2. **Trạng thái phải chính xác:**
   - Hóa đơn: `sent`, `paid`, `partial`
   - Chi phí: `approved`

3. **Báo giá chỉ để so sánh:** Không ảnh hưởng đến lợi nhuận cuối cùng

4. **Công thức bất biến:**
   ```
   Lợi nhuận = Hóa đơn - Chi phí dự án (đã duyệt)
   ```

5. **Biên lợi nhuận tính theo doanh thu thực tế:**
   ```
   Biên LN = (Lợi nhuận / Hóa đơn) × 100%
   ```

---

## 🎯 Kết luận

- ✅ **Dùng tính lợi nhuận:** `invoices` + `project_expenses` (approved)
- 📊 **Chỉ hiển thị so sánh:** `quotes` + `project_expenses_quote`
- 🔢 **Công thức:** Lợi nhuận = Hóa đơn - Chi phí dự án
- 📈 **Biên LN:** (Lợi nhuận / Hóa đơn) × 100%

---

**Ngày cập nhật:** 10/10/2025  
**Phiên bản:** 2.0  
**Trạng thái:** ✅ Đã triển khai

