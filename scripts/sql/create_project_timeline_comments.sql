-- Create timeline_comments table for project timeline discussions
CREATE TABLE IF NOT EXISTS timeline_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timeline_entry_id UUID NOT NULL REFERENCES project_timeline(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    author_name VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_timeline_comments_entry_id ON timeline_comments(timeline_entry_id);
CREATE INDEX IF NOT EXISTS idx_timeline_comments_project_id ON timeline_comments(project_id);
CREATE INDEX IF NOT EXISTS idx_timeline_comments_created_at ON timeline_comments(created_at);

