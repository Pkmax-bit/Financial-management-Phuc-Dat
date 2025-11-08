-- Thêm cột expense_object_id vào bảng project_expenses_quote
ALTER TABLE project_expenses_quote 
ADD COLUMN IF NOT EXISTS expense_object_id UUID REFERENCES expense_objects(id);

-- Thêm cột expense_object_id vào bảng project_expenses  
ALTER TABLE project_expenses 
ADD COLUMN IF NOT EXISTS expense_object_id UUID REFERENCES expense_objects(id);

-- Tạo index để tối ưu hóa truy vấn
CREATE INDEX IF NOT EXISTS idx_project_expenses_quote_expense_object_id 
ON project_expenses_quote(expense_object_id);

CREATE INDEX IF NOT EXISTS idx_project_expenses_expense_object_id 
ON project_expenses(expense_object_id);

-- Thêm comment cho các cột
COMMENT ON COLUMN project_expenses_quote.expense_object_id IS 'ID của đối tượng chi phí';
COMMENT ON COLUMN project_expenses.expense_object_id IS 'ID của đối tượng chi phí';
