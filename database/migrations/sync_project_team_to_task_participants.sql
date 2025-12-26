-- Migration: Đồng bộ thành viên từ project_team sang task_participants
-- Mục đích: Khi thêm thành viên vào đội ngũ dự án, tự động thêm vào tất cả nhiệm vụ của dự án đó
-- Ngày tạo: 2025-01-XX

-- Function: Map responsibility_type (RACI) từ project_team sang role trong task_participants
-- accountable → responsible
-- responsible → responsible
-- consulted → participant
-- informed → observer

-- Function: Khi thêm thành viên vào project_team, tự động thêm vào tất cả nhiệm vụ của dự án
CREATE OR REPLACE FUNCTION auto_add_project_team_to_task_participants()
RETURNS TRIGGER AS $$
DECLARE
    employee_id_val UUID;
    mapped_role TEXT;
BEGIN
    -- Chỉ xử lý nếu status là active
    IF NEW.status != 'active' THEN
        RETURN NEW;
    END IF;
    
    -- Lấy employee_id từ user_id
    SELECT id INTO employee_id_val
    FROM employees
    WHERE user_id = NEW.user_id
    LIMIT 1;
    
    -- Nếu không tìm thấy employee_id, bỏ qua
    IF employee_id_val IS NULL THEN
        RETURN NEW;
    END IF;
    
    -- Map responsibility_type sang role trong task_participants
    mapped_role := CASE 
        WHEN NEW.responsibility_type = 'accountable' THEN 'responsible'
        WHEN NEW.responsibility_type = 'responsible' THEN 'responsible'
        WHEN NEW.responsibility_type = 'consulted' THEN 'participant'
        WHEN NEW.responsibility_type = 'informed' THEN 'observer'
        ELSE 'participant'  -- Default nếu không có responsibility_type
    END;
    
    -- Thêm thành viên vào tất cả nhiệm vụ của dự án
    INSERT INTO task_participants (task_id, employee_id, role, added_by, created_at)
    SELECT 
        t.id AS task_id,
        employee_id_val AS employee_id,
        mapped_role AS role,
        NEW.user_id AS added_by,  -- Hoặc có thể dùng created_by nếu có
        COALESCE(NEW.created_at, NOW()) AS created_at
    FROM tasks t
    WHERE t.project_id = NEW.project_id
        AND t.deleted_at IS NULL  -- Chỉ thêm vào tasks chưa bị xóa
        AND NOT EXISTS (
            SELECT 1 
            FROM task_participants tp 
            WHERE tp.task_id = t.id 
                AND tp.employee_id = employee_id_val
        )
    ON CONFLICT (task_id, employee_id)
    DO UPDATE SET 
        role = EXCLUDED.role;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Tự động thêm thành viên vào tasks khi thêm vào project_team
DROP TRIGGER IF EXISTS trigger_auto_add_project_team_to_task_participants ON project_team;
CREATE TRIGGER trigger_auto_add_project_team_to_task_participants
    AFTER INSERT ON project_team
    FOR EACH ROW
    WHEN (NEW.status = 'active')
    EXECUTE FUNCTION auto_add_project_team_to_task_participants();

-- Function: Khi cập nhật responsibility_type trong project_team, cập nhật role trong task_participants
CREATE OR REPLACE FUNCTION auto_update_project_team_role_in_tasks()
RETURNS TRIGGER AS $$
DECLARE
    employee_id_val UUID;
    mapped_role TEXT;
BEGIN
    -- Chỉ xử lý nếu responsibility_type thay đổi và status là active
    IF NEW.status != 'active' OR (OLD.responsibility_type = NEW.responsibility_type AND OLD.status = NEW.status) THEN
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
                AND t.deleted_at IS NULL
        );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Tự động cập nhật role khi cập nhật responsibility_type
DROP TRIGGER IF EXISTS trigger_auto_update_project_team_role_in_tasks ON project_team;
CREATE TRIGGER trigger_auto_update_project_team_role_in_tasks
    AFTER UPDATE ON project_team
    FOR EACH ROW
    WHEN (NEW.status = 'active' AND (
        OLD.responsibility_type IS DISTINCT FROM NEW.responsibility_type 
        OR OLD.status != NEW.status
    ))
    EXECUTE FUNCTION auto_update_project_team_role_in_tasks();

-- Function: Khi xóa thành viên khỏi project_team hoặc đổi status thành inactive, xóa khỏi tasks
CREATE OR REPLACE FUNCTION auto_remove_project_team_from_tasks()
RETURNS TRIGGER AS $$
DECLARE
    employee_id_val UUID;
BEGIN
    -- Lấy employee_id từ user_id
    SELECT id INTO employee_id_val
    FROM employees
    WHERE user_id = COALESCE(OLD.user_id, NEW.user_id)
    LIMIT 1;
    
    IF employee_id_val IS NULL THEN
        RETURN COALESCE(OLD, NEW);
    END IF;
    
    -- Nếu đang xóa (OLD tồn tại) hoặc đổi status thành inactive
    IF OLD IS NOT NULL AND (TG_OP = 'DELETE' OR NEW.status != 'active') THEN
        -- Xóa khỏi tất cả tasks của dự án
        DELETE FROM task_participants tp
        WHERE tp.employee_id = employee_id_val
            AND tp.task_id IN (
                SELECT t.id 
                FROM tasks t 
                WHERE t.project_id = COALESCE(OLD.project_id, NEW.project_id)
                    AND t.deleted_at IS NULL
            );
    END IF;
    
    RETURN COALESCE(OLD, NEW);
END;
$$ LANGUAGE plpgsql;

-- Trigger: Tự động xóa thành viên khỏi tasks khi xóa khỏi project_team hoặc đổi status
DROP TRIGGER IF EXISTS trigger_auto_remove_project_team_from_tasks ON project_team;
CREATE TRIGGER trigger_auto_remove_project_team_from_tasks
    AFTER DELETE OR UPDATE ON project_team
    FOR EACH ROW
    EXECUTE FUNCTION auto_remove_project_team_from_tasks();

-- Function: Khi tạo task mới trong dự án, tự động thêm tất cả thành viên project_team vào task
CREATE OR REPLACE FUNCTION auto_add_project_team_to_new_task()
RETURNS TRIGGER AS $$
DECLARE
    team_member RECORD;
    employee_id_val UUID;
    mapped_role TEXT;
BEGIN
    -- Chỉ xử lý nếu task có project_id
    IF NEW.project_id IS NULL THEN
        RETURN NEW;
    END IF;
    
    -- Thêm tất cả thành viên active trong project_team vào task mới
    FOR team_member IN 
        SELECT * FROM project_team 
        WHERE project_id = NEW.project_id 
            AND status = 'active'
    LOOP
        -- Lấy employee_id từ user_id
        SELECT id INTO employee_id_val
        FROM employees
        WHERE user_id = team_member.user_id
        LIMIT 1;
        
        IF employee_id_val IS NULL THEN
            CONTINUE;
        END IF;
        
        -- Map responsibility_type sang role
        mapped_role := CASE 
            WHEN team_member.responsibility_type = 'accountable' THEN 'responsible'
            WHEN team_member.responsibility_type = 'responsible' THEN 'responsible'
            WHEN team_member.responsibility_type = 'consulted' THEN 'participant'
            WHEN team_member.responsibility_type = 'informed' THEN 'observer'
            ELSE 'participant'
        END;
        
        -- Thêm vào task_participants
        INSERT INTO task_participants (task_id, employee_id, role, added_by, created_at)
        VALUES (
            NEW.id,
            employee_id_val,
            mapped_role,
            team_member.user_id,
            COALESCE(team_member.created_at, NOW())
        )
        ON CONFLICT (task_id, employee_id)
        DO UPDATE SET 
            role = EXCLUDED.role;
    END LOOP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Tự động thêm thành viên project_team vào task mới
DROP TRIGGER IF EXISTS trigger_auto_add_project_team_to_new_task ON tasks;
CREATE TRIGGER trigger_auto_add_project_team_to_new_task
    AFTER INSERT ON tasks
    FOR EACH ROW
    WHEN (NEW.project_id IS NOT NULL AND NEW.deleted_at IS NULL)
    EXECUTE FUNCTION auto_add_project_team_to_new_task();

-- Ghi chú các functions và triggers
COMMENT ON FUNCTION auto_add_project_team_to_task_participants() IS 'Tự động thêm thành viên mới vào tất cả nhiệm vụ của dự án khi thêm vào project_team';
COMMENT ON FUNCTION auto_update_project_team_role_in_tasks() IS 'Tự động cập nhật role trong tasks khi cập nhật responsibility_type trong project_team';
COMMENT ON FUNCTION auto_remove_project_team_from_tasks() IS 'Tự động xóa thành viên khỏi tất cả tasks khi xóa khỏi project_team hoặc đổi status thành inactive';
COMMENT ON FUNCTION auto_add_project_team_to_new_task() IS 'Tự động thêm tất cả thành viên project_team vào task mới khi tạo task trong dự án';















