-- Migration: Tự động thêm dự án vào nhóm "xưởng" khi status = "xưởng sản xuất"
-- Tạo trigger để tự động quản lý việc thêm/xóa dự án khỏi nhóm xưởng

-- Function: Tự động thêm dự án vào nhóm xưởng khi status thay đổi
CREATE OR REPLACE FUNCTION auto_add_project_to_workshop_category()
RETURNS TRIGGER AS $$
DECLARE
    workshop_category_id UUID;
    workshop_status_id UUID;
BEGIN
    -- Tìm ID của nhóm "xưởng" (hoặc tên tương ứng)
    SELECT id INTO workshop_category_id
    FROM project_categories
    WHERE LOWER(name) LIKE '%xưởng%' OR LOWER(code) LIKE '%workshop%' OR LOWER(code) LIKE '%xuong%'
    LIMIT 1;
    
    -- Tìm ID của trạng thái "xưởng sản xuất" hoặc tương tự
    SELECT id INTO workshop_status_id
    FROM project_statuses
    WHERE LOWER(name) LIKE '%xưởng%' OR LOWER(name) LIKE '%sản xuất%' OR LOWER(name) LIKE '%workshop%'
    LIMIT 1;
    
    -- Nếu tìm thấy nhóm xưởng và trạng thái xưởng sản xuất
    IF workshop_category_id IS NOT NULL AND workshop_status_id IS NOT NULL THEN
        -- Nếu status_id = workshop_status_id, thêm vào nhóm xưởng
        IF NEW.status_id = workshop_status_id THEN
            INSERT INTO project_category_members (project_id, category_id)
            VALUES (NEW.id, workshop_category_id)
            ON CONFLICT (project_id, category_id) DO NOTHING;
        -- Nếu status_id thay đổi và không còn là xưởng sản xuất, xóa khỏi nhóm xưởng
        ELSIF OLD.status_id = workshop_status_id AND NEW.status_id != workshop_status_id THEN
            DELETE FROM project_category_members
            WHERE project_id = NEW.id AND category_id = workshop_category_id;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Tự động thêm/xóa dự án khỏi nhóm xưởng khi status thay đổi
DROP TRIGGER IF EXISTS trigger_auto_add_to_workshop_category ON projects;
CREATE TRIGGER trigger_auto_add_to_workshop_category
    AFTER INSERT OR UPDATE OF status_id ON projects
    FOR EACH ROW
    WHEN (NEW.status_id IS NOT NULL)
    EXECUTE FUNCTION auto_add_project_to_workshop_category();

-- Comment
COMMENT ON FUNCTION auto_add_project_to_workshop_category() IS 'Tự động thêm dự án vào nhóm xưởng khi status = xưởng sản xuất, và xóa khỏi nhóm khi status thay đổi';














