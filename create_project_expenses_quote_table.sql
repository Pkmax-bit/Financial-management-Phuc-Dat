-- Quotes for Project Expenses (planned). Move to project_expenses upon approval

create table if not exists project_expenses_quote (
  id uuid primary key,
  expense_code text,
  description text not null,
  amount numeric(18,2) not null default 0,
  currency text default 'VND',
  expense_date date not null,
  status text default 'pending',
  notes text,
  receipt_url text,

  project_id uuid references projects(id) on delete set null,
  customer_id uuid references customers(id) on delete set null,
  id_parent uuid references project_expenses_quote(id) on delete set null,
  employee_id uuid references employees(id) on delete set null,
  department_id uuid references expense_categories(id) on delete set null,

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_project_expenses_quote_project on project_expenses_quote(project_id);
create index if not exists idx_project_expenses_quote_customer on project_expenses_quote(customer_id);
create index if not exists idx_project_expenses_quote_parent on project_expenses_quote(id_parent);
create index if not exists idx_project_expenses_quote_employee on project_expenses_quote(employee_id);
create index if not exists idx_project_expenses_quote_department on project_expenses_quote(department_id);
create index if not exists idx_project_expenses_quote_date on project_expenses_quote(expense_date);
create index if not exists idx_project_expenses_quote_status on project_expenses_quote(status);








