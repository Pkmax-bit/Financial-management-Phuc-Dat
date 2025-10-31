-- Create table for material adjustment rules
-- Purpose: Define rules for adjusting material (vật tư) quantities/prices when dimensions or quantities change
-- Example: When area increases by 10%, material A increases by 5%
-- Example: When area increases by 5m², material B decreases by 2%

CREATE TABLE IF NOT EXISTS material_adjustment_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_object_id UUID NOT NULL REFERENCES expense_objects(id) ON DELETE CASCADE,
  
  -- Dimension type to monitor: area, volume, height, length, depth, quantity
  dimension_type TEXT NOT NULL CHECK (dimension_type IN ('area', 'volume', 'height', 'length', 'depth', 'quantity')),
  
  -- Type of change to monitor: percentage or absolute value
  change_type TEXT NOT NULL CHECK (change_type IN ('percentage', 'absolute')),
  
  -- Value threshold for change (e.g., 10 for 10%, or 5 for 5m²)
  change_value NUMERIC(18,4) NOT NULL,
  
  -- Direction: increase, decrease, or both
  change_direction TEXT DEFAULT 'increase' CHECK (change_direction IN ('increase', 'decrease', 'both')),
  
  -- Type of adjustment to apply: percentage or absolute
  adjustment_type TEXT NOT NULL CHECK (adjustment_type IN ('percentage', 'absolute')),
  
  -- Adjustment value (e.g., 5 for 5% increase, or -2 for 2% decrease)
  adjustment_value NUMERIC(18,4) NOT NULL,
  
  -- Priority for rule application (lower number = higher priority)
  priority INTEGER DEFAULT 100,
  
  -- Rule name/description
  name TEXT,
  description TEXT,
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Audit fields
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES employees(id) ON DELETE SET NULL
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_material_adjustment_rules_expense_object 
  ON material_adjustment_rules(expense_object_id);

CREATE INDEX IF NOT EXISTS idx_material_adjustment_rules_dimension_type 
  ON material_adjustment_rules(dimension_type);

CREATE INDEX IF NOT EXISTS idx_material_adjustment_rules_active 
  ON material_adjustment_rules(is_active) WHERE is_active = TRUE;

CREATE INDEX IF NOT EXISTS idx_material_adjustment_rules_priority 
  ON material_adjustment_rules(priority);

-- Add comments
COMMENT ON TABLE material_adjustment_rules IS 'Quy tắc điều chỉnh vật tư khi thay đổi kích thước hoặc số lượng';
COMMENT ON COLUMN material_adjustment_rules.dimension_type IS 'Loại kích thước theo dõi: area, volume, height, length, depth, quantity';
COMMENT ON COLUMN material_adjustment_rules.change_type IS 'Loại thay đổi: percentage (theo %) hoặc absolute (giá trị tuyệt đối)';
COMMENT ON COLUMN material_adjustment_rules.change_value IS 'Giá trị ngưỡng thay đổi (ví dụ: 10 cho 10%, hoặc 5 cho 5m²)';
COMMENT ON COLUMN material_adjustment_rules.adjustment_type IS 'Loại điều chỉnh: percentage hoặc absolute';
COMMENT ON COLUMN material_adjustment_rules.adjustment_value IS 'Giá trị điều chỉnh (ví dụ: 5 cho tăng 5%, -2 cho giảm 2%)';
COMMENT ON COLUMN material_adjustment_rules.priority IS 'Độ ưu tiên áp dụng quy tắc (số nhỏ hơn = ưu tiên cao hơn)';

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_material_adjustment_rules_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER trigger_update_material_adjustment_rules_updated_at
  BEFORE UPDATE ON material_adjustment_rules
  FOR EACH ROW
  EXECUTE FUNCTION update_material_adjustment_rules_updated_at();

-- Insert sample rules (examples)
-- Example 1: When area increases by 10%, material A increases by 5%
-- INSERT INTO material_adjustment_rules (expense_object_id, dimension_type, change_type, change_value, change_direction, adjustment_type, adjustment_value, name, description)
-- VALUES (
--   'expense_object_id_A', 
--   'area', 
--   'percentage', 
--   10, 
--   'increase', 
--   'percentage', 
--   5, 
--   'Area increase 10% -> Material A +5%',
--   'Khi diện tích tăng 10% thì vật tư A tăng 5%'
-- );

-- Example 2: When area increases by 5m², material B decreases by 2%
-- INSERT INTO material_adjustment_rules (expense_object_id, dimension_type, change_type, change_value, change_direction, adjustment_type, adjustment_value, name, description)
-- VALUES (
--   'expense_object_id_B', 
--   'area', 
--   'absolute', 
--   5, 
--   'increase', 
--   'percentage', 
--   -2, 
--   'Area +5m² -> Material B -2%',
--   'Khi diện tích tăng 5m² thì vật tư B giảm 2%'
-- );

