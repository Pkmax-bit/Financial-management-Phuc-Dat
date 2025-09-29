-- Create credit_memos table
CREATE TABLE IF NOT EXISTS credit_memos (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    credit_memo_number VARCHAR(50) UNIQUE NOT NULL,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    original_invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
    issue_date DATE NOT NULL,
    returned_items JSONB NOT NULL DEFAULT '[]',
    subtotal NUMERIC(15, 2) NOT NULL DEFAULT 0,
    tax_rate NUMERIC(5, 2) NOT NULL DEFAULT 0,
    tax_amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
    discount_amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
    total_amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
    currency VARCHAR(3) NOT NULL DEFAULT 'VND',
    status VARCHAR(20) NOT NULL DEFAULT 'open',
    reason TEXT,
    applied_amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
    remaining_amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
    applied_to_invoices JSONB DEFAULT '[]',
    refund_amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
    notes TEXT,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create credit_memo_applications table to track applications
CREATE TABLE IF NOT EXISTS credit_memo_applications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    credit_memo_id UUID NOT NULL REFERENCES credit_memos(id) ON DELETE CASCADE,
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    applied_amount NUMERIC(15, 2) NOT NULL,
    applied_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    notes TEXT,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create credit_memo_refunds table to track refunds
CREATE TABLE IF NOT EXISTS credit_memo_refunds (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    credit_memo_id UUID NOT NULL REFERENCES credit_memos(id) ON DELETE CASCADE,
    refund_amount NUMERIC(15, 2) NOT NULL,
    refund_method VARCHAR(50) NOT NULL,
    refund_reference VARCHAR(100),
    refund_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    notes TEXT,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_credit_memos_customer ON credit_memos(customer_id);
CREATE INDEX IF NOT EXISTS idx_credit_memos_invoice ON credit_memos(original_invoice_id);
CREATE INDEX IF NOT EXISTS idx_credit_memos_status ON credit_memos(status);
CREATE INDEX IF NOT EXISTS idx_credit_memos_date ON credit_memos(issue_date);
CREATE INDEX IF NOT EXISTS idx_credit_memo_applications_credit_memo ON credit_memo_applications(credit_memo_id);
CREATE INDEX IF NOT EXISTS idx_credit_memo_applications_invoice ON credit_memo_applications(invoice_id);
CREATE INDEX IF NOT EXISTS idx_credit_memo_refunds_credit_memo ON credit_memo_refunds(credit_memo_id);

-- Add constraints
ALTER TABLE credit_memos ADD CONSTRAINT chk_credit_memos_amounts 
    CHECK (total_amount >= 0 AND applied_amount >= 0 AND remaining_amount >= 0);

ALTER TABLE credit_memos ADD CONSTRAINT chk_credit_memos_remaining 
    CHECK (remaining_amount = total_amount - applied_amount - refund_amount);

-- Add comments
COMMENT ON TABLE credit_memos IS 'Credit memos for returns and allowances';
COMMENT ON TABLE credit_memo_applications IS 'Applications of credit memos to invoices';
COMMENT ON TABLE credit_memo_refunds IS 'Refunds issued for credit memos';
COMMENT ON COLUMN credit_memos.returned_items IS 'JSON array of returned items with details';
COMMENT ON COLUMN credit_memos.applied_to_invoices IS 'JSON array of invoice IDs this credit memo was applied to';
COMMENT ON COLUMN credit_memos.remaining_amount IS 'Amount remaining to be applied or refunded';

-- Create a view for credit memo summary
CREATE OR REPLACE VIEW credit_memo_summary AS
SELECT 
    cm.id,
    cm.credit_memo_number,
    cm.customer_id,
    c.name as customer_name,
    cm.original_invoice_id,
    i.invoice_number as original_invoice_number,
    cm.issue_date,
    cm.total_amount,
    cm.applied_amount,
    cm.refund_amount,
    cm.remaining_amount,
    cm.status,
    cm.reason,
    cm.created_at,
    cm.updated_at,
    -- Count applications
    (SELECT COUNT(*) FROM credit_memo_applications cma WHERE cma.credit_memo_id = cm.id) as application_count,
    -- Count refunds
    (SELECT COUNT(*) FROM credit_memo_refunds cmr WHERE cmr.credit_memo_id = cm.id) as refund_count
FROM credit_memos cm
LEFT JOIN customers c ON cm.customer_id = c.id
LEFT JOIN invoices i ON cm.original_invoice_id = i.id;
