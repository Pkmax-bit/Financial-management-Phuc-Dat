-- Migration: Tự động cập nhật trạng thái dự án dựa trên % tiến độ (projects.progress)
-- Ý tưởng:
--   - progress ~ 0%        -> status = planning
--   - 0% < progress < 100% -> status = active
--   - progress >= 100%     -> status = completed
--
-- Lưu ý:
--   - Không ép buộc nếu bảng project_statuses không có các trạng thái tương ứng,
--     trong trường hợp đó chỉ cập nhật cột status (text / enum) nếu có.
--   - Trigger chạy BEFORE INSERT/UPDATE trên bảng projects.

CREATE OR REPLACE FUNCTION auto_update_project_status_by_progress()
RETURNS TRIGGER AS $$
DECLARE
    v_planning_status_id  UUID;
    v_active_status_id    UUID;
    v_completed_status_id UUID;
BEGIN
    -- Nếu không có progress (NULL) thì bỏ qua
    IF NEW.progress IS NULL THEN
        RETURN NEW;
    END IF;

    -- Nếu là UPDATE và progress không đổi thì bỏ qua
    IF TG_OP = 'UPDATE' AND NEW.progress IS NOT DISTINCT FROM OLD.progress THEN
        RETURN NEW;
    END IF;

    -- Chuẩn hoá giá trị progress về khoảng [0, 1] nếu backend đang dùng 0–100
    -- Giả định hiện tại đang dùng 0–1, nên không scale lại.
    -- Nếu sau này dùng 0–100, có thể sửa:
    --   IF NEW.progress > 1 THEN NEW.progress := NEW.progress / 100.0; END IF;

    -- Lấy status_id tương ứng (nếu tồn tại trong project_statuses)
    -- planning
    BEGIN
        SELECT id
        INTO v_planning_status_id
        FROM project_statuses
        WHERE LOWER(code) = 'planning'
           OR LOWER(name) LIKE '%planning%'
        LIMIT 1;
    EXCEPTION WHEN undefined_table THEN
        -- Bảng project_statuses chưa tồn tại ở môi trường hiện tại -> bỏ qua
        v_planning_status_id := NULL;
    END;

    -- active
    BEGIN
        SELECT id
        INTO v_active_status_id
        FROM project_statuses
        WHERE LOWER(code) = 'active'
           OR LOWER(name) LIKE '%active%'
        LIMIT 1;
    EXCEPTION WHEN undefined_table THEN
        v_active_status_id := NULL;
    END;

    -- completed
    BEGIN
        SELECT id
        INTO v_completed_status_id
        FROM project_statuses
        WHERE LOWER(code) = 'completed'
           OR LOWER(name) LIKE '%completed%'
           OR LOWER(name) LIKE '%hoàn thành%'
        LIMIT 1;
    EXCEPTION WHEN undefined_table THEN
        v_completed_status_id := NULL;
    END;

    -- Ánh xạ % tiến độ -> trạng thái
    IF NEW.progress >= 0.999 THEN
        -- Hoàn thành
        NEW.status := 'completed';
        IF v_completed_status_id IS NOT NULL THEN
            NEW.status_id := v_completed_status_id;
        END IF;
    ELSIF NEW.progress > 0.0 THEN
        -- Đang thực hiện
        NEW.status := 'active';
        IF v_active_status_id IS NOT NULL THEN
            NEW.status_id := v_active_status_id;
        END IF;
    ELSE
        -- Chưa bắt đầu
        NEW.status := 'planning';
        IF v_planning_status_id IS NOT NULL THEN
            NEW.status_id := v_planning_status_id;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- Tạo trigger trên bảng projects
DROP TRIGGER IF EXISTS trigger_auto_update_project_status_by_progress ON projects;
CREATE TRIGGER trigger_auto_update_project_status_by_progress
    BEFORE INSERT OR UPDATE OF progress ON projects
    FOR EACH ROW
    EXECUTE FUNCTION auto_update_project_status_by_progress();

-- Comment cho function & trigger
COMMENT ON FUNCTION auto_update_project_status_by_progress() IS
    'Tự động cập nhật status/status_id của projects dựa trên % progress (0 -> planning, 0<x<1 -> active, >=1 -> completed).';


