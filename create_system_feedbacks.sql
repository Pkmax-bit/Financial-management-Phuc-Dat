-- System Feedbacks table
-- For employees to submit feedback about the system (bugs, ideas, UI/UX, performance)

create table if not exists system_feedbacks (
  id uuid primary key default gen_random_uuid(),
  submitted_by uuid not null, -- user/employee id
  title text not null,
  content text not null,
  category text check (category in ('bug','idea','uiux','performance','other')) default 'other',
  priority text check (priority in ('low','medium','high','critical')) default 'medium',
  status text check (status in ('open','in_progress','resolved','closed')) default 'open',
  attachments jsonb, -- optional array of file metadata
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create index if not exists idx_system_feedbacks_submitted_by on system_feedbacks(submitted_by);
create index if not exists idx_system_feedbacks_status on system_feedbacks(status);
create index if not exists idx_system_feedbacks_created_at on system_feedbacks(created_at desc);





