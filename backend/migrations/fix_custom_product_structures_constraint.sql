-- Fix the custom_product_structures constraint to allow multiple non-default structures per category
-- Drop the incorrect unique constraint
ALTER TABLE custom_product_structures DROP CONSTRAINT IF EXISTS custom_product_structures_category_id_is_default_key;

-- Create a partial unique index that only enforces uniqueness for default structures
CREATE UNIQUE INDEX custom_product_structures_category_default_unique
ON custom_product_structures (category_id)
WHERE is_default = true;






