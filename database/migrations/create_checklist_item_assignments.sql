-- Migration: Tạo bảng task_checklist_item_assignments
-- Mục đích: Lưu nhiều nhân viên được gán cho mỗi checklist item với vai trò (RACI)
-- Ngày tạo: 2025-01-XX

-- Tạo bảng task_checklist_item_assignments
CREATE TABLE IF NOT EXISTS task_checklist_item_assignments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    checklist_item_id UUID REFERENCES task_checklist_items(id) ON DELETE CASCADE NOT NULL,
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE NOT NULL,
    responsibility_type TEXT NOT NULL CHECK (responsibility_type IN ('accountable', 'responsible', 'consulted', 'informed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(checklist_item_id, employee_id)
);

-- Tạo indexes
CREATE INDEX IF NOT EXISTS idx_checklist_item_assignments_item_id ON task_checklist_item_assignments(checklist_item_id);
CREATE INDEX IF NOT EXISTS idx_checklist_item_assignments_employee_id ON task_checklist_item_assignments(employee_id);

-- RLS Policies
ALTER TABLE task_checklist_item_assignments ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view assignments for visible checklist items
CREATE POLICY "Users can view checklist item assignments for visible items"
ON task_checklist_item_assignments
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM task_checklist_items tci
        INNER JOIN task_checklists tc ON tc.id = tci.checklist_id
        INNER JOIN tasks t ON t.id = tc.task_id
        WHERE tci.id = task_checklist_item_assignments.checklist_item_id
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
CREATE POLICY "Task collaborators can manage checklist item assignments"
ON task_checklist_item_assignments
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM task_checklist_items tci
        INNER JOIN task_checklists tc ON tc.id = tci.checklist_id
        INNER JOIN tasks t ON t.id = tc.task_id
        WHERE tci.id = task_checklist_item_assignments.checklist_item_id
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
        )
    )
);

COMMENT ON TABLE task_checklist_item_assignments IS 'Lưu nhiều nhân viên được gán cho mỗi checklist item với vai trò RACI';






















