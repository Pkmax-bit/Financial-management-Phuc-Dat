-- Migration: Create project_categories table and add category_id to projects
-- Allows grouping and categorizing projects

-- Create project_categories table
CREATE TABLE IF NOT EXISTS project_categories (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    color VARCHAR(7), -- Hex color code for UI display (e.g., #FF5733)
    icon VARCHAR(50), -- Icon name for UI display
    display_order INTEGER DEFAULT 0, -- Order for sorting in UI
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add category_id column to projects table
ALTER TABLE projects ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES project_categories(id) ON DELETE SET NULL;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_projects_category_id ON projects(category_id);
CREATE INDEX IF NOT EXISTS idx_project_categories_code ON project_categories(code);
CREATE INDEX IF NOT EXISTS idx_project_categories_is_active ON project_categories(is_active);

-- Add comments
COMMENT ON TABLE project_categories IS 'Categories for grouping and organizing projects';
COMMENT ON COLUMN projects.category_id IS 'Foreign key reference to project_categories table';

-- Insert some default categories
INSERT INTO project_categories (name, code, description, color, icon, display_order) VALUES
    ('Dự án cửa', 'door-project', 'Dự án lắp đặt và thi công cửa', '#4ECDC4', 'door', 1),
    ('Dự án tủ bếp', 'kitchen-cabinet-project', 'Dự án thiết kế và thi công tủ bếp', '#FF6B6B', 'chef-hat', 2)
ON CONFLICT (code) DO NOTHING;

-- Create updated_at trigger function if not exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for project_categories updated_at
DROP TRIGGER IF EXISTS update_project_categories_updated_at ON project_categories;
CREATE TRIGGER update_project_categories_updated_at
    BEFORE UPDATE ON project_categories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

