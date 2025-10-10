-- Project Expenses table schema
-- Stores expenses specifically tied to projects and customers

create table if not exists project_expenses (
  id uuid primary key,
  expense_code text,
  description text not null,
  amount numeric(18,2) not null default 0,
  currency text default 'VND',
  expense_date date not null,
  status text default 'pending',
  notes text,
  receipt_url text,

  -- Relations
  project_id uuid references projects(id) on delete set null,
  customer_id uuid references customers(id) on delete set null,

  -- Audit
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_project_expenses_project on project_expenses(project_id);
create index if not exists idx_project_expenses_customer on project_expenses(customer_id);
create index if not exists idx_project_expenses_date on project_expenses(expense_date);


