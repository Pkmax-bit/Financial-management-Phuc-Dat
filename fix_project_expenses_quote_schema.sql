-- Drop existing foreign key constraint if exists
alter table if exists project_expenses_quote
  drop constraint if exists project_expenses_quote_id_parent_fkey;

-- Add correct foreign key constraint to reference the same table
alter table if exists project_expenses_quote
  add constraint project_expenses_quote_id_parent_fkey 
  foreign key (id_parent) references project_expenses_quote(id) 
  on delete set null;

-- Create index for better performance
create index if not exists idx_project_expenses_quote_parent 
  on project_expenses_quote(id_parent);
