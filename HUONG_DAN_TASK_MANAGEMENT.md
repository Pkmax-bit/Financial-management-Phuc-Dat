# Hướng Dẫn Sử Dụng Hệ Thống Quản Lý Nhiệm Vụ (Task Management)

## Tổng Quan

Hệ thống quản lý nhiệm vụ cho phép:
- Tạo nhóm làm việc giữa các nhân viên
- Giao và quản lý nhiệm vụ
- Theo dõi tiến độ với Kanban board (To Do, In Progress, Completed)
- Nhận thông báo khi có nhiệm vụ mới hoặc thay đổi trạng thái
- Bình luận và đính kèm file cho nhiệm vụ

## Cài Đặt

### 1. Chạy Migration Database

Chạy file migration để tạo các bảng cần thiết:

```sql
-- Chạy file này trong Supabase SQL Editor hoặc PostgreSQL client
database/migrations/create_task_management_tables.sql
```

Các bảng được tạo:
- `task_groups` - Nhóm nhiệm vụ
- `task_group_members` - Thành viên trong nhóm
- `tasks` - Nhiệm vụ
- `task_assignments` - Phân công nhiệm vụ
- `task_comments` - Bình luận nhiệm vụ
- `task_attachments` - File đính kèm
- `task_notifications` - Thông báo nhiệm vụ

### 2. Backend API

Backend API đã được tích hợp vào `backend/routers/tasks.py` và đã được thêm vào `backend/main.py`.

Các endpoints chính:
- `GET /api/tasks` - Lấy danh sách nhiệm vụ (có filter)
- `POST /api/tasks` - Tạo nhiệm vụ mới
- `PUT /api/tasks/{task_id}` - Cập nhật nhiệm vụ
- `DELETE /api/tasks/{task_id}` - Xóa nhiệm vụ
- `GET /api/tasks/groups` - Lấy danh sách nhóm
- `POST /api/tasks/groups` - Tạo nhóm mới
- `GET /api/tasks/notifications` - Lấy thông báo nhiệm vụ

### 3. Frontend

Frontend page đã được tạo tại `frontend/src/app/tasks/page.tsx` và đã được thêm vào navigation.

## Sử Dụng

### Tạo Nhóm

1. Vào trang **Nhiệm vụ** từ menu bên trái
2. Nhấn nút **"Tạo Nhóm"**
3. Điền tên nhóm và mô tả (tùy chọn)
4. Nhấn **"Tạo"**

### Tạo Nhiệm Vụ

1. Nhấn nút **"Thêm Nhiệm Vụ"**
2. Điền thông tin:
   - **Tiêu đề** (bắt buộc)
   - **Mô tả** (tùy chọn)
   - **Trạng thái**: To Do, In Progress, Completed
   - **Độ ưu tiên**: Thấp, Trung bình, Cao, Khẩn cấp
   - **Nhóm**: Chọn nhóm (tùy chọn)
   - **Hạn chót**: Chọn ngày giờ (tùy chọn)
3. Nhấn **"Tạo"**

### Quản Lý Nhiệm Vụ

#### Kanban Board

Nhiệm vụ được hiển thị theo 3 cột:
- **To Do**: Nhiệm vụ chưa bắt đầu
- **In Progress**: Nhiệm vụ đang thực hiện
- **Completed**: Nhiệm vụ đã hoàn thành

#### Filter & Search

- **Tìm kiếm**: Tìm theo tiêu đề hoặc mô tả
- **Lọc theo trạng thái**: Tất cả, To Do, In Progress, Completed, Cancelled
- **Lọc theo nhóm**: Tất cả nhóm hoặc chọn nhóm cụ thể
- **Lọc theo độ ưu tiên**: Tất cả, Thấp, Trung bình, Cao, Khẩn cấp

#### Thay Đổi Trạng Thái

- Click vào nhiệm vụ để xem chi tiết
- Thay đổi trạng thái từ dropdown menu
- Hệ thống sẽ tự động tạo thông báo cho người được giao và người tạo

### Thông Báo

Hệ thống tự động tạo thông báo khi:
- Nhiệm vụ được giao cho bạn
- Trạng thái nhiệm vụ thay đổi
- Có bình luận mới
- Nhiệm vụ sắp đến hạn

Xem thông báo tại:
- Icon chuông ở navigation bar
- Trang **Thông báo** trong menu

## Cấu Trúc Database

### Task Status
- `todo`: Chưa bắt đầu
- `in_progress`: Đang thực hiện
- `completed`: Đã hoàn thành
- `cancelled`: Đã hủy

### Task Priority
- `low`: Thấp
- `medium`: Trung bình
- `high`: Cao
- `urgent`: Khẩn cấp

### Task Group Roles
- `owner`: Chủ sở hữu nhóm
- `admin`: Quản trị viên nhóm
- `member`: Thành viên

## API Examples

### Tạo nhiệm vụ mới

```javascript
POST /api/tasks
{
  "title": "Hoàn thành báo cáo tháng",
  "description": "Tổng hợp và phân tích dữ liệu tháng 1",
  "status": "todo",
  "priority": "high",
  "due_date": "2025-02-01T10:00:00Z",
  "group_id": "uuid-of-group",
  "assigned_to": "uuid-of-employee"
}
```

### Lấy danh sách nhiệm vụ với filter

```javascript
GET /api/tasks?status=in_progress&group_id=uuid&priority=high
```

### Cập nhật trạng thái nhiệm vụ

```javascript
PUT /api/tasks/{task_id}
{
  "status": "completed"
}
```

## Tính Năng Nâng Cao

### Thêm Bình Luận

```javascript
POST /api/tasks/{task_id}/comments
{
  "comment": "Đã hoàn thành phần đầu tiên"
}
```

### Đính Kèm File

Sử dụng file upload API để đính kèm file vào nhiệm vụ.

### Thông Báo Real-time

Hệ thống tự động tạo thông báo qua database triggers khi:
- Nhiệm vụ được giao
- Trạng thái thay đổi
- Có bình luận mới

## Troubleshooting

### Lỗi "Table does not exist"

Đảm bảo đã chạy migration file `create_task_management_tables.sql` trong database.

### Lỗi "Permission denied"

Kiểm tra:
- User đã đăng nhập chưa
- User có quyền truy cập API không
- RLS policies đã được thiết lập đúng chưa

### Thông báo không hiển thị

Kiểm tra:
- `task_notifications` table đã được tạo chưa
- Triggers đã được tạo chưa
- User ID trong notifications có đúng không

## Tích Hợp Với Dự Án

Nhiệm vụ có thể liên kết với dự án thông qua trường `project_id`. Khi tạo nhiệm vụ, có thể chọn dự án từ danh sách dự án hiện có.

## Bảo Mật

- Tất cả API endpoints yêu cầu authentication
- Chỉ người tạo hoặc người được giao mới có thể xem nhiệm vụ
- Admin và Manager có thể xem tất cả nhiệm vụ
- RLS policies được áp dụng cho tất cả bảng


