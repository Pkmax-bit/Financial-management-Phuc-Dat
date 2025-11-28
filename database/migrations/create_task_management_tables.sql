-- Task Management System Migration
-- Create tables for task groups, tasks, assignments, and notifications

-- Create task status enum if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'task_status'
    ) THEN
        CREATE TYPE task_status AS ENUM ('todo', 'in_progress', 'completed', 'cancelled');
    END IF;
END;
$$;

-- Create task priority enum if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'task_priority'
    ) THEN
        CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high', 'urgent');
    END IF;
END;
$$;

-- Task Groups table (nhóm nhiệm vụ)
CREATE TABLE IF NOT EXISTS task_groups (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Task Group Members table (thành viên trong nhóm)
CREATE TABLE IF NOT EXISTS task_group_members (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    group_id UUID REFERENCES task_groups(id) ON DELETE CASCADE NOT NULL,
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE NOT NULL,
    role VARCHAR(50) DEFAULT 'member', -- 'owner', 'admin', 'member'
    added_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(group_id, employee_id)
);

-- Tasks table (nhiệm vụ)
CREATE TABLE IF NOT EXISTS tasks (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status task_status DEFAULT 'todo',
    priority task_priority DEFAULT 'medium',
    start_date TIMESTAMP WITH TIME ZONE,
    due_date TIMESTAMP WITH TIME ZONE,
    group_id UUID REFERENCES task_groups(id) ON DELETE SET NULL,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    assigned_to UUID REFERENCES employees(id) ON DELETE SET NULL,
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    completed_at TIMESTAMP WITH TIME ZONE,
    completed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    estimated_time INT DEFAULT 0,
    time_spent INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure new task columns exist for legacy tables
ALTER TABLE tasks
    ADD COLUMN IF NOT EXISTS start_date TIMESTAMP WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS estimated_time INT DEFAULT 0,
    ADD COLUMN IF NOT EXISTS time_spent INT DEFAULT 0;

-- Task Assignments table (phân công nhiệm vụ)
CREATE TABLE IF NOT EXISTS task_assignments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE NOT NULL,
    assigned_to UUID REFERENCES employees(id) ON DELETE CASCADE NOT NULL,
    assigned_by UUID REFERENCES users(id) ON DELETE SET NULL,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status task_status DEFAULT 'todo',
    notes TEXT,
    UNIQUE(task_id, assigned_to)
);

-- Create participant role enum if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'task_participant_role'
    ) THEN
        CREATE TYPE task_participant_role AS ENUM ('responsible', 'participant', 'observer');
    END IF;
END;
$$;

CREATE TABLE IF NOT EXISTS task_participants (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE NOT NULL,
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE NOT NULL,
    role task_participant_role DEFAULT 'participant',
    added_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(task_id, employee_id, role)
);

-- Task Checklists table
CREATE TABLE IF NOT EXISTS task_checklists (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS task_checklist_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    checklist_id UUID REFERENCES task_checklists(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    is_completed BOOLEAN DEFAULT FALSE,
    assignee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
    sort_order INT DEFAULT 0,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Task Time Logs table
CREATE TABLE IF NOT EXISTS task_time_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Task Comments table (bình luận nhiệm vụ)
CREATE TABLE IF NOT EXISTS task_comments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
    comment TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Task Attachments table (file đính kèm)
CREATE TABLE IF NOT EXISTS task_attachments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    file_size BIGINT,
    file_type VARCHAR(100),
    uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Task Notifications table (thông báo nhiệm vụ)
CREATE TABLE IF NOT EXISTS task_notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
    notification_type VARCHAR(50) NOT NULL, -- 'assigned', 'status_changed', 'due_date_reminder', 'comment_added', 'completed'
    title VARCHAR(255) NOT NULL,
    message TEXT,
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_group_id ON tasks(group_id);
CREATE INDEX IF NOT EXISTS idx_tasks_created_by ON tasks(created_by);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_start_date ON tasks(start_date);
CREATE INDEX IF NOT EXISTS idx_task_assignments_task_id ON task_assignments(task_id);
CREATE INDEX IF NOT EXISTS idx_task_assignments_assigned_to ON task_assignments(assigned_to);
CREATE INDEX IF NOT EXISTS idx_task_participants_task_id ON task_participants(task_id);
CREATE INDEX IF NOT EXISTS idx_task_participants_employee_id ON task_participants(employee_id);
CREATE INDEX IF NOT EXISTS idx_task_checklists_task_id ON task_checklists(task_id);
CREATE INDEX IF NOT EXISTS idx_task_checklist_items_checklist_id ON task_checklist_items(checklist_id);
CREATE INDEX IF NOT EXISTS idx_task_checklist_items_assignee_id ON task_checklist_items(assignee_id);
CREATE INDEX IF NOT EXISTS idx_task_time_logs_task_id ON task_time_logs(task_id);
CREATE INDEX IF NOT EXISTS idx_task_time_logs_user_id ON task_time_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_task_group_members_group_id ON task_group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_task_group_members_employee_id ON task_group_members(employee_id);
CREATE INDEX IF NOT EXISTS idx_task_notifications_user_id ON task_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_task_notifications_is_read ON task_notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_task_notifications_task_id ON task_notifications(task_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_task_groups_updated_at BEFORE UPDATE ON task_groups
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_task_comments_updated_at BEFORE UPDATE ON task_comments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to create notification when task is assigned
CREATE OR REPLACE FUNCTION create_task_assignment_notification()
RETURNS TRIGGER AS $$
BEGIN
    -- Create notification for assigned employee
    INSERT INTO task_notifications (task_id, user_id, employee_id, notification_type, title, message)
    SELECT 
        NEW.task_id,
        u.id,
        NEW.assigned_to,
        'assigned',
        'Nhiệm vụ mới được giao',
        'Bạn đã được giao nhiệm vụ: ' || (SELECT title FROM tasks WHERE id = NEW.task_id)
    FROM users u
    INNER JOIN employees e ON e.user_id = u.id
    WHERE e.id = NEW.assigned_to;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for task assignment notifications
CREATE TRIGGER task_assignment_notification AFTER INSERT ON task_assignments
    FOR EACH ROW EXECUTE FUNCTION create_task_assignment_notification();

-- Create function to create notification when task status changes
CREATE OR REPLACE FUNCTION create_task_status_notification()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        -- Notify task creator
        INSERT INTO task_notifications (task_id, user_id, notification_type, title, message)
        VALUES (
            NEW.id,
            NEW.created_by,
            'status_changed',
            'Trạng thái nhiệm vụ đã thay đổi',
            'Nhiệm vụ "' || NEW.title || '" đã chuyển từ ' || OLD.status || ' sang ' || NEW.status
        );
        
        -- Notify assigned employee if different from creator
        IF NEW.assigned_to IS NOT NULL AND NEW.assigned_to != (SELECT id FROM employees WHERE user_id = NEW.created_by LIMIT 1) THEN
            INSERT INTO task_notifications (task_id, user_id, employee_id, notification_type, title, message)
            SELECT 
                NEW.id,
                u.id,
                NEW.assigned_to,
                'status_changed',
                'Trạng thái nhiệm vụ đã thay đổi',
                'Nhiệm vụ "' || NEW.title || '" đã chuyển từ ' || OLD.status || ' sang ' || NEW.status
            FROM users u
            INNER JOIN employees e ON e.user_id = u.id
            WHERE e.id = NEW.assigned_to;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for task status change notifications
CREATE TRIGGER task_status_notification AFTER UPDATE ON tasks
    FOR EACH ROW EXECUTE FUNCTION create_task_status_notification();

-- Enable Row Level Security (RLS) for all task tables
ALTER TABLE task_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_time_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for task_groups
-- Users can view groups they are members of or created
CREATE POLICY "Users can view groups they belong to" ON task_groups
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM task_group_members tgm
            WHERE tgm.group_id = task_groups.id
            AND tgm.employee_id IN (
                SELECT id FROM employees WHERE user_id = auth.uid()
            )
        )
        OR created_by = auth.uid()
    );

-- Users can create groups
CREATE POLICY "Authenticated users can create groups" ON task_groups
    FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

-- Users can update groups they own or are admin of
CREATE POLICY "Users can update groups they own" ON task_groups
    FOR UPDATE
    USING (
        created_by = auth.uid()
        OR EXISTS (
            SELECT 1 FROM task_group_members tgm
            WHERE tgm.group_id = task_groups.id
            AND tgm.employee_id IN (
                SELECT id FROM employees WHERE user_id = auth.uid()
            )
            AND tgm.role IN ('owner', 'admin')
        )
    );

-- RLS Policies for task_group_members
-- Users can view members of groups they belong to
CREATE POLICY "Users can view group members" ON task_group_members
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM task_group_members tgm2
            WHERE tgm2.group_id = task_group_members.group_id
            AND tgm2.employee_id IN (
                SELECT id FROM employees WHERE user_id = auth.uid()
            )
        )
    );

-- Group owners/admins can add members
CREATE POLICY "Group admins can add members" ON task_group_members
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM task_group_members tgm
            WHERE tgm.group_id = task_group_members.group_id
            AND tgm.employee_id IN (
                SELECT id FROM employees WHERE user_id = auth.uid()
            )
            AND tgm.role IN ('owner', 'admin')
        )
    );

-- Group owners/admins can remove members
CREATE POLICY "Group admins can remove members" ON task_group_members
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM task_group_members tgm
            WHERE tgm.group_id = task_group_members.group_id
            AND tgm.employee_id IN (
                SELECT id FROM employees WHERE user_id = auth.uid()
            )
            AND tgm.role IN ('owner', 'admin')
        )
    );

-- RLS Policies for tasks
-- Users can view tasks they created, are assigned to, or belong to the same group
CREATE POLICY "Users can view relevant tasks" ON tasks
    FOR SELECT
    USING (
        created_by = auth.uid()
        OR assigned_to IN (
            SELECT id FROM employees WHERE user_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM task_assignments ta
            WHERE ta.task_id = tasks.id
            AND ta.assigned_to IN (
                SELECT id FROM employees WHERE user_id = auth.uid()
            )
        )
        OR (
            group_id IS NOT NULL
            AND EXISTS (
                SELECT 1 FROM task_group_members tgm
                WHERE tgm.group_id = tasks.group_id
                AND tgm.employee_id IN (
                    SELECT id FROM employees WHERE user_id = auth.uid()
                )
            )
        )
    );

-- Authenticated users can create tasks
CREATE POLICY "Authenticated users can create tasks" ON tasks
    FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

-- Users can update tasks they created or are assigned to
CREATE POLICY "Users can update relevant tasks" ON tasks
    FOR UPDATE
    USING (
        created_by = auth.uid()
        OR assigned_to IN (
            SELECT id FROM employees WHERE user_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM task_assignments ta
            WHERE ta.task_id = tasks.id
            AND ta.assigned_to IN (
                SELECT id FROM employees WHERE user_id = auth.uid()
            )
        )
        OR (
            group_id IS NOT NULL
            AND EXISTS (
                SELECT 1 FROM task_group_members tgm
                WHERE tgm.group_id = tasks.group_id
                AND tgm.employee_id IN (
                    SELECT id FROM employees WHERE user_id = auth.uid()
                )
                AND tgm.role IN ('owner', 'admin')
            )
        )
    );

-- Users can delete tasks they created
CREATE POLICY "Users can delete their own tasks" ON tasks
    FOR DELETE
    USING (created_by = auth.uid());

-- RLS Policies for task_assignments
-- Users can view assignments for tasks they can see
CREATE POLICY "Users can view relevant assignments" ON task_assignments
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM tasks t
            WHERE t.id = task_assignments.task_id
            AND (
                t.created_by = auth.uid()
                OR t.assigned_to IN (
                    SELECT id FROM employees WHERE user_id = auth.uid()
                )
                OR task_assignments.assigned_to IN (
                    SELECT id FROM employees WHERE user_id = auth.uid()
                )
            )
        )
    );

-- Task creators can create assignments
CREATE POLICY "Task creators can create assignments" ON task_assignments
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM tasks t
            WHERE t.id = task_assignments.task_id
            AND t.created_by = auth.uid()
        )
    );

-- RLS Policies for task_comments
-- Users can view comments for tasks they can see
CREATE POLICY "Users can view relevant comments" ON task_comments
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM tasks t
            WHERE t.id = task_comments.task_id
            AND (
                t.created_by = auth.uid()
                OR t.assigned_to IN (
                    SELECT id FROM employees WHERE user_id = auth.uid()
                )
                OR EXISTS (
                    SELECT 1 FROM task_assignments ta
                    WHERE ta.task_id = t.id
                    AND ta.assigned_to IN (
                        SELECT id FROM employees WHERE user_id = auth.uid()
                    )
                )
            )
        )
    );

-- Authenticated users can create comments
CREATE POLICY "Authenticated users can create comments" ON task_comments
    FOR INSERT
    WITH CHECK (
        auth.uid() IS NOT NULL
        AND EXISTS (
            SELECT 1 FROM tasks t
            WHERE t.id = task_comments.task_id
            AND (
                t.created_by = auth.uid()
                OR t.assigned_to IN (
                    SELECT id FROM employees WHERE user_id = auth.uid()
                )
                OR EXISTS (
                    SELECT 1 FROM task_assignments ta
                    WHERE ta.task_id = t.id
                    AND ta.assigned_to IN (
                        SELECT id FROM employees WHERE user_id = auth.uid()
                    )
                )
            )
        )
    );

-- Users can update their own comments
CREATE POLICY "Users can update their own comments" ON task_comments
    FOR UPDATE
    USING (user_id = auth.uid());

-- Users can delete their own comments
CREATE POLICY "Users can delete their own comments" ON task_comments
    FOR DELETE
    USING (user_id = auth.uid());

-- RLS Policies for task_attachments
-- Users can view attachments for tasks they can see
CREATE POLICY "Users can view relevant attachments" ON task_attachments
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM tasks t
            WHERE t.id = task_attachments.task_id
            AND (
                t.created_by = auth.uid()
                OR t.assigned_to IN (
                    SELECT id FROM employees WHERE user_id = auth.uid()
                )
                OR EXISTS (
                    SELECT 1 FROM task_assignments ta
                    WHERE ta.task_id = t.id
                    AND ta.assigned_to IN (
                        SELECT id FROM employees WHERE user_id = auth.uid()
                    )
                )
            )
        )
    );

-- Authenticated users can upload attachments
CREATE POLICY "Authenticated users can upload attachments" ON task_attachments
    FOR INSERT
    WITH CHECK (
        auth.uid() IS NOT NULL
        AND EXISTS (
            SELECT 1 FROM tasks t
            WHERE t.id = task_attachments.task_id
            AND (
                t.created_by = auth.uid()
                OR t.assigned_to IN (
                    SELECT id FROM employees WHERE user_id = auth.uid()
                )
                OR EXISTS (
                    SELECT 1 FROM task_assignments ta
                    WHERE ta.task_id = t.id
                    AND ta.assigned_to IN (
                        SELECT id FROM employees WHERE user_id = auth.uid()
                    )
                )
            )
        )
    );

-- Users can delete attachments they uploaded
CREATE POLICY "Users can delete their own attachments" ON task_attachments
    FOR DELETE
    USING (uploaded_by = auth.uid());

-- RLS Policies for task_participants
CREATE POLICY "Users can view participants for visible tasks" ON task_participants
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM tasks t
            WHERE t.id = task_participants.task_id
            AND (
                t.created_by = auth.uid()
                OR t.assigned_to IN (SELECT id FROM employees WHERE user_id = auth.uid())
                OR EXISTS (
                    SELECT 1 FROM task_group_members tgm
                    WHERE tgm.group_id = t.group_id
                    AND tgm.employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid())
                )
            )
        )
    );

CREATE POLICY "Task owners can add participants" ON task_participants
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM tasks t
            WHERE t.id = task_participants.task_id
            AND (
                t.created_by = auth.uid()
                OR EXISTS (
                    SELECT 1 FROM task_group_members tgm
                    WHERE tgm.group_id = t.group_id
                    AND tgm.employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid())
                    AND tgm.role IN ('owner', 'admin')
                )
            )
        )
    );

CREATE POLICY "Task owners can remove participants" ON task_participants
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM tasks t
            WHERE t.id = task_participants.task_id
            AND (
                t.created_by = auth.uid()
                OR EXISTS (
                    SELECT 1 FROM task_group_members tgm
                    WHERE tgm.group_id = t.group_id
                    AND tgm.employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid())
                    AND tgm.role IN ('owner', 'admin')
                )
            )
        )
    );

-- RLS Policies for task_checklists
CREATE POLICY "Users can view checklists for visible tasks" ON task_checklists
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM tasks t
            WHERE t.id = task_checklists.task_id
            AND (
                t.created_by = auth.uid()
                OR t.assigned_to IN (SELECT id FROM employees WHERE user_id = auth.uid())
                OR EXISTS (
                    SELECT 1 FROM task_assignments ta
                    WHERE ta.task_id = t.id
                    AND ta.assigned_to IN (SELECT id FROM employees WHERE user_id = auth.uid())
                )
            )
        )
    );

CREATE POLICY "Task collaborators can create checklists" ON task_checklists
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM tasks t
            WHERE t.id = task_checklists.task_id
            AND (
                t.created_by = auth.uid()
                OR t.assigned_to IN (SELECT id FROM employees WHERE user_id = auth.uid())
            )
        )
    );

CREATE POLICY "Task collaborators can update checklists" ON task_checklists
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM tasks t
            WHERE t.id = task_checklists.task_id
            AND (
                t.created_by = auth.uid()
                OR t.assigned_to IN (SELECT id FROM employees WHERE user_id = auth.uid())
            )
        )
    );

CREATE POLICY "Task collaborators can delete checklists" ON task_checklists
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM tasks t
            WHERE t.id = task_checklists.task_id
            AND (
                t.created_by = auth.uid()
                OR t.assigned_to IN (SELECT id FROM employees WHERE user_id = auth.uid())
            )
        )
    );

-- RLS Policies for task_checklist_items
CREATE POLICY "Users can view checklist items for visible tasks" ON task_checklist_items
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM task_checklists tc
            JOIN tasks t ON t.id = tc.task_id
            WHERE tc.id = task_checklist_items.checklist_id
            AND (
                t.created_by = auth.uid()
                OR t.assigned_to IN (SELECT id FROM employees WHERE user_id = auth.uid())
                OR EXISTS (
                    SELECT 1 FROM task_assignments ta
                    WHERE ta.task_id = t.id
                    AND ta.assigned_to IN (SELECT id FROM employees WHERE user_id = auth.uid())
                )
            )
        )
    );

CREATE POLICY "Task collaborators can manage checklist items" ON task_checklist_items
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM task_checklists tc
            JOIN tasks t ON t.id = tc.task_id
            WHERE tc.id = task_checklist_items.checklist_id
            AND (
                t.created_by = auth.uid()
                OR t.assigned_to IN (SELECT id FROM employees WHERE user_id = auth.uid())
            )
        )
    );

CREATE POLICY "Task collaborators can update checklist items" ON task_checklist_items
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM task_checklists tc
            JOIN tasks t ON t.id = tc.task_id
            WHERE tc.id = task_checklist_items.checklist_id
            AND (
                t.created_by = auth.uid()
                OR t.assigned_to IN (SELECT id FROM employees WHERE user_id = auth.uid())
            )
        )
    );

CREATE POLICY "Task collaborators can delete checklist items" ON task_checklist_items
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM task_checklists tc
            JOIN tasks t ON t.id = tc.task_id
            WHERE tc.id = task_checklist_items.checklist_id
            AND (
                t.created_by = auth.uid()
                OR t.assigned_to IN (SELECT id FROM employees WHERE user_id = auth.uid())
            )
        )
    );

-- RLS Policies for task_time_logs
CREATE POLICY "Users can view time logs for visible tasks" ON task_time_logs
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM tasks t
            WHERE t.id = task_time_logs.task_id
            AND (
                t.created_by = auth.uid()
                OR t.assigned_to IN (SELECT id FROM employees WHERE user_id = auth.uid())
                OR EXISTS (
                    SELECT 1 FROM task_assignments ta
                    WHERE ta.task_id = t.id
                    AND ta.assigned_to IN (SELECT id FROM employees WHERE user_id = auth.uid())
                )
            )
        )
    );

CREATE POLICY "Task collaborators can create time logs" ON task_time_logs
    FOR INSERT
    WITH CHECK (
        auth.uid() IS NOT NULL
        AND EXISTS (
            SELECT 1 FROM tasks t
            WHERE t.id = task_time_logs.task_id
            AND (
                t.created_by = auth.uid()
                OR t.assigned_to IN (SELECT id FROM employees WHERE user_id = auth.uid())
                OR EXISTS (
                    SELECT 1 FROM task_assignments ta
                    WHERE ta.task_id = t.id
                    AND ta.assigned_to IN (SELECT id FROM employees WHERE user_id = auth.uid())
                )
            )
        )
    );

CREATE POLICY "Users can update their own time logs" ON task_time_logs
    FOR UPDATE
    USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own time logs" ON task_time_logs
    FOR DELETE
    USING (user_id = auth.uid());

-- RLS Policies for task_notifications
-- Users can only view their own notifications
CREATE POLICY "Users can view their own notifications" ON task_notifications
    FOR SELECT
    USING (user_id = auth.uid());

-- System can create notifications (handled by triggers)
CREATE POLICY "System can create notifications" ON task_notifications
    FOR INSERT
    WITH CHECK (true);

-- Users can update their own notifications
CREATE POLICY "Users can update their own notifications" ON task_notifications
    FOR UPDATE
    USING (user_id = auth.uid());

