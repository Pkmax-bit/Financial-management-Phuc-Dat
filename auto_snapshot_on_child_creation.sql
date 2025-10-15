-- Auto Snapshot on Child Creation
-- Tự động tạo snapshot khi tạo chi phí con

-- Function to create automatic snapshot when child expense is created
CREATE OR REPLACE FUNCTION create_auto_snapshot_on_child_creation()
RETURNS TRIGGER AS $$
DECLARE
    parent_expense JSONB;
    snapshot_data JSONB;
    snapshot_name TEXT;
    parent_table_name TEXT;
    parent_id UUID;
BEGIN
    -- Only proceed if this is a child expense (has id_parent)
    IF NEW.id_parent IS NOT NULL THEN
        -- Determine parent table based on current table
        IF TG_TABLE_NAME = 'expenses' THEN
            parent_table_name := 'expenses';
        ELSIF TG_TABLE_NAME = 'project_expenses' THEN
            parent_table_name := 'project_expenses';
        ELSIF TG_TABLE_NAME = 'project_expenses_quote' THEN
            parent_table_name := 'project_expenses_quote';
        ELSE
            RETURN NEW;
        END IF;
        
        -- Get parent expense data
        EXECUTE format('SELECT to_jsonb(t.*) FROM %I t WHERE id = $1', parent_table_name)
        INTO parent_expense
        USING NEW.id_parent;
        
        -- If parent exists, create snapshot
        IF parent_expense IS NOT NULL THEN
            -- Create snapshot name with timestamp
            snapshot_name := format('Auto-snapshot-%s-%s', 
                TG_TABLE_NAME, 
                to_char(NOW(), 'YYYY-MM-DD-HH24-MI-SS')
            );
            
            -- Prepare snapshot data
            snapshot_data := jsonb_build_object(
                'parent_expense', parent_expense,
                'child_expense', to_jsonb(NEW),
                'snapshot_type', TG_TABLE_NAME,
                'created_at', NOW(),
                'trigger_reason', 'child_creation'
            );
            
            -- Insert snapshot
            INSERT INTO expense_snapshots (
                snapshot_name,
                snapshot_description,
                snapshot_type,
                expenses_data,
                created_by,
                is_active
            ) VALUES (
                snapshot_name,
                format('Auto-snapshot created when child expense was added to parent %s', NEW.id_parent),
                TG_TABLE_NAME,
                jsonb_build_array(snapshot_data),
                NEW.created_by,
                TRUE
            );
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for all expense tables
CREATE TRIGGER trigger_auto_snapshot_expenses
    AFTER INSERT ON expenses
    FOR EACH ROW
    EXECUTE FUNCTION create_auto_snapshot_on_child_creation();

CREATE TRIGGER trigger_auto_snapshot_project_expenses
    AFTER INSERT ON project_expenses
    FOR EACH ROW
    EXECUTE FUNCTION create_auto_snapshot_on_child_creation();

CREATE TRIGGER trigger_auto_snapshot_project_expenses_quote
    AFTER INSERT ON project_expenses_quote
    FOR EACH ROW
    EXECUTE FUNCTION create_auto_snapshot_on_child_creation();

-- Function to get latest auto-snapshot for a parent expense
CREATE OR REPLACE FUNCTION get_latest_auto_snapshot(
    p_parent_id UUID,
    p_table_name TEXT
)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
BEGIN
    SELECT expenses_data INTO result
    FROM expense_snapshots
    WHERE snapshot_type = p_table_name
      AND expenses_data @> jsonb_build_object('trigger_reason', 'child_creation')
      AND expenses_data @> jsonb_build_object('parent_expense', jsonb_build_object('id', p_parent_id))
    ORDER BY created_at DESC
    LIMIT 1;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to restore parent expense from snapshot
CREATE OR REPLACE FUNCTION restore_parent_from_snapshot(
    p_parent_id UUID,
    p_table_name TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    snapshot_data JSONB;
    parent_data JSONB;
    result BOOLEAN := FALSE;
BEGIN
    -- Get latest snapshot
    snapshot_data := get_latest_auto_snapshot(p_parent_id, p_table_name);
    
    IF snapshot_data IS NOT NULL THEN
        -- Extract parent data from snapshot
        parent_data := snapshot_data->'parent_expense';
        
        IF parent_data IS NOT NULL THEN
            -- Restore parent expense
            EXECUTE format('UPDATE %I SET 
                description = $2,
                amount = $3,
                currency = $4,
                expense_date = $5,
                status = $6,
                notes = $7,
                receipt_url = $8,
                updated_at = NOW()
                WHERE id = $1', p_table_name)
            USING 
                p_parent_id,
                parent_data->>'description',
                (parent_data->>'amount')::NUMERIC,
                parent_data->>'currency',
                parent_data->>'expense_date',
                parent_data->>'status',
                parent_data->>'notes',
                parent_data->>'receipt_url';
            
            result := TRUE;
        END IF;
    END IF;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to get restore history for a parent expense
CREATE OR REPLACE FUNCTION get_restore_history(
    p_parent_id UUID,
    p_table_name TEXT
)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
BEGIN
    SELECT jsonb_agg(
        jsonb_build_object(
            'snapshot_id', id,
            'snapshot_name', snapshot_name,
            'created_at', created_at,
            'restored_at', restored_at,
            'can_restore', restored_at IS NULL
        )
    ) INTO result
    FROM expense_snapshots
    WHERE snapshot_type = p_table_name
      AND expenses_data @> jsonb_build_object('trigger_reason', 'child_creation')
      AND expenses_data @> jsonb_build_object('parent_expense', jsonb_build_object('id', p_parent_id))
    ORDER BY created_at DESC;
    
    RETURN COALESCE(result, '[]'::jsonb);
END;
$$ LANGUAGE plpgsql;
