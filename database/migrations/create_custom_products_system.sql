-- Migration: Create custom products system
-- Allows creating customizable products with dynamic columns and options

-- Create custom_product_categories table
CREATE TABLE IF NOT EXISTS custom_product_categories (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    order_index INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create custom_product_columns table
CREATE TABLE IF NOT EXISTS custom_product_columns (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    category_id UUID NOT NULL REFERENCES custom_product_categories(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    order_index INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create custom_product_options table
CREATE TABLE IF NOT EXISTS custom_product_options (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    column_id UUID NOT NULL REFERENCES custom_product_columns(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    order_index INTEGER DEFAULT 0,

    -- Dimensions
    width DECIMAL(10,2),
    height DECIMAL(10,2),
    depth DECIMAL(10,2),
    has_dimensions BOOLEAN DEFAULT false,

    -- Visuals
    image_url TEXT,
    image_urls TEXT[],

    -- Pricing
    unit_price DECIMAL(12,2) DEFAULT 0,
    unit VARCHAR(50) DEFAULT 'cái',

    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create custom_products table (combined products)
CREATE TABLE IF NOT EXISTS custom_products (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    category_id UUID NOT NULL REFERENCES custom_product_categories(id) ON DELETE CASCADE,
    name VARCHAR(500) NOT NULL,
    description TEXT,

    -- Selected options as JSON
    column_options JSONB NOT NULL DEFAULT '{}',

    -- Calculated dimensions
    total_width DECIMAL(10,2),
    total_height DECIMAL(10,2),
    total_depth DECIMAL(10,2),

    -- Calculated pricing
    total_price DECIMAL(12,2),
    quantity INTEGER DEFAULT 1,
    total_amount DECIMAL(12,2),

    -- Images
    image_urls TEXT[],

    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create custom_product_structures table (column ordering for combination)
CREATE TABLE IF NOT EXISTS custom_product_structures (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    category_id UUID NOT NULL REFERENCES custom_product_categories(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,

    -- Ordered list of column IDs
    column_order UUID[] NOT NULL DEFAULT '{}',

    -- Separator between columns in generated name
    separator VARCHAR(10) DEFAULT ' ',

    is_default BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(category_id, is_default)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_custom_product_categories_order_index ON custom_product_categories(order_index);
CREATE INDEX IF NOT EXISTS idx_custom_product_categories_is_active ON custom_product_categories(is_active);

CREATE INDEX IF NOT EXISTS idx_custom_product_columns_category_id ON custom_product_columns(category_id);
CREATE INDEX IF NOT EXISTS idx_custom_product_columns_order_index ON custom_product_columns(order_index);
CREATE INDEX IF NOT EXISTS idx_custom_product_columns_is_active ON custom_product_columns(is_active);

CREATE INDEX IF NOT EXISTS idx_custom_product_options_column_id ON custom_product_options(column_id);
CREATE INDEX IF NOT EXISTS idx_custom_product_options_order_index ON custom_product_options(order_index);
CREATE INDEX IF NOT EXISTS idx_custom_product_options_is_active ON custom_product_options(is_active);

CREATE INDEX IF NOT EXISTS idx_custom_products_category_id ON custom_products(category_id);
CREATE INDEX IF NOT EXISTS idx_custom_products_name ON custom_products(name);
CREATE INDEX IF NOT EXISTS idx_custom_products_is_active ON custom_products(is_active);

CREATE INDEX IF NOT EXISTS idx_custom_product_structures_category_id ON custom_product_structures(category_id);
CREATE INDEX IF NOT EXISTS idx_custom_product_structures_is_default ON custom_product_structures(is_default);
CREATE INDEX IF NOT EXISTS idx_custom_product_structures_is_active ON custom_product_structures(is_active);

-- Create GIN index for JSON column
CREATE INDEX IF NOT EXISTS idx_custom_products_column_options ON custom_products USING GIN (column_options);

-- Add comments
COMMENT ON TABLE custom_product_categories IS 'Categories for grouping custom product types (e.g., Furniture, Electronics)';
COMMENT ON TABLE custom_product_columns IS 'Columns/attributes within a category (e.g., Size, Material, Color)';
COMMENT ON TABLE custom_product_options IS 'Options within a column (e.g., Large, Small, Wood, Metal)';
COMMENT ON TABLE custom_products IS 'Combined products created from selected options across columns';
COMMENT ON TABLE custom_product_structures IS 'Defines the order of columns for product name generation';

-- Create updated_at trigger function if not exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_custom_product_categories_updated_at ON custom_product_categories;
CREATE TRIGGER update_custom_product_categories_updated_at
    BEFORE UPDATE ON custom_product_categories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_custom_product_columns_updated_at ON custom_product_columns;
CREATE TRIGGER update_custom_product_columns_updated_at
    BEFORE UPDATE ON custom_product_columns
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_custom_product_options_updated_at ON custom_product_options;
CREATE TRIGGER update_custom_product_options_updated_at
    BEFORE UPDATE ON custom_product_options
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_custom_products_updated_at ON custom_products;
CREATE TRIGGER update_custom_products_updated_at
    BEFORE UPDATE ON custom_products
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_custom_product_structures_updated_at ON custom_product_structures;
CREATE TRIGGER update_custom_product_structures_updated_at
    BEFORE UPDATE ON custom_product_structures
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE custom_product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_product_columns ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_product_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_product_structures ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (allow authenticated users to read/write)
CREATE POLICY "Allow authenticated users to read custom_product_categories" ON custom_product_categories
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert custom_product_categories" ON custom_product_categories
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update custom_product_categories" ON custom_product_categories
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete custom_product_categories" ON custom_product_categories
    FOR DELETE USING (auth.role() = 'authenticated');

-- Similar policies for other tables
CREATE POLICY "Allow authenticated users to read custom_product_columns" ON custom_product_columns
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert custom_product_columns" ON custom_product_columns
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update custom_product_columns" ON custom_product_columns
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete custom_product_columns" ON custom_product_columns
    FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to read custom_product_options" ON custom_product_options
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert custom_product_options" ON custom_product_options
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update custom_product_options" ON custom_product_options
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete custom_product_options" ON custom_product_options
    FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to read custom_products" ON custom_products
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert custom_products" ON custom_products
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update custom_products" ON custom_products
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete custom_products" ON custom_products
    FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to read custom_product_structures" ON custom_product_structures
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert custom_product_structures" ON custom_product_structures
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update custom_product_structures" ON custom_product_structures
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete custom_product_structures" ON custom_product_structures
    FOR DELETE USING (auth.role() = 'authenticated');

-- Insert sample data
INSERT INTO custom_product_categories (name, description, order_index) VALUES
    ('Nội thất', 'Các sản phẩm nội thất như tủ, bàn, ghế', 1),
    ('Điện tử', 'Các sản phẩm điện tử và thiết bị', 2),
    ('Vật liệu xây dựng', 'Nguyên vật liệu xây dựng', 3)
ON CONFLICT DO NOTHING;





