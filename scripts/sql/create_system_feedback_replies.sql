-- System Feedback Replies table
-- For admins/managers to reply to system feedback

create table if not exists system_feedback_replies (
  id uuid primary key default gen_random_uuid(),
  feedback_id uuid not null,
  replied_by uuid not null, -- user id who replied
  content text not null,
  attachments jsonb, -- optional array of file metadata
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  
  -- Foreign key constraints
  constraint fk_system_feedback_replies_feedback_id 
    foreign key (feedback_id) references system_feedbacks(id) on delete cascade,
  constraint fk_system_feedback_replies_replied_by 
    foreign key (replied_by) references users(id) on delete set null
);

-- Indexes for better performance
create index if not exists idx_system_feedback_replies_feedback_id 
  on system_feedback_replies(feedback_id);

create index if not exists idx_system_feedback_replies_replied_by 
  on system_feedback_replies(replied_by);

create index if not exists idx_system_feedback_replies_created_at 
  on system_feedback_replies(created_at desc);

-- Add comment
comment on table system_feedback_replies is 'Replies from admins/managers to system feedback';
comment on column system_feedback_replies.feedback_id is 'Reference to the system feedback being replied to';
comment on column system_feedback_replies.replied_by is 'User ID who replied';
comment on column system_feedback_replies.content is 'Reply content';
comment on column system_feedback_replies.attachments is 'Optional attachments for the reply';


