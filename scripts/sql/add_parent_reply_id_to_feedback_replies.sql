-- Add parent_reply_id column to system_feedback_replies for threaded replies
-- This allows replies to be nested (reply to a reply)

alter table system_feedback_replies 
add column if not exists parent_reply_id uuid;

-- Add foreign key constraint for parent_reply_id
do $$
begin
    if not exists (
        select 1 from information_schema.table_constraints 
        where constraint_name = 'fk_system_feedback_replies_parent_reply_id'
    ) then
        alter table system_feedback_replies 
        add constraint fk_system_feedback_replies_parent_reply_id 
        foreign key (parent_reply_id) references system_feedback_replies(id) on delete cascade;
    end if;
end $$;

-- Add index for better performance when querying child replies
create index if not exists idx_system_feedback_replies_parent_reply_id 
  on system_feedback_replies(parent_reply_id);

-- Add comment
comment on column system_feedback_replies.parent_reply_id is 'Reference to parent reply for threaded/nested replies. NULL means it is a top-level reply to the feedback.';

