-- Add estimated_time and time_spent columns to tasks table
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS estimated_time INTEGER DEFAULT 0;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS time_spent INTEGER DEFAULT 0;

-- Add start_date if it doesn't exist
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS start_date TIMESTAMP WITH TIME ZONE;

-- Add completed_at and completed_by if they don't exist (just in case)
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS completed_by UUID REFERENCES auth.users(id);
