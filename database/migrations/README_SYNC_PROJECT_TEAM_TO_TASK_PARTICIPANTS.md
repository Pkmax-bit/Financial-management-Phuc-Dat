# Đồng bộ Project Team với Task Participants

## Mục đích

Tự động đồng bộ thành viên từ `project_team` (đội ngũ dự án) sang `task_participants` (thành viên nhiệm vụ) để đảm bảo:
- Khi thêm thành viên vào đội ngũ dự án → tự động thêm vào tất cả nhiệm vụ của dự án
- Vai trò (responsibility_type) được map đúng sang role trong task_participants
- Khi cập nhật vai trò → tự động cập nhật role trong tasks
- Khi xóa thành viên hoặc đổi status → tự động xóa khỏi tasks

## Mapping Vai trò (RACI → Task Role)

| Responsibility Type (RACI) | Task Participant Role |
|---------------------------|----------------------|
| `accountable` | `responsible` |
| `responsible` | `responsible` |
| `consulted` | `participant` |
| `informed` | `observer` |
| (không có) | `participant` (default) |

## Các Triggers và Functions

### 1. `auto_add_project_team_to_task_participants()`
**Trigger**: `trigger_auto_add_project_team_to_task_participants`
- **Khi nào**: Sau khi INSERT vào `project_team` với `status = 'active'`
- **Làm gì**: 
  - Tìm `employee_id` từ `user_id`
  - Map `responsibility_type` sang `role`
  - Thêm vào tất cả tasks của dự án (chưa bị xóa)

### 2. `auto_update_project_team_role_in_tasks()`
**Trigger**: `trigger_auto_update_project_team_role_in_tasks`
- **Khi nào**: Sau khi UPDATE `project_team` khi `responsibility_type` thay đổi hoặc `status` thay đổi
- **Làm gì**: 
  - Cập nhật `role` trong tất cả tasks của dự án theo `responsibility_type` mới

### 3. `auto_remove_project_team_from_tasks()`
**Trigger**: `trigger_auto_remove_project_team_from_tasks`
- **Khi nào**: 
  - Sau khi DELETE khỏi `project_team`
  - Sau khi UPDATE `status` thành không phải `'active'`
- **Làm gì**: 
  - Xóa khỏi tất cả tasks của dự án

### 4. `auto_add_project_team_to_new_task()`
**Trigger**: `trigger_auto_add_project_team_to_new_task`
- **Khi nào**: Sau khi INSERT task mới có `project_id`
- **Làm gì**: 
  - Thêm tất cả thành viên `project_team` (status = 'active') vào task mới
  - Map `responsibility_type` sang `role`

## Luồng hoạt động

### Kịch bản 1: Thêm thành viên vào đội ngũ dự án
```
1. User thêm thành viên vào project_team với responsibility_type = 'accountable'
2. Trigger tự động:
   - Tìm employee_id từ user_id
   - Map 'accountable' → 'responsible'
   - Thêm vào tất cả tasks của dự án với role = 'responsible'
```

### Kịch bản 2: Tạo task mới trong dự án
```
1. User tạo task mới với project_id
2. Trigger tự động:
   - Lấy tất cả thành viên project_team (status = 'active')
   - Map responsibility_type → role
   - Thêm vào task_participants
```

### Kịch bản 3: Cập nhật vai trò thành viên
```
1. User cập nhật responsibility_type từ 'informed' → 'accountable'
2. Trigger tự động:
   - Cập nhật role từ 'observer' → 'responsible' trong tất cả tasks
```

### Kịch bản 4: Xóa thành viên khỏi đội ngũ
```
1. User xóa thành viên khỏi project_team hoặc đổi status = 'inactive'
2. Trigger tự động:
   - Xóa khỏi tất cả tasks của dự án
```

## Kiểm tra

### Kiểm tra thành viên đã được thêm vào tasks
```sql
SELECT 
    pt.name as team_member_name,
    pt.responsibility_type,
    tp.role as task_role,
    t.title as task_title,
    p.name as project_name
FROM project_team pt
INNER JOIN employees e ON e.user_id = pt.user_id
INNER JOIN task_participants tp ON tp.employee_id = e.id
INNER JOIN tasks t ON t.id = tp.task_id
INNER JOIN projects p ON p.id = t.project_id
WHERE pt.project_id = p.id
    AND pt.status = 'active'
ORDER BY p.name, t.title, pt.name;
```

### Kiểm tra tasks chưa có thành viên từ project_team
```sql
SELECT 
    t.id,
    t.title,
    p.name as project_name,
    COUNT(DISTINCT pt.id) as team_members_count,
    COUNT(DISTINCT tp.employee_id) as participants_count
FROM tasks t
INNER JOIN projects p ON p.id = t.project_id
LEFT JOIN project_team pt ON pt.project_id = p.id AND pt.status = 'active'
LEFT JOIN task_participants tp ON tp.task_id = t.id
WHERE t.project_id IS NOT NULL
GROUP BY t.id, t.title, p.name
HAVING COUNT(DISTINCT pt.id) > COUNT(DISTINCT tp.employee_id);
```

## Lưu ý

1. **Chỉ xử lý status = 'active'**: Chỉ thành viên có `status = 'active'` mới được thêm vào tasks
2. **Mapping vai trò**: `responsibility_type` được map sang `role` theo bảng mapping ở trên
3. **Không duplicate**: Sử dụng `ON CONFLICT` để tránh duplicate, nếu đã tồn tại thì update role
4. **Xóa mềm**: Chỉ xử lý tasks chưa bị xóa (nếu có cột `deleted_at`)

## Rollback

Nếu cần rollback, chạy:
```sql
DROP TRIGGER IF EXISTS trigger_auto_add_project_team_to_task_participants ON project_team;
DROP TRIGGER IF EXISTS trigger_auto_update_project_team_role_in_tasks ON project_team;
DROP TRIGGER IF EXISTS trigger_auto_remove_project_team_from_tasks ON project_team;
DROP TRIGGER IF EXISTS trigger_auto_add_project_team_to_new_task ON tasks;

DROP FUNCTION IF EXISTS auto_add_project_team_to_task_participants();
DROP FUNCTION IF EXISTS auto_update_project_team_role_in_tasks();
DROP FUNCTION IF EXISTS auto_remove_project_team_from_tasks();
DROP FUNCTION IF EXISTS auto_add_project_team_to_new_task();
```












