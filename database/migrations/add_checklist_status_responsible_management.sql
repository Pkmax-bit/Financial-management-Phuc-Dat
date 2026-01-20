-- Migration: Thêm tính năng quản lý người chịu trách nhiệm checklist theo trạng thái
-- Mục đích: Tự động đổi người chịu trách nhiệm khi trạng thái checklist item thay đổi
-- Ngày tạo: 2025-01-XX

-- =====================================================
-- 1. Thêm trường status vào task_checklist_items
-- =====================================================
ALTER TABLE task_checklist_items
ADD COLUMN IF NOT EXISTS status TEXT;

-- Tạo index cho status
CREATE INDEX IF NOT EXISTS idx_task_checklist_items_status 
ON task_checklist_items(status);

-- Comment cho cột status
COMMENT ON COLUMN task_checklist_items.status IS 'Trạng thái của checklist item (THỎA THUẬN, XƯỞNG SẢN XUẤT, VẬN CHUYỂN, LẮP ĐẶT, CHĂM SÓC KHÁCH HÀNG, BÁO CÁO / SỬA CHỮA, HOÀN THÀNH)';

-- =====================================================
-- 2. Tạo bảng mapping trạng thái → người chịu trách nhiệm
-- =====================================================
CREATE TABLE IF NOT EXISTS checklist_status_responsible_mapping (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    status TEXT NOT NULL,
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE NOT NULL,
    responsibility_type TEXT NOT NULL DEFAULT 'accountable' CHECK (responsibility_type IN ('accountable', 'responsible', 'consulted', 'informed')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    UNIQUE(status, employee_id, responsibility_type)
);

-- Tạo indexes
CREATE INDEX IF NOT EXISTS idx_checklist_status_mapping_status 
ON checklist_status_responsible_mapping(status);

CREATE INDEX IF NOT EXISTS idx_checklist_status_mapping_employee_id 
ON checklist_status_responsible_mapping(employee_id);

CREATE INDEX IF NOT EXISTS idx_checklist_status_mapping_active 
ON checklist_status_responsible_mapping(is_active) WHERE is_active = true;

-- Comment cho bảng
COMMENT ON TABLE checklist_status_responsible_mapping IS 'Mapping giữa trạng thái checklist và người chịu trách nhiệm';
COMMENT ON COLUMN checklist_status_responsible_mapping.status IS 'Trạng thái của checklist item';
COMMENT ON COLUMN checklist_status_responsible_mapping.employee_id IS 'ID của nhân viên chịu trách nhiệm';
COMMENT ON COLUMN checklist_status_responsible_mapping.responsibility_type IS 'Loại trách nhiệm (accountable, responsible, consulted, informed)';

-- =====================================================
-- 3. Tạo trigger function để tự động cập nhật người chịu trách nhiệm
-- =====================================================
CREATE OR REPLACE FUNCTION update_checklist_responsible_on_status_change()
RETURNS TRIGGER AS $$
DECLARE
    new_responsible_employee_id UUID;
    old_responsible_employee_id UUID;
BEGIN
    -- Chỉ xử lý khi status thay đổi và status mới không null
    IF OLD.status IS DISTINCT FROM NEW.status AND NEW.status IS NOT NULL THEN
        -- Lấy người chịu trách nhiệm mới từ mapping
        SELECT employee_id INTO new_responsible_employee_id
        FROM checklist_status_responsible_mapping
        WHERE status = NEW.status
          AND responsibility_type = 'accountable'
          AND is_active = true
        LIMIT 1;
        
        -- Nếu tìm thấy người chịu trách nhiệm mới
        IF new_responsible_employee_id IS NOT NULL THEN
            -- Lấy người chịu trách nhiệm cũ (nếu có)
            SELECT employee_id INTO old_responsible_employee_id
            FROM task_checklist_item_assignments
            WHERE checklist_item_id = NEW.id
              AND responsibility_type = 'accountable'
            LIMIT 1;
            
            -- Xóa assignment cũ (accountable) nếu có và khác với mới
            IF old_responsible_employee_id IS NOT NULL 
               AND old_responsible_employee_id != new_responsible_employee_id THEN
                DELETE FROM task_checklist_item_assignments
                WHERE checklist_item_id = NEW.id
                  AND employee_id = old_responsible_employee_id
                  AND responsibility_type = 'accountable';
            END IF;
            
            -- Thêm assignment mới (hoặc cập nhật nếu đã tồn tại)
            INSERT INTO task_checklist_item_assignments 
            (checklist_item_id, employee_id, responsibility_type)
            VALUES (NEW.id, new_responsible_employee_id, 'accountable')
            ON CONFLICT (checklist_item_id, employee_id) 
            DO UPDATE SET responsibility_type = 'accountable';
            
            -- Cập nhật assignee_id (người thực hiện chính)
            UPDATE task_checklist_items
            SET assignee_id = new_responsible_employee_id
            WHERE id = NEW.id;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 4. Tạo trigger
-- =====================================================
DROP TRIGGER IF EXISTS trigger_update_checklist_responsible ON task_checklist_items;
CREATE TRIGGER trigger_update_checklist_responsible
    AFTER UPDATE OF status ON task_checklist_items
    FOR EACH ROW
    WHEN (OLD.status IS DISTINCT FROM NEW.status)
    EXECUTE FUNCTION update_checklist_responsible_on_status_change();

-- =====================================================
-- 5. Tạo trigger để tự động cập nhật updated_at
-- =====================================================
CREATE OR REPLACE FUNCTION update_checklist_status_mapping_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_checklist_status_mapping_updated_at
    BEFORE UPDATE ON checklist_status_responsible_mapping
    FOR EACH ROW
    EXECUTE FUNCTION update_checklist_status_mapping_updated_at();

-- =====================================================
-- 6. RLS Policies cho bảng checklist_status_responsible_mapping
-- =====================================================
ALTER TABLE checklist_status_responsible_mapping ENABLE ROW LEVEL SECURITY;

-- Policy: Tất cả authenticated users có thể xem mapping
CREATE POLICY "Users can view checklist status responsible mapping"
ON checklist_status_responsible_mapping
FOR SELECT
USING (auth.role() = 'authenticated');

-- Policy: Chỉ admin mới có thể quản lý mapping
CREATE POLICY "Admins can manage checklist status responsible mapping"
ON checklist_status_responsible_mapping
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid()
        AND users.role = 'admin'
    )
);

-- =====================================================
-- 7. Tạo view để dễ dàng query mapping
-- =====================================================
CREATE OR REPLACE VIEW checklist_status_responsible_view AS
SELECT 
    csm.id,
    csm.status,
    csm.employee_id,
    COALESCE(e.first_name || ' ' || e.last_name, e.first_name, e.last_name, '') AS employee_name,
    csm.responsibility_type,
    csm.is_active,
    csm.created_at,
    csm.updated_at
FROM checklist_status_responsible_mapping csm
INNER JOIN employees e ON e.id = csm.employee_id
WHERE csm.is_active = true;

COMMENT ON VIEW checklist_status_responsible_view IS 'View để xem mapping trạng thái và người chịu trách nhiệm';
