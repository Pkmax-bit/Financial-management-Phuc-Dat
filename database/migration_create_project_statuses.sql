-- Migration: Create project_statuses table and update projects table
-- This allows dynamic project status management in Kanban board

-- Create project_statuses table
CREATE TABLE IF NOT EXISTS project_statuses (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    display_order INTEGER NOT NULL DEFAULT 0,
    description TEXT,
    color_class VARCHAR(100) DEFAULT 'bg-gray-100 text-gray-800',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_status_name UNIQUE(name),
    CONSTRAINT unique_display_order UNIQUE(display_order)
);

-- Insert default statuses with Vietnamese names
INSERT INTO project_statuses (name, display_order, description, color_class) VALUES
    ('Lập kế hoạch', 1, 'Dự án đang trong giai đoạn lập kế hoạch', 'bg-gray-100 text-gray-800'),
    ('Đang thực hiện', 2, 'Dự án đang được thực hiện', 'bg-green-100 text-green-800'),
    ('Tạm dừng', 3, 'Dự án tạm dừng', 'bg-yellow-100 text-yellow-800'),
    ('Hoàn thành', 4, 'Dự án đã hoàn thành', 'bg-blue-100 text-blue-800'),
    ('Đã hủy', 5, 'Dự án đã bị hủy', 'bg-red-100 text-red-800')
ON CONFLICT (name) DO NOTHING;

-- Add status_id column to projects table (keeping status for backward compatibility)
ALTER TABLE projects ADD COLUMN IF NOT EXISTS status_id UUID REFERENCES project_statuses(id) ON DELETE SET NULL;

-- Update existing projects to link to Vietnamese statuses by mapping old English names
UPDATE projects p
SET status_id = ps.id
FROM project_statuses ps
WHERE 
    (p.status::text = 'planning' AND ps.name = 'Lập kế hoạch') OR
    (p.status::text = 'active' AND ps.name = 'Đang thực hiện') OR
    (p.status::text = 'on_hold' AND ps.name = 'Tạm dừng') OR
    (p.status::text = 'completed' AND ps.name = 'Hoàn thành') OR
    (p.status::text = 'cancelled' AND ps.name = 'Đã hủy');

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_projects_status_id ON projects(status_id);
CREATE INDEX IF NOT EXISTS idx_project_statuses_display_order ON project_statuses(display_order);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_project_statuses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_project_statuses_updated_at
    BEFORE UPDATE ON project_statuses
    FOR EACH ROW
    EXECUTE FUNCTION update_project_statuses_updated_at();

