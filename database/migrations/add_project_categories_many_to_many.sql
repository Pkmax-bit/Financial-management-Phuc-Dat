-- Migration: Thêm quan hệ many-to-many giữa projects và project_categories
-- Cho phép một dự án thuộc nhiều nhóm phân loại

-- Tạo bảng junction table
CREATE TABLE IF NOT EXISTS project_category_members (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES project_categories(id) ON DELETE CASCADE,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    added_by UUID REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT unique_project_category UNIQUE(project_id, category_id)
);

-- Tạo index để tối ưu query
CREATE INDEX IF NOT EXISTS idx_project_category_members_project_id ON project_category_members(project_id);
CREATE INDEX IF NOT EXISTS idx_project_category_members_category_id ON project_category_members(category_id);

-- Migrate dữ liệu từ category_id sang project_category_members
-- Giữ lại category_id trong projects để backward compatibility
INSERT INTO project_category_members (project_id, category_id)
SELECT id, category_id
FROM projects
WHERE category_id IS NOT NULL
ON CONFLICT (project_id, category_id) DO NOTHING;

-- Thêm comment
COMMENT ON TABLE project_category_members IS 'Quan hệ many-to-many giữa projects và project_categories. Một dự án có thể thuộc nhiều nhóm.';
COMMENT ON COLUMN project_category_members.added_at IS 'Thời điểm dự án được thêm vào nhóm';
COMMENT ON COLUMN project_category_members.added_by IS 'Người thêm dự án vào nhóm';














