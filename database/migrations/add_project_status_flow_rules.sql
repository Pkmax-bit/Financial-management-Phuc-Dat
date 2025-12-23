-- Migration: Tạo bảng quản lý flow tự động cho trạng thái dự án
-- Cho phép cấu hình: khi dự án chuyển đến trạng thái X → tự động thêm vào nhóm Y

-- Tạo bảng project_status_flow_rules
CREATE TABLE IF NOT EXISTS project_status_flow_rules (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    status_id UUID NOT NULL REFERENCES project_statuses(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES project_categories(id) ON DELETE CASCADE,
    action_type VARCHAR(50) NOT NULL DEFAULT 'add', -- 'add' hoặc 'remove'
    is_active BOOLEAN DEFAULT true,
    priority INTEGER DEFAULT 0, -- Độ ưu tiên (số càng cao càng ưu tiên)
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT unique_status_category_action UNIQUE(status_id, category_id, action_type)
);

-- Tạo index để tối ưu query
CREATE INDEX IF NOT EXISTS idx_project_status_flow_rules_status_id ON project_status_flow_rules(status_id);
CREATE INDEX IF NOT EXISTS idx_project_status_flow_rules_category_id ON project_status_flow_rules(category_id);
CREATE INDEX IF NOT EXISTS idx_project_status_flow_rules_active ON project_status_flow_rules(is_active);

-- Thêm comment
COMMENT ON TABLE project_status_flow_rules IS 'Quy tắc flow tự động: khi dự án chuyển đến trạng thái X → tự động thêm/xóa khỏi nhóm Y';
COMMENT ON COLUMN project_status_flow_rules.status_id IS 'Trạng thái trigger';
COMMENT ON COLUMN project_status_flow_rules.category_id IS 'Nhóm sẽ được thêm/xóa';
COMMENT ON COLUMN project_status_flow_rules.action_type IS 'Loại hành động: add (thêm vào) hoặc remove (xóa khỏi)';
COMMENT ON COLUMN project_status_flow_rules.priority IS 'Độ ưu tiên: số càng cao càng ưu tiên (dùng khi có nhiều rule cho cùng status)';

-- Tạo trigger để tự động cập nhật updated_at
CREATE OR REPLACE FUNCTION update_project_status_flow_rules_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_project_status_flow_rules_updated_at
    BEFORE UPDATE ON project_status_flow_rules
    FOR EACH ROW
    EXECUTE FUNCTION update_project_status_flow_rules_updated_at();

-- Migrate rule hiện tại (xưởng sản xuất → nhóm xưởng) vào bảng mới
INSERT INTO project_status_flow_rules (status_id, category_id, action_type, is_active, description, priority)
SELECT 
    ps.id as status_id,
    pc.id as category_id,
    'add' as action_type,
    true as is_active,
    'Tự động thêm dự án vào nhóm xưởng khi chuyển đến trạng thái xưởng sản xuất' as description,
    10 as priority
FROM project_statuses ps
CROSS JOIN project_categories pc
WHERE (UPPER(ps.name) LIKE '%XƯỞNG%' OR UPPER(ps.name) LIKE '%SẢN XUẤT%')
  AND (pc.code = 'xuong-san-xuat' OR LOWER(pc.name) LIKE '%xưởng%')
ON CONFLICT (status_id, category_id, action_type) DO NOTHING;






