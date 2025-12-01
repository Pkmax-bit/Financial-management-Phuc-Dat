# Hướng dẫn Test Quyền Truy Cập Dự Án

## Mục đích
Kiểm tra xem hệ thống có lọc đúng dữ liệu dự án dựa trên quyền thành viên trong `project_team` hay không.

## Yêu cầu
- Backend đang chạy tại `http://localhost:8000`
- Có ít nhất 2 tài khoản để test:
  - 1 tài khoản **CÓ** trong `project_team` của một số dự án
  - 1 tài khoản **KHÔNG** có trong `project_team` của bất kỳ dự án nào

## Cách Test

### Phương pháp 1: Script Test Tương Tác (Khuyến nghị)

Chạy script test tương tác để nhập thông tin tài khoản:

```bash
cd backend
python test_project_access_permissions.py
```

Script sẽ yêu cầu bạn nhập:
- Email và password của tài khoản 1 (có trong project_team)
- Email và password của tài khoản 2 (không có trong project_team)

Sau đó script sẽ:
1. Đăng nhập với cả 2 tài khoản
2. Test các API endpoints:
   - Danh sách dự án (`/api/projects/`)
   - Thông tin dự án cụ thể (`/api/projects/{project_id}`)
   - Financial summary (`/api/projects/{project_id}/financial-summary`)
   - Danh sách hóa đơn (`/api/sales/invoices`)
   - Danh sách báo giá (`/api/sales/quotes`)
   - Chi phí dự án (`/api/project-expenses/project-expenses`)
3. So sánh kết quả giữa 2 tài khoản

### Phương pháp 2: Script Test Nhanh

Chỉnh sửa file `backend/test_project_access_quick.py` và cập nhật thông tin tài khoản:

```python
TEST_ACCOUNTS = [
    {
        "name": "Admin (có quyền tất cả)",
        "email": "admin@test.com",
        "password": "123456",
        "expected_access": "all"
    },
    {
        "name": "Employee (có trong project_team)",
        "email": "employee@test.com",  # Thay đổi email thực tế
        "password": "123456",
        "expected_access": "limited"
    },
    {
        "name": "Employee (KHÔNG có trong project_team)",
        "email": "employee2@test.com",  # Thay đổi email thực tế
        "password": "123456",
        "expected_access": "none"
    }
]
```

Sau đó chạy:

```bash
cd backend
python test_project_access_quick.py
```

### Phương pháp 3: Test Thủ Công với cURL hoặc Postman

#### 1. Đăng nhập và lấy token

```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user1@example.com", "password": "password123"}'
```

Lưu token từ response.

#### 2. Test lấy danh sách dự án

```bash
curl -X GET http://localhost:8000/api/projects/ \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

#### 3. Test lấy thông tin dự án cụ thể

```bash
curl -X GET http://localhost:8000/api/projects/{project_id} \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

#### 4. Test các endpoint khác

```bash
# Financial summary
curl -X GET http://localhost:8000/api/projects/{project_id}/financial-summary \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Hóa đơn
curl -X GET http://localhost:8000/api/sales/invoices \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Báo giá
curl -X GET http://localhost:8000/api/sales/quotes \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Chi phí dự án
curl -X GET http://localhost:8000/api/project-expenses/project-expenses \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Kết Quả Mong Đợi

### Tài khoản CÓ trong project_team:
- ✅ Thấy danh sách dự án mà họ tham gia
- ✅ Có thể xem thông tin chi tiết các dự án đó
- ✅ Có thể xem financial summary, dashboard, profitability
- ✅ Thấy hóa đơn và báo giá của các dự án đó
- ✅ Thấy chi phí của các dự án đó

### Tài khoản KHÔNG có trong project_team:
- ❌ Không thấy dự án nào (trừ admin/accountant/workshop_employee)
- ❌ Không thể xem thông tin dự án (403 Forbidden)
- ❌ Không thể xem financial summary (403 Forbidden)
- ❌ Không thấy hóa đơn/báo giá của dự án (chỉ thấy những cái không có project_id)
- ❌ Không thấy chi phí dự án

### Tài khoản Admin/Accountant/Workshop_Employee:
- ✅ Thấy TẤT CẢ dự án
- ✅ Có quyền truy cập tất cả dữ liệu

## Kiểm Tra Database

Để xác nhận user có trong project_team hay không, kiểm tra bảng `project_team`:

```sql
-- Xem tất cả thành viên trong project_team
SELECT 
    pt.id,
    pt.project_id,
    pt.user_id,
    pt.email,
    pt.status,
    p.name as project_name,
    u.email as user_email
FROM project_team pt
LEFT JOIN projects p ON p.id = pt.project_id
LEFT JOIN users u ON u.id = pt.user_id
WHERE pt.status = 'active'
ORDER BY pt.project_id;
```

## Xử Lý Lỗi

### Lỗi 403 Forbidden
- **Nguyên nhân**: User không có quyền truy cập dự án
- **Giải pháp**: Kiểm tra xem user có trong `project_team` của dự án đó không

### Lỗi 404 Not Found
- **Nguyên nhân**: Dự án không tồn tại
- **Giải pháp**: Kiểm tra `project_id` có đúng không

### Không thấy dữ liệu
- **Nguyên nhân**: User không có trong `project_team` của bất kỳ dự án nào
- **Giải pháp**: Thêm user vào `project_team` của dự án cần test

## Ghi Chú

- Script test sẽ hiển thị kết quả với màu sắc:
  - ✅ Xanh lá: Thành công
  - ❌ Đỏ: Lỗi
  - ⚠️ Vàng: Cảnh báo
  - ℹ️ Xanh dương: Thông tin

- Nếu backend chạy ở port khác, sửa biến `API_BASE_URL` trong script

