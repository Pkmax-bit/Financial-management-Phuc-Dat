# Migration: Chuyển thành viên từ nhóm nhiệm vụ sang thành viên của từng nhiệm vụ

## Mục đích

Thay đổi cách quản lý thành viên từ cấp nhóm (task_group_members) sang cấp nhiệm vụ (task_participants). Mỗi nhiệm vụ sẽ có danh sách thành viên riêng thay vì kế thừa từ nhóm.

## Lợi ích

1. **Linh hoạt hơn**: Mỗi nhiệm vụ có thể có thành viên khác nhau, không bị ràng buộc bởi nhóm
2. **Quản lý tốt hơn**: Có thể gán thành viên cụ thể cho từng nhiệm vụ
3. **Phù hợp với workflow**: Phản ánh đúng thực tế là mỗi nhiệm vụ có thể có team riêng

## Các thay đổi

### 1. Database Migration

File: `migrate_group_members_to_task_participants.sql`

**Bước 1**: Chuyển dữ liệu từ `task_group_members` sang `task_participants`
- Với mỗi nhiệm vụ trong nhóm, thêm tất cả thành viên của nhóm đó vào `task_participants`
- Mapping role:
  - `owner` → `responsible`
  - `admin` → `responsible`
  - `member` → `participant`

**Bước 2**: Tạo triggers tự động
- Khi thêm thành viên vào nhóm → tự động thêm vào tất cả nhiệm vụ trong nhóm
- Khi thêm nhiệm vụ mới vào nhóm → tự động thêm tất cả thành viên nhóm vào nhiệm vụ
- Khi xóa thành viên khỏi nhóm → tự động xóa khỏi tất cả nhiệm vụ trong nhóm

### 2. Backend Changes

- API endpoint `/api/tasks/{task_id}` đã trả về `participants` trong `TaskResponse`
- Frontend sử dụng `taskData.participants` thay vì load `groupMembers` riêng

### 3. Frontend Changes

File: `frontend/src/app/tasks/[taskId]/page.tsx`

- Loại bỏ state `groupMembers`
- Sử dụng `taskData?.participants` từ TaskResponse
- Cập nhật các hàm:
  - `getAllAvailableMembers()` - sử dụng participants
  - `getMentionMembers()` - sử dụng participants
  - Hiển thị thành viên - sử dụng participants

## Cách chạy migration

### Option 1: Chạy trực tiếp trong Supabase Dashboard

1. Mở Supabase Dashboard → SQL Editor
2. Copy nội dung file `migrate_group_members_to_task_participants.sql`
3. Paste và chạy

### Option 2: Chạy qua Supabase CLI

```bash
supabase db push
```

### Option 3: Chạy qua backend API (nếu có endpoint migration)

```bash
# Tạo endpoint migration nếu cần
POST /api/tasks/run-migration-group-members
```

## Kiểm tra sau migration

1. **Kiểm tra dữ liệu đã được migrate**:
```sql
-- Kiểm tra số lượng participants sau migration
SELECT COUNT(*) FROM task_participants;

-- Kiểm tra participants của một nhiệm vụ cụ thể
SELECT tp.*, t.title, e.first_name, e.last_name
FROM task_participants tp
JOIN tasks t ON t.id = tp.task_id
JOIN employees e ON e.id = tp.employee_id
WHERE t.id = 'YOUR_TASK_ID';
```

2. **Kiểm tra triggers hoạt động**:
```sql
-- Thêm thành viên mới vào nhóm và kiểm tra xem có được thêm vào tasks không
INSERT INTO task_group_members (group_id, employee_id, role)
VALUES ('GROUP_ID', 'EMPLOYEE_ID', 'member');

-- Kiểm tra xem thành viên đã được thêm vào task_participants chưa
SELECT * FROM task_participants 
WHERE employee_id = 'EMPLOYEE_ID' 
AND task_id IN (SELECT id FROM tasks WHERE group_id = 'GROUP_ID');
```

3. **Kiểm tra frontend**:
- Mở một nhiệm vụ có group_id
- Kiểm tra xem thành viên có hiển thị đúng không
- Kiểm tra mention members có hoạt động không

## Lưu ý

1. **Không xóa task_group_members**: Bảng này vẫn được giữ để tương thích ngược và để triggers hoạt động
2. **Đồng bộ tự động**: Triggers sẽ tự động đồng bộ giữa `task_group_members` và `task_participants`
3. **Performance**: Index đã được tạo để tối ưu query performance

## Rollback (nếu cần)

Nếu cần rollback, có thể:
1. Xóa triggers:
```sql
DROP TRIGGER IF EXISTS trigger_auto_add_group_member_to_tasks ON task_group_members;
DROP TRIGGER IF EXISTS trigger_auto_add_task_to_group_members ON tasks;
DROP TRIGGER IF EXISTS trigger_auto_remove_group_member_from_tasks ON task_group_members;
```

2. Xóa dữ liệu đã migrate (nếu muốn):
```sql
-- CẨN THẬN: Chỉ chạy nếu thực sự cần rollback
DELETE FROM task_participants 
WHERE created_at >= '2025-01-XX'; -- Thay bằng ngày migration
```

## Tương lai

Có thể xem xét:
- Hoàn toàn loại bỏ `task_group_members` nếu không còn cần thiết
- Thêm UI để quản lý participants trực tiếp từ task detail page
- Thêm API để add/remove participants từ task























