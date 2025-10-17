-- Employee Feedbacks table
-- Tracks feedback given about or to employees by managers/admins

create table if not exists employee_feedbacks (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null,
  given_by uuid not null, -- employee id or user id of the person giving feedback
  title text not null,
  content text not null,
  category text check (category in ('performance','behavior','attendance','kudos','other')) default 'other',
  rating int check (rating between 1 and 5),
  is_public boolean not null default false, -- visible to the employee
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

-- Helpful indexes
create index if not exists idx_employee_feedbacks_employee_id on employee_feedbacks(employee_id);
create index if not exists idx_employee_feedbacks_given_by on employee_feedbacks(given_by);
create index if not exists idx_employee_feedbacks_created_at on employee_feedbacks(created_at desc);

-- Optional foreign keys if tables exist
-- alter table employee_feedbacks add constraint fk_feedback_employee foreign key (employee_id) references employees(id) on delete cascade;
-- alter table employee_feedbacks add constraint fk_feedback_given_by foreign key (given_by) references employees(id) on delete set null;


