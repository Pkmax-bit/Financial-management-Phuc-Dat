-- Add original_file_name column to task_attachments table
-- This stores the original filename before renaming for storage

ALTER TABLE task_attachments
ADD COLUMN IF NOT EXISTS original_file_name VARCHAR(255);

-- Update existing records to use file_name as original_file_name if column was just added
UPDATE task_attachments
SET original_file_name = file_name
WHERE original_file_name IS NULL;

