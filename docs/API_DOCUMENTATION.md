# Tài liệu API - Financial Management System

## Tổng quan

Hệ thống quản lý tài chính Phúc Đạt cung cấp các API endpoints để quản lý:
- Xác thực và người dùng
- Dự án (Projects)
- Khách hàng (Customers)
- Bán hàng (Sales): Quotes, Invoices, Sales Receipts
- Chi phí (Expenses): Expenses, Bills, Vendors
- Nhân viên (Employees)
- Báo cáo (Reports)
- Dashboard
- Tasks
- Và nhiều module khác

**Base URL**: `http://localhost:8000` (development) hoặc production URL

**Authentication**: Hầu hết các endpoint yêu cầu JWT token trong header:
```
Authorization: Bearer <token>
```

---

## 1. Authentication & User Management (`/api/auth`)

### 1.1. Đăng ký người dùng
- **Endpoint**: `POST /api/auth/register`
- **Mô tả**: Đăng ký tài khoản người dùng mới
- **Request Body**:
```json
{
  "email": "user@example.com",
  "password": "password123",
  "full_name": "Nguyễn Văn A",
  "role": "employee"
}
```
- **Response**: `UserResponse` với thông tin người dùng đã tạo

### 1.2. Đăng nhập
- **Endpoint**: `POST /api/auth/login`
- **Mô tả**: Đăng nhập và nhận JWT token
- **Request Body**:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```
- **Response**:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in": 3600
}
```

### 1.3. Đăng xuất
- **Endpoint**: `POST /api/auth/logout`
- **Mô tả**: Đăng xuất người dùng
- **Response**: `{"message": "Successfully logged out"}`

### 1.4. Lấy thông tin người dùng hiện tại
- **Endpoint**: `GET /api/auth/me`
- **Mô tả**: Lấy thông tin người dùng đang đăng nhập
- **Response**: `UserResponse` với thông tin đầy đủ

### 1.5. Cập nhật thông tin người dùng
- **Endpoint**: `PUT /api/auth/me`
- **Mô tả**: Cập nhật thông tin người dùng hiện tại
- **Request Body**: `UserUpdate` (partial update)

### 1.6. Đổi mật khẩu
- **Endpoint**: `POST /api/auth/change-password`
- **Mô tả**: Đổi mật khẩu người dùng
- **Request Body**:
```json
{
  "current_password": "oldpass",
  "new_password": "newpass"
}
```

### 1.7. Yêu cầu reset mật khẩu
- **Endpoint**: `POST /api/auth/password-reset/request`
- **Mô tả**: Gửi email reset mật khẩu
- **Request Body**:
```json
{
  "email": "user@example.com"
}
```

### 1.8. Reset mật khẩu
- **Endpoint**: `POST /api/auth/reset-password`
- **Mô tả**: Đặt lại mật khẩu với token
- **Request Body**:
```json
{
  "token": "reset_token",
  "new_password": "newpass123"
}
```

### 1.9. Lấy danh sách người dùng (Admin only)
- **Endpoint**: `GET /api/auth/users`
- **Query Parameters**: `skip`, `limit`
- **Response**: Danh sách `UserResponse`

### 1.10. Cập nhật người dùng (Admin only)
- **Endpoint**: `PUT /api/auth/users/{user_id}`
- **Request Body**: `UserUpdate`

### 1.11. Xóa người dùng (Admin only)
- **Endpoint**: `DELETE /api/auth/users/{user_id}`
- **Response**: `{"message": "User deactivated successfully"}`

---

## 2. Dashboard (`/api/dashboard`)

### 2.1. Thống kê tổng quan
- **Endpoint**: `GET /api/dashboard/stats`
- **Mô tả**: Lấy thống kê tổng quan cho dashboard
- **Response**:
```json
{
  "totalRevenue": 1000000,
  "totalExpenses": 500000,
  "profitLoss": 500000,
  "cashBalance": 500000,
  "openInvoices": 10,
  "overdueInvoices": 2,
  "paidLast30Days": 800000,
  "pendingBills": 5,
  "expensesByCategory": [...],
  "monthlyRevenueData": [...],
  "topCustomers": [...],
  "recentTransactions": [...],
  "bankAccounts": [...]
}
```

### 2.2. Dự báo dòng tiền
- **Endpoint**: `GET /api/dashboard/cashflow/projection`
- **Query Parameters**: `months` (default: 6)
- **Response**: Dự báo dòng tiền theo tháng

### 2.3. Sự kiện lịch
- **Endpoint**: `GET /api/dashboard/planner/events`
- **Mô tả**: Lấy các sự kiện tài chính sắp tới
- **Response**: Danh sách events (invoices, bills, expenses)

### 2.4. Tính toán kịch bản What-If
- **Endpoint**: `POST /api/dashboard/planner/scenario`
- **Request Body**:
```json
{
  "revenue_change": 10,
  "expense_change": 5,
  "new_expense": 50000,
  "months": 6
}
```

---

## 3. Projects (`/api/projects`)

### 3.1. Lấy danh sách dự án
- **Endpoint**: `GET /api/projects`
- **Query Parameters**:
  - `skip`: Số bản ghi bỏ qua (default: 0)
  - `limit`: Số bản ghi trả về (default: 100, max: 1000)
  - `search`: Tìm kiếm theo tên/mô tả
  - `customer_id`: Lọc theo khách hàng
  - `status`: Lọc theo trạng thái
- **Response**: Danh sách `Project` với `customer_name` và `manager_name`

### 3.2. Lấy danh sách ID dự án
- **Endpoint**: `GET /api/projects/list-ids`
- **Response**: `{"projects": [...], "count": 10}`

### 3.3. Lấy thông tin dự án
- **Endpoint**: `GET /api/projects/{project_id}`
- **Response**: `Project` với đầy đủ thông tin

### 3.4. Tạo dự án mới
- **Endpoint**: `POST /api/projects`
- **Request Body**: `ProjectCreate`
- **Yêu cầu**: Manager hoặc Admin
- **Response**: `Project` đã tạo

### 3.5. Cập nhật dự án
- **Endpoint**: `PUT /api/projects/{project_id}`
- **Request Body**: `ProjectUpdate`
- **Yêu cầu**: Manager hoặc Admin

### 3.6. Lấy dự án theo khách hàng
- **Endpoint**: `GET /api/projects/by-customer/{customer_id}`
- **Query Parameters**: `status` (optional)
- **Response**: Danh sách dự án của khách hàng

### 3.7. Lấy options dropdown dự án
- **Endpoint**: `GET /api/projects/dropdown-options/{customer_id}`
- **Response**: Danh sách dự án dạng dropdown

### 3.8. Validate dự án - khách hàng
- **Endpoint**: `GET /api/projects/validate-project-customer`
- **Query Parameters**: `project_id`, `customer_id`
- **Response**: `{"valid": true/false, "project": {...}}`

### 3.9. Quản lý trạng thái dự án
- **Lấy danh sách trạng thái**: `GET /api/projects/statuses`
- **Tạo trạng thái**: `POST /api/projects/statuses`
- **Cập nhật trạng thái**: `PUT /api/projects/statuses/{status_id}`
- **Xóa trạng thái**: `DELETE /api/projects/statuses/{status_id}`

### 3.10. Time Entries
- **Lấy time entries**: `GET /api/projects/{project_id}/time-entries`
  - Query: `skip`, `limit`, `employee_id`, `start_date`, `end_date`
- **Tạo time entry**: `POST /api/projects/{project_id}/time-entries`
  - Request Body: `TimeEntryCreate`

### 3.11. Phân tích lợi nhuận dự án
- **Endpoint**: `GET /api/projects/{project_id}/profitability`
- **Response**: Phân tích lợi nhuận chi tiết với revenue, costs, profit margins

### 3.12. Thống kê dự án
- **Endpoint**: `GET /api/projects/stats/overview`
- **Query Parameters**: `start_date`, `end_date`
- **Response**: Thống kê tổng quan các dự án

### 3.13. So sánh lợi nhuận dự án
- **Endpoint**: `GET /api/projects/profitability/comparison`
- **Query Parameters**: `start_date`, `end_date`, `status`, `sort_by`, `sort_order`
- **Response**: So sánh lợi nhuận giữa các dự án

### 3.14. Báo cáo chi tiết dự án
- **Endpoint**: `GET /api/projects/{project_id}/detailed-report`
- **Query Parameters**: `include_transactions` (default: true)
- **Response**: Báo cáo chi tiết với tất cả giao dịch

### 3.15. Tóm tắt tài chính dự án
- **Endpoint**: `GET /api/projects/{project_id}/financial-summary`
- **Response**: Tóm tắt tài chính cho dashboard dự án

### 3.16. Dashboard dự án
- **Endpoint**: `GET /api/projects/{project_id}/dashboard`
- **Response**: Metrics và hoạt động gần đây

### 3.17. Cập nhật trạng thái dự án
- **Endpoint**: `PUT /api/projects/{project_id}/status`
- **Query Parameters**: `status`
- **Yêu cầu**: Manager hoặc Admin

---

## 4. Customers (`/api/customers`)

### 4.1. Lấy danh sách khách hàng
- **Endpoint**: `GET /api/customers`
- **Query Parameters**: `skip`, `limit`, `search`, `status`, `level`
- **Response**: Danh sách `Customer`

### 4.2. Lấy thông tin khách hàng
- **Endpoint**: `GET /api/customers/{customer_id}`
- **Response**: `Customer` với đầy đủ thông tin

### 4.3. Tạo khách hàng mới
- **Endpoint**: `POST /api/customers`
- **Request Body**: `CustomerCreate`
- **Response**: `Customer` đã tạo

### 4.4. Cập nhật khách hàng
- **Endpoint**: `PUT /api/customers/{customer_id}`
- **Request Body**: `CustomerUpdate`

### 4.5. Xóa khách hàng
- **Endpoint**: `DELETE /api/customers/{customer_id}`
- **Response**: `{"message": "Customer deleted successfully"}`

### 4.6. Lấy mã khách hàng tiếp theo
- **Endpoint**: `GET /api/customers/next-customer-code`
- **Response**: `{"next_customer_code": "CUS001"}`

### 4.7. Lấy lịch sử giao dịch khách hàng
- **Endpoint**: `GET /api/customers/{customer_id}/transactions`
- **Response**: Danh sách invoices, payments, expenses

### 4.8. Cập nhật cấp độ khách hàng
- **Endpoint**: `PUT /api/customers/{customer_id}/level`
- **Request Body**: `{"level": "gold"}`

---

## 5. Sales (`/api/sales`)

### 5.1. Quotes (Báo giá)

#### 5.1.1. Lấy danh sách quotes
- **Endpoint**: `GET /api/sales/quotes`
- **Query Parameters**: `skip`, `limit`, `search`, `customer_id`, `status`
- **Response**: Danh sách `Quote`

#### 5.1.2. Lấy thông tin quote
- **Endpoint**: `GET /api/sales/quotes/{quote_id}`
- **Response**: `Quote` với items

#### 5.1.3. Tạo quote mới
- **Endpoint**: `POST /api/sales/quotes`
- **Request Body**: `QuoteCreate`
- **Response**: `Quote` đã tạo

#### 5.1.4. Cập nhật quote
- **Endpoint**: `PUT /api/sales/quotes/{quote_id}`
- **Request Body**: `QuoteUpdate`

#### 5.1.5. Xóa quote
- **Endpoint**: `DELETE /api/sales/quotes/{quote_id}`

#### 5.1.6. Chuyển quote thành invoice
- **Endpoint**: `POST /api/sales/quotes/{quote_id}/convert-to-invoice`
- **Request Body**: `QuoteConvertToInvoice`
- **Response**: `Invoice` đã tạo

#### 5.1.7. Gửi quote qua email
- **Endpoint**: `POST /api/sales/quotes/{quote_id}/send`
- **Request Body**: `QuoteSendRequest` (customizable email content)

### 5.2. Invoices (Hóa đơn)

#### 5.2.1. Lấy danh sách invoices
- **Endpoint**: `GET /api/sales/invoices`
- **Query Parameters**: `skip`, `limit`, `search`, `customer_id`, `project_id`, `status`, `payment_status`
- **Response**: Danh sách `Invoice`

#### 5.2.2. Lấy thông tin invoice
- **Endpoint**: `GET /api/sales/invoices/{invoice_id}`
- **Response**: `Invoice` với items và payments

#### 5.2.3. Tạo invoice mới
- **Endpoint**: `POST /api/sales/invoices`
- **Request Body**: `InvoiceCreate`
- **Response**: `Invoice` đã tạo

#### 5.2.4. Cập nhật invoice
- **Endpoint**: `PUT /api/sales/invoices/{invoice_id}`
- **Request Body**: `InvoiceUpdate`

#### 5.2.5. Xóa invoice
- **Endpoint**: `DELETE /api/sales/invoices/{invoice_id}`

#### 5.2.6. Ghi nhận thanh toán invoice
- **Endpoint**: `POST /api/sales/invoices/{invoice_id}/payments`
- **Request Body**: `PaymentCreate`
- **Response**: `Payment` đã tạo

### 5.3. Sales Receipts (Phiếu thu)

#### 5.3.1. Lấy danh sách sales receipts
- **Endpoint**: `GET /api/sales/sales-receipts`
- **Query Parameters**: `skip`, `limit`, `search`, `customer_id`, `project_id`
- **Response**: Danh sách `SalesReceipt`

#### 5.3.2. Lấy thông tin sales receipt
- **Endpoint**: `GET /api/sales/sales-receipts/{receipt_id}`
- **Response**: `SalesReceipt`

#### 5.3.3. Tạo sales receipt mới
- **Endpoint**: `POST /api/sales/sales-receipts`
- **Request Body**: `SalesReceiptCreate`
- **Response**: `SalesReceipt` đã tạo

#### 5.3.4. Cập nhật sales receipt
- **Endpoint**: `PUT /api/sales/sales-receipts/{receipt_id}`
- **Request Body**: `SalesReceiptUpdate`

#### 5.3.5. Xóa sales receipt
- **Endpoint**: `DELETE /api/sales/sales-receipts/{receipt_id}`

### 5.4. Payments (Thanh toán)

#### 5.4.1. Lấy danh sách payments
- **Endpoint**: `GET /api/sales/payments`
- **Query Parameters**: `skip`, `limit`, `invoice_id`, `customer_id`
- **Response**: Danh sách `Payment`

#### 5.4.2. Lấy thông tin payment
- **Endpoint**: `GET /api/sales/payments/{payment_id}`
- **Response**: `Payment`

#### 5.4.3. Tạo payment mới
- **Endpoint**: `POST /api/sales/payments`
- **Request Body**: `PaymentCreate`
- **Response**: `Payment` đã tạo

#### 5.4.4. Cập nhật payment
- **Endpoint**: `PUT /api/sales/payments/{payment_id}`
- **Request Body**: `PaymentUpdate`

#### 5.4.5. Xóa payment
- **Endpoint**: `DELETE /api/sales/payments/{payment_id}`

---

## 6. Expenses (`/api/expenses`)

### 6.1. Expenses (Chi phí)

#### 6.1.1. Lấy danh sách expenses
- **Endpoint**: `GET /api/expenses/expenses`
- **Query Parameters**: 
  - `skip`, `limit`, `search`
  - `employee_id`, `project_id`, `customer_id`
  - `category`, `status_filter`
  - `is_billable`, `is_reimbursable`
  - `payment_method`
- **Response**: Danh sách `Expense`

#### 6.1.2. Lấy thông tin expense
- **Endpoint**: `GET /api/expenses/expenses/{expense_id}`
- **Response**: `Expense`

#### 6.1.3. Tạo expense mới
- **Endpoint**: `POST /api/expenses/expenses`
- **Request Body**: `ExpenseCreate`
- **Response**: `Expense` đã tạo

#### 6.1.4. Cập nhật expense
- **Endpoint**: `PUT /api/expenses/expenses/{expense_id}`
- **Request Body**: `ExpenseUpdate`

#### 6.1.5. Xóa expense
- **Endpoint**: `DELETE /api/expenses/expenses/{expense_id}`

#### 6.1.6. Gửi expense để duyệt
- **Endpoint**: `POST /api/expenses/expenses/{expense_id}/submit`
- **Response**: `{"message": "Expense submitted for approval successfully"}`

#### 6.1.7. Duyệt expense
- **Endpoint**: `PUT /api/expenses/expenses/{expense_id}/approve`
- **Yêu cầu**: Manager hoặc Admin
- **Response**: Duyệt expense và tất cả children

#### 6.1.8. Từ chối expense
- **Endpoint**: `PUT /api/expenses/expenses/{expense_id}/reject`
- **Query Parameters**: `reason`
- **Yêu cầu**: Manager hoặc Admin

#### 6.1.9. Hoàn trả expense
- **Endpoint**: `POST /api/expenses/expenses/reimbursement`
- **Request Body**: `ExpenseReimbursement` với `expense_ids`
- **Yêu cầu**: Manager hoặc Admin

#### 6.1.10. Lấy billable expenses
- **Endpoint**: `GET /api/expenses/expenses/billable`
- **Query Parameters**: `customer_id`, `project_id`, `unbilled_only`
- **Response**: Danh sách expenses có thể bill

### 6.2. Bills (Hóa đơn phải trả)

#### 6.2.1. Lấy danh sách bills
- **Endpoint**: `GET /api/expenses/bills`
- **Query Parameters**: 
  - `skip`, `limit`, `search`
  - `vendor_id`, `project_id`, `status`
  - `overdue_only`, `due_soon`
- **Response**: Danh sách `Bill`

#### 6.2.2. Lấy thông tin bill
- **Endpoint**: `GET /api/expenses/bills/{bill_id}`
- **Response**: `Bill`

#### 6.2.3. Tạo bill mới
- **Endpoint**: `POST /api/expenses/bills`
- **Request Body**: `BillCreate`
- **Yêu cầu**: Manager hoặc Admin
- **Response**: `Bill` đã tạo

#### 6.2.4. Cập nhật bill
- **Endpoint**: `PUT /api/expenses/bills/{bill_id}`
- **Request Body**: `BillUpdate`
- **Yêu cầu**: Manager hoặc Admin

#### 6.2.5. Ghi nhận thanh toán bill
- **Endpoint**: `PUT /api/expenses/bills/{bill_id}/payment`
- **Query Parameters**: `payment_amount`, `payment_date`
- **Yêu cầu**: Manager hoặc Admin

### 6.3. Vendors (Nhà cung cấp)

#### 6.3.1. Lấy danh sách vendors
- **Endpoint**: `GET /api/expenses/vendors`
- **Query Parameters**: `skip`, `limit`, `search`, `vendor_type`, `status`
- **Response**: Danh sách `Vendor`

#### 6.3.2. Lấy thông tin vendor
- **Endpoint**: `GET /api/expenses/vendors/{vendor_id}`
- **Response**: `Vendor`

#### 6.3.3. Tạo vendor mới
- **Endpoint**: `POST /api/expenses/vendors`
- **Request Body**: `VendorCreate`
- **Yêu cầu**: Manager hoặc Admin
- **Response**: `Vendor` đã tạo

#### 6.3.4. Cập nhật vendor
- **Endpoint**: `PUT /api/expenses/vendors/{vendor_id}`
- **Request Body**: `VendorUpdate`
- **Yêu cầu**: Manager hoặc Admin

#### 6.3.5. Lấy bills của vendor
- **Endpoint**: `GET /api/expenses/vendors/{vendor_id}/bills`
- **Query Parameters**: `skip`, `limit`, `status`
- **Response**: Danh sách bills của vendor

### 6.4. Dashboard & Analytics

#### 6.4.1. Thống kê dashboard expenses
- **Endpoint**: `GET /api/expenses/dashboard/stats`
- **Query Parameters**: `start_date`, `end_date`
- **Response**: Thống kê expenses, bills, vendors

#### 6.4.2. Nhắc nhở thanh toán bills
- **Endpoint**: `GET /api/expenses/bills/due-reminders`
- **Response**: Bills overdue, due today, due soon

#### 6.4.3. Tóm tắt expenses theo category
- **Endpoint**: `GET /api/expenses/expenses/categories/summary`
- **Query Parameters**: `start_date`, `end_date`
- **Response**: Tóm tắt expenses theo category

### 6.5. Project Integration

#### 6.5.1. Lấy projects cho customer
- **Endpoint**: `GET /api/expenses/projects/by-customer/{customer_id}`
- **Response**: Danh sách projects của customer

#### 6.5.2. Lấy dropdown options projects
- **Endpoint**: `GET /api/expenses/projects/dropdown-options/{customer_id}`
- **Response**: Options cho dropdown

#### 6.5.3. Validate project-customer
- **Endpoint**: `GET /api/expenses/validate-project-customer`
- **Query Parameters**: `project_id`, `customer_id`
- **Response**: `{"valid": true/false}`

---

## 7. Employees (`/api/employees`)

### 7.1. Lấy danh sách employees
- **Endpoint**: `GET /api/employees`
- **Query Parameters**: `skip`, `limit`, `search`, `department_id`, `position_id`, `status`
- **Response**: Danh sách `Employee`

### 7.2. Lấy thông tin employee
- **Endpoint**: `GET /api/employees/{employee_id}`
- **Response**: `Employee`

### 7.3. Tạo employee mới
- **Endpoint**: `POST /api/employees`
- **Request Body**: `EmployeeCreate`
- **Yêu cầu**: Manager hoặc Admin
- **Response**: `Employee` đã tạo

### 7.4. Cập nhật employee
- **Endpoint**: `PUT /api/employees/{employee_id}`
- **Request Body**: `EmployeeUpdate`
- **Yêu cầu**: Manager hoặc Admin

### 7.5. Xóa employee
- **Endpoint**: `DELETE /api/employees/{employee_id}`
- **Yêu cầu**: Manager hoặc Admin

### 7.6. Departments (Phòng ban)
- **Lấy danh sách**: `GET /api/employees/departments`
- **Tạo**: `POST /api/employees/departments`
- **Cập nhật**: `PUT /api/employees/departments/{department_id}`
- **Xóa**: `DELETE /api/employees/departments/{department_id}`

### 7.7. Positions (Chức vụ)
- **Lấy danh sách**: `GET /api/employees/positions`
- **Tạo**: `POST /api/employees/positions`
- **Cập nhật**: `PUT /api/employees/positions/{position_id}`
- **Xóa**: `DELETE /api/employees/positions/{position_id}`

---

## 8. Reports (`/api/reports`)

### 8.1. Financial Reports

#### 8.1.1. P&L Report (Báo cáo lãi lỗ)
- **Endpoint**: `GET /api/reports/financial/pl-report`
- **Query Parameters**: `start_date`, `end_date`, `format`
- **Response**: Báo cáo lãi lỗ chi tiết

#### 8.1.2. Balance Sheet (Bảng cân đối kế toán)
- **Endpoint**: `GET /api/reports/financial/balance-sheet`
- **Query Parameters**: `as_of_date`, `format`
- **Response**: Bảng cân đối kế toán

#### 8.1.3. Cash Flow Statement (Báo cáo lưu chuyển tiền tệ)
- **Endpoint**: `GET /api/reports/financial/cash-flow`
- **Query Parameters**: `start_date`, `end_date`, `format`
- **Response**: Báo cáo lưu chuyển tiền tệ

#### 8.1.4. Cash Flow Vietnamese
- **Endpoint**: `GET /api/reports/financial/cash-flow-vietnamese`
- **Response**: Báo cáo lưu chuyển tiền tệ (tiếng Việt)

#### 8.1.5. Drill-Down Reports
- **Endpoint**: `GET /api/reports/financial/drill-down`
- **Query Parameters**: `account_code`, `start_date`, `end_date`
- **Response**: Chi tiết giao dịch theo tài khoản

### 8.2. Sales Reports

#### 8.2.1. Sales by Customer
- **Endpoint**: `GET /api/reports/sales/by-customer`
- **Query Parameters**: `start_date`, `end_date`
- **Response**: Doanh số theo khách hàng

### 8.3. Expense Reports

#### 8.3.1. Expenses by Vendor
- **Endpoint**: `GET /api/reports/expenses/by-vendor`
- **Query Parameters**: `start_date`, `end_date`
- **Response**: Chi phí theo nhà cung cấp

### 8.4. Accountant Reports

#### 8.4.1. General Ledger (Sổ cái)
- **Endpoint**: `GET /api/reports/accountant/general-ledger`
- **Query Parameters**: `start_date`, `end_date`, `account_code`
- **Response**: Sổ cái chi tiết

### 8.5. Project Reports

#### 8.5.1. Project Detailed Report
- **Endpoint**: `GET /api/reports/projects/{project_id}/detailed`
- **Query Parameters**: `include_transactions`, `format`
- **Response**: Báo cáo chi tiết dự án

#### 8.5.2. Export Project Report to Excel
- **Endpoint**: `GET /api/reports/projects/{project_id}/export-excel`
- **Response**: File Excel

---

## 9. Tasks (`/api/tasks`)

### 9.1. Tasks Management

#### 9.1.1. Lấy danh sách tasks
- **Endpoint**: `GET /api/tasks`
- **Query Parameters**: `skip`, `limit`, `search`, `project_id`, `status`, `priority`, `assignee_id`
- **Response**: Danh sách `Task`

#### 9.1.2. Lấy thông tin task
- **Endpoint**: `GET /api/tasks/{task_id}`
- **Response**: `Task` với đầy đủ thông tin

#### 9.1.3. Tạo task mới
- **Endpoint**: `POST /api/tasks`
- **Request Body**: `TaskCreate`
- **Response**: `Task` đã tạo

#### 9.1.4. Cập nhật task
- **Endpoint**: `PUT /api/tasks/{task_id}`
- **Request Body**: `TaskUpdate`

#### 9.1.5. Xóa task
- **Endpoint**: `DELETE /api/tasks/{task_id}`

### 9.2. Task Groups

#### 9.2.1. Lấy danh sách task groups
- **Endpoint**: `GET /api/tasks/groups`
- **Response**: Danh sách `TaskGroup`

#### 9.2.2. Tạo task group
- **Endpoint**: `POST /api/tasks/groups`
- **Request Body**: `TaskGroupCreate`

#### 9.2.3. Cập nhật task group
- **Endpoint**: `PUT /api/tasks/groups/{group_id}`
- **Request Body**: `TaskGroupUpdate`

#### 9.2.4. Xóa task group
- **Endpoint**: `DELETE /api/tasks/groups/{group_id}`

### 9.3. Task Assignments

#### 9.3.1. Gán task cho người dùng
- **Endpoint**: `POST /api/tasks/{task_id}/assign`
- **Request Body**: `{"user_id": "...", "role": "assignee"}`

#### 9.3.2. Hủy gán task
- **Endpoint**: `DELETE /api/tasks/{task_id}/assign/{assignment_id}`

### 9.4. Task Comments

#### 9.4.1. Lấy comments của task
- **Endpoint**: `GET /api/tasks/{task_id}/comments`
- **Response**: Danh sách `TaskComment`

#### 9.4.2. Thêm comment
- **Endpoint**: `POST /api/tasks/{task_id}/comments`
- **Request Body**: `TaskCommentCreate`

#### 9.4.3. Cập nhật comment
- **Endpoint**: `PUT /api/tasks/{task_id}/comments/{comment_id}`
- **Request Body**: `TaskCommentUpdate`

#### 9.4.4. Xóa comment
- **Endpoint**: `DELETE /api/tasks/{task_id}/comments/{comment_id}`

### 9.5. Task Attachments

#### 9.5.1. Lấy attachments của task
- **Endpoint**: `GET /api/tasks/{task_id}/attachments`
- **Response**: Danh sách `TaskAttachment`

#### 9.5.2. Upload attachment
- **Endpoint**: `POST /api/tasks/{task_id}/attachments`
- **Request**: Multipart form với file

#### 9.5.3. Xóa attachment
- **Endpoint**: `DELETE /api/tasks/{task_id}/attachments/{attachment_id}`

### 9.6. Task Checklists

#### 9.6.1. Lấy checklists của task
- **Endpoint**: `GET /api/tasks/{task_id}/checklists`
- **Response**: Danh sách `TaskChecklist`

#### 9.6.2. Tạo checklist
- **Endpoint**: `POST /api/tasks/{task_id}/checklists`
- **Request Body**: `TaskChecklistCreate`

#### 9.6.3. Cập nhật checklist item
- **Endpoint**: `PUT /api/tasks/{task_id}/checklists/{checklist_id}/items/{item_id}`
- **Request Body**: `TaskChecklistItemUpdate`

### 9.7. Task Time Logging

#### 9.7.1. Bắt đầu log time
- **Endpoint**: `POST /api/tasks/{task_id}/time-logs/start`
- **Request Body**: `TaskTimeLogStart`

#### 9.7.2. Dừng log time
- **Endpoint**: `POST /api/tasks/{task_id}/time-logs/stop`
- **Request Body**: `TaskTimeLogStop`

#### 9.7.3. Lấy time logs
- **Endpoint**: `GET /api/tasks/{task_id}/time-logs`
- **Response**: Danh sách `TaskTimeLog`

---

## 10. Project Team (`/api/project-team`)

### 10.1. Lấy danh sách team members
- **Endpoint**: `GET /api/project-team/{project_id}/members`
- **Response**: Danh sách thành viên team

### 10.2. Thêm team member
- **Endpoint**: `POST /api/project-team/{project_id}/members`
- **Request Body**: `{"user_id": "...", "email": "...", "role": "member"}`

### 10.3. Cập nhật team member
- **Endpoint**: `PUT /api/project-team/{project_id}/members/{member_id}`
- **Request Body**: `{"role": "...", "status": "active"}`

### 10.4. Xóa team member
- **Endpoint**: `DELETE /api/project-team/{project_id}/members/{member_id}`

---

## 11. Notifications (`/api/notifications`)

### 11.1. Lấy danh sách notifications
- **Endpoint**: `GET /api/notifications`
- **Query Parameters**: `skip`, `limit`, `unread_only`
- **Response**: Danh sách notifications

### 11.2. Đánh dấu đã đọc
- **Endpoint**: `PUT /api/notifications/{notification_id}/read`

### 11.3. Đánh dấu tất cả đã đọc
- **Endpoint**: `PUT /api/notifications/read-all`

### 11.4. Xóa notification
- **Endpoint**: `DELETE /api/notifications/{notification_id}`

---

## 12. File Upload (`/api/file-upload`)

### 12.1. Upload file
- **Endpoint**: `POST /api/file-upload`
- **Request**: Multipart form với file
- **Response**: `{"url": "...", "path": "..."}`

### 12.2. Xóa file
- **Endpoint**: `DELETE /api/file-upload`
- **Request Body**: `{"path": "..."}`

---

## 13. Journal Entries (`/api/accounting`)

### 13.1. Lấy danh sách journal entries
- **Endpoint**: `GET /api/accounting/journal-entries`
- **Query Parameters**: `skip`, `limit`, `start_date`, `end_date`, `account_code`
- **Response**: Danh sách journal entries

### 13.2. Tạo journal entry
- **Endpoint**: `POST /api/accounting/journal-entries`
- **Request Body**: `JournalEntryCreate`
- **Response**: `JournalEntry` đã tạo

### 13.3. Cập nhật journal entry
- **Endpoint**: `PUT /api/accounting/journal-entries/{entry_id}`
- **Request Body**: `JournalEntryUpdate`

### 13.4. Xóa journal entry
- **Endpoint**: `DELETE /api/accounting/journal-entries/{entry_id}`

---

## 14. Expense Objects (`/api/expense-objects`)

### 14.1. Lấy danh sách expense objects
- **Endpoint**: `GET /api/expense-objects`
- **Response**: Danh sách expense objects

### 14.2. Tạo expense object
- **Endpoint**: `POST /api/expense-objects`
- **Request Body**: `ExpenseObjectCreate`

### 14.3. Cập nhật expense object
- **Endpoint**: `PUT /api/expense-objects/{object_id}`
- **Request Body**: `ExpenseObjectUpdate`

### 14.4. Xóa expense object
- **Endpoint**: `DELETE /api/expense-objects/{object_id}`

---

## 15. Expense Snapshots (`/api/expense-snapshots`)

### 15.1. Lấy danh sách snapshots
- **Endpoint**: `GET /api/expense-snapshots`
- **Query Parameters**: `expense_id`, `snapshot_type`
- **Response**: Danh sách snapshots

### 15.2. Tạo snapshot
- **Endpoint**: `POST /api/expense-snapshots`
- **Request Body**: `ExpenseSnapshotCreate`

### 15.3. Restore từ snapshot
- **Endpoint**: `POST /api/expense-restore/{snapshot_id}/restore`
- **Response**: Expense đã được restore

---

## 16. Material Adjustment Rules (`/api/material-adjustment-rules`)

### 16.1. Lấy danh sách rules
- **Endpoint**: `GET /api/material-adjustment-rules`
- **Response**: Danh sách rules

### 16.2. Tạo rule
- **Endpoint**: `POST /api/material-adjustment-rules`
- **Request Body**: `MaterialAdjustmentRuleCreate`

### 16.3. Cập nhật rule
- **Endpoint**: `PUT /api/material-adjustment-rules/{rule_id}`
- **Request Body**: `MaterialAdjustmentRuleUpdate`

### 16.4. Xóa rule
- **Endpoint**: `DELETE /api/material-adjustment-rules/{rule_id}`

---

## 17. System Feedback (`/api/system-feedback`)

### 17.1. Gửi feedback
- **Endpoint**: `POST /api/system-feedback`
- **Request Body**: `SystemFeedbackCreate`
- **Response**: Feedback đã tạo

### 17.2. Lấy danh sách feedback
- **Endpoint**: `GET /api/system-feedback`
- **Query Parameters**: `skip`, `limit`, `status`
- **Response**: Danh sách feedback

---

## 18. Product Import (`/api/sales/products/import`)

### 18.1. Import products từ Excel
- **Endpoint**: `POST /api/sales/products/import`
- **Request**: Multipart form với Excel file
- **Response**: Kết quả import

---

## 19. Purchase Orders (`/api/purchase-orders`)

### 19.1. Lấy danh sách purchase orders
- **Endpoint**: `GET /api/purchase-orders`
- **Query Parameters**: `skip`, `limit`, `search`, `vendor_id`, `status`
- **Response**: Danh sách purchase orders

### 19.2. Tạo purchase order
- **Endpoint**: `POST /api/purchase-orders`
- **Request Body**: `PurchaseOrderCreate`

### 19.3. Cập nhật purchase order
- **Endpoint**: `PUT /api/purchase-orders/{po_id}`
- **Request Body**: `PurchaseOrderUpdate`

---

## 20. Expense Claims (`/api/expense-claims`)

### 20.1. Lấy danh sách expense claims
- **Endpoint**: `GET /api/expense-claims`
- **Query Parameters**: `skip`, `limit`, `employee_id`, `status`
- **Response**: Danh sách expense claims

### 20.2. Tạo expense claim
- **Endpoint**: `POST /api/expense-claims`
- **Request Body**: `ExpenseClaimCreate`

### 20.3. Cập nhật expense claim
- **Endpoint**: `PUT /api/expense-claims/{claim_id}`
- **Request Body**: `ExpenseClaimUpdate`

---

## 21. Budgeting (`/api/budgeting`)

### 21.1. Lấy danh sách budgets
- **Endpoint**: `GET /api/budgeting`
- **Query Parameters**: `skip`, `limit`, `project_id`, `department_id`
- **Response**: Danh sách budgets

### 21.2. Tạo budget
- **Endpoint**: `POST /api/budgeting`
- **Request Body**: `BudgetCreate`

### 21.3. Cập nhật budget
- **Endpoint**: `PUT /api/budgeting/{budget_id}`
- **Request Body**: `BudgetUpdate`

---

## 22. Credit Memos (`/api/credit-memos`)

### 22.1. Lấy danh sách credit memos
- **Endpoint**: `GET /api/credit-memos`
- **Query Parameters**: `skip`, `limit`, `customer_id`, `invoice_id`
- **Response**: Danh sách credit memos

### 22.2. Tạo credit memo
- **Endpoint**: `POST /api/credit-memos`
- **Request Body**: `CreditMemoCreate`

---

## 23. Project Timeline (`/api/project-timeline`)

### 23.1. Lấy timeline của project
- **Endpoint**: `GET /api/project-timeline/{project_id}`
- **Response**: Timeline events của project

### 23.2. Thêm event vào timeline
- **Endpoint**: `POST /api/project-timeline/{project_id}/events`
- **Request Body**: `TimelineEventCreate`

---

## 24. Customer View (`/api/customer-view`)

### 24.1. Lấy thông tin customer view
- **Endpoint**: `GET /api/customer-view/{customer_id}`
- **Response**: Thông tin customer với projects, invoices, payments

---

## 25. Emotions & Comments (`/api/emotions-comments`)

### 25.1. Lấy emotions và comments
- **Endpoint**: `GET /api/emotions-comments`
- **Query Parameters**: `entity_type`, `entity_id`
- **Response**: Danh sách emotions và comments

### 25.2. Thêm emotion/comment
- **Endpoint**: `POST /api/emotions-comments`
- **Request Body**: `EmotionCommentCreate`

---

## Lưu ý quan trọng

1. **Authentication**: Hầu hết các endpoint yêu cầu JWT token trong header `Authorization: Bearer <token>`

2. **Pagination**: Các endpoint list thường hỗ trợ `skip` và `limit` để phân trang

3. **Filtering**: Nhiều endpoint hỗ trợ filtering qua query parameters

4. **Permissions**: Một số endpoint yêu cầu quyền Manager hoặc Admin

5. **Project Access Control**: Người dùng chỉ thấy projects mà họ là thành viên trong `project_team`, trừ Admin và Accountant

6. **Error Handling**: Tất cả các endpoint trả về error với format:
```json
{
  "detail": "Error message"
}
```

7. **Date Formats**: Sử dụng ISO 8601 format: `YYYY-MM-DD` hoặc `YYYY-MM-DDTHH:mm:ss`

8. **Currency**: Tất cả số tiền được lưu và trả về dưới dạng số (VND)

---

## Swagger Documentation

Truy cập Swagger UI tại: `http://localhost:8000/docs`
Truy cập ReDoc tại: `http://localhost:8000/redoc`

---

**Cập nhật lần cuối**: 2024
**Phiên bản API**: 1.0.0


