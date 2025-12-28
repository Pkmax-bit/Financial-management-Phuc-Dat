-- Migration: Tự động gửi thông báo cho nhân viên khi được thêm vào nhiệm vụ
-- Mục đích: Khi thêm nhân viên vào task_participants, tự động tạo thông báo theo vai trò
-- Ngày tạo: 2025-01-XX

-- Function: Tạo thông báo cho nhân viên khi được thêm vào nhiệm vụ
CREATE OR REPLACE FUNCTION auto_notify_task_participant_added()
RETURNS TRIGGER AS $$
DECLARE
    task_title TEXT;
    task_project_id UUID;
    employee_user_id UUID;
    employee_name TEXT;
    role_message TEXT;
    notification_title TEXT;
    notification_message TEXT;
    created_by_user_id UUID;
BEGIN
    -- Lấy thông tin task
    SELECT 
        t.title,
        t.project_id,
        t.created_by
    INTO 
        task_title,
        task_project_id,
        created_by_user_id
    FROM tasks t
    WHERE t.id = NEW.task_id;
    
    -- Nếu không tìm thấy task, bỏ qua
    IF task_title IS NULL THEN
        RETURN NEW;
    END IF;
    
    -- Lấy thông tin nhân viên
    SELECT 
        e.user_id,
        COALESCE(e.first_name || ' ' || e.last_name, 'Nhân viên') as name
    INTO 
        employee_user_id,
        employee_name
    FROM employees e
    WHERE e.id = NEW.employee_id;
    
    -- Nếu không có user_id, không thể gửi thông báo
    IF employee_user_id IS NULL THEN
        RETURN NEW;
    END IF;
    
    -- Tạo thông báo theo vai trò
    role_message := CASE 
        WHEN NEW.role = 'responsible' THEN 'bạn được giao làm người chịu trách nhiệm chính'
        WHEN NEW.role = 'participant' THEN 'bạn được mời tham gia'
        WHEN NEW.role = 'observer' THEN 'bạn được mời theo dõi'
        ELSE 'bạn được thêm vào'
    END;
    
    notification_title := 'Bạn được thêm vào nhiệm vụ: ' || task_title;
    notification_message := 'Xin chào ' || employee_name || ', ' || role_message || ' nhiệm vụ "' || task_title || '". Vui lòng kiểm tra và thực hiện nhiệm vụ này.';
    
    -- Tạo thông báo
    INSERT INTO task_notifications (
        task_id,
        user_id,
        employee_id,
        notification_type,
        title,
        message,
        is_read,
        created_at
    )
    VALUES (
        NEW.task_id,
        employee_user_id,
        NEW.employee_id,
        'task_assigned',
        notification_title,
        notification_message,
        FALSE,
        NOW()
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Tự động gửi thông báo khi thêm nhân viên vào nhiệm vụ
DROP TRIGGER IF EXISTS trigger_auto_notify_task_participant_added ON task_participants;
CREATE TRIGGER trigger_auto_notify_task_participant_added
    AFTER INSERT ON task_participants
    FOR EACH ROW
    EXECUTE FUNCTION auto_notify_task_participant_added();

-- Function: Tạo thông báo khi cập nhật vai trò của nhân viên trong nhiệm vụ
CREATE OR REPLACE FUNCTION auto_notify_task_participant_role_updated()
RETURNS TRIGGER AS $$
DECLARE
    task_title TEXT;
    employee_user_id UUID;
    employee_name TEXT;
    old_role_message TEXT;
    new_role_message TEXT;
    notification_title TEXT;
    notification_message TEXT;
BEGIN
    -- Chỉ xử lý nếu role thay đổi
    IF OLD.role = NEW.role THEN
        RETURN NEW;
    END IF;
    
    -- Lấy thông tin task
    SELECT title INTO task_title
    FROM tasks
    WHERE id = NEW.task_id;
    
    IF task_title IS NULL THEN
        RETURN NEW;
    END IF;
    
    -- Lấy thông tin nhân viên
    SELECT 
        e.user_id,
        COALESCE(e.first_name || ' ' || e.last_name, 'Nhân viên') as name
    INTO 
        employee_user_id,
        employee_name
    FROM employees e
    WHERE e.id = NEW.employee_id;
    
    IF employee_user_id IS NULL THEN
        RETURN NEW;
    END IF;
    
    -- Tạo thông báo về thay đổi vai trò
    old_role_message := CASE 
        WHEN OLD.role = 'responsible' THEN 'người chịu trách nhiệm chính'
        WHEN OLD.role = 'participant' THEN 'người tham gia'
        WHEN OLD.role = 'observer' THEN 'người theo dõi'
        ELSE 'thành viên'
    END;
    
    new_role_message := CASE 
        WHEN NEW.role = 'responsible' THEN 'người chịu trách nhiệm chính'
        WHEN NEW.role = 'participant' THEN 'người tham gia'
        WHEN NEW.role = 'observer' THEN 'người theo dõi'
        ELSE 'thành viên'
    END;
    
    notification_title := 'Vai trò của bạn đã thay đổi trong nhiệm vụ: ' || task_title;
    notification_message := 'Xin chào ' || employee_name || ', vai trò của bạn trong nhiệm vụ "' || task_title || '" đã được thay đổi từ ' || old_role_message || ' thành ' || new_role_message || '.';
    
    -- Tạo thông báo
    INSERT INTO task_notifications (
        task_id,
        user_id,
        employee_id,
        notification_type,
        title,
        message,
        is_read,
        created_at
    )
    VALUES (
        NEW.task_id,
        employee_user_id,
        NEW.employee_id,
        'role_updated',
        notification_title,
        notification_message,
        FALSE,
        NOW()
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Tự động gửi thông báo khi cập nhật vai trò
DROP TRIGGER IF EXISTS trigger_auto_notify_task_participant_role_updated ON task_participants;
CREATE TRIGGER trigger_auto_notify_task_participant_role_updated
    AFTER UPDATE ON task_participants
    FOR EACH ROW
    WHEN (OLD.role IS DISTINCT FROM NEW.role)
    EXECUTE FUNCTION auto_notify_task_participant_role_updated();

-- Function: Tạo thông báo khi task được cập nhật (status, priority, due_date, etc.)
CREATE OR REPLACE FUNCTION auto_notify_task_updated()
RETURNS TRIGGER AS $$
DECLARE
    participant_record RECORD;
    employee_user_id UUID;
    employee_name TEXT;
    change_message TEXT;
    notification_title TEXT;
    notification_message TEXT;
BEGIN
    -- Chỉ xử lý nếu có thay đổi quan trọng
    IF OLD.status = NEW.status 
       AND OLD.priority = NEW.priority 
       AND OLD.due_date IS NOT DISTINCT FROM NEW.due_date
       AND OLD.title = NEW.title THEN
        RETURN NEW;
    END IF;
    
    -- Tạo thông điệp về thay đổi
    change_message := '';
    
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        change_message := change_message || 'Trạng thái: ' || OLD.status || ' → ' || NEW.status || '. ';
    END IF;
    
    IF OLD.priority IS DISTINCT FROM NEW.priority THEN
        change_message := change_message || 'Độ ưu tiên: ' || OLD.priority || ' → ' || NEW.priority || '. ';
    END IF;
    
    IF OLD.due_date IS DISTINCT FROM NEW.due_date THEN
        IF NEW.due_date IS NOT NULL THEN
            change_message := change_message || 'Hạn chót: ' || TO_CHAR(NEW.due_date, 'DD/MM/YYYY') || '. ';
        ELSE
            change_message := change_message || 'Hạn chót đã được gỡ bỏ. ';
        END IF;
    END IF;
    
    IF change_message = '' THEN
        RETURN NEW;
    END IF;
    
    notification_title := 'Nhiệm vụ đã được cập nhật: ' || NEW.title;
    
    -- Gửi thông báo cho tất cả participants
    FOR participant_record IN 
        SELECT DISTINCT tp.employee_id, tp.role
        FROM task_participants tp
        WHERE tp.task_id = NEW.id
    LOOP
        -- Lấy user_id từ employee_id
        SELECT 
            e.user_id,
            COALESCE(e.first_name || ' ' || e.last_name, 'Nhân viên') as name
        INTO 
            employee_user_id,
            employee_name
        FROM employees e
        WHERE e.id = participant_record.employee_id;
        
        IF employee_user_id IS NOT NULL THEN
            notification_message := 'Xin chào ' || employee_name || ', nhiệm vụ "' || NEW.title || '" đã được cập nhật: ' || change_message;
            
            INSERT INTO task_notifications (
                task_id,
                user_id,
                employee_id,
                notification_type,
                title,
                message,
                is_read,
                created_at
            )
            VALUES (
                NEW.id,
                employee_user_id,
                participant_record.employee_id,
                'task_updated',
                notification_title,
                notification_message,
                FALSE,
                NOW()
            );
        END IF;
    END LOOP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Tự động gửi thông báo khi task được cập nhật
DROP TRIGGER IF EXISTS trigger_auto_notify_task_updated ON tasks;
CREATE TRIGGER trigger_auto_notify_task_updated
    AFTER UPDATE ON tasks
    FOR EACH ROW
    WHEN (
        OLD.status IS DISTINCT FROM NEW.status 
        OR OLD.priority IS DISTINCT FROM NEW.priority 
        OR OLD.due_date IS DISTINCT FROM NEW.due_date
        OR OLD.title IS DISTINCT FROM NEW.title
    )
    EXECUTE FUNCTION auto_notify_task_updated();

-- Ghi chú các functions và triggers
COMMENT ON FUNCTION auto_notify_task_participant_added() IS 'Tự động gửi thông báo cho nhân viên khi được thêm vào nhiệm vụ, theo vai trò';
COMMENT ON FUNCTION auto_notify_task_participant_role_updated() IS 'Tự động gửi thông báo khi vai trò của nhân viên trong nhiệm vụ được thay đổi';
COMMENT ON FUNCTION auto_notify_task_updated() IS 'Tự động gửi thông báo cho tất cả participants khi task được cập nhật (status, priority, due_date)';

















