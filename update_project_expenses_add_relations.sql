-- Add relational fields to project_expenses: id_parent, employee_id, department_id

alter table if exists project_expenses
  add column if not exists id_parent uuid references project_expenses(id) on delete set null,
  add column if not exists employee_id uuid references employees(id) on delete set null,
  add column if not exists department_id uuid references expense_categories(id) on delete set null;

create index if not exists idx_project_expenses_parent on project_expenses(id_parent);
create index if not exists idx_project_expenses_employee on project_expenses(employee_id);
create index if not exists idx_project_expenses_department on project_expenses(department_id);






