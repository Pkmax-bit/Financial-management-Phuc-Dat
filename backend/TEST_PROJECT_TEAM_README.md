# Hướng Dẫn Test Lấy Dữ Liệu Dự Án và Kiểm Tra Thành Viên

## 📋 Mô Tả

Script `test_project_team_members.py` được sử dụng để:
- ✅ Lấy danh sách tất cả dự án
- ✅ Lấy danh sách tất cả thành viên trong `project_team`
- ✅ Lấy danh sách tất cả nhân viên (employees) và users
- ✅ Phân tích và hiển thị:
  - Dự án không có thành viên
  - Dự án có thành viên (chi tiết)
  - **Thành viên KHÔNG có trong team dự án** (mục đích chính)

## 🚀 Cách Chạy

### Windows (PowerShell):
```powershell
cd backend
python test_project_team_members.py
```

### Linux/Mac:
```bash
cd backend
python3 test_project_team_members.py
```

## 📊 Kết Quả Hiển Thị

Script sẽ hiển thị:

### 1. Thống Kê Tổng Quan
- Tổng số dự án
- Tổng số thành viên trong project_team
- Tổng số nhân viên (active)
- Tổng số users (active)
- Số dự án có team
- Số users/emails có trong team

### 2. Dự Án Không Có Thành Viên
- Danh sách các dự án không có thành viên nào trong `project_team`

### 3. Dự Án Có Thành Viên
- Chi tiết từng dự án:
  - Mã dự án và tên dự án
  - Tổng số thành viên (active/inactive)
  - Danh sách thành viên active (hiển thị 5 người đầu)

### 4. **Thành Viên Không Có Trong Team Dự Án** ⭐
- **Nhân viên (employees) không có trong team**: 
  - Danh sách nhân viên từ bảng `employees` không có trong bất kỳ `project_team` nào
  - Hiển thị: Tên, ID, Email, User ID
  
- **Users không có trong team**:
  - Danh sách users từ bảng `users` không có trong bất kỳ `project_team` nào
  - Hiển thị: Tên, ID, Email, Role

### 5. Tổng Kết
- Tổng số người (employees + users)
- Số người có trong team
- Số người KHÔNG có trong team
- Tỷ lệ phần trăm

## 🔍 Cách Kiểm Tra

Script so khớp thành viên với `project_team` theo 2 cách:
1. **So khớp qua `user_id`**: Nếu `employees.user_id` hoặc `users.id` có trong `project_team.user_id`
2. **So khớp qua `email`**: Nếu `employees.email` hoặc `users.email` có trong `project_team.email`

Nếu một người **không khớp** theo cả 2 cách trên → Họ **KHÔNG có trong team dự án**.

## 📝 Ví Dụ Kết Quả

```
📌 Nhân viên (employees) không có trong team dự án: 7

   Danh sách:
   • Admin Cửa Phúc Đạt (ID: 2c52908f-...)
     Email: kinhdoanh@phucdatdoor.vn, User ID: a846cd29-...
   • Hoàng Quân (ID: 34e9407c-...)
     Email: tranhoangquan2707@gmail.com, User ID: 74f5a334-...
   ...

📌 Users không có trong team dự án: 16

   Danh sách:
   • Phúc Đạt Lắp Đặt (ID: f160e3f7-...)
     Email: phucdatlapdat7@gmail.com, Role: worker
   • xuong (ID: 52a1ee40-...)
     Email: xuong@gmail.com, Role: workshop_employee
   ...
```

## ⚠️ Lưu Ý

1. **Cần cấu hình Supabase**: Script sử dụng `get_supabase_client()` từ `services/supabase_client.py`
   - Đảm bảo đã cấu hình đúng `SUPABASE_URL` và `SUPABASE_SERVICE_KEY` trong file `.env`

2. **Chỉ hiển thị 20 người đầu**: Nếu có nhiều hơn 20 người không có trong team, script chỉ hiển thị 20 người đầu và thông báo số lượng còn lại

3. **Chỉ lấy dữ liệu active**:
   - Employees: Chỉ lấy những người có `status = 'active'`
   - Users: Chỉ lấy những người có `is_active = True`
   - Project Team: Lấy tất cả (có thể có status active/inactive)

## 🎯 Mục Đích Sử Dụng

Script này hữu ích để:
- ✅ Kiểm tra xem có nhân viên/users nào chưa được thêm vào team dự án
- ✅ Phát hiện những người cần được thêm vào `project_team` để có quyền truy cập dự án
- ✅ Kiểm tra tính nhất quán của dữ liệu
- ✅ Thống kê tổng quan về việc phân bổ nhân sự vào dự án

## 🔧 Troubleshooting

### Lỗi: "Không thể import supabase_client"
- Đảm bảo đang chạy từ thư mục `backend/`
- Kiểm tra file `services/supabase_client.py` có tồn tại

### Lỗi: "Failed to initialize Supabase client"
- Kiểm tra file `.env` có cấu hình đúng `SUPABASE_URL` và `SUPABASE_SERVICE_KEY`
- Kiểm tra kết nối mạng đến Supabase

### Không có dữ liệu
- Kiểm tra database có dữ liệu không
- Kiểm tra quyền truy cập của service key

---

**Tạo bởi:** Script test tự động  
**Cập nhật:** Dựa trên codebase hiện tại

