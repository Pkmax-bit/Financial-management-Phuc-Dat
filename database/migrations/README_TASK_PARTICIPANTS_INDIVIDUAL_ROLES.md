# Quản lý Vai trò Riêng cho Từng Nhiệm vụ

## Khái niệm

Mỗi nhiệm vụ có danh sách nhân viên riêng, và **mỗi nhân viên có thể có vai trò khác nhau trong từng nhiệm vụ khác nhau**.

## Cấu trúc Dữ liệu

### Bảng `task_participants`
- `task_id`: ID của nhiệm vụ
- `employee_id`: ID của nhân viên
- `role`: Vai trò của nhân viên trong nhiệm vụ này
  - `responsible`: Người chịu trách nhiệm chính
  - `participant`: Người tham gia
  - `observer`: Người quan sát/theo dõi

### Constraint Unique
- `(task_id, employee_id)`: Mỗi nhân viên chỉ có thể có 1 vai trò trong 1 nhiệm vụ

## Ví dụ Thực tế

### Ví dụ 1: Nhân viên có vai trò khác nhau trong các nhiệm vụ khác nhau

```
Nhân viên: Nguyễn Văn A

Dự án: Xây dựng nhà
├── Nhiệm vụ 1: "Thiết kế" → Vai trò: responsible
├── Nhiệm vụ 2: "Mua vật liệu" → Vai trò: participant  
└── Nhiệm vụ 3: "Giám sát" → Vai trò: observer
```

### Ví dụ 2: Cùng một nhiệm vụ, nhiều nhân viên với vai trò khác nhau

```
Nhiệm vụ: "Thiết kế kiến trúc"

├── Nguyễn Văn A → Vai trò: responsible (chịu trách nhiệm chính)
├── Trần Thị B → Vai trò: participant (tham gia thiết kế)
└── Lê Văn C → Vai trò: observer (theo dõi tiến độ)
```

## Cách Hoạt động

### 1. Đồng bộ Tự động từ Project Team
- Khi thêm thành viên vào `project_team` → Tự động thêm vào tất cả tasks với vai trò từ `responsibility_type`
- **NHƯNG**: Bạn có thể thay đổi vai trò riêng cho từng nhiệm vụ sau đó

### 2. Gán Vai trò Riêng cho Từng Nhiệm vụ
- Có thể thêm/xóa/sửa nhân viên và vai trò trực tiếp trong `task_participants`
- Vai trò này **độc lập** với vai trò trong `project_team`
- Mỗi nhiệm vụ có thể có danh sách nhân viên và vai trò hoàn toàn khác nhau

### 3. Quy tắc Ưu tiên
1. **Vai trò trong task_participants** là vai trò thực tế được sử dụng
2. Vai trò từ `project_team` chỉ là giá trị mặc định ban đầu
3. Có thể thay đổi vai trò riêng cho từng nhiệm vụ mà không ảnh hưởng đến vai trò trong project_team

## API Quản lý

### Thêm nhân viên vào nhiệm vụ với vai trò cụ thể
```http
POST /api/tasks/{task_id}/participants
{
  "employee_id": "uuid",
  "role": "responsible" | "participant" | "observer"
}
```

### Cập nhật vai trò của nhân viên trong nhiệm vụ
```http
PUT /api/tasks/{task_id}/participants/{participant_id}
{
  "role": "responsible" | "participant" | "observer"
}
```

### Xóa nhân viên khỏi nhiệm vụ
```http
DELETE /api/tasks/{task_id}/participants/{participant_id}
```

## SQL Queries

### Xem tất cả nhân viên và vai trò trong một nhiệm vụ
```sql
SELECT 
    tp.role,
    e.first_name || ' ' || e.last_name as employee_name,
    e.email
FROM task_participants tp
INNER JOIN employees e ON e.id = tp.employee_id
WHERE tp.task_id = 'task_id_here'
ORDER BY 
    CASE tp.role 
        WHEN 'responsible' THEN 1
        WHEN 'participant' THEN 2
        WHEN 'observer' THEN 3
    END,
    e.first_name;
```

### Xem tất cả nhiệm vụ của một nhân viên và vai trò trong từng nhiệm vụ
```sql
SELECT 
    t.title as task_title,
    tp.role,
    p.name as project_name
FROM task_participants tp
INNER JOIN tasks t ON t.id = tp.task_id
LEFT JOIN projects p ON p.id = t.project_id
WHERE tp.employee_id = 'employee_id_here'
ORDER BY t.title;
```

### So sánh vai trò trong project_team vs task_participants
```sql
SELECT 
    t.title as task_title,
    e.first_name || ' ' || e.last_name as employee_name,
    pt.responsibility_type as project_team_role,
    tp.role as task_role,
    CASE 
        WHEN pt.responsibility_type = 'accountable' AND tp.role = 'responsible' THEN '✓ Đúng'
        WHEN pt.responsibility_type = 'responsible' AND tp.role = 'responsible' THEN '✓ Đúng'
        WHEN pt.responsibility_type = 'consulted' AND tp.role = 'participant' THEN '✓ Đúng'
        WHEN pt.responsibility_type = 'informed' AND tp.role = 'observer' THEN '✓ Đúng'
        ELSE '⚠ Đã thay đổi'
    END as status
FROM task_participants tp
INNER JOIN tasks t ON t.id = tp.task_id
INNER JOIN employees e ON e.id = tp.employee_id
LEFT JOIN project_team pt ON pt.project_id = t.project_id 
    AND pt.user_id = e.user_id 
    AND pt.status = 'active'
WHERE t.project_id IS NOT NULL
ORDER BY t.title, e.first_name;
```

## Lưu ý Quan trọng

1. **Vai trò riêng được ưu tiên**: Vai trò trong `task_participants` là vai trò thực tế, không bị ghi đè bởi `project_team`

2. **Đồng bộ một chiều**: 
   - Thêm vào `project_team` → Tự động thêm vào tasks (lần đầu)
   - Thay đổi vai trò trong `task_participants` → **KHÔNG** ảnh hưởng đến `project_team`

3. **Xóa khỏi project_team**: 
   - Nếu xóa khỏi `project_team` → Tự động xóa khỏi tất cả tasks
   - Nếu chỉ xóa khỏi 1 task → Chỉ xóa khỏi task đó, vẫn ở trong `project_team`

4. **Linh hoạt**: 
   - Có thể có nhân viên trong task nhưng không trong project_team (thêm trực tiếp vào task)
   - Có thể có nhân viên trong project_team nhưng không trong một số tasks cụ thể (đã xóa riêng)

## Use Cases

### Use Case 1: Chuyên gia tư vấn
- Thêm chuyên gia vào 1 nhiệm vụ cụ thể với vai trò `participant`
- Không cần thêm vào toàn bộ project_team

### Use Case 2: Thay đổi vai trò theo nhiệm vụ
- Nhân viên A: `responsible` trong task 1, nhưng `participant` trong task 2
- Phản ánh đúng thực tế công việc

### Use Case 3: Theo dõi tiến độ
- Thêm manager với vai trò `observer` vào các tasks quan trọng
- Manager chỉ theo dõi, không tham gia trực tiếp











