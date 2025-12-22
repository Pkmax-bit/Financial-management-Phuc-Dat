-- Fix: Thêm trường role vào INSERT statement trong trigger auto_add_to_project_team_if_in_multiple_tasks
-- Lỗi: "null value in column "role" of relation "project_team" violates not-null constraint"
-- Nguyên nhân: Trigger INSERT vào project_team nhưng thiếu trường role (NOT NULL)

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
        -- FIX: Thêm trường role và start_date (NOT NULL constraint)
        INSERT INTO project_team (
            project_id,
            user_id,
            name,
            email,
            status,
            role,  -- FIX: Thêm trường role
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
            END,  -- Map responsibility_type sang role cho project_team
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

COMMENT ON FUNCTION auto_add_to_project_team_if_in_multiple_tasks() IS 'Tự động thêm vào project_team khi nhân viên tham gia >= 50% tasks của project. FIX: Đã thêm trường role để tránh lỗi NOT NULL constraint';

