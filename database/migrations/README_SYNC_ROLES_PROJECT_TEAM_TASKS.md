# Đồng bộ Vai trò giữa Đội ngũ Dự án và Nhiệm vụ

## Mục đích

Đảm bảo vai trò trong nhiệm vụ (`task_participants.role`) luôn giống với vai trò ở đội ngũ dự án (`project_team.responsibility_type`).

## Mapping Vai trò

| Project Team (RACI) | Task Participants | Mô tả |
|---------------------|-------------------|-------|
| `accountable` | `responsible` | Chịu trách nhiệm chính |
| `responsible` | `responsible` | Thực hiện |
| `consulted` | `participant` | Tư vấn / Tham gia |
| `informed` | `observer` | Thông báo / Theo dõi |

## Cơ chế Đồng bộ

### 1. Khi thêm thành viên vào Project Team
- **Trigger**: `trigger_auto_add_project_team_to_task_participants`
- **Hành động**: Tự động thêm vào tất cả tasks với vai trò được map từ `responsibility_type`

### 2. Khi cập nhật vai trò trong Project Team
- **Trigger**: `trigger_auto_update_project_team_role_in_tasks`
- **Hành động**: Tự động cập nhật vai trò trong tất cả tasks của dự án

### 3. Khi thêm/cập nhật thành viên vào Task Participants
- **Trigger**: `trigger_auto_sync_task_participant_role_from_project_team` (BEFORE INSERT/UPDATE)
- **Hành động**: 
  - Kiểm tra xem thành viên có trong `project_team` không
  - Nếu có, tự động map `responsibility_type` → `role`
  - Đảm bảo vai trò luôn khớp với đội ngũ

## Luồng Hoạt động

### Kịch bản 1: Thêm thành viên vào đội ngũ
```
1. Admin thêm "Nguyễn Văn A" vào project_team với responsibility_type = 'accountable'
2. Trigger tự động:
   - Map 'accountable' → 'responsible'
   - Thêm vào tất cả tasks với role = 'responsible'
```

### Kịch bản 2: Thêm thành viên vào nhiệm vụ (đã có trong đội ngũ)
```
1. User thêm "Nguyễn Văn A" vào task_participants với role = 'participant'
2. Trigger BEFORE INSERT tự động:
   - Kiểm tra: "Nguyễn Văn A" có trong project_team với responsibility_type = 'accountable'
   - Tự động đổi role từ 'participant' → 'responsible' (theo project_team)
   - Đảm bảo vai trò khớp với đội ngũ
```

### Kịch bản 3: Cập nhật vai trò trong đội ngũ
```
1. Admin cập nhật responsibility_type từ 'consulted' → 'accountable'
2. Trigger tự động:
   - Cập nhật role từ 'participant' → 'responsible' trong tất cả tasks
```

### Kịch bản 4: Cập nhật vai trò trong nhiệm vụ (đã có trong đội ngũ)
```
1. User cập nhật role từ 'participant' → 'observer' trong task_participants
2. Trigger BEFORE UPDATE tự động:
   - Kiểm tra: thành viên có trong project_team với responsibility_type = 'consulted'
   - Tự động đổi lại role từ 'observer' → 'participant' (theo project_team)
   - Đảm bảo vai trò luôn khớp với đội ngũ
```

## Lưu ý Quan trọng

1. **Ưu tiên Project Team**: 
   - Nếu thành viên có trong `project_team`, vai trò trong tasks sẽ luôn theo `project_team`
   - Không thể thay đổi vai trò trong tasks nếu khác với `project_team`

2. **Thành viên không trong Project Team**:
   - Có thể thêm trực tiếp vào tasks với vai trò bất kỳ
   - Vai trò này sẽ được giữ nguyên

3. **Đồng bộ tự động**:
   - Tất cả thay đổi ở `project_team` → tự động cập nhật `task_participants`
   - Thêm/cập nhật ở `task_participants` → tự động kiểm tra và đồng bộ với `project_team`

## SQL Queries

### Kiểm tra vai trò đã đồng bộ chưa
```sql
SELECT 
    p.name as project_name,
    t.title as task_title,
    e.first_name || ' ' || e.last_name as employee_name,
    pt.responsibility_type as project_team_role,
    tp.role as task_role,
    CASE 
        WHEN pt.responsibility_type = 'accountable' AND tp.role = 'responsible' THEN '✓ Đúng'
        WHEN pt.responsibility_type = 'responsible' AND tp.role = 'responsible' THEN '✓ Đúng'
        WHEN pt.responsibility_type = 'consulted' AND tp.role = 'participant' THEN '✓ Đúng'
        WHEN pt.responsibility_type = 'informed' AND tp.role = 'observer' THEN '✓ Đúng'
        ELSE '⚠ Khác nhau'
    END as status
FROM task_participants tp
INNER JOIN employees e ON e.id = tp.employee_id
INNER JOIN tasks t ON t.id = tp.task_id
INNER JOIN projects p ON p.id = t.project_id
LEFT JOIN project_team pt ON pt.project_id = p.id AND pt.user_id = e.user_id AND pt.status = 'active'
WHERE pt.responsibility_type IS NOT NULL
ORDER BY p.name, t.title, e.first_name;
```

### Tìm các trường hợp chưa đồng bộ
```sql
SELECT 
    tp.id,
    t.title as task_title,
    e.first_name || ' ' || e.last_name as employee_name,
    pt.responsibility_type as project_team_role,
    tp.role as current_task_role,
    CASE 
        WHEN pt.responsibility_type = 'accountable' THEN 'responsible'
        WHEN pt.responsibility_type = 'responsible' THEN 'responsible'
        WHEN pt.responsibility_type = 'consulted' THEN 'participant'
        WHEN pt.responsibility_type = 'informed' THEN 'observer'
    END as expected_task_role
FROM task_participants tp
INNER JOIN employees e ON e.id = tp.employee_id
INNER JOIN tasks t ON t.id = tp.task_id
INNER JOIN projects p ON p.id = t.project_id
INNER JOIN project_team pt ON pt.project_id = p.id AND pt.user_id = e.user_id AND pt.status = 'active'
WHERE tp.role != CASE 
    WHEN pt.responsibility_type = 'accountable' THEN 'responsible'
    WHEN pt.responsibility_type = 'responsible' THEN 'responsible'
    WHEN pt.responsibility_type = 'consulted' THEN 'participant'
    WHEN pt.responsibility_type = 'informed' THEN 'observer'
END;
```

## Kết luận

Hệ thống đã được thiết lập để:
- ✅ Tự động đồng bộ vai trò từ `project_team` sang `task_participants`
- ✅ Đảm bảo vai trò trong nhiệm vụ luôn khớp với vai trò ở đội ngũ
- ✅ Tự động cập nhật khi có thay đổi ở cả 2 bên
- ✅ Ưu tiên vai trò từ `project_team` khi có xung đột

Vai trò trong nhiệm vụ sẽ luôn giống với vai trò ở đội ngũ dự án! 🎯











