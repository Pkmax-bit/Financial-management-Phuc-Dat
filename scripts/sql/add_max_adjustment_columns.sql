-- Migration: Add max adjustment limit columns to material_adjustment_rules table
-- Purpose: Add support for maximum adjustment limits (e.g., max decrease 30%)
-- Example: If area increases 20%, decrease 10%, but max decrease is 30%

-- Add max_adjustment_percentage column (for percentage adjustments)
-- This limits the total adjustment percentage that can be applied
-- Example: If adjustment_value is -10% and max_adjustment_percentage is 30,
-- then even if area increases 60% (which would trigger 3 times = -30%),
-- the total decrease will be capped at -30% (the max limit)
ALTER TABLE material_adjustment_rules
ADD COLUMN IF NOT EXISTS max_adjustment_percentage NUMERIC(18,4) NULL;

-- Add max_adjustment_value column (for absolute adjustments)
-- This limits the total absolute adjustment value that can be applied
ALTER TABLE material_adjustment_rules
ADD COLUMN IF NOT EXISTS max_adjustment_value NUMERIC(18,4) NULL;

-- Add comments
COMMENT ON COLUMN material_adjustment_rules.max_adjustment_percentage IS 
'Giới hạn tối đa cho điều chỉnh phần trăm (ví dụ: 30 cho tối đa 30%). 
Ví dụ: Tăng diện tích 20% thì giảm 10%, nhưng tối đa chỉ giảm 30%';

COMMENT ON COLUMN material_adjustment_rules.max_adjustment_value IS 
'Giới hạn tối đa cho điều chỉnh tuyệt đối (ví dụ: 100 cho tối đa 100 đơn vị). 
Áp dụng cho adjustment_type = absolute';

-- Example usage:
-- UPDATE material_adjustment_rules 
-- SET max_adjustment_percentage = 30 
-- WHERE id = 'rule_id' AND adjustment_type = 'percentage' AND adjustment_value < 0;
-- This means: "Decrease by 10% when area increases 20%, but maximum decrease is 30%"

