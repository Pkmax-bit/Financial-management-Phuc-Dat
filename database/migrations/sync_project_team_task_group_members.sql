-- Migration: Đồng bộ xóa thành viên giữa project_team và task_group_members
-- Khi xóa thành viên khỏi project_team → tự động xóa khỏi task_group_members
-- Khi xóa thành viên khỏi task_group_members → tự động xóa khỏi project_team nếu không còn ở task group nào khác

-- Function: Xóa khỏi task_group_members khi xóa khỏi project_team
CREATE OR REPLACE FUNCTION sync_delete_task_group_members_on_project_team_delete()
RETURNS TRIGGER AS $$
DECLARE
    v_employee_id UUID;
    v_user_id UUID;
    v_project_id UUID;
    v_group_ids UUID[];
BEGIN
    -- Get employee_id and project_id from deleted record
    v_user_id := OLD.user_id;
    v_project_id := OLD.project_id;
    
    -- Find employee_id from user_id
    IF v_user_id IS NOT NULL THEN
        SELECT id INTO v_employee_id
        FROM employees
        WHERE user_id = v_user_id
        LIMIT 1;
    END IF;
    
    -- If we have employee_id, remove from task_group_members
    IF v_employee_id IS NOT NULL THEN
        -- Get all task group IDs from tasks in this project
        SELECT ARRAY_AGG(DISTINCT group_id) INTO v_group_ids
        FROM tasks
        WHERE project_id = v_project_id
        AND deleted_at IS NULL
        AND group_id IS NOT NULL;
        
        -- Remove from task_group_members
        IF v_group_ids IS NOT NULL AND array_length(v_group_ids, 1) > 0 THEN
            DELETE FROM task_group_members
            WHERE employee_id = v_employee_id
            AND group_id = ANY(v_group_ids);
        END IF;
    END IF;
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Xóa khỏi task_group_members khi xóa khỏi project_team
DROP TRIGGER IF EXISTS trigger_sync_delete_task_group_members ON project_team;
CREATE TRIGGER trigger_sync_delete_task_group_members
    AFTER DELETE ON project_team
    FOR EACH ROW
    EXECUTE FUNCTION sync_delete_task_group_members_on_project_team_delete();

-- Function: Xóa khỏi project_team khi xóa khỏi task_group_members (nếu không còn ở task group nào khác)
CREATE OR REPLACE FUNCTION sync_delete_project_team_on_task_group_member_delete()
RETURNS TRIGGER AS $$
DECLARE
    v_employee_id UUID;
    v_user_id UUID;
    v_group_id UUID;
    v_project_id UUID;
    v_remaining_groups UUID[];
    v_category_id UUID;
BEGIN
    -- Get employee_id and group_id from deleted record
    v_employee_id := OLD.employee_id;
    v_group_id := OLD.group_id;
    
    -- Get category_id from task_group
    SELECT category_id INTO v_category_id
    FROM task_groups
    WHERE id = v_group_id;
    
    -- Get project_id from category or from tasks
    IF v_category_id IS NOT NULL THEN
        SELECT id INTO v_project_id
        FROM projects
        WHERE category_id = v_category_id
        LIMIT 1;
    END IF;
    
    -- If still no project_id, get from tasks
    IF v_project_id IS NULL THEN
        SELECT project_id INTO v_project_id
        FROM tasks
        WHERE group_id = v_group_id
        AND deleted_at IS NULL
        LIMIT 1;
    END IF;
    
    -- If we have employee_id and project_id, check if still in other groups
    IF v_employee_id IS NOT NULL AND v_project_id IS NOT NULL THEN
        -- Get user_id from employee
        SELECT user_id INTO v_user_id
        FROM employees
        WHERE id = v_employee_id
        LIMIT 1;
        
        -- Get all task group IDs in this project
        IF v_category_id IS NOT NULL THEN
            SELECT ARRAY_AGG(id) INTO v_remaining_groups
            FROM task_groups
            WHERE category_id = v_category_id;
        ELSE
            SELECT ARRAY_AGG(DISTINCT group_id) INTO v_remaining_groups
            FROM tasks
            WHERE project_id = v_project_id
            AND deleted_at IS NULL
            AND group_id IS NOT NULL;
        END IF;
        
        -- Check if employee is still in any other task group
        IF v_remaining_groups IS NOT NULL AND array_length(v_remaining_groups, 1) > 0 THEN
            -- Check if employee is in any remaining group
            IF NOT EXISTS (
                SELECT 1
                FROM task_group_members
                WHERE employee_id = v_employee_id
                AND group_id = ANY(v_remaining_groups)
            ) THEN
                -- Not in any other group, remove from project_team
                IF v_user_id IS NOT NULL THEN
                    DELETE FROM project_team
                    WHERE project_id = v_project_id
                    AND user_id = v_user_id;
                END IF;
            END IF;
        ELSE
            -- No other groups, remove from project_team
            IF v_user_id IS NOT NULL THEN
                DELETE FROM project_team
                WHERE project_id = v_project_id
                AND user_id = v_user_id;
            END IF;
        END IF;
    END IF;
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Xóa khỏi project_team khi xóa khỏi task_group_members
DROP TRIGGER IF EXISTS trigger_sync_delete_project_team ON task_group_members;
CREATE TRIGGER trigger_sync_delete_project_team
    AFTER DELETE ON task_group_members
    FOR EACH ROW
    EXECUTE FUNCTION sync_delete_project_team_on_task_group_member_delete();

-- Add comments
COMMENT ON FUNCTION sync_delete_task_group_members_on_project_team_delete() IS 'Tự động xóa khỏi task_group_members khi xóa khỏi project_team';
COMMENT ON FUNCTION sync_delete_project_team_on_task_group_member_delete() IS 'Tự động xóa khỏi project_team khi xóa khỏi task_group_members (nếu không còn ở task group nào khác)';
























