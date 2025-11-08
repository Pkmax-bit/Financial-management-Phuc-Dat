-- Create project_team table
CREATE TABLE IF NOT EXISTS project_team (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(100) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    start_date DATE NOT NULL,
    hourly_rate DECIMAL(10,2),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    skills TEXT[],
    avatar TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create project_timeline table
CREATE TABLE IF NOT EXISTS project_timeline (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    date TIMESTAMP WITH TIME ZONE NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('milestone', 'update', 'issue', 'meeting')),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
    created_by VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create timeline_attachments table
CREATE TABLE IF NOT EXISTS timeline_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timeline_entry_id UUID NOT NULL REFERENCES project_timeline(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    url TEXT NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('image', 'document', 'other')),
    size BIGINT NOT NULL,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_project_team_project_id ON project_team(project_id);
CREATE INDEX IF NOT EXISTS idx_project_team_status ON project_team(status);
CREATE INDEX IF NOT EXISTS idx_project_timeline_project_id ON project_timeline(project_id);
CREATE INDEX IF NOT EXISTS idx_project_timeline_date ON project_timeline(date);
CREATE INDEX IF NOT EXISTS idx_project_timeline_type ON project_timeline(type);
CREATE INDEX IF NOT EXISTS idx_project_timeline_status ON project_timeline(status);
CREATE INDEX IF NOT EXISTS idx_timeline_attachments_entry_id ON timeline_attachments(timeline_entry_id);

-- Create RLS policies (if using Supabase RLS)
ALTER TABLE project_team ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_timeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE timeline_attachments ENABLE ROW LEVEL SECURITY;

-- Policy for project_team
CREATE POLICY "Users can view project team members" ON project_team
    FOR SELECT USING (true);

CREATE POLICY "Users can insert project team members" ON project_team
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update project team members" ON project_team
    FOR UPDATE USING (true);

CREATE POLICY "Users can delete project team members" ON project_team
    FOR DELETE USING (true);

-- Policy for project_timeline
CREATE POLICY "Users can view project timeline" ON project_timeline
    FOR SELECT USING (true);

CREATE POLICY "Users can insert project timeline" ON project_timeline
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update project timeline" ON project_timeline
    FOR UPDATE USING (true);

CREATE POLICY "Users can delete project timeline" ON project_timeline
    FOR DELETE USING (true);

-- Policy for timeline_attachments
CREATE POLICY "Users can view timeline attachments" ON timeline_attachments
    FOR SELECT USING (true);

CREATE POLICY "Users can insert timeline attachments" ON timeline_attachments
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update timeline attachments" ON timeline_attachments
    FOR UPDATE USING (true);

CREATE POLICY "Users can delete timeline attachments" ON timeline_attachments
    FOR DELETE USING (true);

-- Insert sample data for testing
INSERT INTO project_team (project_id, name, role, email, phone, start_date, hourly_rate, status, skills) VALUES
('dddddddd-dddd-dddd-dddd-dddddddddddd', 'Nguyễn Văn A', 'project_manager', 'nguyenvana@example.com', '0123456789', '2024-01-15', 500000, 'active', ARRAY['Project Management', 'Leadership', 'Agile']),
('dddddddd-dddd-dddd-dddd-dddddddddddd', 'Trần Thị B', 'developer', 'tranthib@example.com', '0987654321', '2024-01-20', 400000, 'active', ARRAY['React', 'Node.js', 'TypeScript']),
('dddddddd-dddd-dddd-dddd-dddddddddddd', 'Lê Văn C', 'designer', 'levanc@example.com', '0369852147', '2024-01-25', 350000, 'active', ARRAY['UI/UX Design', 'Figma', 'Adobe Creative Suite']);

INSERT INTO project_timeline (project_id, title, description, date, type, status, created_by) VALUES
('dddddddd-dddd-dddd-dddd-dddddddddddd', 'Kickoff Meeting', 'Cuộc họp khởi động dự án với khách hàng', '2024-01-15 09:00:00+07', 'meeting', 'completed', 'Nguyễn Văn A'),
('dddddddd-dddd-dddd-dddd-dddddddddddd', 'Thiết kế UI/UX', 'Hoàn thành thiết kế giao diện người dùng', '2024-02-01 14:00:00+07', 'milestone', 'completed', 'Lê Văn C'),
('dddddddd-dddd-dddd-dddd-dddddddddddd', 'Phát triển Frontend', 'Bắt đầu phát triển giao diện người dùng', '2024-02-15 08:00:00+07', 'update', 'in_progress', 'Trần Thị B'),
('dddddddd-dddd-dddd-dddd-dddddddddddd', 'Bug trong API', 'Phát hiện lỗi trong API authentication', '2024-02-20 16:30:00+07', 'issue', 'pending', 'Trần Thị B');
