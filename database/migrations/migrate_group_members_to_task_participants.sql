-- Migration: Chuyển thành viên từ nhóm nhiệm vụ sang thành viên của từng nhiệm vụ trong nhóm
-- Mục đích: Thay vì gán thành viên ở cấp nhóm, gán thành viên cho từng nhiệm vụ riêng lẻ
-- Ngày tạo: 2025-01-XX

-- Bước 1: Chuyển tất cả thành viên từ task_group_members sang task_participants
-- Với mỗi nhiệm vụ trong nhóm, thêm tất cả thành viên của nhóm đó vào task_participants
-- Lưu ý: Constraint unique là (task_id, employee_id), không có role. Role là text, không phải enum.

INSERT INTO task_participants (task_id, employee_id, role, added_by, created_at)
SELECT 
    t.id AS task_id,
    tgm.employee_id,
    CASE 
        WHEN tgm.role = 'owner' THEN 'responsible'
        WHEN tgm.role = 'admin' THEN 'responsible'
        ELSE 'participant'
    END AS role,
    tgm.added_by,
    COALESCE(tgm.created_at, NOW()) AS created_at
FROM tasks t
INNER JOIN task_group_members tgm ON t.group_id = tgm.group_id
WHERE t.group_id IS NOT NULL
    -- Chỉ thêm nếu chưa tồn tại (tránh duplicate)
    AND NOT EXISTS (
        SELECT 1 
        FROM task_participants tp 
        WHERE tp.task_id = t.id 
            AND tp.employee_id = tgm.employee_id
    )
ON CONFLICT (task_id, employee_id) 
DO UPDATE SET 
    role = EXCLUDED.role;

-- Bước 2: Tạo index để tối ưu hiệu suất (nếu chưa có)
CREATE INDEX IF NOT EXISTS idx_task_participants_task_id ON task_participants(task_id);
CREATE INDEX IF NOT EXISTS idx_task_participants_employee_id ON task_participants(employee_id);

-- Bước 3: Thêm comment để ghi chú migration
COMMENT ON TABLE task_participants IS 'Thành viên của từng nhiệm vụ. Đã được migrate từ task_group_members.';

-- Bước 4: (Tùy chọn) Xóa dữ liệu cũ từ task_group_members nếu muốn
-- UNCOMMENT dòng dưới nếu muốn xóa thành viên khỏi nhóm sau khi đã migrate
-- DELETE FROM task_group_members;

-- Bước 5: Tạo function để tự động thêm thành viên mới vào task_participants khi:
-- - Thêm thành viên vào nhóm → tự động thêm vào tất cả nhiệm vụ trong nhóm
-- - Thêm nhiệm vụ mới vào nhóm → tự động thêm tất cả thành viên nhóm vào nhiệm vụ

-- Function: Khi thêm thành viên vào nhóm, tự động thêm vào tất cả nhiệm vụ trong nhóm
CREATE OR REPLACE FUNCTION auto_add_group_member_to_tasks()
RETURNS TRIGGER AS $$
BEGIN
    -- Thêm thành viên mới vào tất cả nhiệm vụ trong nhóm
    INSERT INTO task_participants (task_id, employee_id, role, added_by, created_at)
    SELECT 
        t.id AS task_id,
        NEW.employee_id,
        CASE 
            WHEN NEW.role = 'owner' THEN 'responsible'
            WHEN NEW.role = 'admin' THEN 'responsible'
            ELSE 'participant'
        END AS role,
        NEW.added_by,
        COALESCE(NEW.created_at, NOW()) AS created_at
    FROM tasks t
    WHERE t.group_id = NEW.group_id
        AND NOT EXISTS (
            SELECT 1 
            FROM task_participants tp 
            WHERE tp.task_id = t.id 
                AND tp.employee_id = NEW.employee_id
                AND tp.employee_id = NEW.employee_id
        )
    ON CONFLICT (task_id, employee_id)
    DO UPDATE SET 
        role = EXCLUDED.role;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Tự động thêm thành viên vào nhiệm vụ khi thêm vào nhóm
DROP TRIGGER IF EXISTS trigger_auto_add_group_member_to_tasks ON task_group_members;
CREATE TRIGGER trigger_auto_add_group_member_to_tasks
    AFTER INSERT ON task_group_members
    FOR EACH ROW
    EXECUTE FUNCTION auto_add_group_member_to_tasks();

-- Function: Khi thêm nhiệm vụ mới vào nhóm, tự động thêm tất cả thành viên nhóm vào nhiệm vụ
CREATE OR REPLACE FUNCTION auto_add_task_to_group_members()
RETURNS TRIGGER AS $$
BEGIN
    -- Chỉ xử lý nếu nhiệm vụ có group_id
    IF NEW.group_id IS NOT NULL THEN
        -- Thêm tất cả thành viên nhóm vào nhiệm vụ mới
        INSERT INTO task_participants (task_id, employee_id, role, added_by, created_at)
        SELECT 
            NEW.id AS task_id,
            tgm.employee_id,
            CASE 
                WHEN tgm.role = 'owner' THEN 'responsible'
                WHEN tgm.role = 'admin' THEN 'responsible'
                ELSE 'participant'
            END AS role,
            tgm.added_by,
            COALESCE(tgm.created_at, NOW()) AS created_at
        FROM task_group_members tgm
        WHERE tgm.group_id = NEW.group_id
            AND NOT EXISTS (
                SELECT 1 
                FROM task_participants tp 
                WHERE tp.task_id = NEW.id 
                    AND tp.employee_id = tgm.employee_id
                    AND tp.employee_id = tgm.employee_id
            )
        ON CONFLICT (task_id, employee_id)
        DO UPDATE SET 
            role = EXCLUDED.role;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Tự động thêm thành viên nhóm vào nhiệm vụ mới
DROP TRIGGER IF EXISTS trigger_auto_add_task_to_group_members ON tasks;
CREATE TRIGGER trigger_auto_add_task_to_group_members
    AFTER INSERT ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION auto_add_task_to_group_members();

-- Function: Khi xóa thành viên khỏi nhóm, tự động xóa khỏi tất cả nhiệm vụ trong nhóm
CREATE OR REPLACE FUNCTION auto_remove_group_member_from_tasks()
RETURNS TRIGGER AS $$
BEGIN
    -- Xóa thành viên khỏi tất cả nhiệm vụ trong nhóm
    DELETE FROM task_participants tp
    WHERE tp.employee_id = OLD.employee_id
        AND tp.task_id IN (
            SELECT t.id 
            FROM tasks t 
            WHERE t.group_id = OLD.group_id
        );
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Tự động xóa thành viên khỏi nhiệm vụ khi xóa khỏi nhóm
DROP TRIGGER IF EXISTS trigger_auto_remove_group_member_from_tasks ON task_group_members;
CREATE TRIGGER trigger_auto_remove_group_member_from_tasks
    AFTER DELETE ON task_group_members
    FOR EACH ROW
    EXECUTE FUNCTION auto_remove_group_member_from_tasks();

-- Ghi chú các functions và triggers
COMMENT ON FUNCTION auto_add_group_member_to_tasks() IS 'Tự động thêm thành viên mới vào tất cả nhiệm vụ trong nhóm khi thêm vào task_group_members';
COMMENT ON FUNCTION auto_add_task_to_group_members() IS 'Tự động thêm tất cả thành viên nhóm vào nhiệm vụ mới khi tạo nhiệm vụ có group_id';
COMMENT ON FUNCTION auto_remove_group_member_from_tasks() IS 'Tự động xóa thành viên khỏi tất cả nhiệm vụ trong nhóm khi xóa khỏi task_group_members';

