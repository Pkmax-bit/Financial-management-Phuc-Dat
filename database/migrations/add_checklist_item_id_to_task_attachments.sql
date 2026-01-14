-- Add checklist_item_id column to task_attachments table
-- This allows linking attachments to specific checklist items (subtasks)

ALTER TABLE task_attachments
ADD COLUMN IF NOT EXISTS checklist_item_id UUID REFERENCES task_checklist_items(id) ON DELETE CASCADE;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_task_attachments_checklist_item_id 
ON task_attachments(checklist_item_id);

-- Add comment
COMMENT ON COLUMN task_attachments.checklist_item_id IS 'Optional: Links attachment to a specific checklist item (subtask). If NULL, attachment belongs to the main task.';



