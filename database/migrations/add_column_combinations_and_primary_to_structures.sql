-- Migration: Add column combinations and primary column to custom product structures
-- Enhances product name generation with custom separators and primary column designation

-- Add column_combinations column to store separators between columns
ALTER TABLE custom_product_structures
ADD COLUMN IF NOT EXISTS column_combinations TEXT[];

-- Add primary_column_id to designate which column provides dimension information
ALTER TABLE custom_product_structures
ADD COLUMN IF NOT EXISTS primary_column_id UUID REFERENCES custom_product_columns(id);

-- Add comment for new columns
COMMENT ON COLUMN custom_product_structures.column_combinations IS 'Custom separators between columns in product name generation';
COMMENT ON COLUMN custom_product_structures.primary_column_id IS 'Primary column that provides dimension information for the product';

-- Create index for primary_column_id for better query performance
CREATE INDEX IF NOT EXISTS idx_custom_product_structures_primary_column_id
ON custom_product_structures(primary_column_id);






