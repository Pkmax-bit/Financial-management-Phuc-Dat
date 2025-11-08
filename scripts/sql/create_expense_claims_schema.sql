-- Enable uuid-ossp extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop tables if they exist to allow recreation during development
DROP VIEW IF EXISTS expense_claim_summary;
DROP TABLE IF EXISTS expense_claim_items;
DROP TABLE IF EXISTS expense_claims;

-- Create expense_claims table
CREATE TABLE IF NOT EXISTS expense_claims (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    claim_number VARCHAR(50) UNIQUE NOT NULL,
    employee_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    submission_date DATE NOT NULL,
    description TEXT NOT NULL,
    line_items JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of expense items with receipts
    total_amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
    currency VARCHAR(3) NOT NULL DEFAULT 'VND',
    status VARCHAR(20) NOT NULL DEFAULT 'draft', -- 'draft', 'submitted', 'approved', 'rejected', 'paid'
    notes TEXT,
    rejection_reason TEXT,
    approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    approved_at TIMESTAMP WITH TIME ZONE,
    paid_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    paid_at TIMESTAMP WITH TIME ZONE,
    payment_method VARCHAR(50), -- 'cash', 'bank_transfer', 'check'
    payment_reference VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create expense_claim_items table for detailed line items
CREATE TABLE IF NOT EXISTS expense_claim_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    claim_id UUID NOT NULL REFERENCES expense_claims(id) ON DELETE CASCADE,
    expense_category VARCHAR(100) NOT NULL, -- 'travel', 'meals', 'office_supplies', 'transportation', etc.
    description TEXT NOT NULL,
    expense_date DATE NOT NULL,
    amount NUMERIC(15, 2) NOT NULL,
    receipt_url TEXT, -- URL to uploaded receipt image
    receipt_filename VARCHAR(255),
    receipt_size INTEGER, -- File size in bytes
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_expense_claims_employee_id ON expense_claims(employee_id);
CREATE INDEX IF NOT EXISTS idx_expense_claims_status ON expense_claims(status);
CREATE INDEX IF NOT EXISTS idx_expense_claims_submission_date ON expense_claims(submission_date);
CREATE INDEX IF NOT EXISTS idx_expense_claims_approved_by ON expense_claims(approved_by);
CREATE INDEX IF NOT EXISTS idx_expense_claims_paid_by ON expense_claims(paid_by);
CREATE INDEX IF NOT EXISTS idx_expense_claim_items_claim_id ON expense_claim_items(claim_id);
CREATE INDEX IF NOT EXISTS idx_expense_claim_items_category ON expense_claim_items(expense_category);
CREATE INDEX IF NOT EXISTS idx_expense_claim_items_expense_date ON expense_claim_items(expense_date);

-- Add comments for clarity
COMMENT ON TABLE expense_claims IS 'Employee expense claims for reimbursement';
COMMENT ON COLUMN expense_claims.claim_number IS 'Unique claim number (e.g., EC-20250101-001)';
COMMENT ON COLUMN expense_claims.employee_id IS 'Employee who submitted the claim';
COMMENT ON COLUMN expense_claims.submission_date IS 'Date when the claim was submitted';
COMMENT ON COLUMN expense_claims.line_items IS 'JSON array of expense items with receipts (for quick access)';
COMMENT ON COLUMN expense_claims.status IS 'Current status of the claim (draft, submitted, approved, rejected, paid)';
COMMENT ON COLUMN expense_claims.approved_by IS 'Manager/Admin who approved the claim';
COMMENT ON COLUMN expense_claims.approved_at IS 'Timestamp when the claim was approved';
COMMENT ON COLUMN expense_claims.paid_by IS 'Person who processed the payment';
COMMENT ON COLUMN expense_claims.paid_at IS 'Timestamp when the claim was paid';
COMMENT ON COLUMN expense_claims.payment_method IS 'Method used to pay the claim (cash, bank_transfer, check)';
COMMENT ON COLUMN expense_claims.payment_reference IS 'Reference number for the payment';
COMMENT ON TABLE expense_claim_items IS 'Detailed line items for each expense claim';
COMMENT ON COLUMN expense_claim_items.expense_category IS 'Category of the expense (travel, meals, office_supplies, etc.)';
COMMENT ON COLUMN expense_claim_items.receipt_url IS 'URL to the uploaded receipt image';
COMMENT ON COLUMN expense_claim_items.receipt_filename IS 'Original filename of the receipt';

-- Create a view to summarize expense claim information
CREATE OR REPLACE VIEW expense_claim_summary AS
SELECT
    ec.id,
    ec.claim_number,
    ec.employee_id,
    u.email AS employee_email,
    u.raw_user_meta_data->>'full_name' AS employee_name,
    ec.submission_date,
    ec.description,
    ec.total_amount,
    ec.currency,
    ec.status,
    ec.notes,
    ec.rejection_reason,
    ec.approved_by,
    approver.email AS approved_by_email,
    approver.raw_user_meta_data->>'full_name' AS approved_by_name,
    ec.approved_at,
    ec.paid_by,
    payer.email AS paid_by_email,
    payer.raw_user_meta_data->>'full_name' AS paid_by_name,
    ec.paid_at,
    ec.payment_method,
    ec.payment_reference,
    ec.created_at,
    ec.updated_at,
    COUNT(eci.id) AS item_count
FROM
    expense_claims ec
JOIN
    auth.users u ON ec.employee_id = u.id
LEFT JOIN
    auth.users approver ON ec.approved_by = approver.id
LEFT JOIN
    auth.users payer ON ec.paid_by = payer.id
LEFT JOIN
    expense_claim_items eci ON ec.id = eci.claim_id
GROUP BY
    ec.id, ec.claim_number, ec.employee_id, u.email, u.raw_user_meta_data, 
    ec.submission_date, ec.description, ec.total_amount, ec.currency, ec.status, 
    ec.notes, ec.rejection_reason, ec.approved_by, approver.email, approver.raw_user_meta_data,
    ec.approved_at, ec.paid_by, payer.email, payer.raw_user_meta_data, ec.paid_at, 
    ec.payment_method, ec.payment_reference, ec.created_at, ec.updated_at;

-- Create a function to generate claim numbers
CREATE OR REPLACE FUNCTION generate_claim_number()
RETURNS TEXT AS $$
DECLARE
    new_number TEXT;
    counter INTEGER;
BEGIN
    -- Get the next counter for today
    SELECT COALESCE(MAX(CAST(SUBSTRING(claim_number FROM 12) AS INTEGER)), 0) + 1
    INTO counter
    FROM expense_claims
    WHERE claim_number LIKE 'EC-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-%';
    
    -- Format: EC-YYYYMMDD-XXX
    new_number := 'EC-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || LPAD(counter::TEXT, 3, '0');
    
    RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to automatically generate claim numbers
CREATE OR REPLACE FUNCTION set_claim_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.claim_number IS NULL OR NEW.claim_number = '' THEN
        NEW.claim_number := generate_claim_number();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_claim_number
    BEFORE INSERT ON expense_claims
    FOR EACH ROW
    EXECUTE FUNCTION set_claim_number();

-- Create a trigger to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_expense_claim_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_expense_claim_updated_at
    BEFORE UPDATE ON expense_claims
    FOR EACH ROW
    EXECUTE FUNCTION update_expense_claim_updated_at();

-- Create a function to get expense claim statistics
CREATE OR REPLACE FUNCTION get_expense_claim_stats(
    start_date DATE DEFAULT NULL,
    end_date DATE DEFAULT NULL,
    employee_id UUID DEFAULT NULL
)
RETURNS TABLE (
    total_claims INTEGER,
    total_amount NUMERIC,
    pending_claims INTEGER,
    approved_claims INTEGER,
    rejected_claims INTEGER,
    paid_claims INTEGER,
    by_status JSONB,
    by_category JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(*)::INTEGER as total_claims,
        COALESCE(SUM(ec.total_amount), 0) as total_amount,
        COUNT(CASE WHEN ec.status = 'submitted' THEN 1 END)::INTEGER as pending_claims,
        COUNT(CASE WHEN ec.status = 'approved' THEN 1 END)::INTEGER as approved_claims,
        COUNT(CASE WHEN ec.status = 'rejected' THEN 1 END)::INTEGER as rejected_claims,
        COUNT(CASE WHEN ec.status = 'paid' THEN 1 END)::INTEGER as paid_claims,
        jsonb_object_agg(ec.status, status_count) as by_status,
        jsonb_object_agg(category, category_count) as by_category
    FROM (
        SELECT 
            ec.*,
            COUNT(*) OVER (PARTITION BY ec.status) as status_count
        FROM expense_claims ec
        WHERE (start_date IS NULL OR ec.submission_date >= start_date)
        AND (end_date IS NULL OR ec.submission_date <= end_date)
        AND (employee_id IS NULL OR ec.employee_id = employee_id)
    ) ec
    LEFT JOIN (
        SELECT 
            eci.claim_id,
            eci.expense_category as category,
            COUNT(*) as category_count
        FROM expense_claim_items eci
        GROUP BY eci.claim_id, eci.expense_category
    ) categories ON ec.id = categories.claim_id;
END;
$$ LANGUAGE plpgsql;
