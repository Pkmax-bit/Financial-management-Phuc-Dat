# Tóm tắt Hệ thống Đồng bộ Thành viên

## ✅ Trạng thái Hiện tại

### 1. Đồng bộ Thành viên
- ✅ **Đã hoạt động**: Đồng bộ 2 chiều giữa `project_team` và `task_participants`
- ✅ **Quản lý đầy đủ**: Có thể thêm/xóa/sửa ở cả 2 bên
- ✅ **Tự động**: Khi thao tác ở một bên, bên kia tự động thay đổi theo

### 2. Liên kết Dự án - Nhiệm vụ
- ✅ **Liên kết chặt chẽ**: Tất cả tasks đều có `project_id` (9/9 tasks)
- ✅ **Foreign Key**: Có constraint `tasks_project_id_fkey` đảm bảo tính toàn vẹn
- ✅ **Tự động đồng bộ**: Khi tạo task mới → tự động thêm thành viên project_team vào task

## 🔄 Cơ chế Đồng bộ 2 Chiều

### Chiều 1: Project Team → Task Participants

#### Khi thêm thành viên vào Project Team:
```
1. User thêm vào project_team với responsibility_type
2. Trigger tự động:
   - Tìm employee_id từ user_id
   - Map responsibility_type → role
   - Thêm vào TẤT CẢ tasks của project với role tương ứng
```

#### Khi cập nhật responsibility_type:
```
1. User cập nhật responsibility_type trong project_team
2. Trigger tự động:
   - Cập nhật role trong TẤT CẢ tasks của project
```

#### Khi xóa khỏi Project Team:
```
1. User xóa khỏi project_team hoặc đổi status = 'inactive'
2. Trigger tự động:
   - Xóa khỏi TẤT CẢ tasks của project
```

#### Khi tạo Task mới:
```
1. User tạo task mới với project_id
2. Trigger tự động:
   - Thêm TẤT CẢ thành viên project_team vào task mới
   - Map responsibility_type → role
```

### Chiều 2: Task Participants → Project Team (Thông minh)

#### Khi thêm vào Task Participants:
```
1. User thêm nhân viên vào task_participants
2. Trigger kiểm tra:
   - Nếu nhân viên tham gia >= 50% tasks của project
   - → Tự động thêm vào project_team
   - Map role → responsibility_type
```

**Lý do**: Chỉ thêm vào project_team khi nhân viên tham gia nhiều tasks (>= 50%), tránh thêm nhân viên tạm thời chỉ tham gia 1-2 tasks.

#### Khi xóa khỏi Task Participants:
```
1. User xóa nhân viên khỏi task_participants
2. Trigger kiểm tra:
   - Nếu không còn tham gia task nào của project
   - → Tự động xóa khỏi project_team
```

#### Khi cập nhật role trong Task:
```
1. User cập nhật role trong task_participants
2. Trigger kiểm tra:
   - Nếu nhân viên tham gia >= 50% tasks của project
   - → Tự động cập nhật responsibility_type trong project_team
   - Map role → responsibility_type
```

## 📊 Mapping Vai trò

### Project Team → Task Participants
| Responsibility Type (RACI) | Task Participant Role |
|---------------------------|----------------------|
| `accountable` | `responsible` |
| `responsible` | `responsible` |
| `consulted` | `participant` |
| `informed` | `observer` |

### Task Participants → Project Team
| Task Participant Role | Responsibility Type (RACI) |
|----------------------|---------------------------|
| `responsible` | `responsible` |
| `participant` | `consulted` |
| `observer` | `informed` |

## 🎯 Use Cases

### Use Case 1: Thêm thành viên vào đội ngũ dự án
```
1. Admin thêm "Nguyễn Văn A" vào project_team với role = "accountable"
2. Hệ thống tự động:
   - Thêm "Nguyễn Văn A" vào TẤT CẢ tasks của project
   - Gán role = "responsible" trong task_participants
```

### Use Case 2: Thêm nhân viên vào nhiều tasks
```
1. User thêm "Trần Thị B" vào 3/5 tasks của project với role = "participant"
2. Hệ thống tự động:
   - Nhận thấy tham gia >= 50% tasks (3/5 = 60%)
   - Tự động thêm vào project_team với responsibility_type = "consulted"
```

### Use Case 3: Xóa khỏi tất cả tasks
```
1. User xóa "Lê Văn C" khỏi task cuối cùng của project
2. Hệ thống tự động:
   - Nhận thấy không còn tham gia task nào
   - Tự động xóa khỏi project_team
```

### Use Case 4: Cập nhật vai trò
```
1. User cập nhật role của "Phạm Thị D" từ "participant" → "responsible" trong task
2. Nếu "Phạm Thị D" tham gia >= 50% tasks:
   - Hệ thống tự động cập nhật responsibility_type = "responsible" trong project_team
```

## 🔍 Kiểm tra Hệ thống

### Kiểm tra đồng bộ
```sql
-- Xem tất cả thành viên và vai trò trong project và tasks
SELECT 
    p.name as project_name,
    pt.name as team_member,
    pt.responsibility_type as project_role,
    COUNT(DISTINCT tp.task_id) as tasks_count,
    STRING_AGG(DISTINCT tp.role, ', ') as task_roles
FROM project_team pt
INNER JOIN projects p ON p.id = pt.project_id
LEFT JOIN employees e ON e.user_id = pt.user_id
LEFT JOIN task_participants tp ON tp.employee_id = e.id
LEFT JOIN tasks t ON t.id = tp.task_id AND t.project_id = p.id
WHERE pt.status = 'active'
GROUP BY p.name, pt.name, pt.responsibility_type
ORDER BY p.name, pt.name;
```

### Kiểm tra liên kết project_id
```sql
-- Kiểm tra tasks không có project_id
SELECT COUNT(*) as tasks_without_project
FROM tasks
WHERE project_id IS NULL
    AND deleted_at IS NULL;

-- Kiểm tra tasks có project_id nhưng project không tồn tại
SELECT t.id, t.title, t.project_id
FROM tasks t
LEFT JOIN projects p ON p.id = t.project_id
WHERE t.project_id IS NOT NULL
    AND p.id IS NULL
    AND t.deleted_at IS NULL;
```

### Kiểm tra foreign keys
```sql
-- Xem tất cả foreign keys liên quan
SELECT
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND (tc.table_name IN ('tasks', 'task_participants', 'project_team'))
ORDER BY tc.table_name, kcu.column_name;
```

## 📝 API Endpoints

### Quản lý Project Team
- `GET /api/projects/{project_id}/team` - Lấy danh sách thành viên
- `POST /api/projects/{project_id}/team` - Thêm thành viên
- `PUT /api/projects/{project_id}/team/{member_id}` - Cập nhật thành viên
- `DELETE /api/projects/{project_id}/team/{member_id}` - Xóa thành viên

### Quản lý Task Participants
- `GET /api/tasks/{task_id}/participants` - Lấy danh sách thành viên
- `POST /api/tasks/{task_id}/participants` - Thêm thành viên
- `PUT /api/tasks/participants/{participant_id}` - Cập nhật vai trò
- `DELETE /api/tasks/participants/{participant_id}` - Xóa thành viên

## ⚠️ Lưu ý Quan trọng

1. **Đồng bộ thông minh**: 
   - Chiều 1 (project_team → tasks): Luôn đồng bộ 100%
   - Chiều 2 (tasks → project_team): Chỉ đồng bộ khi tham gia >= 50% tasks

2. **Vai trò riêng được ưu tiên**:
   - Vai trò trong `task_participants` là vai trò thực tế
   - Có thể thay đổi vai trò riêng cho từng task
   - Không bị ghi đè bởi project_team (trừ khi cập nhật project_team)

3. **Liên kết chặt chẽ**:
   - Tất cả tasks phải có `project_id`
   - Foreign key đảm bảo tính toàn vẹn dữ liệu
   - Không thể xóa project nếu còn tasks

4. **Performance**:
   - Có indexes trên `task_id`, `employee_id`, `project_id`
   - Triggers được tối ưu để tránh vòng lặp vô hạn

## ✅ Kết luận

Hệ thống đã được thiết lập đầy đủ với:
- ✅ Đồng bộ 2 chiều thông minh
- ✅ Quản lý đầy đủ (thêm/xóa/sửa)
- ✅ Liên kết chặt chẽ giữa project và tasks
- ✅ API endpoints đầy đủ
- ✅ Foreign keys đảm bảo tính toàn vẹn

Hệ thống sẵn sàng sử dụng! 🎉






