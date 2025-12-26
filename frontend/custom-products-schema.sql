-- Custom Products Database Schema
-- Run this SQL in your Supabase SQL editor to create the required tables

-- Custom Product Categories
CREATE TABLE IF NOT EXISTS custom_product_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    order_index INTEGER DEFAULT 0,
    is_primary BOOLEAN DEFAULT false, -- Primary category (red header)
    is_active BOOLEAN DEFAULT true,
    user_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Custom Product Columns (Attributes/Properties)
CREATE TABLE IF NOT EXISTS custom_product_columns (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    category_id UUID NOT NULL REFERENCES custom_product_categories(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    order_index INTEGER DEFAULT 0,
    is_primary BOOLEAN DEFAULT false, -- Primary column for dimensions and pricing
    is_active BOOLEAN DEFAULT true,
    user_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Custom Product Options (Attribute Values)
CREATE TABLE IF NOT EXISTS custom_product_options (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    column_id UUID NOT NULL REFERENCES custom_product_columns(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,      -- Option name (e.g., "2m x 1.5m x 0.6m")
    description TEXT,                -- Optional description
    unit_price DECIMAL(10,2) DEFAULT 0, -- Unit price in VND/m² (for primary columns)
    width DECIMAL(10,2) DEFAULT 0,   -- Width in mm (for primary columns)
    height DECIMAL(10,2) DEFAULT 0,  -- Height in mm (for primary columns)
    depth DECIMAL(10,2) DEFAULT 0,   -- Depth in mm (for primary columns)
    area DECIMAL(10,2) DEFAULT 0,    -- Auto-calculated area in m²
    volume DECIMAL(10,2) DEFAULT 0,  -- Auto-calculated volume in m³
    total_price DECIMAL(10,2) DEFAULT 0, -- Auto-calculated total price (area * unit_price)
    order_index INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    user_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_custom_product_categories_user_id ON custom_product_categories(user_id);
CREATE INDEX IF NOT EXISTS idx_custom_product_categories_active ON custom_product_categories(is_active);
CREATE INDEX IF NOT EXISTS idx_custom_product_columns_category_id ON custom_product_columns(category_id);
CREATE INDEX IF NOT EXISTS idx_custom_product_columns_user_id ON custom_product_columns(user_id);
CREATE INDEX IF NOT EXISTS idx_custom_product_columns_active ON custom_product_columns(is_active);
CREATE INDEX IF NOT EXISTS idx_custom_product_options_column_id ON custom_product_options(column_id);
CREATE INDEX IF NOT EXISTS idx_custom_product_options_user_id ON custom_product_options(user_id);
CREATE INDEX IF NOT EXISTS idx_custom_product_options_active ON custom_product_options(is_active);

-- Add new columns to existing tables (if upgrading)
-- ALTER TABLE custom_product_categories ADD COLUMN IF NOT EXISTS is_primary BOOLEAN DEFAULT false;
-- ALTER TABLE custom_product_columns ADD COLUMN IF NOT EXISTS is_primary BOOLEAN DEFAULT false;
-- ALTER TABLE custom_product_options ADD COLUMN IF NOT EXISTS description TEXT;
-- ALTER TABLE custom_product_options ADD COLUMN IF NOT EXISTS width DECIMAL(10,2) DEFAULT 0;   -- mm
-- ALTER TABLE custom_product_options ADD COLUMN IF NOT EXISTS height DECIMAL(10,2) DEFAULT 0;  -- mm
-- ALTER TABLE custom_product_options ADD COLUMN IF NOT EXISTS depth DECIMAL(10,2) DEFAULT 0;   -- mm
-- ALTER TABLE custom_product_options ADD COLUMN IF NOT EXISTS area DECIMAL(10,2) DEFAULT 0;    -- m²
-- ALTER TABLE custom_product_options ADD COLUMN IF NOT EXISTS volume DECIMAL(10,2) DEFAULT 0;  -- m³
-- ALTER TABLE custom_product_options ADD COLUMN IF NOT EXISTS total_price DECIMAL(10,2) DEFAULT 0;

-- Enable Row Level Security (RLS)
ALTER TABLE custom_product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_product_columns ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_product_options ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (users can only access their own data)
CREATE POLICY "Users can view their own categories" ON custom_product_categories
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own categories" ON custom_product_categories
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own categories" ON custom_product_categories
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own categories" ON custom_product_categories
    FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own columns" ON custom_product_columns
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own columns" ON custom_product_columns
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own columns" ON custom_product_columns
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own columns" ON custom_product_columns
    FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own options" ON custom_product_options
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own options" ON custom_product_options
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own options" ON custom_product_options
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own options" ON custom_product_options
    FOR DELETE USING (auth.uid() = user_id);
