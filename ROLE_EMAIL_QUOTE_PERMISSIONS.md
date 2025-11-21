# Phân Quyền Review và Gửi Email Báo Giá

## Tổng Quan

Tài liệu này mô tả các role được phép review và gửi email báo giá trong hệ thống.

## Các Endpoint Liên Quan

### 1. Preview Email Báo Giá
- **Endpoint**: `POST /api/sales/quotes/{quote_id}/preview`
- **File**: `backend/routers/sales.py` (dòng 790-794)
- **Dependency**: `require_manager_or_admin` (từ `utils.auth`)

### 2. Gửi Email Báo Giá
- **Endpoint**: `POST /api/sales/quotes/{quote_id}/send`
- **File**: `backend/routers/sales.py` (dòng 1215-1219)
- **Dependency**: `require_manager_or_admin` (từ `utils.auth`)

### 3. Lưu Bản Nháp Email
- **Endpoint**: `POST /api/sales/quotes/{quote_id}/save-draft`
- **File**: `backend/routers/sales.py` (dòng 1073-1076)
- **Dependency**: `require_manager_or_admin` (từ `utils.auth`)

### 4. Test Gửi Email
- **Endpoint**: `POST /api/sales/quotes/{quote_id}/test-email`
- **File**: `backend/routers/sales.py` (dòng 2767-2770)
- **Dependency**: `require_manager_or_admin` (từ `utils.auth`)

## Các Role Được Phép

Theo hàm `require_manager_or_admin` trong `backend/utils/auth.py` (dòng 236-247), các role sau được phép:

### ✅ **ADMIN** (Quản trị viên)
- Có quyền đầy đủ
- Có thể review và gửi email báo giá

### ✅ **MANAGER** (Quản lý)
- Có quyền review và gửi email báo giá
- Có thể quản lý báo giá

### ✅ **SALES** (Nhân viên bán hàng)
- Có quyền review và gửi email báo giá
- Có thể tạo và quản lý báo giá của mình

### ✅ **ACCOUNTANT** (Kế toán)
- Có quyền review và gửi email báo giá
- Có thể xem và quản lý báo giá

### ✅ **EMPLOYEE** (Nhân viên)
- Có quyền review và gửi email báo giá
- Có thể xem và gửi email báo giá

## Các Role KHÔNG Được Phép

### ❌ **WORKER** (Công nhân)
- Không có quyền review và gửi email báo giá

### ❌ **CUSTOMER** (Khách hàng)
- Không có quyền review và gửi email báo giá

### ❌ **TRANSPORT** (Vận chuyển)
- Không có quyền review và gửi email báo giá

### ❌ **WORKSHOP_EMPLOYEE** (Nhân viên xưởng)
- Không có quyền review và gửi email báo giá

## Code Tham Khảo

### Hàm Phân Quyền
```python
# backend/utils/auth.py (dòng 236-247)
def require_manager_or_admin(current_user: User = Depends(get_current_user)) -> User:
    """Require manager, sales, accountant, employee, or admin role"""
    # Handle both enum and string role values
    role_value = current_user.role.value if isinstance(current_user.role, UserRole) else str(current_user.role)
    role_value = role_value.lower()
    
    if role_value not in ["admin", "manager", "sales", "accountant", "employee"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Requires manager, sales, accountant, employee, or admin role"
        )
    return current_user
```

## Lưu Ý

1. **Các role được phép**: Hiện tại có 5 role được phép review và gửi email báo giá:
   - admin
   - manager
   - sales
   - accountant
   - employee

2. **Endpoint hiện tại**: Các endpoint trong `sales.py` đang sử dụng hàm từ `utils.auth`, nên tất cả 5 role trên đều được phép.

3. **Không nhất quán**: Có 2 hàm `require_manager_or_admin`:
   - `backend/utils/auth.py`: Cho phép "admin", "manager", "sales", "accountant", "employee" (đang được sử dụng)
   - `backend/utils/rbac_middleware.py`: Cho phép "admin", "sales", "accountant" (không được sử dụng trong sales.py)

## Kiểm Tra

Để kiểm tra role hiện tại của user:
1. Xem trong database bảng `users` - cột `role`
2. Hoặc kiểm tra trong response của API authentication
3. Hoặc xem trong frontend sau khi đăng nhập

## Cập Nhật

- **Ngày tạo**: 2025-01-XX
- **Cập nhật lần 1**: Sau khi sửa để cho phép role "sales"
- **Cập nhật lần 2**: Thêm role "accountant" và "employee" vào danh sách được phép

