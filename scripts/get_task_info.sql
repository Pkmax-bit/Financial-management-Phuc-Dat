-- =====================================================
-- LẤY THÔNG TIN NHÓM, NHIỆM VỤ "test 7" VÀ THÀNH VIÊN
-- =====================================================

-- 1. Tìm nhiệm vụ "test 7"
SELECT 
    t.id as task_id,
    t.title as task_title,
    t.status,
    t.priority,
    t.description,
    t.group_id,
    t.assigned_to,
    t.created_at,
    t.updated_at
FROM tasks t
WHERE LOWER(t.title) LIKE '%test 7%'
  AND t.deleted_at IS NULL
ORDER BY t.created_at DESC;

-- 2. Lấy thông tin nhóm (nếu có)
-- Thay YOUR_TASK_ID bằng task_id từ kết quả query trên
SELECT 
    tg.id as group_id,
    tg.name as group_name,
    tg.description as group_description,
    tg.created_at
FROM task_groups tg
WHERE tg.id = (
    SELECT group_id FROM tasks 
    WHERE LOWER(title) LIKE '%test 7%' 
      AND deleted_at IS NULL 
    LIMIT 1
);

-- 3. Lấy assignments (từ task_assignments)
-- Thay YOUR_TASK_ID bằng task_id từ kết quả query trên
SELECT 
    ta.id as assignment_id,
    ta.task_id,
    ta.assigned_to as employee_id,
    e.first_name,
    e.last_name,
    e.email,
    ta.status as assignment_status,
    ta.assigned_at,
    u.full_name as assigned_by_name
FROM task_assignments ta
LEFT JOIN employees e ON ta.assigned_to = e.id
LEFT JOIN users u ON ta.assigned_by = u.id
WHERE ta.task_id = (
    SELECT id FROM tasks 
    WHERE LOWER(title) LIKE '%test 7%' 
      AND deleted_at IS NULL 
    LIMIT 1
);

-- 4. Lấy participants (từ task_participants)
-- Thay YOUR_TASK_ID bằng task_id từ kết quả query trên
SELECT 
    tp.id as participant_id,
    tp.task_id,
    tp.employee_id,
    e.first_name,
    e.last_name,
    e.email,
    tp.role,
    tp.added_at
FROM task_participants tp
LEFT JOIN employees e ON tp.employee_id = e.id
WHERE tp.task_id = (
    SELECT id FROM tasks 
    WHERE LOWER(title) LIKE '%test 7%' 
      AND deleted_at IS NULL 
    LIMIT 1
);

-- 5. Lấy group members (nếu có group_id)
-- Thay YOUR_GROUP_ID bằng group_id từ kết quả query trên
SELECT 
    tgm.id as member_id,
    tgm.group_id,
    tgm.employee_id,
    e.first_name,
    e.last_name,
    e.email,
    tgm.role,
    tgm.added_at
FROM task_group_members tgm
LEFT JOIN employees e ON tgm.employee_id = e.id
WHERE tgm.group_id = (
    SELECT group_id FROM tasks 
    WHERE LOWER(title) LIKE '%test 7%' 
      AND deleted_at IS NULL 
    LIMIT 1
);

-- 6. Lấy assigned_to từ task (nếu có)
SELECT 
    t.id as task_id,
    t.assigned_to as employee_id,
    e.first_name,
    e.last_name,
    e.email
FROM tasks t
LEFT JOIN employees e ON t.assigned_to = e.id
WHERE LOWER(t.title) LIKE '%test 7%'
  AND t.deleted_at IS NULL
LIMIT 1;

-- =====================================================
-- TỔNG HỢP TẤT CẢ THÀNH VIÊN (UNION ALL)
-- =====================================================
WITH task_info AS (
    SELECT id, title, group_id, assigned_to
    FROM tasks
    WHERE LOWER(title) LIKE '%test 7%'
      AND deleted_at IS NULL
    LIMIT 1
)
SELECT 
    'task.assigned_to' as source,
    e.id as employee_id,
    e.first_name,
    e.last_name,
    e.email,
    NULL as role
FROM task_info ti
LEFT JOIN employees e ON ti.assigned_to = e.id
WHERE e.id IS NOT NULL

UNION ALL

SELECT 
    'task_assignments' as source,
    e.id as employee_id,
    e.first_name,
    e.last_name,
    e.email,
    ta.status as role
FROM task_info ti
JOIN task_assignments ta ON ta.task_id = ti.id
LEFT JOIN employees e ON ta.assigned_to = e.id
WHERE e.id IS NOT NULL

UNION ALL

SELECT 
    'task_participants' as source,
    e.id as employee_id,
    e.first_name,
    e.last_name,
    e.email,
    tp.role
FROM task_info ti
JOIN task_participants tp ON tp.task_id = ti.id
LEFT JOIN employees e ON tp.employee_id = e.id
WHERE e.id IS NOT NULL

UNION ALL

SELECT 
    'task_group_members' as source,
    e.id as employee_id,
    e.first_name,
    e.last_name,
    e.email,
    tgm.role
FROM task_info ti
JOIN task_group_members tgm ON tgm.group_id = ti.group_id
LEFT JOIN employees e ON tgm.employee_id = e.id
WHERE e.id IS NOT NULL
  AND ti.group_id IS NOT NULL

ORDER BY source, first_name, last_name;

