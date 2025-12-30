-- Migration: Tối ưu hóa - Chỉ reference, không đồng bộ data
-- Thay vì đồng bộ name/description, chỉ lưu category_id và JOIN khi cần

-- Xóa các triggers đồng bộ name/description (không cần nữa)
DROP TRIGGER IF EXISTS trigger_update_task_group_on_category_update ON project_categories;

-- Function mới: Chỉ tạo task_group với category_id, không lưu name/description
CREATE OR REPLACE FUNCTION create_task_group_for_category()
RETURNS TRIGGER AS $$
BEGIN
    -- Chỉ tạo task_group nếu category được kích hoạt
    IF NEW.is_active = true THEN
        INSERT INTO task_groups (category_id, is_active, created_at, updated_at)
        VALUES (
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

-- Function mới: Chỉ cập nhật is_active, không đồng bộ name/description
CREATE OR REPLACE FUNCTION update_task_group_active_status()
RETURNS TRIGGER AS $$
BEGIN
    -- Chỉ cập nhật is_active của task_group
    UPDATE task_groups
    SET 
        is_active = NEW.is_active,
        updated_at = NOW()
    WHERE category_id = NEW.id;
    
    -- Nếu category được kích hoạt lại và chưa có task_group, tạo mới
    IF NEW.is_active = true AND OLD.is_active = false THEN
        INSERT INTO task_groups (category_id, is_active, created_at, updated_at)
        VALUES (
            NEW.id,
            true,
            NOW(),
            NOW()
        )
        ON CONFLICT (category_id) DO UPDATE
        SET 
            is_active = true,
            updated_at = NOW();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Chỉ cập nhật is_active
DROP TRIGGER IF EXISTS trigger_update_task_group_on_category_update ON project_categories;
CREATE TRIGGER trigger_update_task_group_on_category_update
    AFTER UPDATE ON project_categories
    FOR EACH ROW
    WHEN (OLD.is_active IS DISTINCT FROM NEW.is_active)
    EXECUTE FUNCTION update_task_group_active_status();

-- Function: Tạo task_group chỉ với category_id
CREATE OR REPLACE FUNCTION ensure_task_group_for_project_category()
RETURNS TRIGGER AS $$
DECLARE
    v_category_id UUID;
BEGIN
    -- Nếu project có category_id
    IF NEW.category_id IS NOT NULL THEN
        -- Kiểm tra category có active không
        SELECT id INTO v_category_id
        FROM project_categories
        WHERE id = NEW.category_id AND is_active = true;
        
        -- Nếu tìm thấy category và chưa có task_group, tạo mới
        IF v_category_id IS NOT NULL THEN
            INSERT INTO task_groups (category_id, is_active, created_at, updated_at)
            VALUES (
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

-- Cập nhật task_groups hiện có: Xóa name/description nếu có (giữ lại category_id)
-- Không xóa data, chỉ đảm bảo logic mới hoạt động

-- Tạo view để query task_groups với thông tin category (JOIN)
CREATE OR REPLACE VIEW task_groups_with_category AS
SELECT 
    tg.id,
    tg.category_id,
    tg.is_active,
    tg.created_by,
    tg.created_at,
    tg.updated_at,
    -- Thông tin từ project_categories
    pc.name as category_name,
    pc.code as category_code,
    pc.description as category_description,
    pc.color as category_color,
    pc.icon as category_icon,
    pc.display_order as category_display_order
FROM task_groups tg
LEFT JOIN project_categories pc ON tg.category_id = pc.id;

-- Comment
COMMENT ON VIEW task_groups_with_category IS 'View để query task_groups với thông tin category (JOIN) - Single Source of Truth';






























