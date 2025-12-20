-- Migration: Đồng bộ task_groups với project_categories
-- Khi tạo project category, tự động tạo task_group tương ứng
-- Khi tạo project với category, tự động tạo task_group nếu chưa có

-- Thêm category_id vào task_groups để liên kết với project_categories
ALTER TABLE task_groups 
ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES project_categories(id) ON DELETE SET NULL;

-- Tạo index cho category_id
CREATE INDEX IF NOT EXISTS idx_task_groups_category_id ON task_groups(category_id);

-- Tạo unique constraint để đảm bảo mỗi category chỉ có 1 task_group
-- Sử dụng partial unique index để chỉ áp dụng khi category_id IS NOT NULL
CREATE UNIQUE INDEX IF NOT EXISTS idx_task_groups_category_unique 
ON task_groups(category_id) 
WHERE category_id IS NOT NULL;

-- Note: ON CONFLICT (category_id) sẽ hoạt động với unique index này

-- Comment
COMMENT ON COLUMN task_groups.category_id IS 'Liên kết với project_categories - mỗi category có 1 task_group tương ứng';

-- Function: Tự động tạo task_group khi tạo project_category
CREATE OR REPLACE FUNCTION create_task_group_for_category()
RETURNS TRIGGER AS $$
BEGIN
    -- Chỉ tạo task_group nếu category được kích hoạt
    IF NEW.is_active = true THEN
        INSERT INTO task_groups (name, description, category_id, is_active, created_at, updated_at)
        VALUES (
            NEW.name,
            NEW.description,
            NEW.id,
            true,
            NOW(),
            NOW()
        )
        ON CONFLICT (category_id) DO NOTHING;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Tự động tạo task_group khi tạo project_category mới
DROP TRIGGER IF EXISTS trigger_create_task_group_on_category_create ON project_categories;
CREATE TRIGGER trigger_create_task_group_on_category_create
    AFTER INSERT ON project_categories
    FOR EACH ROW
    WHEN (NEW.is_active = true)
    EXECUTE FUNCTION create_task_group_for_category();

-- Function: Cập nhật task_group khi cập nhật project_category
CREATE OR REPLACE FUNCTION update_task_group_for_category()
RETURNS TRIGGER AS $$
BEGIN
    -- Cập nhật task_group tương ứng
    UPDATE task_groups
    SET 
        name = NEW.name,
        description = NEW.description,
        is_active = NEW.is_active,
        updated_at = NOW()
    WHERE category_id = NEW.id;
    
    -- Nếu category bị vô hiệu hóa, vô hiệu hóa task_group
    IF NEW.is_active = false AND OLD.is_active = true THEN
        UPDATE task_groups
        SET is_active = false, updated_at = NOW()
        WHERE category_id = NEW.id;
    END IF;
    
    -- Nếu category được kích hoạt lại và chưa có task_group, tạo mới
    IF NEW.is_active = true AND OLD.is_active = false THEN
        INSERT INTO task_groups (name, description, category_id, is_active, created_at, updated_at)
        VALUES (
            NEW.name,
            NEW.description,
            NEW.id,
            true,
            NOW(),
            NOW()
        )
        ON CONFLICT (category_id) DO UPDATE
        SET 
            name = NEW.name,
            description = NEW.description,
            is_active = true,
            updated_at = NOW();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Cập nhật task_group khi cập nhật project_category
DROP TRIGGER IF EXISTS trigger_update_task_group_on_category_update ON project_categories;
CREATE TRIGGER trigger_update_task_group_on_category_update
    AFTER UPDATE ON project_categories
    FOR EACH ROW
    EXECUTE FUNCTION update_task_group_for_category();

-- Function: Tự động tạo task_group khi tạo project với category
CREATE OR REPLACE FUNCTION ensure_task_group_for_project_category()
RETURNS TRIGGER AS $$
DECLARE
    v_category_id UUID;
    v_category_name VARCHAR(255);
    v_category_description TEXT;
BEGIN
    -- Nếu project có category_id
    IF NEW.category_id IS NOT NULL THEN
        -- Lấy thông tin category
        SELECT id, name, description INTO v_category_id, v_category_name, v_category_description
        FROM project_categories
        WHERE id = NEW.category_id AND is_active = true;
        
        -- Nếu tìm thấy category và chưa có task_group, tạo mới
        IF v_category_id IS NOT NULL THEN
            INSERT INTO task_groups (name, description, category_id, is_active, created_at, updated_at)
            VALUES (
                v_category_name,
                v_category_description,
                v_category_id,
                true,
                NOW(),
                NOW()
            )
            ON CONFLICT (category_id) DO NOTHING;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Đảm bảo có task_group khi tạo project với category
DROP TRIGGER IF EXISTS trigger_ensure_task_group_on_project_create ON projects;
CREATE TRIGGER trigger_ensure_task_group_on_project_create
    AFTER INSERT ON projects
    FOR EACH ROW
    EXECUTE FUNCTION ensure_task_group_for_project_category();

-- Function: Tự động tạo task khi tạo project với category
CREATE OR REPLACE FUNCTION create_task_for_project()
RETURNS TRIGGER AS $$
DECLARE
    v_task_group_id UUID;
    v_category_name VARCHAR(255);
    v_priority task_priority;
BEGIN
    -- Nếu project có category_id
    IF NEW.category_id IS NOT NULL THEN
        -- Lấy task_group_id từ category (đợi trigger tạo nếu chưa có)
        SELECT id, name INTO v_task_group_id, v_category_name
        FROM task_groups
        WHERE category_id = NEW.category_id AND is_active = true
        LIMIT 1;
        
        -- Nếu chưa có task_group, đợi một chút rồi thử lại (trigger có thể chưa chạy xong)
        IF v_task_group_id IS NULL THEN
            PERFORM pg_sleep(0.1); -- Đợi 100ms
            SELECT id, name INTO v_task_group_id, v_category_name
            FROM task_groups
            WHERE category_id = NEW.category_id AND is_active = true
            LIMIT 1;
        END IF;
        
        -- Nếu tìm thấy task_group, tạo task mặc định
        IF v_task_group_id IS NOT NULL THEN
            -- Convert priority từ project_priority enum sang task_priority enum
            CASE NEW.priority::text
                WHEN 'low' THEN v_priority := 'low'::task_priority;
                WHEN 'high' THEN v_priority := 'high'::task_priority;
                WHEN 'urgent' THEN v_priority := 'urgent'::task_priority;
                ELSE v_priority := 'medium'::task_priority;
            END CASE;
            
            INSERT INTO tasks (
                title,
                description,
                status,
                priority,
                group_id,
                project_id,
                assigned_to,
                start_date,
                due_date,
                created_at,
                updated_at
            )
            VALUES (
                NEW.name,
                COALESCE(NEW.description, 'Nhiệm vụ chính cho dự án ' || NEW.name),
                'todo'::task_status,
                v_priority,
                v_task_group_id,
                NEW.id,
                NEW.manager_id,
                NEW.start_date::timestamp with time zone,
                NEW.end_date::timestamp with time zone,
                NOW(),
                NOW()
            );
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Tự động tạo task khi tạo project với category
-- Trigger này chạy SAU trigger_ensure_task_group_on_project_create
-- để đảm bảo task_group đã được tạo trước
DROP TRIGGER IF EXISTS trigger_create_task_on_project_create ON projects;
CREATE TRIGGER trigger_create_task_on_project_create
    AFTER INSERT ON projects
    FOR EACH ROW
    WHEN (NEW.category_id IS NOT NULL)
    EXECUTE FUNCTION create_task_for_project();
    
-- Đảm bảo trigger create_task chạy sau trigger ensure_task_group
-- bằng cách set thứ tự (PostgreSQL chạy triggers theo thứ tự tạo)
-- Vì trigger_ensure_task_group được tạo trước, nó sẽ chạy trước trigger_create_task

-- Tạo task_groups cho các categories hiện có (nếu chưa có)
-- Chỉ tạo với category_id, không lưu name/description (sẽ JOIN khi cần)
INSERT INTO task_groups (category_id, is_active, created_at, updated_at)
SELECT 
    pc.id,
    pc.is_active,
    NOW(),
    NOW()
FROM project_categories pc
WHERE pc.is_active = true
  AND NOT EXISTS (
      SELECT 1 FROM task_groups tg WHERE tg.category_id = pc.id
  )
ON CONFLICT (category_id) DO NOTHING;

-- Cập nhật is_active của task_groups hiện có
UPDATE task_groups tg
SET 
    is_active = pc.is_active,
    updated_at = NOW()
FROM project_categories pc
WHERE tg.category_id = pc.id;

