# Hệ thống Tự động Gửi Thông báo cho Nhân viên Nhiệm vụ

## Mục đích

Tự động gửi thông báo cho nhân viên khi:
1. **Được thêm vào nhiệm vụ** - Theo vai trò của nhân viên
2. **Vai trò được thay đổi** - Thông báo về sự thay đổi vai trò
3. **Nhiệm vụ được cập nhật** - Thông báo về thay đổi status, priority, due_date

## Tính năng

### ✅ 1. Thêm nhiều nhân viên cho 1 nhiệm vụ
- Có thể thêm nhiều nhân viên vào cùng 1 nhiệm vụ
- Mỗi nhân viên có vai trò riêng (responsible, participant, observer)
- Mỗi nhân viên sẽ nhận thông báo riêng theo vai trò của họ

### ✅ 2. Thông báo theo vai trò
- **responsible**: "bạn được giao làm người chịu trách nhiệm chính"
- **participant**: "bạn được mời tham gia"
- **observer**: "bạn được mời theo dõi"

### ✅ 3. Tự động gửi thông báo
- Khi thêm nhân viên → Tự động tạo thông báo
- Khi cập nhật vai trò → Tự động tạo thông báo
- Khi cập nhật task → Tự động gửi cho tất cả participants

## Các Triggers

### 1. `auto_notify_task_participant_added()`
**Trigger**: `trigger_auto_notify_task_participant_added`
- **Khi nào**: Sau khi INSERT vào `task_participants`
- **Làm gì**: 
  - Tạo thông báo cho nhân viên
  - Nội dung thông báo thay đổi theo vai trò
  - Notification type: `task_assigned`

**Ví dụ thông báo**:
```
Title: "Bạn được thêm vào nhiệm vụ: Thiết kế kiến trúc"
Message: "Xin chào Nguyễn Văn A, bạn được giao làm người chịu trách nhiệm chính nhiệm vụ "Thiết kế kiến trúc". Vui lòng kiểm tra và thực hiện nhiệm vụ này."
```

### 2. `auto_notify_task_participant_role_updated()`
**Trigger**: `trigger_auto_notify_task_participant_role_updated`
- **Khi nào**: Sau khi UPDATE `role` trong `task_participants`
- **Làm gì**: 
  - Tạo thông báo về thay đổi vai trò
  - Notification type: `role_updated`

**Ví dụ thông báo**:
```
Title: "Vai trò của bạn đã thay đổi trong nhiệm vụ: Thiết kế kiến trúc"
Message: "Xin chào Nguyễn Văn A, vai trò của bạn trong nhiệm vụ "Thiết kế kiến trúc" đã được thay đổi từ người tham gia thành người chịu trách nhiệm chính."
```

### 3. `auto_notify_task_updated()`
**Trigger**: `trigger_auto_notify_task_updated`
- **Khi nào**: Sau khi UPDATE task (status, priority, due_date, title)
- **Làm gì**: 
  - Gửi thông báo cho TẤT CẢ participants
  - Thông báo về các thay đổi cụ thể
  - Notification type: `task_updated`

**Ví dụ thông báo**:
```
Title: "Nhiệm vụ đã được cập nhật: Thiết kế kiến trúc"
Message: "Xin chào Nguyễn Văn A, nhiệm vụ "Thiết kế kiến trúc" đã được cập nhật: Trạng thái: todo → in_progress. Độ ưu tiên: medium → high. Hạn chót: 15/01/2025."
```

## Use Cases

### Use Case 1: Thêm nhiều nhân viên vào nhiệm vụ
```
1. Admin thêm 3 nhân viên vào task "Thiết kế kiến trúc":
   - Nguyễn Văn A: responsible
   - Trần Thị B: participant
   - Lê Văn C: observer

2. Hệ thống tự động:
   - Tạo 3 thông báo riêng biệt
   - Mỗi nhân viên nhận thông báo với nội dung phù hợp vai trò
   - Nguyễn Văn A: "bạn được giao làm người chịu trách nhiệm chính"
   - Trần Thị B: "bạn được mời tham gia"
   - Lê Văn C: "bạn được mời theo dõi"
```

### Use Case 2: Cập nhật vai trò
```
1. Admin cập nhật vai trò của Trần Thị B từ "participant" → "responsible"

2. Hệ thống tự động:
   - Tạo thông báo cho Trần Thị B
   - Nội dung: "vai trò của bạn đã được thay đổi từ người tham gia thành người chịu trách nhiệm chính"
```

### Use Case 3: Cập nhật nhiệm vụ
```
1. Admin cập nhật task:
   - Status: todo → in_progress
   - Priority: medium → high
   - Due date: 20/01/2025

2. Hệ thống tự động:
   - Gửi thông báo cho TẤT CẢ 3 nhân viên (A, B, C)
   - Nội dung: "nhiệm vụ đã được cập nhật: Trạng thái: todo → in_progress. Độ ưu tiên: medium → high. Hạn chót: 20/01/2025."
```

## API Endpoints

### Lấy thông báo
```http
GET /api/tasks/notifications
GET /api/tasks/notifications?is_read=false  # Chỉ lấy thông báo chưa đọc
```

### Đánh dấu đã đọc
```http
PUT /api/tasks/notifications/{notification_id}/read
```

### Thêm nhân viên vào nhiệm vụ (tự động gửi thông báo)
```http
POST /api/tasks/{task_id}/participants
{
  "employee_id": "uuid",
  "role": "responsible" | "participant" | "observer"
}
```

### Cập nhật vai trò (tự động gửi thông báo)
```http
PUT /api/tasks/participants/{participant_id}
{
  "role": "responsible" | "participant" | "observer"
}
```

## SQL Queries

### Xem thông báo của một nhân viên
```sql
SELECT 
    tn.id,
    tn.title,
    tn.message,
    tn.notification_type,
    tn.is_read,
    tn.created_at,
    t.title as task_title
FROM task_notifications tn
INNER JOIN tasks t ON t.id = tn.task_id
WHERE tn.user_id = 'user_id_here'
ORDER BY tn.created_at DESC;
```

### Xem thông báo chưa đọc
```sql
SELECT 
    COUNT(*) as unread_count
FROM task_notifications
WHERE user_id = 'user_id_here'
    AND is_read = FALSE;
```

### Xem thông báo theo loại
```sql
SELECT 
    notification_type,
    COUNT(*) as count
FROM task_notifications
WHERE user_id = 'user_id_here'
GROUP BY notification_type;
```

## Kiểm tra Hệ thống

### Test 1: Thêm nhân viên vào nhiệm vụ
```sql
-- Thêm nhân viên vào task
INSERT INTO task_participants (task_id, employee_id, role, added_by, created_at)
VALUES (
    'task_id_here',
    'employee_id_here',
    'responsible',
    'user_id_here',
    NOW()
);

-- Kiểm tra thông báo đã được tạo
SELECT * FROM task_notifications
WHERE task_id = 'task_id_here'
    AND employee_id = 'employee_id_here'
    AND notification_type = 'task_assigned'
ORDER BY created_at DESC
LIMIT 1;
```

### Test 2: Cập nhật vai trò
```sql
-- Cập nhật vai trò
UPDATE task_participants
SET role = 'responsible'
WHERE task_id = 'task_id_here'
    AND employee_id = 'employee_id_here'
    AND role = 'participant';

-- Kiểm tra thông báo
SELECT * FROM task_notifications
WHERE task_id = 'task_id_here'
    AND employee_id = 'employee_id_here'
    AND notification_type = 'role_updated'
ORDER BY created_at DESC
LIMIT 1;
```

### Test 3: Cập nhật task
```sql
-- Cập nhật task
UPDATE tasks
SET status = 'in_progress',
    priority = 'high'
WHERE id = 'task_id_here';

-- Kiểm tra thông báo cho tất cả participants
SELECT 
    tn.*,
    e.first_name || ' ' || e.last_name as employee_name
FROM task_notifications tn
INNER JOIN employees e ON e.id = tn.employee_id
WHERE tn.task_id = 'task_id_here'
    AND tn.notification_type = 'task_updated'
    AND tn.created_at > NOW() - INTERVAL '1 minute'
ORDER BY tn.created_at DESC;
```

## Lưu ý Quan trọng

1. **Chỉ gửi cho nhân viên có user_id**: Nếu employee không có user_id, không thể gửi thông báo

2. **Thông báo theo vai trò**: Nội dung thông báo thay đổi theo vai trò của nhân viên

3. **Gửi cho tất cả participants**: Khi task được cập nhật, tất cả participants đều nhận thông báo

4. **Không spam**: Chỉ gửi thông báo khi có thay đổi thực sự (status, priority, due_date, title)

5. **Thông báo chưa đọc**: Tất cả thông báo mới đều có `is_read = FALSE`

## Kết luận

Hệ thống đã được thiết lập đầy đủ với:
- ✅ Tự động gửi thông báo khi thêm nhân viên
- ✅ Thông báo theo vai trò của nhân viên
- ✅ Hỗ trợ nhiều nhân viên cho 1 nhiệm vụ
- ✅ Tự động gửi khi cập nhật vai trò
- ✅ Tự động gửi khi cập nhật task

Hệ thống sẵn sàng sử dụng! 🎉






















