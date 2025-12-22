-- Migration: Đồng bộ 2 chiều giữa task_participants và project_team
-- Mục đích: Khi thao tác ở một bên, bên kia cũng tự động thay đổi theo
-- Ngày tạo: 2025-01-XX

-- Function: Khi thêm nhân viên vào nhiều tasks của cùng project, tự động thêm vào project_team
CREATE OR REPLACE FUNCTION auto_add_to_project_team_if_in_multiple_tasks()
RETURNS TRIGGER AS $$
DECLARE
    task_project_id UUID;
    employee_user_id UUID;
    task_count INTEGER;
    mapped_responsibility_type TEXT;
BEGIN
    -- Lấy project_id từ task
    SELECT project_id INTO task_project_id
    FROM tasks
    WHERE id = NEW.task_id;
    
    -- Nếu task không có project_id, không làm gì
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
    
    -- Đếm số lượng tasks của project mà nhân viên này đang tham gia
    SELECT COUNT(DISTINCT tp.task_id) INTO task_count
    FROM task_participants tp
    INNER JOIN tasks t ON t.id = tp.task_id
    WHERE tp.employee_id = NEW.employee_id
        AND t.project_id = task_project_id
        AND t.deleted_at IS NULL;
    
    -- Nếu nhân viên tham gia >= 50% số tasks của project, tự động thêm vào project_team
    -- Hoặc nếu tham gia tất cả tasks (nếu project có ít tasks)
    IF task_count >= (
        SELECT GREATEST(1, CEIL(COUNT(*) * 0.5))
        FROM tasks
        WHERE project_id = task_project_id
            AND deleted_at IS NULL
    ) THEN
        -- Map role ngược lại sang responsibility_type
        mapped_responsibility_type := CASE 
            WHEN NEW.role = 'responsible' THEN 'responsible'
            WHEN NEW.role = 'participant' THEN 'consulted'
            WHEN NEW.role = 'observer' THEN 'informed'
            ELSE 'consulted'
        END;
        
        -- Thêm vào project_team nếu chưa có
        -- Map responsibility_type sang role cho project_team
        -- (role trong project_team khác với role trong task_participants)
        INSERT INTO project_team (
            project_id,
            user_id,
            name,
            email,
            status,
            role,
            responsibility_type,
            start_date,  -- FIX: Thêm trường start_date (lấy từ project.start_date)
            created_at,
            updated_at
        )
        SELECT 
            task_project_id,
            employee_user_id,
            e.first_name || ' ' || e.last_name,
            e.email,
            'active',
            CASE 
                WHEN mapped_responsibility_type = 'accountable' THEN 'manager'
                WHEN mapped_responsibility_type = 'responsible' THEN 'member'
                ELSE 'member'
            END,  -- Đảm bảo role không null
            mapped_responsibility_type,
            COALESCE(p.start_date, CURRENT_DATE),  -- Lấy từ project.start_date, nếu null thì dùng ngày hiện tại
            NOW(),
            NOW()
        FROM employees e
        INNER JOIN projects p ON p.id = task_project_id  -- JOIN để lấy start_date từ project
        WHERE e.id = NEW.employee_id
            AND NOT EXISTS (
                SELECT 1 
                FROM project_team pt
                WHERE pt.project_id = task_project_id
                    AND pt.user_id = employee_user_id
            )
        ON CONFLICT DO NOTHING;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Tự động thêm vào project_team khi thêm vào nhiều tasks
DROP TRIGGER IF EXISTS trigger_auto_add_to_project_team_if_in_multiple_tasks ON task_participants;
CREATE TRIGGER trigger_auto_add_to_project_team_if_in_multiple_tasks
    AFTER INSERT ON task_participants
    FOR EACH ROW
    EXECUTE FUNCTION auto_add_to_project_team_if_in_multiple_tasks();

-- Function: Khi xóa nhân viên khỏi tất cả tasks của project, tự động xóa khỏi project_team
CREATE OR REPLACE FUNCTION auto_remove_from_project_team_if_no_tasks()
RETURNS TRIGGER AS $$
DECLARE
    task_project_id UUID;
    employee_user_id UUID;
    remaining_task_count INTEGER;
BEGIN
    -- Lấy project_id từ task đã bị xóa
    SELECT project_id INTO task_project_id
    FROM tasks
    WHERE id = OLD.task_id;
    
    IF task_project_id IS NULL THEN
        RETURN OLD;
    END IF;
    
    -- Lấy user_id từ employee_id
    SELECT user_id INTO employee_user_id
    FROM employees
    WHERE id = OLD.employee_id;
    
    IF employee_user_id IS NULL THEN
        RETURN OLD;
    END IF;
    
    -- Đếm số lượng tasks còn lại mà nhân viên này tham gia trong project
    SELECT COUNT(DISTINCT tp.task_id) INTO remaining_task_count
    FROM task_participants tp
    INNER JOIN tasks t ON t.id = tp.task_id
    WHERE tp.employee_id = OLD.employee_id
        AND t.project_id = task_project_id
        AND t.deleted_at IS NULL;
    
    -- Nếu không còn task nào, xóa khỏi project_team
    IF remaining_task_count = 0 THEN
        DELETE FROM project_team
        WHERE project_id = task_project_id
            AND user_id = employee_user_id;
    END IF;
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Tự động xóa khỏi project_team khi xóa khỏi tất cả tasks
DROP TRIGGER IF EXISTS trigger_auto_remove_from_project_team_if_no_tasks ON task_participants;
CREATE TRIGGER trigger_auto_remove_from_project_team_if_no_tasks
    AFTER DELETE ON task_participants
    FOR EACH ROW
    EXECUTE FUNCTION auto_remove_from_project_team_if_no_tasks();

-- Function: Khi cập nhật role trong task_participants, cập nhật responsibility_type trong project_team
-- (chỉ khi nhân viên tham gia >= 50% tasks của project)
CREATE OR REPLACE FUNCTION auto_update_project_team_role_from_task()
RETURNS TRIGGER AS $$
DECLARE
    task_project_id UUID;
    employee_user_id UUID;
    task_count INTEGER;
    total_tasks INTEGER;
    mapped_responsibility_type TEXT;
BEGIN
    -- Chỉ xử lý nếu role thay đổi
    IF OLD.role = NEW.role THEN
        RETURN NEW;
    END IF;
    
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
    
    -- Đếm số lượng tasks
    SELECT COUNT(DISTINCT tp.task_id) INTO task_count
    FROM task_participants tp
    INNER JOIN tasks t ON t.id = tp.task_id
    WHERE tp.employee_id = NEW.employee_id
        AND t.project_id = task_project_id
        AND t.deleted_at IS NULL;
    
    SELECT COUNT(*) INTO total_tasks
    FROM tasks
    WHERE project_id = task_project_id
        AND deleted_at IS NULL;
    
    -- Chỉ cập nhật nếu tham gia >= 50% tasks
    IF task_count >= GREATEST(1, CEIL(total_tasks * 0.5)) THEN
        -- Map role ngược lại sang responsibility_type
        mapped_responsibility_type := CASE 
            WHEN NEW.role = 'responsible' THEN 'responsible'
            WHEN NEW.role = 'participant' THEN 'consulted'
            WHEN NEW.role = 'observer' THEN 'informed'
            ELSE 'consulted'
        END;
        
        -- Cập nhật project_team
        UPDATE project_team
        SET responsibility_type = mapped_responsibility_type,
            updated_at = NOW()
        WHERE project_id = task_project_id
            AND user_id = employee_user_id
            AND responsibility_type != mapped_responsibility_type;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Tự động cập nhật project_team khi cập nhật role trong task
DROP TRIGGER IF EXISTS trigger_auto_update_project_team_role_from_task ON task_participants;
CREATE TRIGGER trigger_auto_update_project_team_role_from_task
    AFTER UPDATE ON task_participants
    FOR EACH ROW
    WHEN (OLD.role IS DISTINCT FROM NEW.role)
    EXECUTE FUNCTION auto_update_project_team_role_from_task();

-- Ghi chú các functions và triggers
COMMENT ON FUNCTION auto_add_to_project_team_if_in_multiple_tasks() IS 'Tự động thêm vào project_team khi nhân viên tham gia >= 50% tasks của project';
COMMENT ON FUNCTION auto_remove_from_project_team_if_no_tasks() IS 'Tự động xóa khỏi project_team khi nhân viên không còn tham gia task nào của project';
COMMENT ON FUNCTION auto_update_project_team_role_from_task() IS 'Tự động cập nhật responsibility_type trong project_team khi cập nhật role trong task (nếu tham gia >= 50% tasks)';


