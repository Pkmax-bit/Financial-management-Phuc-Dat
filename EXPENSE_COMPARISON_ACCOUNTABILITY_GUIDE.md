# Hướng dẫn So sánh Chi phí và Quy Trách nhiệm Dự án

## Tổng quan

Tính năng **So sánh Chi phí - Kế hoạch vs Thực tế** cho phép phân tích chi tiết từng khoản chi phí dự án và quy trách nhiệm rõ ràng cho các bộ phận liên quan.

## Vị trí Tính năng

- **URL:** `/reports/projects-detailed/[projectId]`
- **Component:** `frontend/src/app/reports/projects-detailed/[projectId]/page.tsx`
- **Section:** "Phân tích Chi phí - Kế hoạch vs Thực tế" (sau phần biểu đồ, trước tóm tắt)

## Cách hoạt động

### 1. Thu thập dữ liệu

#### Kế hoạch (Planned)
- **Nguồn:** `project.budget * 0.7` (70% ngân sách dự án)
- **Phân bổ:** Chia đều cho 5 danh mục chi phí
- **Lưu ý:** Trong hệ thống thực tế, nên lưu kế hoạch chi tiết theo danh mục

#### Thực tế (Actual)
- **Nguồn:** Bảng `project_expenses` với `status = 'approved'`
- **Nhóm theo:** `category` (Vật liệu, Nhân công, Thiết bị, Vận chuyển, Khác)
- **Bộ phận:** Lấy từ `employees.department_id` thông qua `employee_id`

### 2. Tính toán Chênh lệch (Variance)

```typescript
variance = actual - planned
variance_percent = (variance / planned) * 100
```

### 3. Xác định Trạng thái

| Trạng thái | Điều kiện | Màu sắc | Ý nghĩa |
|------------|-----------|---------|---------|
| **Vượt chi** (Over Budget) | `variance > 0` và `|variance_percent| >= 5%` | 🔴 Đỏ | Bộ phận chịu trách nhiệm giải trình |
| **Tiết kiệm** (Under Budget) | `variance < 0` và `|variance_percent| >= 5%` | 🟢 Xanh | Bộ phận được hưởng phần tiết kiệm |
| **Đúng kế hoạch** (On Budget) | `|variance_percent| < 5%` | ⚪ Xám | Chênh lệch chấp nhận được |

### 4. Quy Trách nhiệm

#### Trường hợp Vượt chi (Over Budget)
```
Responsible: [Bộ phận] (Chịu trách nhiệm vượt chi)
Note: Vượt chi [số tiền] - Bộ phận chịu trách nhiệm giải trình
```

**Hành động cần thiết:**
- Bộ phận phải giải trình lý do vượt chi
- Đề xuất giải pháp khắc phục
- Có thể ảnh hưởng đến đánh giá hiệu suất

#### Trường hợp Tiết kiệm (Under Budget)
```
Responsible: [Bộ phận] (Được hưởng phần tiết kiệm)
Note: Tiết kiệm [số tiền] - Được hưởng phần dư
```

**Hành động khen thưởng:**
- Bộ phận được hưởng một phần tiết kiệm theo quy định
- Ghi nhận vào KPI hiệu suất
- Khuyến khích tối ưu hóa chi phí

#### Trường hợp Đúng kế hoạch (On Budget)
```
Responsible: [Bộ phận]
Note: Đúng kế hoạch
```

**Ghi nhận:**
- Quản lý chi phí tốt
- Tuân thủ ngân sách

## Cấu trúc Dữ liệu

### Interface ExpenseComparison

```typescript
interface ExpenseComparison {
  category: string              // Danh mục chi phí
  department: string            // Bộ phận chịu trách nhiệm
  planned: number              // Chi phí kế hoạch (VND)
  actual: number               // Chi phí thực tế (VND)
  variance: number             // Chênh lệch (VND)
  variance_percent: number     // % Chênh lệch
  status: 'over_budget' | 'under_budget' | 'on_budget'
  responsible_party: string    // Bộ phận và vai trò trách nhiệm
  note: string                 // Ghi chú chi tiết
}
```

## Hiển thị trong UI

### Bảng So sánh

```
┌────────────┬───────────┬──────────┬───────────┬──────────┬─────────────────┬──────────────────┐
│ Danh mục   │ Kế hoạch  │ Thực tế  │ Chênh lệch│ % Biến động│ Trách nhiệm    │ Ghi chú          │
├────────────┼───────────┼──────────┼───────────┼──────────┼─────────────────┼──────────────────┤
│ 🎨 Vật liệu│ 100,000 ₫│ 120,000 ₫│ +20,000 ₫│ ↑ 20.0% │ Kho (Vượt chi)  │ Vượt chi 20k...  │
│ 👷 Nhân công│ 100,000 ₫│  85,000 ₫│ -15,000 ₫│ ↓ 15.0% │ Xưởng (Tiết kiệm)│ Tiết kiệm 15k... │
└────────────┴───────────┴──────────┴───────────┴──────────┴─────────────────┴──────────────────┘
```

### Mã màu

- **Nền đỏ nhạt:** Vượt chi - cần chú ý
- **Nền xanh nhạt:** Tiết kiệm - tốt
- **Nền trắng:** Đúng kế hoạch

### Chú giải

```
🔴 Vượt chi (Over Budget)
   Bộ phận chịu trách nhiệm giải trình và xử lý

🟢 Tiết kiệm (Under Budget)
   Bộ phận được hưởng phần tiết kiệm theo quy định

⚪ Đúng kế hoạch (On Budget)
   Chênh lệch dưới 5%, được chấp nhận
```

## Xuất báo cáo (Export)

### PDF Export
- **File:** `frontend/src/utils/reportExport.ts`
- **Section:** "PHÂN TÍCH CHI PHÍ - KẾ HOẠCH VS THỰC TẾ"
- **Màu header:** Cam (#FF8C00)
- **Định dạng:** Bảng chi tiết + Chú giải

### Excel Export
- **Sheet:** "So sánh chi phí" (Sheet 5)
- **Cột:** Danh mục | Kế hoạch | Thực tế | Chênh lệch | % | Trách nhiệm | Ghi chú
- **Footer:** Tổng cộng + Chú giải

## Cách sử dụng

### 1. Xem báo cáo

```
1. Vào /reports
2. Click "Báo cáo dự án chi tiết"
3. Chọn dự án muốn xem
4. Cuộn xuống phần "Phân tích Chi phí"
```

### 2. Phân tích

- **Sắp xếp:** Mặc định theo chênh lệch lớn nhất (variance)
- **Tập trung:** Các khoản vượt chi (đỏ) cần ưu tiên xử lý
- **Khen thưởng:** Các khoản tiết kiệm (xanh) ghi nhận công lao

### 3. Xuất báo cáo

```typescript
// PDF
handleExportToPDF()

// Excel  
handleExportToExcel()
```

Cả hai hàm đều tự động bao gồm phần so sánh chi phí.

## Cải tiến trong Tương lai

### 1. Kế hoạch Chi phí Chi tiết

Thay vì phân bổ đều, nên tạo bảng `project_budget_breakdown`:

```sql
CREATE TABLE project_budget_breakdown (
  id UUID PRIMARY KEY,
  project_id UUID REFERENCES projects(id),
  category VARCHAR(100),
  planned_amount DECIMAL(15,2),
  department_id UUID,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 2. Workflow Xử lý Vượt chi

```typescript
interface OverBudgetWorkflow {
  expense_comparison_id: string
  status: 'pending_explanation' | 'explained' | 'resolved'
  explanation: string
  action_plan: string
  resolved_by: string
  resolved_at: Date
}
```

### 3. Cơ chế Chia sẻ Tiết kiệm

```typescript
interface SavingDistribution {
  expense_comparison_id: string
  total_saving: number
  distribution: {
    department: string
    employee_id: string
    amount: number
    percentage: number
  }[]
}
```

### 4. Dashboard Hiệu suất Bộ phận

- Tổng hợp theo department
- Tỷ lệ vượt chi / tiết kiệm
- Xu hướng theo thời gian
- So sánh giữa các bộ phận

### 5. Cảnh báo Tự động

```typescript
// Gửi thông báo khi vượt chi > 10%
if (variance_percent > 10) {
  sendNotification({
    to: department_manager,
    type: 'over_budget_warning',
    severity: 'high'
  })
}
```

## Danh mục Chi phí Mặc định

| Danh mục | Mô tả | Ví dụ |
|----------|-------|-------|
| **Vật liệu** | Nguyên vật liệu, hàng hóa | Sắt thép, gỗ, sơn, đinh vít |
| **Nhân công** | Chi phí lao động trực tiếp | Công thợ, kỹ thuật viên |
| **Thiết bị** | Máy móc, công cụ, thuê thiết bị | Máy hàn, cần cẩu, xe nâng |
| **Vận chuyển** | Logistics, giao nhận | Xe tải, xăng dầu, phí đường |
| **Khác** | Chi phí phát sinh khác | Giấy phép, bảo hiểm, tiện ích |

## Quy định Chấp nhận Chênh lệch

- **< 5%:** Chấp nhận, không cần giải trình
- **5-10%:** Cần giải thích ngắn gọn
- **> 10%:** Cần giải trình chi tiết và kế hoạch khắc phục

## Files Liên quan

### Frontend
- `frontend/src/app/reports/projects-detailed/[projectId]/page.tsx` - Component chính
- `frontend/src/utils/reportExport.ts` - PDF & Excel export

### Backend
- `backend/routers/project_expenses.py` - API project expenses
- `backend/routers/projects.py` - API projects

### Documentation
- `PROJECT_DETAILED_REPORT_GUIDE.md` - Hướng dẫn báo cáo dự án tổng thể
- `PROJECT_REPORT_LOGIC_SUMMARY.md` - Logic tính toán báo cáo

## Ví dụ Tình huống Thực tế

### Tình huống 1: Vượt chi Vật liệu

```
Danh mục: Vật liệu
Kế hoạch: 50,000,000 ₫
Thực tế: 65,000,000 ₫
Chênh lệch: +15,000,000 ₫ (↑ 30%)
Trách nhiệm: Bộ phận Mua hàng (Chịu trách nhiệm vượt chi)

Hành động:
1. Bộ phận Mua hàng giải trình:
   - Giá nguyên vật liệu tăng 20% do biến động thị trường
   - Phải mua thêm 10% vật liệu do sai sót thiết kế ban đầu
2. Giải pháp:
   - Đàm phán lại với nhà cung cấp
   - Cải thiện quy trình kiểm tra thiết kế
3. Trách nhiệm: 
   - 50% do thị trường (bất khả kháng)
   - 50% do bộ phận (cần cải thiện)
```

### Tình huống 2: Tiết kiệm Nhân công

```
Danh mục: Nhân công
Kế hoạch: 80,000,000 ₫
Thực tế: 68,000,000 ₫
Chênh lệch: -12,000,000 ₫ (↓ 15%)
Trách nhiệm: Bộ phận Xưởng (Được hưởng phần tiết kiệm)

Khen thưởng:
1. Phân tích:
   - Cải thiện quy trình sản xuất, giảm 20% thời gian
   - Đào tạo công nhân tay nghề cao hơn
   - Không phát sinh làm thêm giờ
2. Thưởng:
   - 30% tiết kiệm (3,600,000 ₫) chia cho team xưởng
   - Ghi nhận vào KPI quý
3. Lan tỏa: Áp dụng quy trình mới cho các dự án khác
```

## Kết luận

Tính năng **So sánh Chi phí và Quy Trách nhiệm** giúp:

✅ **Minh bạch:** Rõ ràng ai chịu trách nhiệm khoản chi nào
✅ **Công bằng:** Người vượt chi giải trình, người tiết kiệm được thưởng
✅ **Cải thiện:** Học hỏi từ các dự án để tối ưu hóa chi phí
✅ **Động lực:** Khuyến khích tiết kiệm và quản lý tốt ngân sách

---

**Ngày tạo:** 2025-10-10  
**Version:** 1.0  
**Tác giả:** Financial Management System Team

