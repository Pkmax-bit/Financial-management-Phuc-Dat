-- Drop custom products tables
-- Migration to remove custom product functionality

-- Drop indexes first
DROP INDEX IF EXISTS idx_custom_product_columns_order;
DROP INDEX IF EXISTS idx_custom_product_columns_active;
DROP INDEX IF EXISTS idx_custom_product_options_column_id;
DROP INDEX IF EXISTS idx_custom_product_options_active;

-- Drop tables in reverse order due to foreign key constraints
DROP TABLE IF EXISTS custom_products;
DROP TABLE IF EXISTS custom_product_options;
DROP TABLE IF EXISTS custom_product_columns;
DROP TABLE IF EXISTS custom_product_categories;










