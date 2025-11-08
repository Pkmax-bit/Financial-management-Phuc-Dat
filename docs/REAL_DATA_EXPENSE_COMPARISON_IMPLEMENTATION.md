# Triển khai So sánh Chi phí - Sử dụng Dữ liệu Thực từ Database

## Tổng quan

Đã cập nhật tính năng **So sánh Chi phí - Kế hoạch vs Thực tế** để sử dụng dữ liệu thực từ database thay vì mock/hardcode.

## Thay đổi Chính

### 1. **Nguồn dữ liệu CHI PHÍ KẾ HOẠCH**

#### ❌ Trước (Mock data):
```typescript
// Hardcode - phân bổ từ budget
const plannedCosts = project?.budget ? project.budget * 0.7 : 0
const plannedPerCategory = plannedCosts / categories.length // Chia đều 5 danh mục
```

#### ✅ Sau (Real data from DB):
```typescript
// Lấy từ bảng project_expenses_quote
const { data: projectExpenseQuotesData } = await supabase
  .from('project_expenses_quote')
  .select(`
    *,
    employees:employee_id (
      id,
      full_name,
      department_id
    ),
    expense_categories:department_id (
      id,
      name
    )
  `)
  .eq('project_id', projectId)
  .order('expense_date', { ascending: false })

const totalExpenseQuotes = expenseQuotes.reduce((sum, eq) => sum + (eq.amount || 0), 0)
```

### 2. **Nhóm Chi phí theo Danh mục Thực tế**

#### ❌ Trước (Hardcode categories):
```typescript
const categories = ['Vật liệu', 'Nhân công', 'Thiết bị', 'Vận chuyển', 'Khác']
// Fixed 5 categories
```

#### ✅ Sau (Dynamic from DB):
```typescript
// Group PLANNED costs
const plannedMap = new Map()
expenseQuotes.forEach(eq => {
  const category = eq.expense_categories?.name || eq.description?.split(' ')[0] || 'Khác'
  // ...
})

// Group ACTUAL costs
const actualMap = new Map()
expenses.forEach(exp => {
  const category = exp.expense_categories?.name || exp.description?.split(' ')[0] || 'Khác'
  // ...
})

// Merge all categories from both
const allCategories = new Set([...plannedMap.keys(), ...actualMap.keys()])
```

### 3. **Xử lý Trường hợp Đặc biệt**

#### ✅ Chi phí phát sinh (không có kế hoạch):
```typescript
if (planned === 0 && actual > 0) {
  status = 'over_budget'
  responsible_party = `${department} (Chi phí ngoài kế hoạch)`
  note = `Chi phí phát sinh ${formatCurrency(actual)} - Không có trong kế hoạch ban đầu`
}
```

#### ✅ Kế hoạch chưa thực hiện:
```typescript
if (actual === 0 && planned > 0) {
  status = 'under_budget'
  responsible_party = `${department} (Chưa thực hiện)`
  note = `Chưa phát sinh chi phí - Kế hoạch ${formatCurrency(planned)}`
}
```

#### ✅ Bỏ qua nếu cả hai đều 0:
```typescript
if (planned === 0 && actual === 0) {
  return // Skip this category
}
```

### 4. **Lợi nhuận Kế hoạch**

#### ❌ Trước:
```typescript
const plannedCosts = project.budget * 0.7 // Mock
const plannedProfit = totalQuotes - plannedCosts
```

#### ✅ Sau:
```typescript
const totalExpenseQuotes = expenseQuotes.reduce((sum, eq) => sum + (eq.amount || 0), 0)
const plannedProfit = totalQuotes - totalExpenseQuotes // Real
```

## Cấu trúc Database

### Bảng `project_expenses_quote` (Chi phí Kế hoạch)

```sql
CREATE TABLE project_expenses_quote (
  id UUID PRIMARY KEY,
  expense_code TEXT,
  description TEXT NOT NULL,
  amount NUMERIC(18,2) NOT NULL DEFAULT 0,
  currency TEXT DEFAULT 'VND',
  expense_date DATE NOT NULL,
  status TEXT DEFAULT 'pending', -- pending, approved, rejected
  notes TEXT,
  receipt_url TEXT,
  
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  department_id UUID REFERENCES expense_categories(id) ON DELETE SET NULL, -- Category
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Bảng `project_expenses` (Chi phí Thực tế)

```sql
CREATE TABLE project_expenses (
  id UUID PRIMARY KEY,
  expense_code TEXT,
  description TEXT NOT NULL,
  amount NUMERIC(18,2) NOT NULL DEFAULT 0,
  currency TEXT DEFAULT 'VND',
  expense_date DATE NOT NULL,
  status TEXT DEFAULT 'pending', -- pending, approved, rejected
  notes TEXT,
  receipt_url TEXT,
  
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  department_id UUID REFERENCES expense_categories(id) ON DELETE SET NULL, -- Category
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Bảng `expense_categories` (Danh mục Chi phí)

```sql
CREATE TABLE expense_categories (
  id UUID PRIMARY KEY,
  name VARCHAR(100) NOT NULL, -- Vật liệu, Nhân công, Thiết bị...
  description TEXT,
  icon VARCHAR(50),
  color VARCHAR(20),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Quy trình Sử dụng

### 1. **Tạo Chi phí Kế hoạch** (Lập dự toán)

```typescript
// Frontend: CreateProjectExpenseDialog.tsx
const createExpenseQuote = async (data) => {
  await api.post('/project-expenses/quotes', {
    description: 'Vật liệu xây dựng',
    amount: 50000000,
    expense_date: '2025-10-15',
    project_id: projectId,
    department_id: categoryId, // Expense category
    status: 'pending'
  })
}
```

### 2. **Duyệt Chi phí Kế hoạch** (Nếu cần)

```typescript
// Backend: approve_project_expense_quote
// Convert from project_expenses_quote → project_expenses
PUT /project-expenses/quotes/{quoteId}/approve
```

### 3. **Tạo Chi phí Thực tế** (Phát sinh thực)

```typescript
const createExpense = async (data) => {
  await api.post('/project-expenses', {
    description: 'Vật liệu xây dựng - Thực tế',
    amount: 55000000, // Actual amount
    expense_date: '2025-10-20',
    project_id: projectId,
    department_id: categoryId,
    status: 'approved'
  })
}
```

### 4. **Xem So sánh trong Báo cáo**

```
/reports/projects-detailed/[projectId]
→ Section "Phân tích Chi phí - Kế hoạch vs Thực tế"
```

## Ví dụ Thực tế

### Tình huống 1: Chi phí đúng kế hoạch

```javascript
// Kế hoạch (project_expenses_quote)
{
  description: 'Vật liệu xây dựng',
  amount: 50000000,
  department_id: 'category-vat-lieu'
}

// Thực tế (project_expenses)
{
  description: 'Vật liệu xây dựng - Thực tế',
  amount: 51000000, // +2% variance
  department_id: 'category-vat-lieu'
}

// So sánh
Category: Vật liệu
Planned: 50,000,000 ₫
Actual: 51,000,000 ₫
Variance: +1,000,000 ₫ (↑ 2.0%)
Status: on_budget (< 5%)
```

### Tình huống 2: Vượt chi đáng kể

```javascript
// Kế hoạch
{
  description: 'Nhân công xây dựng',
  amount: 80000000,
  department_id: 'category-nhan-cong'
}

// Thực tế
{
  description: 'Nhân công xây dựng + Làm thêm giờ',
  amount: 95000000, // +18.75% variance
  department_id: 'category-nhan-cong'
}

// So sánh
Category: Nhân công
Planned: 80,000,000 ₫
Actual: 95,000,000 ₫
Variance: +15,000,000 ₫ (↑ 18.8%)
Status: over_budget
Responsible: Bộ phận Xưởng (Chịu trách nhiệm vượt chi)
Note: Vượt chi 15,000,000 ₫ - Bộ phận chịu trách nhiệm giải trình
```

### Tình huống 3: Chi phí ngoài kế hoạch

```javascript
// Kế hoạch: Không có

// Thực tế
{
  description: 'Sửa chữa hư hỏng đột xuất',
  amount: 10000000,
  department_id: 'category-sua-chua'
}

// So sánh
Category: Sửa chữa
Planned: 0 ₫
Actual: 10,000,000 ₫
Variance: +10,000,000 ₫
Status: over_budget
Responsible: Bộ phận Kỹ thuật (Chi phí ngoài kế hoạch)
Note: Chi phí phát sinh 10,000,000 ₫ - Không có trong kế hoạch ban đầu
```

### Tình huống 4: Tiết kiệm

```javascript
// Kế hoạch
{
  description: 'Vận chuyển',
  amount: 20000000,
  department_id: 'category-van-chuyen'
}

// Thực tế
{
  description: 'Vận chuyển - Tự lo',
  amount: 15000000, // -25% variance
  department_id: 'category-van-chuyen'
}

// So sánh
Category: Vận chuyển
Planned: 20,000,000 ₫
Actual: 15,000,000 ₫
Variance: -5,000,000 ₫ (↓ 25.0%)
Status: under_budget
Responsible: Bộ phận Logistics (Được hưởng phần tiết kiệm)
Note: Tiết kiệm 5,000,000 ₫ - Được hưởng phần dư
```

## Files Đã Thay đổi

### 1. `frontend/src/app/reports/projects-detailed/[projectId]/page.tsx`

**Thêm state:**
```typescript
const [expenseQuotes, setExpenseQuotes] = useState<any[]>([])
```

**Fetch data:**
```typescript
// Line 213-231: Fetch project_expenses_quote
const { data: projectExpenseQuotesData } = await supabase
  .from('project_expenses_quote')
  .select(`
    *,
    employees:employee_id (id, full_name, department_id),
    expense_categories:department_id (id, name)
  `)
  .eq('project_id', projectId)
  .order('expense_date', { ascending: false })

setExpenseQuotes(projectExpenseQuotesData || [])
```

**Tính toán:**
```typescript
// Line 421-422: Total expense quotes
const totalExpenseQuotes = expenseQuotes.reduce((sum, eq) => sum + (eq.amount || 0), 0)
const plannedProfit = totalQuotes - totalExpenseQuotes
```

**So sánh:**
```typescript
// Line 432-553: Expense comparison logic
const expenseComparison = useMemo(() => {
  // Group planned costs from expenseQuotes
  // Group actual costs from expenses
  // Compare by category
  // Handle special cases
}, [expenses, expenseQuotes])
```

### 2. `frontend/src/utils/reportExport.ts`

**Interface update:**
```typescript
interface ProjectReportData {
  summary: {
    plannedCosts: number // From totalExpenseQuotes, not mock
  }
  expenseComparison?: Array<{...}> // Already updated
}
```

## Lợi ích

### ✅ Độ chính xác cao
- Dữ liệu thực từ database, không phụ thuộc vào mock
- So sánh chính xác từng khoản chi phí theo category
- Phản ánh đúng tình hình tài chính dự án

### ✅ Linh hoạt
- Tự động nhận diện tất cả categories có trong dữ liệu
- Xử lý các trường hợp đặc biệt (phát sinh ngoài kế hoạch, chưa thực hiện)
- Không bị giới hạn bởi 5 danh mục cố định

### ✅ Trách nhiệm rõ ràng
- Xác định chính xác bộ phận/category nào vượt chi
- Phân biệt rõ vượt chi theo kế hoạch vs ngoài kế hoạch
- Ghi nhận tiết kiệm của từng bộ phận

### ✅ Tích hợp hoàn chỉnh
- Liên kết với `expense_categories` để quản lý danh mục
- Join với `employees` để biết người chịu trách nhiệm
- Export PDF/Excel với dữ liệu đầy đủ

## Hướng dẫn Migration (nếu đã có dữ liệu cũ)

### Bước 1: Kiểm tra dữ liệu hiện tại

```sql
-- Xem có bao nhiêu dự án đang dùng budget mock
SELECT 
  p.id, 
  p.name, 
  p.budget,
  COUNT(pe.id) as actual_expenses_count,
  COUNT(peq.id) as planned_expenses_count
FROM projects p
LEFT JOIN project_expenses pe ON p.id = pe.project_id
LEFT JOIN project_expenses_quote peq ON p.id = peq.project_id
GROUP BY p.id
HAVING COUNT(peq.id) = 0 -- Dự án chưa có chi phí kế hoạch
```

### Bước 2: Tạo chi phí kế hoạch từ budget

```sql
-- Script tạo chi phí kế hoạch mặc định từ budget
INSERT INTO project_expenses_quote (
  id, description, amount, expense_date, 
  project_id, department_id, status
)
SELECT 
  uuid_generate_v4(),
  'Chi phí dự kiến - ' || ec.name,
  (p.budget * 0.7 / (SELECT COUNT(*) FROM expense_categories)),
  p.start_date,
  p.id,
  ec.id,
  'pending'
FROM projects p
CROSS JOIN expense_categories ec
WHERE p.budget IS NOT NULL
  AND p.budget > 0
  AND NOT EXISTS (
    SELECT 1 FROM project_expenses_quote peq 
    WHERE peq.project_id = p.id
  );
```

### Bước 3: Verify

```sql
-- Kiểm tra lại
SELECT 
  p.name,
  COUNT(peq.id) as planned_count,
  SUM(peq.amount) as planned_total,
  p.budget,
  SUM(peq.amount) / NULLIF(p.budget, 0) * 100 as percentage
FROM projects p
LEFT JOIN project_expenses_quote peq ON p.id = peq.project_id
GROUP BY p.id, p.name, p.budget;
```

## Kết luận

Tính năng **So sánh Chi phí** hiện đã:

- ✅ Sử dụng 100% dữ liệu thực từ database
- ✅ Không còn mock/hardcode
- ✅ Linh hoạt với mọi danh mục chi phí
- ✅ Xử lý đầy đủ các trường hợp đặc biệt
- ✅ Tích hợp với hệ thống quản lý chi phí hiện tại

**Sẵn sàng triển khai production!** 🚀

---

**Ngày cập nhật:** 2025-10-10  
**Version:** 2.0 (Real Data Implementation)  
**Tác giả:** Financial Management System Team

