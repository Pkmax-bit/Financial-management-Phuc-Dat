-- Add parent_id column to expense_objects table for hierarchy support
-- This allows creating parent-child relationships like:
-- Xưởng (parent) -> Nguyên Vật liệu chính (child), Nguyên Vật liệu phụ (child)

-- Add parent_id column
ALTER TABLE expense_objects 
ADD COLUMN parent_id UUID REFERENCES expense_objects(id) ON DELETE CASCADE;

-- Add index for better performance on parent_id queries
CREATE INDEX IF NOT EXISTS idx_expense_objects_parent_id 
ON expense_objects(parent_id);

-- Add index for hierarchy queries
CREATE INDEX IF NOT EXISTS idx_expense_objects_hierarchy 
ON expense_objects(parent_id, id);

-- Add constraint to prevent self-reference
ALTER TABLE expense_objects 
ADD CONSTRAINT check_no_self_parent 
CHECK (parent_id != id);

-- Add column to track hierarchy level (0 = root, 1 = first level child, etc.)
ALTER TABLE expense_objects 
ADD COLUMN hierarchy_level INTEGER DEFAULT 0;

-- Add index for hierarchy level queries
CREATE INDEX IF NOT EXISTS idx_expense_objects_hierarchy_level 
ON expense_objects(hierarchy_level);

-- Add column to track if this is a parent object (has children)
ALTER TABLE expense_objects 
ADD COLUMN is_parent BOOLEAN DEFAULT FALSE;

-- Add index for parent objects
CREATE INDEX IF NOT EXISTS idx_expense_objects_is_parent 
ON expense_objects(is_parent);

-- Add column to track total cost from children (calculated field)
ALTER TABLE expense_objects 
ADD COLUMN total_children_cost DECIMAL(15,2) DEFAULT 0.00;

-- Add column to track if cost is calculated from children
ALTER TABLE expense_objects 
ADD COLUMN cost_from_children BOOLEAN DEFAULT FALSE;

-- Add index for cost calculation queries
CREATE INDEX IF NOT EXISTS idx_expense_objects_cost_from_children 
ON expense_objects(cost_from_children);

-- Create function to update hierarchy level
CREATE OR REPLACE FUNCTION update_expense_object_hierarchy_level()
RETURNS TRIGGER AS $$
DECLARE
    parent_level INTEGER;
BEGIN
    -- If parent_id is NULL, this is a root object
    IF NEW.parent_id IS NULL THEN
        NEW.hierarchy_level := 0;
    ELSE
        -- Get parent's hierarchy level
        SELECT hierarchy_level INTO parent_level 
        FROM expense_objects 
        WHERE id = NEW.parent_id;
        
        -- Set level to parent's level + 1
        NEW.hierarchy_level := parent_level + 1;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update hierarchy level
CREATE TRIGGER trigger_update_hierarchy_level
    BEFORE INSERT OR UPDATE ON expense_objects
    FOR EACH ROW
    EXECUTE FUNCTION update_expense_object_hierarchy_level();

-- Create function to update parent's is_parent flag
CREATE OR REPLACE FUNCTION update_parent_is_parent_flag()
RETURNS TRIGGER AS $$
BEGIN
    -- If this is an INSERT or UPDATE with parent_id
    IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') AND NEW.parent_id IS NOT NULL THEN
        -- Update parent to mark as parent
        UPDATE expense_objects 
        SET is_parent = TRUE 
        WHERE id = NEW.parent_id;
    END IF;
    
    -- If this is a DELETE or UPDATE that removes parent_id
    IF (TG_OP = 'DELETE' OR (TG_OP = 'UPDATE' AND OLD.parent_id IS NOT NULL AND NEW.parent_id IS NULL)) THEN
        -- Check if parent still has children
        IF TG_OP = 'DELETE' THEN
            -- Check if parent still has other children
            IF NOT EXISTS (
                SELECT 1 FROM expense_objects 
                WHERE parent_id = OLD.parent_id AND id != OLD.id
            ) THEN
                -- No more children, update parent
                UPDATE expense_objects 
                SET is_parent = FALSE 
                WHERE id = OLD.parent_id;
            END IF;
        ELSE
            -- UPDATE case - check if old parent still has children
            IF NOT EXISTS (
                SELECT 1 FROM expense_objects 
                WHERE parent_id = OLD.parent_id AND id != NEW.id
            ) THEN
                -- No more children, update parent
                UPDATE expense_objects 
                SET is_parent = FALSE 
                WHERE id = OLD.parent_id;
            END IF;
        END IF;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update parent's is_parent flag
CREATE TRIGGER trigger_update_parent_flag
    AFTER INSERT OR UPDATE OR DELETE ON expense_objects
    FOR EACH ROW
    EXECUTE FUNCTION update_parent_is_parent_flag();

-- Create function to calculate total cost from children
CREATE OR REPLACE FUNCTION calculate_children_total_cost(parent_object_id UUID)
RETURNS DECIMAL(15,2) AS $$
DECLARE
    total_cost DECIMAL(15,2) := 0;
BEGIN
    -- Sum up all children's costs
    SELECT COALESCE(SUM(amount), 0) INTO total_cost
    FROM expense_objects 
    WHERE parent_id = parent_object_id;
    
    RETURN total_cost;
END;
$$ LANGUAGE plpgsql;

-- Create function to update parent's total cost from children
CREATE OR REPLACE FUNCTION update_parent_total_cost()
RETURNS TRIGGER AS $$
DECLARE
    new_total_cost DECIMAL(15,2);
BEGIN
    -- If this affects a parent object, update its total cost
    IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') AND NEW.parent_id IS NOT NULL THEN
        -- Calculate new total for the parent
        new_total_cost := calculate_children_total_cost(NEW.parent_id);
        
        -- Update parent's total_children_cost
        UPDATE expense_objects 
        SET total_children_cost = new_total_cost,
            cost_from_children = (new_total_cost > 0)
        WHERE id = NEW.parent_id;
    END IF;
    
    -- If this is a DELETE or UPDATE that removes parent_id
    IF (TG_OP = 'DELETE' OR (TG_OP = 'UPDATE' AND OLD.parent_id IS NOT NULL AND NEW.parent_id IS NULL)) THEN
        -- Update old parent's total cost
        IF OLD.parent_id IS NOT NULL THEN
            new_total_cost := calculate_children_total_cost(OLD.parent_id);
            
            UPDATE expense_objects 
            SET total_children_cost = new_total_cost,
                cost_from_children = (new_total_cost > 0)
            WHERE id = OLD.parent_id;
        END IF;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update parent's total cost
CREATE TRIGGER trigger_update_parent_total_cost
    AFTER INSERT OR UPDATE OR DELETE ON expense_objects
    FOR EACH ROW
    EXECUTE FUNCTION update_parent_total_cost();

-- Add comments for documentation
COMMENT ON COLUMN expense_objects.parent_id IS 'ID of parent expense object for hierarchy';
COMMENT ON COLUMN expense_objects.hierarchy_level IS 'Level in hierarchy (0=root, 1=first level child, etc.)';
COMMENT ON COLUMN expense_objects.is_parent IS 'Whether this object has children';
COMMENT ON COLUMN expense_objects.total_children_cost IS 'Total cost calculated from children';
COMMENT ON COLUMN expense_objects.cost_from_children IS 'Whether cost is calculated from children';
