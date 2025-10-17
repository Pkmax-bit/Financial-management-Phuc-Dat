-- Create notifications table for employee notifications
create table if not exists public.notifications (
  id uuid not null default extensions.uuid_generate_v4 (),
  user_id uuid null,
  title character varying(255) not null,
  message text not null,
  type character varying(50) not null,
  entity_type character varying(50) null,
  entity_id uuid null,
  is_read boolean null default false,
  read_at timestamp with time zone null,
  action_url text null,
  created_at timestamp with time zone null default now(),
  constraint notifications_pkey primary key (id),
  constraint notifications_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE
) TABLESPACE pg_default;

-- Create indexes for better performance
create index IF not exists idx_notifications_user_id on public.notifications using btree (user_id) TABLESPACE pg_default;
create index IF not exists idx_notifications_is_read on public.notifications using btree (is_read) TABLESPACE pg_default;
create index IF not exists idx_notifications_created_at on public.notifications using btree (created_at) TABLESPACE pg_default;

-- Enable RLS
alter table public.notifications enable row level security;

-- Create RLS policies
create policy "Users can view their own notifications" on public.notifications
  for select using (auth.uid() = user_id);

create policy "Users can update their own notifications" on public.notifications
  for update using (auth.uid() = user_id);

create policy "System can insert notifications" on public.notifications
  for insert with check (true);

-- Create trigger for updated_at
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger notifications_updated_at
  before update on public.notifications
  for each row execute function public.handle_updated_at();
