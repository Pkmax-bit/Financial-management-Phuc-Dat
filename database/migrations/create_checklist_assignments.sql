-- Migration: Tạo bảng task_checklist_assignments
-- Mục đích: Lưu nhiều nhân viên được gán cho mỗi checklist với vai trò (RACI)
-- Ngày tạo: 2025-01-XX

-- Tạo bảng task_checklist_assignments
CREATE TABLE IF NOT EXISTS task_checklist_assignments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    checklist_id UUID REFERENCES task_checklists(id) ON DELETE CASCADE NOT NULL,
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE NOT NULL,
    responsibility_type TEXT NOT NULL CHECK (responsibility_type IN ('accountable', 'responsible', 'consulted', 'informed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(checklist_id, employee_id)
);

-- Tạo indexes
CREATE INDEX IF NOT EXISTS idx_checklist_assignments_checklist_id ON task_checklist_assignments(checklist_id);
CREATE INDEX IF NOT EXISTS idx_checklist_assignments_employee_id ON task_checklist_assignments(employee_id);

-- RLS Policies
ALTER TABLE task_checklist_assignments ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view assignments for visible checklists
CREATE POLICY "Users can view checklist assignments for visible checklists"
ON task_checklist_assignments
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM task_checklists tc
        INNER JOIN tasks t ON t.id = tc.task_id
        WHERE tc.id = task_checklist_assignments.checklist_id
        AND (
            t.created_by = auth.uid()
            OR EXISTS (
                SELECT 1 FROM task_participants tp
                WHERE tp.task_id = t.id
                AND tp.employee_id IN (
                    SELECT id FROM employees WHERE user_id = auth.uid()
                )
            )
        )
    )
);

-- Policy: Task collaborators can manage assignments
CREATE POLICY "Task collaborators can manage checklist assignments"
ON task_checklist_assignments
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM task_checklists tc
        INNER JOIN tasks t ON t.id = tc.task_id
        WHERE tc.id = task_checklist_assignments.checklist_id
        AND (
            t.created_by = auth.uid()
            OR EXISTS (
                SELECT 1 FROM task_participants tp
                WHERE tp.task_id = t.id
                AND tp.employee_id IN (
                    SELECT id FROM employees WHERE user_id = auth.uid()
                )
                AND tp.role IN ('responsible', 'participant')
            )
            OR EXISTS (
                SELECT 1 FROM users u
                WHERE u.id = auth.uid()
                AND u.role = 'admin'
            )
        )
    )
);

COMMENT ON TABLE task_checklist_assignments IS 'Lưu nhiều nhân viên được gán cho mỗi checklist với vai trò RACI';
