# Thống Kê API Endpoints

## 📊 Tổng Quan

**Tổng số API Endpoints: 402+ endpoints**

## 📋 Phân Loại Theo Module

### 1. **Tasks** (46 endpoints)
- Task Groups: CRUD, members, restore, cleanup
- Tasks: CRUD, comments, checklists, time logs, participants, notes, attachments, notifications
- File: `backend/routers/tasks.py`

### 2. **Sales** (47 endpoints)
- Quotes: CRUD, approve, accept, convert to invoice, email, preview
- Invoices: CRUD, send, payment
- Payments: CRUD, allocation
- Sales Receipts: CRUD
- Journal Entries: CRUD, reverse
- Dashboard stats, payment reminders
- File: `backend/routers/sales.py`

### 3. **Projects** (25 endpoints)
- Projects: CRUD, statuses, time entries, profitability, reports, dashboard
- Project validation, dropdown options
- File: `backend/routers/projects.py`

### 4. **Expenses** (29 endpoints)
- Expenses: CRUD, submit, approve, reject, delete, reimbursement
- Bills: CRUD, payment
- Vendors: CRUD, bills
- Dashboard stats, billable expenses, due reminders
- File: `backend/routers/expenses.py`

### 5. **Employees** (16 endpoints)
- Employees: CRUD, simple list, public list
- Departments, Positions
- File: `backend/routers/employees.py`

### 6. **Customers** (16 endpoints)
- Customers: CRUD, contacts, projects, invoices, quotes
- File: `backend/routers/customers.py`

### 7. **File Upload** (10 endpoints)
- Upload: general, multiple, images
- Delete files
- Specialized: expenses, invoices, bills, projects, products, avatars
- File: `backend/routers/file_upload.py`

### 8. **Authentication** (15 endpoints)
- Login, logout, register, password reset
- Token management
- File: `backend/routers/auth.py`

### 9. **System Feedback** (13 endpoints)
- Feedback: CRUD, replies, resolve
- File: `backend/routers/system_feedback.py`

### 10. **Emotions & Comments** (11 endpoints)
- Comments: CRUD, reactions, mentions
- File: `backend/routers/emotions_comments.py`

### 11. **Expense Claims** (11 endpoints)
- Claims: CRUD, submit, approve, reject, pay
- File: `backend/routers/expense_claims.py`

### 12. **Budgeting** (12 endpoints)
- Budgets: CRUD, lines, approve
- File: `backend/routers/budgeting.py`

### 13. **Project Expenses** (7 endpoints)
- Project Expenses: CRUD, approve (quotes and actual)
- File: `backend/routers/project_expenses.py`

### 14. **Project Team** (4 endpoints)
- Team Members: CRUD
- File: `backend/routers/project_team.py`

### 15. **Project Timeline** (9 endpoints)
- Timeline: CRUD, upload, delete attachments
- File: `backend/routers/project_timeline.py`

### 16. **Notifications** (9 endpoints)
- Notifications: CRUD, mark read
- File: `backend/routers/notifications.py`

### 17. **Credit Memos** (7 endpoints)
- Credit Memos: CRUD, apply, refund
- File: `backend/routers/credit_memos.py`

### 18. **Purchase Orders** (10 endpoints)
- Purchase Orders: CRUD, approve, items
- File: `backend/routers/purchase_orders.py`

### 19. **Expense Objects** (6 endpoints)
- Expense Objects: CRUD, tree structure
- File: `backend/routers/expense_objects.py`

### 20. **Expense Snapshots** (6 endpoints)
- Snapshots: CRUD, restore
- File: `backend/routers/expense_snapshots.py`

### 21. **Expense Restore** (5 endpoints)
- Restore expenses from snapshots
- File: `backend/routers/expense_restore.py`

### 22. **Material Adjustment Rules** (5 endpoints)
- Rules: CRUD for material adjustments
- File: `backend/routers/material_adjustment_rules.py`

### 23. **Journal** (5 endpoints)
- Journal Entries: CRUD, lines
- File: `backend/routers/journal.py`

### 24. **Dashboard** (5 endpoints)
- Dashboard stats and widgets
- File: `backend/routers/dashboard.py`

### 25. **Reports** (6 endpoints)
- Various reports
- File: `backend/routers/reports.py`

### 26. **Product Import** (3 endpoints)
- Import products from Excel
- File: `backend/routers/product_import.py`

### 27. **Project Reports** (2 endpoints)
- Project-specific reports
- File: `backend/routers/project_reports.py`

### 28. **Employee Excel** (2 endpoints)
- Excel import/export for employees
- File: `backend/routers/employee_excel.py`

### 29. **Customer View** (6 endpoints)
- Customer-facing views
- File: `backend/routers/customer_view.py`

### 30. **Sales Receipts** (6 endpoints)
- Sales Receipts: CRUD
- File: `backend/routers/sales_receipts.py`

### 31. **Sales by Customer** (3 endpoints)
- Reports by customer
- File: `backend/routers/sales_customer.py`

### 32. **Expenses by Vendor** (3 endpoints)
- Reports by vendor
- File: `backend/routers/expenses_vendor.py`

### 33. **Projects Financial** (3 endpoints)
- Financial reports for projects
- File: `backend/routers/projects_financial.py`

### 34. **P&L Report** (1 endpoint)
- Profit & Loss report
- File: `backend/routers/pl_report.py`

### 35. **Balance Sheet** (1 endpoint)
- Balance sheet report
- File: `backend/routers/balance_sheet.py`

### 36. **Drill-Down** (1 endpoint)
- Drill-down reports
- File: `backend/routers/drill_down.py`

### 37. **Cash Flow** (2 endpoints)
- Cash flow statements
- File: `backend/routers/cash_flow.py`

### 38. **Cash Flow Vietnamese** (2 endpoints)
- Cash flow (Vietnamese format)
- File: `backend/routers/cash_flow_vietnamese.py`

### 39. **General Ledger** (1 endpoint)
- General ledger report
- File: `backend/routers/general_ledger.py`

### 40. **Task Attachments** (2 endpoints)
- Task attachment endpoints
- File: `backend/routers/task_attachments_endpoint.py`

### 41. **Project Permissions Demo** (15 endpoints)
- Demo endpoints for permissions
- File: `backend/routers/project_permissions_demo.py`

### 42. **Emotions Comments Old** (7 endpoints)
- Old version of emotions/comments
- File: `backend/routers/emotions_comments_old.py`

### 43. **Emotions Comments Simple** (7 endpoints)
- Simple version of emotions/comments
- File: `backend/routers/emotions_comments_simple.py`

## 📈 Phân Loại Theo HTTP Method

- **GET**: ~200+ endpoints (Read operations)
- **POST**: ~150+ endpoints (Create operations)
- **PUT**: ~40+ endpoints (Update operations)
- **DELETE**: ~12+ endpoints (Delete operations)
- **PATCH**: ~0 endpoints (Partial updates)

## 🔗 Base URLs

Tất cả API endpoints có prefix `/api/` trừ một số endpoints đặc biệt:

- `/api/auth/*` - Authentication
- `/api/dashboard/*` - Dashboard
- `/api/employees/*` - Employees
- `/api/customers/*` - Customers
- `/api/sales/*` - Sales
- `/api/expenses/*` - Expenses
- `/api/projects/*` - Projects
- `/api/reports/*` - Reports
- `/api/notifications/*` - Notifications
- `/api/accounting/*` - Accounting
- `/api/uploads/*` - File Uploads
- `/api/tasks/*` - Tasks
- Và nhiều module khác...

## 📝 Special Endpoints

- `/` - Root/Health check
- `/health` - Health check
- `/docs` - Swagger UI documentation
- `/redoc` - ReDoc documentation
- `/openapi.json` - OpenAPI schema

## 🎯 Tổng Kết

**Tổng số: 402+ API endpoints** được phân bố trên **43 router files**

Hệ thống có đầy đủ CRUD operations cho tất cả các entities chính:
- ✅ Projects, Tasks, Expenses, Sales, Customers, Employees
- ✅ File uploads, Notifications, Reports
- ✅ Accounting, Budgeting, Financial Reports
- ✅ Authentication & Authorization


