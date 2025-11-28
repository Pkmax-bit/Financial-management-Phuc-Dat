-- Phase 2: Task Page & Collaboration Schema Updates

-- 1. Update task_groups table
ALTER TABLE task_groups ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE task_groups ADD COLUMN IF NOT EXISTS color TEXT DEFAULT '#3b82f6'; -- Default blue

-- 2. Update task_comments table
ALTER TABLE task_comments ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'text'; -- 'text', 'file', 'image'
ALTER TABLE task_comments ADD COLUMN IF NOT EXISTS file_url TEXT;
ALTER TABLE task_comments ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT FALSE;

-- 3. Create task_notes table
CREATE TABLE IF NOT EXISTS task_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for task_notes
ALTER TABLE task_notes ENABLE ROW LEVEL SECURITY;

-- Create policy for task_notes
CREATE POLICY "Enable all access for authenticated users" ON task_notes FOR ALL USING (auth.role() = 'authenticated');
