-- Migration: Đồng bộ vai trò trong task_participants với project_team
-- Mục đích: Đảm bảo vai trò trong nhiệm vụ giống với vai trò ở đội ngũ dự án
-- Ngày tạo: 2025-01-XX

-- Bước 1: Cập nhật lại vai trò trong task_participants để khớp với project_team
UPDATE task_participants tp
SET role = CASE 
    WHEN pt.responsibility_type = 'accountable' THEN 'responsible'
    WHEN pt.responsibility_type = 'responsible' THEN 'responsible'
    WHEN pt.responsibility_type = 'consulted' THEN 'participant'
    WHEN pt.responsibility_type = 'informed' THEN 'observer'
    ELSE tp.role  -- Giữ nguyên nếu không có trong project_team
END
FROM employees e
INNER JOIN tasks t ON t.id = tp.task_id
INNER JOIN projects p ON p.id = t.project_id
INNER JOIN project_team pt ON pt.project_id = p.id 
    AND pt.user_id = e.user_id 
    AND pt.status = 'active'
WHERE tp.employee_id = e.id
    AND tp.role != CASE 
        WHEN pt.responsibility_type = 'accountable' THEN 'responsible'
        WHEN pt.responsibility_type = 'responsible' THEN 'responsible'
        WHEN pt.responsibility_type = 'consulted' THEN 'participant'
        WHEN pt.responsibility_type = 'informed' THEN 'observer'
        ELSE tp.role
    END;

-- Bước 2: Tạo function để tự động cập nhật vai trò khi cập nhật responsibility_type trong project_team
-- (Function này đã có trong sync_project_team_to_task_participants.sql, nhưng cần đảm bảo nó cập nhật đúng)

-- Bước 3: Tạo function để tự động cập nhật vai trò khi thêm thành viên vào task_participants
-- Nếu thành viên đã có trong project_team, sử dụng vai trò từ project_team
CREATE OR REPLACE FUNCTION auto_sync_task_participant_role_from_project_team()
RETURNS TRIGGER AS $$
DECLARE
    task_project_id UUID;
    employee_user_id UUID;
    project_team_role TEXT;
    mapped_role TEXT;
BEGIN
    -- Lấy project_id từ task
    SELECT project_id INTO task_project_id
    FROM tasks
    WHERE id = NEW.task_id;
    
    IF task_project_id IS NULL THEN
        RETURN NEW;
    END IF;
    
    -- Lấy user_id từ employee_id
    SELECT user_id INTO employee_user_id
    FROM employees
    WHERE id = NEW.employee_id;
    
    IF employee_user_id IS NULL THEN
        RETURN NEW;
    END IF;
    
    -- Lấy responsibility_type từ project_team
    SELECT responsibility_type INTO project_team_role
    FROM project_team
    WHERE project_id = task_project_id
        AND user_id = employee_user_id
        AND status = 'active'
    LIMIT 1;
    
    -- Nếu có trong project_team, map sang role
    IF project_team_role IS NOT NULL THEN
        mapped_role := CASE 
            WHEN project_team_role = 'accountable' THEN 'responsible'
            WHEN project_team_role = 'responsible' THEN 'responsible'
            WHEN project_team_role = 'consulted' THEN 'participant'
            WHEN project_team_role = 'informed' THEN 'observer'
            ELSE NEW.role
        END;
        
        -- Cập nhật role nếu khác
        IF mapped_role != NEW.role THEN
            NEW.role := mapped_role;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Tự động đồng bộ vai trò khi thêm thành viên vào task_participants
DROP TRIGGER IF EXISTS trigger_auto_sync_task_participant_role_from_project_team ON task_participants;
CREATE TRIGGER trigger_auto_sync_task_participant_role_from_project_team
    BEFORE INSERT OR UPDATE ON task_participants
    FOR EACH ROW
    EXECUTE FUNCTION auto_sync_task_participant_role_from_project_team();

-- Bước 4: Cập nhật function auto_update_project_team_role_in_tasks để đảm bảo cập nhật đúng
CREATE OR REPLACE FUNCTION auto_update_project_team_role_in_tasks()
RETURNS TRIGGER AS $$
DECLARE
    employee_id_val UUID;
    mapped_role TEXT;
BEGIN
    -- Chỉ xử lý nếu responsibility_type thay đổi và status là active
    IF NEW.status != 'active' OR (OLD.responsibility_type IS NOT DISTINCT FROM NEW.responsibility_type AND OLD.status = NEW.status) THEN
        RETURN NEW;
    END IF;
    
    -- Lấy employee_id từ user_id
    SELECT id INTO employee_id_val
    FROM employees
    WHERE user_id = NEW.user_id
    LIMIT 1;
    
    IF employee_id_val IS NULL THEN
        RETURN NEW;
    END IF;
    
    -- Map responsibility_type sang role
    mapped_role := CASE 
        WHEN NEW.responsibility_type = 'accountable' THEN 'responsible'
        WHEN NEW.responsibility_type = 'responsible' THEN 'responsible'
        WHEN NEW.responsibility_type = 'consulted' THEN 'participant'
        WHEN NEW.responsibility_type = 'informed' THEN 'observer'
        ELSE 'participant'
    END;
    
    -- Cập nhật role trong tất cả tasks của dự án
    UPDATE task_participants tp
    SET role = mapped_role
    WHERE tp.employee_id = employee_id_val
        AND tp.task_id IN (
            SELECT t.id 
            FROM tasks t 
            WHERE t.project_id = NEW.project_id
                AND (t.deleted_at IS NULL OR t.deleted_at IS NOT NULL)
        )
        AND tp.role != mapped_role;  -- Chỉ cập nhật nếu khác
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Ghi chú
COMMENT ON FUNCTION auto_sync_task_participant_role_from_project_team() IS 'Tự động đồng bộ vai trò từ project_team khi thêm/cập nhật task_participants';
COMMENT ON FUNCTION auto_update_project_team_role_in_tasks() IS 'Tự động cập nhật role trong task_participants khi cập nhật responsibility_type trong project_team';






