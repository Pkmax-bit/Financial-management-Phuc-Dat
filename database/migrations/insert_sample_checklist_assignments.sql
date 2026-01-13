-- Migration: Insert sample checklist item assignments for testing
-- Date: 2025-01-XX
-- Purpose: Add sample assignments to test the assignments display feature

-- Note: This migration will only work if you have existing checklist items and employees
-- If no data exists, these inserts will be skipped

DO $$
DECLARE
    checklist_item_record RECORD;
    employee_record RECORD;
    assignment_count INTEGER := 0;
    responsibility_types TEXT[] := ARRAY['accountable', 'responsible', 'consulted', 'informed'];
BEGIN
    -- Loop through first 5 checklist items
    FOR checklist_item_record IN
        SELECT id FROM task_checklist_items LIMIT 5
    LOOP
        -- Get 2-3 random employees for each item
        FOR employee_record IN
            SELECT id, first_name, last_name FROM employees ORDER BY RANDOM() LIMIT (2 + (RANDOM() * 2)::INTEGER)
        LOOP
            -- Insert assignment with random responsibility type
            INSERT INTO task_checklist_item_assignments (
                checklist_item_id,
                employee_id,
                responsibility_type
            )
            VALUES (
                checklist_item_record.id,
                employee_record.id,
                responsibility_types[1 + (RANDOM() * 4)::INTEGER]
            )
            ON CONFLICT (checklist_item_id, employee_id) DO NOTHING;

            assignment_count := assignment_count + 1;

            -- Log what we inserted
            RAISE NOTICE 'Created assignment for checklist item %: % % - %',
                checklist_item_record.id,
                employee_record.first_name,
                employee_record.last_name,
                responsibility_types[1 + (RANDOM() * 4)::INTEGER];
        END LOOP;
    END LOOP;

    RAISE NOTICE 'Inserted % sample checklist assignments', assignment_count;
END $$;

COMMENT ON DATABASE CURRENT_DATABASE IS 'Migration completed: Inserted sample checklist item assignments for testing assignments display';


