-- Enable uuid-ossp extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop tables if they exist to allow recreation during development
DROP VIEW IF EXISTS budget_summary;
DROP TABLE IF EXISTS budget_lines CASCADE;
DROP TABLE IF EXISTS budgets CASCADE;

-- Create budgets table
CREATE TABLE IF NOT EXISTS budgets (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    budget_name VARCHAR(255) NOT NULL,
    period VARCHAR(20) NOT NULL, -- 'monthly', 'quarterly', 'yearly'
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    budget_lines JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of budget line items
    total_budget_amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
    currency VARCHAR(3) NOT NULL DEFAULT 'VND',
    status VARCHAR(20) NOT NULL DEFAULT 'draft', -- 'draft', 'active', 'closed'
    description TEXT,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create budget_lines table for detailed budget line items
CREATE TABLE IF NOT EXISTS budget_lines (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    budget_id UUID NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
    expense_category VARCHAR(100) NOT NULL, -- 'travel', 'meals', 'office_supplies', etc.
    expense_category_name VARCHAR(255) NOT NULL,
    budgeted_amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
    actual_amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
    variance_amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
    variance_percentage NUMERIC(5, 2) NOT NULL DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_budgets_period ON budgets(period);
CREATE INDEX IF NOT EXISTS idx_budgets_start_date ON budgets(start_date);
CREATE INDEX IF NOT EXISTS idx_budgets_end_date ON budgets(end_date);
CREATE INDEX IF NOT EXISTS idx_budgets_status ON budgets(status);
CREATE INDEX IF NOT EXISTS idx_budgets_created_by ON budgets(created_by);
CREATE INDEX IF NOT EXISTS idx_budget_lines_budget_id ON budget_lines(budget_id);
CREATE INDEX IF NOT EXISTS idx_budget_lines_category ON budget_lines(expense_category);

-- Add comments for clarity
COMMENT ON TABLE budgets IS 'Budget management for expense control';
COMMENT ON COLUMN budgets.budget_name IS 'Name of the budget (e.g., "Q1 2024 Budget")';
COMMENT ON COLUMN budgets.period IS 'Budget period type (monthly, quarterly, yearly)';
COMMENT ON COLUMN budgets.budget_lines IS 'JSON array of budget line items (for quick access)';
COMMENT ON COLUMN budgets.total_budget_amount IS 'Total budgeted amount across all categories';
COMMENT ON COLUMN budgets.status IS 'Current status of the budget (draft, active, closed)';
COMMENT ON COLUMN budgets.approved_by IS 'User who approved this budget';
COMMENT ON COLUMN budgets.approved_at IS 'Timestamp when the budget was approved';
COMMENT ON TABLE budget_lines IS 'Detailed budget line items for each category';
COMMENT ON COLUMN budget_lines.expense_category IS 'Category of expense (travel, meals, office_supplies, etc.)';
COMMENT ON COLUMN budget_lines.budgeted_amount IS 'Planned budget amount for this category';
COMMENT ON COLUMN budget_lines.actual_amount IS 'Actual spent amount for this category';
COMMENT ON COLUMN budget_lines.variance_amount IS 'Difference between budgeted and actual (actual - budgeted)';
COMMENT ON COLUMN budget_lines.variance_percentage IS 'Variance as percentage ((actual - budgeted) / budgeted * 100)';

-- Create a view to summarize budget information
CREATE OR REPLACE VIEW budget_summary AS
SELECT
    b.id,
    b.budget_name,
    b.period,
    b.start_date,
    b.end_date,
    b.total_budget_amount,
    b.currency,
    b.status,
    b.description,
    b.created_by,
    creator.email AS created_by_email,
    creator.raw_user_meta_data->>'full_name' AS created_by_name,
    b.approved_by,
    approver.email AS approved_by_email,
    approver.raw_user_meta_data->>'full_name' AS approved_by_name,
    b.approved_at,
    b.created_at,
    b.updated_at,
    COUNT(bl.id) AS line_count,
    SUM(bl.actual_amount) AS total_actual_amount,
    SUM(bl.variance_amount) AS total_variance_amount
FROM
    budgets b
LEFT JOIN
    auth.users creator ON b.created_by = creator.id
LEFT JOIN
    auth.users approver ON b.approved_by = approver.id
LEFT JOIN
    budget_lines bl ON b.id = bl.budget_id
GROUP BY
    b.id, b.budget_name, b.period, b.start_date, b.end_date, b.total_budget_amount, 
    b.currency, b.status, b.description, b.created_by, creator.email, creator.raw_user_meta_data,
    b.approved_by, approver.email, approver.raw_user_meta_data, b.approved_at, b.created_at, b.updated_at;

-- Create a function to generate budget numbers
CREATE OR REPLACE FUNCTION generate_budget_number()
RETURNS TEXT AS $$
DECLARE
    new_number TEXT;
    counter INTEGER;
BEGIN
    -- Get the next counter for today
    SELECT COALESCE(MAX(CAST(SUBSTRING(budget_name FROM 8) AS INTEGER)), 0) + 1
    INTO counter
    FROM budgets
    WHERE budget_name LIKE 'BUDGET-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-%';
    
    -- Format: BUDGET-YYYYMMDD-XXX
    new_number := 'BUDGET-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || LPAD(counter::TEXT, 3, '0');
    
    RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to automatically generate budget numbers
CREATE OR REPLACE FUNCTION set_budget_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.budget_name IS NULL OR NEW.budget_name = '' THEN
        NEW.budget_name := generate_budget_number();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_budget_number
    BEFORE INSERT ON budgets
    FOR EACH ROW
    EXECUTE FUNCTION set_budget_number();

-- Create a trigger to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_budget_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_budget_updated_at
    BEFORE UPDATE ON budgets
    FOR EACH ROW
    EXECUTE FUNCTION update_budget_updated_at();

-- Create a function to calculate budget variance
CREATE OR REPLACE FUNCTION calculate_budget_variance(budget_id UUID)
RETURNS TABLE (
    expense_category VARCHAR(100),
    budgeted_amount NUMERIC(15, 2),
    actual_amount NUMERIC(15, 2),
    variance_amount NUMERIC(15, 2),
    variance_percentage NUMERIC(5, 2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        bl.expense_category,
        bl.budgeted_amount,
        bl.actual_amount,
        bl.variance_amount,
        bl.variance_percentage
    FROM budget_lines bl
    WHERE bl.budget_id = calculate_budget_variance.budget_id
    ORDER BY bl.variance_amount DESC;
END;
$$ LANGUAGE plpgsql;

-- Create a function to get budget statistics
CREATE OR REPLACE FUNCTION get_budget_stats(
    start_date DATE DEFAULT NULL,
    end_date DATE DEFAULT NULL,
    period VARCHAR(20) DEFAULT NULL
)
RETURNS TABLE (
    total_budgets INTEGER,
    total_budgeted_amount NUMERIC(15, 2),
    total_actual_amount NUMERIC(15, 2),
    total_variance_amount NUMERIC(15, 2),
    active_budgets INTEGER,
    draft_budgets INTEGER,
    closed_budgets INTEGER,
    by_period JSONB,
    by_status JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(*)::INTEGER as total_budgets,
        COALESCE(SUM(b.total_budget_amount), 0) as total_budgeted_amount,
        COALESCE(SUM(bl.actual_amount), 0) as total_actual_amount,
        COALESCE(SUM(bl.variance_amount), 0) as total_variance_amount,
        COUNT(CASE WHEN b.status = 'active' THEN 1 END)::INTEGER as active_budgets,
        COUNT(CASE WHEN b.status = 'draft' THEN 1 END)::INTEGER as draft_budgets,
        COUNT(CASE WHEN b.status = 'closed' THEN 1 END)::INTEGER as closed_budgets,
        jsonb_object_agg(b.period, period_count) as by_period,
        jsonb_object_agg(b.status, status_count) as by_status
    FROM (
        SELECT 
            b.*,
            COUNT(*) OVER (PARTITION BY b.period) as period_count,
            COUNT(*) OVER (PARTITION BY b.status) as status_count
        FROM budgets b
        WHERE (start_date IS NULL OR b.start_date >= start_date)
        AND (end_date IS NULL OR b.end_date <= end_date)
        AND (period IS NULL OR b.period = period)
    ) b
    LEFT JOIN budget_lines bl ON b.id = bl.budget_id;
END;
$$ LANGUAGE plpgsql;

-- Create a function to update actual amounts from expenses
CREATE OR REPLACE FUNCTION update_budget_actual_amounts(budget_id UUID)
RETURNS VOID AS $$
DECLARE
    budget_record RECORD;
    expense_category VARCHAR(100);
    actual_amount NUMERIC(15, 2);
BEGIN
    -- Get budget details
    SELECT * INTO budget_record FROM budgets WHERE id = budget_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Budget not found';
    END IF;
    
    -- Update actual amounts for each budget line
    FOR expense_category IN 
        SELECT DISTINCT expense_category FROM budget_lines WHERE budget_id = update_budget_actual_amounts.budget_id
    LOOP
        -- Calculate actual amount from expenses and bills within budget period
        SELECT COALESCE(SUM(amount), 0) INTO actual_amount
        FROM (
            SELECT amount FROM expenses 
            WHERE expense_category = update_budget_actual_amounts.expense_category
            AND expense_date BETWEEN budget_record.start_date AND budget_record.end_date
            UNION ALL
            SELECT total_amount FROM bills 
            WHERE status IN ('paid', 'partial')
            AND issue_date BETWEEN budget_record.start_date AND budget_record.end_date
        ) combined_expenses;
        
        -- Update budget line with actual amount and calculate variance
        UPDATE budget_lines 
        SET 
            actual_amount = actual_amount,
            variance_amount = actual_amount - budgeted_amount,
            variance_percentage = CASE 
                WHEN budgeted_amount > 0 THEN ((actual_amount - budgeted_amount) / budgeted_amount) * 100
                ELSE 0
            END,
            updated_at = NOW()
        WHERE budget_id = update_budget_actual_amounts.budget_id 
        AND expense_category = update_budget_actual_amounts.expense_category;
    END LOOP;
END;
$$ LANGUAGE plpgsql;
