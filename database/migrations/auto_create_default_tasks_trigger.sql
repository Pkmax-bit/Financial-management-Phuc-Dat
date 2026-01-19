-- Migration: Auto-create default tasks when a project is created
-- Date: 2025-01-19
-- Description: Create database trigger and function to automatically create default tasks
--               when a project is inserted (works for both API and direct database inserts)

-- ============================================================
-- PART 1: CREATE FUNCTION TO CREATE DEFAULT TASKS
-- ============================================================

CREATE OR REPLACE FUNCTION create_default_tasks_for_new_project()
RETURNS TRIGGER AS $$
DECLARE
    parent_task_id UUID;
    sub_task_id UUID;
    task_group RECORD;
    sub_task RECORD;
    project_start_date DATE;
    created_by_user_id UUID;
    parent_task_title TEXT;
    sub_task_title TEXT;
BEGIN
    -- Get project start_date
    project_start_date := NEW.start_date;
    
    -- Try to get created_by from auth context or use a default
    -- If created_by column doesn't exist, we'll use NULL or try to get from auth.uid()
    created_by_user_id := COALESCE(
        (SELECT id FROM users WHERE id = auth.uid() LIMIT 1),
        (SELECT id FROM users WHERE role = 'admin' LIMIT 1),
        NULL
    );
    
    -- If still no user, we can't create tasks with created_by, so skip
    IF created_by_user_id IS NULL THEN
        RAISE NOTICE 'No user found for created_by, skipping task creation';
        RETURN NEW;
    END IF;
    
    -- Task Group 1: Kế hoạch
    parent_task_id := gen_random_uuid();
    parent_task_title := 'Kế hoạch';
    
    INSERT INTO tasks (
        id, title, description, status, priority, project_id, created_by,
        start_date, estimated_time, time_spent, parent_id, created_at, updated_at
    ) VALUES (
        parent_task_id, parent_task_title, 'Nhiệm vụ lớn: ' || parent_task_title,
        'todo', 'medium', NEW.id, created_by_user_id,
        project_start_date, 0, 0, NULL, NOW(), NOW()
    );
    
    -- Sub-tasks for Kế hoạch
    INSERT INTO tasks (id, title, description, status, priority, project_id, created_by, start_date, estimated_time, time_spent, parent_id, created_at, updated_at) VALUES
        (gen_random_uuid(), 'Đo đạt', 'Nhiệm vụ nhỏ: Đo đạt', 'todo', 'medium', NEW.id, created_by_user_id, project_start_date, 0, 0, parent_task_id, NOW(), NOW()),
        (gen_random_uuid(), 'Thiết kế / cập nhật bản vẽ', 'Nhiệm vụ nhỏ: Thiết kế / cập nhật bản vẽ', 'todo', 'medium', NEW.id, created_by_user_id, project_start_date, 0, 0, parent_task_id, NOW(), NOW()),
        (gen_random_uuid(), 'Kế hoạch vật tư', 'Nhiệm vụ nhỏ: Kế hoạch vật tư', 'todo', 'medium', NEW.id, created_by_user_id, project_start_date, 0, 0, parent_task_id, NOW(), NOW()),
        (gen_random_uuid(), 'Kế hoạch sản xuất', 'Nhiệm vụ nhỏ: Kế hoạch sản xuất', 'todo', 'medium', NEW.id, created_by_user_id, project_start_date, 0, 0, parent_task_id, NOW(), NOW()),
        (gen_random_uuid(), 'Kế hoạch lắp đặt', 'Nhiệm vụ nhỏ: Kế hoạch lắp đặt', 'todo', 'medium', NEW.id, created_by_user_id, project_start_date, 0, 0, parent_task_id, NOW(), NOW());
    
    -- Task Group 2: Sản xuất
    parent_task_id := gen_random_uuid();
    parent_task_title := 'Sản xuất';
    
    INSERT INTO tasks (
        id, title, description, status, priority, project_id, created_by,
        start_date, estimated_time, time_spent, parent_id, created_at, updated_at
    ) VALUES (
        parent_task_id, parent_task_title, 'Nhiệm vụ lớn: ' || parent_task_title,
        'todo', 'medium', NEW.id, created_by_user_id,
        project_start_date, 0, 0, NULL, NOW(), NOW()
    );
    
    -- Sub-tasks for Sản xuất
    INSERT INTO tasks (id, title, description, status, priority, project_id, created_by, start_date, estimated_time, time_spent, parent_id, created_at, updated_at) VALUES
        (gen_random_uuid(), 'Mua hàng', 'Nhiệm vụ nhỏ: Mua hàng', 'todo', 'medium', NEW.id, created_by_user_id, project_start_date, 0, 0, parent_task_id, NOW(), NOW()),
        (gen_random_uuid(), 'Sản xuất', 'Nhiệm vụ nhỏ: Sản xuất', 'todo', 'medium', NEW.id, created_by_user_id, project_start_date, 0, 0, parent_task_id, NOW(), NOW()),
        (gen_random_uuid(), 'Hoàn thành', 'Nhiệm vụ nhỏ: Hoàn thành', 'todo', 'medium', NEW.id, created_by_user_id, project_start_date, 0, 0, parent_task_id, NOW(), NOW());
    
    -- Task Group 3: Vận chuyển / lắp đặt
    parent_task_id := gen_random_uuid();
    parent_task_title := 'Vận chuyển / lắp đặt';
    
    INSERT INTO tasks (
        id, title, description, status, priority, project_id, created_by,
        start_date, estimated_time, time_spent, parent_id, created_at, updated_at
    ) VALUES (
        parent_task_id, parent_task_title, 'Nhiệm vụ lớn: ' || parent_task_title,
        'todo', 'medium', NEW.id, created_by_user_id,
        project_start_date, 0, 0, NULL, NOW(), NOW()
    );
    
    -- Sub-tasks for Vận chuyển / lắp đặt
    INSERT INTO tasks (id, title, description, status, priority, project_id, created_by, start_date, estimated_time, time_spent, parent_id, created_at, updated_at) VALUES
        (gen_random_uuid(), 'Vận chuyển', 'Nhiệm vụ nhỏ: Vận chuyển', 'todo', 'medium', NEW.id, created_by_user_id, project_start_date, 0, 0, parent_task_id, NOW(), NOW()),
        (gen_random_uuid(), 'Lắp đặt', 'Nhiệm vụ nhỏ: Lắp đặt', 'todo', 'medium', NEW.id, created_by_user_id, project_start_date, 0, 0, parent_task_id, NOW(), NOW()),
        (gen_random_uuid(), 'Nghiệm thu bàn giao', 'Nhiệm vụ nhỏ: Nghiệm thu bàn giao', 'todo', 'medium', NEW.id, created_by_user_id, project_start_date, 0, 0, parent_task_id, NOW(), NOW()),
        (gen_random_uuid(), 'Thu tiền', 'Nhiệm vụ nhỏ: Thu tiền', 'todo', 'medium', NEW.id, created_by_user_id, project_start_date, 0, 0, parent_task_id, NOW(), NOW());
    
    -- Task Group 4: Chăm sóc khách hàng
    parent_task_id := gen_random_uuid();
    parent_task_title := 'Chăm sóc khách hàng';
    
    INSERT INTO tasks (
        id, title, description, status, priority, project_id, created_by,
        start_date, estimated_time, time_spent, parent_id, created_at, updated_at
    ) VALUES (
        parent_task_id, parent_task_title, 'Nhiệm vụ lớn: ' || parent_task_title,
        'todo', 'medium', NEW.id, created_by_user_id,
        project_start_date, 0, 0, NULL, NOW(), NOW()
    );
    
    -- Sub-tasks for Chăm sóc khách hàng
    INSERT INTO tasks (id, title, description, status, priority, project_id, created_by, start_date, estimated_time, time_spent, parent_id, created_at, updated_at) VALUES
        (gen_random_uuid(), 'Đánh giá khách hàng', 'Nhiệm vụ nhỏ: Đánh giá khách hàng', 'todo', 'medium', NEW.id, created_by_user_id, project_start_date, 0, 0, parent_task_id, NOW(), NOW()),
        (gen_random_uuid(), 'Báo cáo / sửa chữa', 'Nhiệm vụ nhỏ: Báo cáo / sửa chữa', 'todo', 'medium', NEW.id, created_by_user_id, project_start_date, 0, 0, parent_task_id, NOW(), NOW()),
        (gen_random_uuid(), 'Nghiệm thu tính lương', 'Nhiệm vụ nhỏ: Nghiệm thu tính lương', 'todo', 'medium', NEW.id, created_by_user_id, project_start_date, 0, 0, parent_task_id, NOW(), NOW());
    
    RAISE NOTICE 'Created default tasks for project %', NEW.id;
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log error but don't fail the project creation
        RAISE WARNING 'Error creating default tasks for project %: %', NEW.id, SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- PART 2: CREATE TRIGGER
-- ============================================================

-- Drop trigger if exists
DROP TRIGGER IF EXISTS trigger_create_default_tasks_on_project_insert ON projects;

-- Create trigger that fires AFTER INSERT on projects
CREATE TRIGGER trigger_create_default_tasks_on_project_insert
    AFTER INSERT ON projects
    FOR EACH ROW
    EXECUTE FUNCTION create_default_tasks_for_new_project();

-- ============================================================
-- PART 3: VERIFICATION
-- ============================================================

-- Verify trigger exists
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement,
    action_timing
FROM information_schema.triggers
WHERE event_object_table = 'projects'
    AND trigger_name = 'trigger_create_default_tasks_on_project_insert';
