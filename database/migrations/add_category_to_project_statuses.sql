-- Migration: Add category_id to project_statuses
-- Cho phép mỗi trạng thái dự án thuộc về một nhóm phân loại
-- NULL category_id = trạng thái toàn cục (áp dụng cho tất cả nhóm)

-- Thêm category_id vào project_statuses
ALTER TABLE project_statuses 
ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES project_categories(id) ON DELETE SET NULL;

-- Tạo index để tối ưu query
CREATE INDEX IF NOT EXISTS idx_project_statuses_category_id ON project_statuses(category_id);

-- Thêm comment
COMMENT ON COLUMN project_statuses.category_id IS 'Nhóm phân loại mà trạng thái này thuộc về. NULL = trạng thái toàn cục (áp dụng cho tất cả nhóm)';

-- Cập nhật các trạng thái mặc định thành trạng thái toàn cục (nếu chưa có category_id)
-- Giữ nguyên các trạng thái hiện tại là toàn cục
UPDATE project_statuses 
SET category_id = NULL 
WHERE category_id IS NULL;

