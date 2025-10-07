# 🔐 Hệ thống Phân quyền Dựa trên Role

## 📋 Tổng quan

Hệ thống phân quyền được thiết kế dựa trên **Role-Based Access Control (RBAC)** với 3 giai đoạn dự án và các vai trò cụ thể.

## 👥 Các Vai trò (Roles)

### 1. **ADMIN** - Quản trị viên
- **Quyền hạn**: Toàn quyền truy cập hệ thống
- **Chức năng**: Quản lý người dùng, cấu hình hệ thống, xem tất cả báo cáo

### 2. **SALES** - Nhân viên bán hàng
- **Quyền hạn**: Tạo dự án, báo giá, theo dõi tiến độ khách hàng
- **Chức năng**: 
  - Tạo báo giá và chi phí kế hoạch
  - Theo dõi quá trình duyệt của khách hàng
  - Xem tiến độ dự án

### 3. **ACCOUNTANT** - Kế toán
- **Quyền hạn**: Quản lý hóa đơn, chi phí, báo cáo tài chính
- **Chức năng**:
  - Tạo hóa đơn từ báo giá đã duyệt
  - Quản lý chi phí thực tế
  - Tổng kết chi phí cuối dự án
  - Tạo báo cáo tài chính

### 4. **WORKSHOP_EMPLOYEE** - Nhân viên xưởng
- **Quyền hạn**: Xem dự án, tạo chi phí sản xuất
- **Chức năng**: Ghi nhận chi phí sản xuất, vật liệu

### 5. **WORKER** - Công nhân
- **Quyền hạn**: Xem dự án, ghi nhận chi phí lao động
- **Chức năng**: Ghi nhận chi phí nhân công

### 6. **TRANSPORT** - Nhân viên vận chuyển
- **Quyền hạn**: Xem dự án, ghi nhận chi phí vận chuyển
- **Chức năng**: Ghi nhận chi phí vận chuyển

### 7. **CUSTOMER** - Khách hàng
- **Quyền hạn**: Xem dự án của mình, duyệt báo giá, thanh toán
- **Chức năng**:
  - Xem tiến độ dự án
  - Duyệt báo giá
  - Thanh toán hóa đơn

## 🚀 3 Giai đoạn Dự án

### 📝 **Giai đoạn Kế hoạch (PLANNING)**
- **Sales**: Tạo báo giá và chi phí kế hoạch
- **Customer**: Duyệt báo giá
- **Accountant**: Tạo hóa đơn từ báo giá đã duyệt

### ⚙️ **Giai đoạn Thực hiện (EXECUTION)**
- **Workshop/Worker/Transport**: Ghi nhận chi phí thực tế
- **Customer**: Xem tiến độ thi công
- **Accountant**: Quản lý chi phí và doanh thu

### 📊 **Giai đoạn Hoàn thành (COMPLETION)**
- **Accountant**: Tổng kết chi phí và tạo báo cáo
- **Customer**: Xem báo cáo cuối dự án

## 🔧 Cách sử dụng trong Code

### 1. **Sử dụng Decorator**

```python
from utils.permissions import require_permission, require_role
from models.permissions import Permission, UserRole

@router.get("/create-project")
@require_permission(Permission.CREATE_PROJECT)
async def create_project(current_user: User = Depends(get_current_user)):
    return {"message": "Project created"}

@router.get("/admin-only")
@require_role([UserRole.ADMIN])
async def admin_only(current_user: User = Depends(get_current_user)):
    return {"message": "Admin access"}
```

### 2. **Sử dụng Dependency Injection**

```python
from utils.permissions import PermissionChecker, require_admin, require_sales

@router.get("/view-reports")
async def view_reports(
    current_user: User = Depends(PermissionChecker(Permission.VIEW_REPORTS))
):
    return {"message": "Reports viewed"}

@router.get("/sales-dashboard")
async def sales_dashboard(
    current_user: User = Depends(require_sales)
):
    return {"message": "Sales dashboard"}
```

### 3. **Kiểm tra quyền theo giai đoạn dự án**

```python
from utils.permissions import require_project_stage_access
from models.permissions import ProjectStage

@router.get("/planning-tasks")
@require_project_stage_access(ProjectStage.PLANNING)
async def planning_tasks(current_user: User = Depends(get_current_user)):
    return {"message": "Planning tasks"}
```

## 📊 Bảng Phân quyền Chi tiết

| Chức năng | Admin | Sales | Accountant | Workshop | Worker | Transport | Customer |
|-----------|-------|-------|------------|----------|--------|-----------|----------|
| **Tạo dự án** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Tạo báo giá** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Duyệt báo giá** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Tạo hóa đơn** | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Tạo chi phí** | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ | ❌ |
| **Xem báo cáo** | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Xem tiến độ** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Quản lý người dùng** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

## 🎯 Quy trình Workflow

### **Bước 1: Sales tạo báo giá**
```python
@router.post("/quotes")
@require_permission(Permission.CREATE_QUOTE)
async def create_quote(quote_data: QuoteCreate, current_user: User = Depends(get_current_user)):
    # Sales tạo báo giá
    pass
```

### **Bước 2: Customer duyệt báo giá**
```python
@router.post("/quotes/{quote_id}/approve")
@require_permission(Permission.APPROVE_QUOTE)
async def approve_quote(quote_id: str, current_user: User = Depends(get_current_user)):
    # Customer duyệt báo giá
    pass
```

### **Bước 3: Accountant tạo hóa đơn**
```python
@router.post("/invoices")
@require_permission(Permission.CREATE_INVOICE)
async def create_invoice(invoice_data: InvoiceCreate, current_user: User = Depends(get_current_user)):
    # Accountant tạo hóa đơn từ báo giá đã duyệt
    pass
```

### **Bước 4: Nhân viên ghi nhận chi phí**
```python
@router.post("/costs")
@require_permission(Permission.CREATE_COST)
async def create_cost(cost_data: CostCreate, current_user: User = Depends(get_current_user)):
    # Workshop/Worker/Transport ghi nhận chi phí
    pass
```

### **Bước 5: Accountant tổng kết**
```python
@router.get("/projects/{project_id}/summary")
@require_permission(Permission.VIEW_REPORTS)
async def project_summary(project_id: str, current_user: User = Depends(get_current_user)):
    # Accountant tổng kết chi phí
    pass
```

## 🔒 Bảo mật

1. **Authentication**: Tất cả endpoint đều yêu cầu đăng nhập
2. **Authorization**: Kiểm tra quyền trước khi thực hiện hành động
3. **Role Hierarchy**: Admin có quyền cao nhất
4. **Stage-based Access**: Quyền thay đổi theo giai đoạn dự án

## 📝 Lưu ý

- Hệ thống sử dụng **JWT tokens** cho authentication
- Mỗi user chỉ có **1 role** duy nhất
- Quyền được kiểm tra ở **runtime** khi gọi API
- Có thể mở rộng thêm quyền mới trong `models/permissions.py`
