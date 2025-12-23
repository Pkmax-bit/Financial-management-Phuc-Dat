-- Migration: Cập nhật trigger để sử dụng flow rules thay vì hardcode
-- Thay thế logic hardcode bằng việc sử dụng bảng project_status_flow_rules

-- Function: Tự động áp dụng flow rules khi status thay đổi
CREATE OR REPLACE FUNCTION auto_apply_project_status_flow_rules()
RETURNS TRIGGER AS $$
DECLARE
    flow_rule RECORD;
    old_flow_rule RECORD;
    new_category_ids UUID[];
BEGIN
    -- Chỉ xử lý khi status_id thay đổi
    IF NEW.status_id IS NULL OR (OLD.status_id = NEW.status_id) THEN
        RETURN NEW;
    END IF;
    
    -- Áp dụng flow rules cho status mới
    FOR flow_rule IN 
        SELECT category_id, action_type, priority
        FROM project_status_flow_rules
        WHERE status_id = NEW.status_id
          AND is_active = true
        ORDER BY priority DESC, created_at ASC
    LOOP
        IF flow_rule.action_type = 'add' THEN
            -- Thêm vào nhóm (nếu chưa có)
            INSERT INTO project_category_members (project_id, category_id)
            VALUES (NEW.id, flow_rule.category_id)
            ON CONFLICT (project_id, category_id) DO NOTHING;
            
            -- Lưu category_id vào mảng để kiểm tra sau
            new_category_ids := array_append(new_category_ids, flow_rule.category_id);
        ELSIF flow_rule.action_type = 'remove' THEN
            -- Xóa khỏi nhóm
            DELETE FROM project_category_members
            WHERE project_id = NEW.id
              AND category_id = flow_rule.category_id;
        END IF;
    END LOOP;
    
    -- Xử lý flow rules của status cũ (nếu có)
    IF OLD.status_id IS NOT NULL THEN
        FOR old_flow_rule IN
            SELECT category_id
            FROM project_status_flow_rules
            WHERE status_id = OLD.status_id
              AND is_active = true
              AND action_type = 'add'
        LOOP
            -- Chỉ xóa nếu status mới không thêm vào cùng category
            IF NOT (old_flow_rule.category_id = ANY(new_category_ids)) THEN
                DELETE FROM project_category_members
                WHERE project_id = NEW.id
                  AND category_id = old_flow_rule.category_id;
            END IF;
        END LOOP;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger cũ nếu có
DROP TRIGGER IF EXISTS trigger_auto_add_to_workshop_category ON projects;
DROP TRIGGER IF EXISTS trigger_auto_apply_flow_rules ON projects;

-- Tạo trigger mới
CREATE TRIGGER trigger_auto_apply_flow_rules
    AFTER INSERT OR UPDATE OF status_id ON projects
    FOR EACH ROW
    WHEN (NEW.status_id IS NOT NULL)
    EXECUTE FUNCTION auto_apply_project_status_flow_rules();

-- Comment
COMMENT ON FUNCTION auto_apply_project_status_flow_rules() IS 'Tự động áp dụng flow rules từ bảng project_status_flow_rules khi status_id của dự án thay đổi';






