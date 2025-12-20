-- Add accountable_person column to tasks table
-- This allows assigning a responsible person from project team members

ALTER TABLE tasks
ADD COLUMN IF NOT EXISTS accountable_person UUID REFERENCES employees(id) ON DELETE SET NULL;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_tasks_accountable_person ON tasks(accountable_person);

-- Add comment to explain the column
COMMENT ON COLUMN tasks.accountable_person IS 'Employee responsible for overseeing task completion';
