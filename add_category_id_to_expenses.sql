-- Add category_id column to expenses table
ALTER TABLE public.expenses 
ADD COLUMN IF NOT EXISTS category_id uuid;

-- Add foreign key constraint to expense_categories table
ALTER TABLE public.expenses 
ADD CONSTRAINT expenses_category_id_fkey 
FOREIGN KEY (category_id) REFERENCES expense_categories (id) ON DELETE SET NULL;

-- Create index for category_id
CREATE INDEX IF NOT EXISTS idx_expenses_category_id 
ON public.expenses USING btree (category_id) 
TABLESPACE pg_default;

-- Add comment to the new column
COMMENT ON COLUMN public.expenses.category_id IS 'ID of the expense category from expense_categories table';
