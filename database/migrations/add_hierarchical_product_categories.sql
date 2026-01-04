-- Migration: Add Hierarchical Product Categories
-- Date: 2025-01-02
-- Description: Add parent-child relationships to product_categories for hierarchical structure

-- =====================================================
-- 1. ENHANCE PRODUCT_CATEGORIES TABLE
-- =====================================================

-- Add hierarchical structure columns
ALTER TABLE product_categories ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES product_categories(id) ON DELETE CASCADE;
ALTER TABLE product_categories ADD COLUMN IF NOT EXISTS category_code VARCHAR(50);
ALTER TABLE product_categories ADD COLUMN IF NOT EXISTS category_level INTEGER DEFAULT 1;
ALTER TABLE product_categories ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;
ALTER TABLE product_categories ADD COLUMN IF NOT EXISTS icon_name VARCHAR(100);
ALTER TABLE product_categories ADD COLUMN IF NOT EXISTS color_code VARCHAR(7);
ALTER TABLE product_categories ADD COLUMN IF NOT EXISTS path TEXT; -- Materialized path for fast queries

-- Add constraint to prevent self-referencing
ALTER TABLE product_categories ADD CONSTRAINT check_no_self_reference
    CHECK (parent_id != id);

-- Add constraint for category level
ALTER TABLE product_categories ADD CONSTRAINT check_category_level
    CHECK (category_level >= 1 AND category_level <= 5);

-- =====================================================
-- 2. UPDATE EXISTING DATA
-- =====================================================

-- Update category_level for existing records (they are all root level)
UPDATE product_categories SET category_level = 1 WHERE category_level IS NULL;

-- Update sort_order for existing records
UPDATE product_categories SET sort_order = 0 WHERE sort_order IS NULL;

-- =====================================================
-- 3. CREATE INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_product_categories_parent_id ON product_categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_product_categories_category_level ON product_categories(category_level);
CREATE INDEX IF NOT EXISTS idx_product_categories_sort_order ON product_categories(sort_order);
CREATE INDEX IF NOT EXISTS idx_product_categories_path ON product_categories(path);
CREATE INDEX IF NOT EXISTS idx_product_categories_code ON product_categories(category_code);

-- =====================================================
-- 4. CREATE FUNCTIONS FOR HIERARCHICAL OPERATIONS
-- =====================================================

-- Function to update materialized path
CREATE OR REPLACE FUNCTION update_category_path() RETURNS TRIGGER AS $$
BEGIN
    IF NEW.parent_id IS NULL THEN
        NEW.path = NEW.id::TEXT;
        NEW.category_level = 1;
    ELSE
        SELECT
            COALESCE(pc.path || '.' || NEW.id::TEXT, NEW.id::TEXT),
            pc.category_level + 1
        INTO NEW.path, NEW.category_level
        FROM product_categories pc
        WHERE pc.id = NEW.parent_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to get category tree
CREATE OR REPLACE FUNCTION get_category_tree(root_category_id UUID DEFAULT NULL)
RETURNS TABLE (
    id UUID,
    name TEXT,
    description TEXT,
    parent_id UUID,
    category_code VARCHAR(50),
    category_level INTEGER,
    sort_order INTEGER,
    icon_name VARCHAR(100),
    color_code VARCHAR(7),
    path TEXT,
    is_active BOOLEAN,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    children_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    WITH RECURSIVE category_tree AS (
        -- Base case: root categories or specific root
        SELECT
            pc.id,
            pc.name,
            pc.description,
            pc.parent_id,
            pc.category_code,
            pc.category_level,
            pc.sort_order,
            pc.icon_name,
            pc.color_code,
            pc.path,
            pc.is_active,
            pc.created_at,
            pc.updated_at,
            0::BIGINT as children_count
        FROM product_categories pc
        WHERE (root_category_id IS NULL AND pc.parent_id IS NULL)
           OR (root_category_id IS NOT NULL AND pc.id = root_category_id)

        UNION ALL

        -- Recursive case: children
        SELECT
            pc.id,
            pc.name,
            pc.description,
            pc.parent_id,
            pc.category_code,
            pc.category_level,
            pc.sort_order,
            pc.icon_name,
            pc.color_code,
            pc.path,
            pc.is_active,
            pc.created_at,
            pc.updated_at,
            0::BIGINT
        FROM product_categories pc
        INNER JOIN category_tree ct ON pc.parent_id = ct.id
    )
    SELECT
        ct.id,
        ct.name,
        ct.description,
        ct.parent_id,
        ct.category_code,
        ct.category_level,
        ct.sort_order,
        ct.icon_name,
        ct.color_code,
        ct.path,
        ct.is_active,
        ct.created_at,
        ct.updated_at,
        COUNT(child.id) as children_count
    FROM category_tree ct
    LEFT JOIN product_categories child ON child.parent_id = ct.id
    GROUP BY ct.id, ct.name, ct.description, ct.parent_id, ct.category_code,
             ct.category_level, ct.sort_order, ct.icon_name, ct.color_code,
             ct.path, ct.is_active, ct.created_at, ct.updated_at
    ORDER BY ct.category_level, ct.sort_order, ct.name;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 5. CREATE TRIGGERS
-- =====================================================

-- Trigger to automatically update path and level
DROP TRIGGER IF EXISTS trigger_update_category_path ON product_categories;
CREATE TRIGGER trigger_update_category_path
    BEFORE INSERT OR UPDATE ON product_categories
    FOR EACH ROW EXECUTE FUNCTION update_category_path();

-- Update updated_at trigger
DROP TRIGGER IF EXISTS update_product_categories_updated_at ON product_categories;
CREATE TRIGGER update_product_categories_updated_at
    BEFORE UPDATE ON product_categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 6. INSERT SAMPLE HIERARCHICAL DATA
-- =====================================================

-- Clear existing data if needed (only for development)
-- TRUNCATE TABLE product_categories CASCADE;

-- Insert root categories
INSERT INTO product_categories (name, description, category_code, sort_order, icon_name, color_code) VALUES
('Vat lieu xay dung', 'Cac loai vat lieu dung cho xay dung cong trinh', 'XL', 1, 'building', '#FF6B6B'),
('Do noi that', 'Do noi that gia dinh va van phong', 'NT', 2, 'chair', '#4ECDC4'),
('Dien nuoc', 'Thiet bi dien va ong nuoc', 'DN', 3, 'zap', '#45B7D1'),
('Trang tri', 'Vat lieu trang tri noi ngoai that', 'TT', 4, 'palette', '#FFA07A'),
('Vat tu phu', 'Cac loai vat tu phu tro', 'VT', 5, 'wrench', '#98D8C8')
ON CONFLICT (name) DO NOTHING;

-- Insert sub-categories for "Vat lieu xay dung"
INSERT INTO product_categories (name, description, parent_id, category_code, sort_order, icon_name, color_code) VALUES
('Xi mang', 'Cac loai xi mang xay dung', (SELECT id FROM product_categories WHERE category_code = 'XL'), 'XL_CEMENT', 1, 'package', '#FF8A65'),
('Gach da', 'Gach, da xay dung', (SELECT id FROM product_categories WHERE category_code = 'XL'), 'XL_BRICK', 2, 'square', '#FFAB91'),
('Cat soi', 'Cat, soi cac loai', (SELECT id FROM product_categories WHERE category_code = 'XL'), 'XL_SAND', 3, 'mountain', '#FFCCBC'),
('Thep', 'Thep xay dung', (SELECT id FROM product_categories WHERE category_code = 'XL'), 'XL_STEEL', 4, 'settings', '#E57373'),
('Vua', 'Vua xay dung', (SELECT id FROM product_categories WHERE category_code = 'XL'), 'XL_MORTAR', 5, 'droplets', '#EF5350')
ON CONFLICT (name) DO NOTHING;

-- Insert sub-categories for "Do noi that"
INSERT INTO product_categories (name, description, parent_id, category_code, sort_order, icon_name, color_code) VALUES
('Ban ghe', 'Ban ghe cac loai', (SELECT id FROM product_categories WHERE category_code = 'NT'), 'NT_TABLE', 1, 'table', '#26A69A'),
('Tu ke', 'Tu, ke luu tru', (SELECT id FROM product_categories WHERE category_code = 'NT'), 'NT_CABINET', 2, 'archive', '#4DB6AC'),
('Giuong tu', 'Giuong ngu, tu do', (SELECT id FROM product_categories WHERE category_code = 'NT'), 'NT_BED', 3, 'bed', '#80CBC4'),
('Do trang tri', 'Do trang tri noi that', (SELECT id FROM product_categories WHERE category_code = 'NT'), 'NT_DECOR', 4, 'sparkles', '#B2DFDB'),
('Phu kien', 'Phu kien noi that', (SELECT id FROM product_categories WHERE category_code = 'NT'), 'NT_ACCESSORY', 5, 'star', '#E0F2F1')
ON CONFLICT (name) DO NOTHING;

-- Insert sub-categories for "Dien nuoc"
INSERT INTO product_categories (name, description, parent_id, category_code, sort_order, icon_name, color_code) VALUES
('Dien dan dung', 'Thiet bi dien gia dinh', (SELECT id FROM product_categories WHERE category_code = 'DN'), 'DN_ELECTRIC', 1, 'lightbulb', '#42A5F5'),
('Ong nuoc', 'Ong nuoc cac loai', (SELECT id FROM product_categories WHERE category_code = 'DN'), 'DN_PIPE', 2, 'droplets', '#64B5F6'),
('Vat lieu dien', 'Day dan, cau dao, o cam', (SELECT id FROM product_categories WHERE category_code = 'DN'), 'DN_WIRING', 3, 'plug', '#90CAF9'),
('Den chieu sang', 'Den cac loai', (SELECT id FROM product_categories WHERE category_code = 'DN'), 'DN_LIGHTING', 4, 'sun', '#BBDEFB'),
('Thiet bi dien', 'Cong tac, cau dao', (SELECT id FROM product_categories WHERE category_code = 'DN'), 'DN_SWITCH', 5, 'toggle-left', '#E3F2FD')
ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- 7. UPDATE EXISTING PRODUCTS (if any)
-- =====================================================

-- Update products to use new category structure
-- This will be handled by application logic

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

-- Add comment to track migration
COMMENT ON DATABASE postgres IS 'Migration: add_hierarchical_product_categories applied on 2025-01-02';
