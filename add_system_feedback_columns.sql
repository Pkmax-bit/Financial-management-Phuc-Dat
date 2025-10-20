-- Add missing columns to system_feedbacks table
-- These columns are needed for the resolve feedback functionality

-- Add admin_notes column for admin to add notes when resolving feedback
alter table system_feedbacks 
add column if not exists admin_notes text;

-- Add resolved_at column to track when feedback was resolved
alter table system_feedbacks 
add column if not exists resolved_at timestamp with time zone;

-- Add resolved_by column to track who resolved the feedback
alter table system_feedbacks 
add column if not exists resolved_by uuid;

-- Add foreign key constraint for resolved_by (only if it doesn't exist)
do $$
begin
    if not exists (
        select 1 from information_schema.table_constraints 
        where constraint_name = 'fk_system_feedbacks_resolved_by'
    ) then
        alter table system_feedbacks 
        add constraint fk_system_feedbacks_resolved_by 
        foreign key (resolved_by) references users(id) on delete set null;
    end if;
end $$;

-- Add index for resolved_by for better performance
create index if not exists idx_system_feedbacks_resolved_by 
on system_feedbacks(resolved_by);

-- Add index for resolved_at for better performance
create index if not exists idx_system_feedbacks_resolved_at 
on system_feedbacks(resolved_at);

-- Update the priority constraint to include both 'urgent' and 'critical' (as used in the frontend)
do $$
begin
    -- Drop existing constraint if it exists
    if exists (
        select 1 from information_schema.table_constraints 
        where constraint_name = 'system_feedbacks_priority_check'
    ) then
        alter table system_feedbacks drop constraint system_feedbacks_priority_check;
    end if;
    
    -- Add new constraint
    alter table system_feedbacks 
    add constraint system_feedbacks_priority_check 
    check (priority in ('low','medium','high','urgent','critical'));
end $$;

-- Add comment to document the table purpose
comment on table system_feedbacks is 'System feedback from employees - bugs, ideas, UI/UX, performance issues';
comment on column system_feedbacks.admin_notes is 'Admin notes when resolving feedback';
comment on column system_feedbacks.resolved_at is 'Timestamp when feedback was resolved';
comment on column system_feedbacks.resolved_by is 'User ID who resolved the feedback';
