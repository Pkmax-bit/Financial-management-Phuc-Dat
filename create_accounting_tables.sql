-- Create accounting_entries table
CREATE TABLE IF NOT EXISTS accounting_entries (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    entry_number VARCHAR(50) UNIQUE NOT NULL,
    entry_date TIMESTAMP WITH TIME ZONE NOT NULL,
    description TEXT NOT NULL,
    reference_type VARCHAR(50) NOT NULL,
    reference_id UUID NOT NULL,
    total_debit NUMERIC(15, 2) NOT NULL DEFAULT 0,
    total_credit NUMERIC(15, 2) NOT NULL DEFAULT 0,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create accounting_entry_lines table
CREATE TABLE IF NOT EXISTS accounting_entry_lines (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    entry_id UUID NOT NULL REFERENCES accounting_entries(id) ON DELETE CASCADE,
    account_code VARCHAR(20) NOT NULL,
    account_name VARCHAR(100) NOT NULL,
    debit_amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
    credit_amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_accounting_entries_reference ON accounting_entries(reference_type, reference_id);
CREATE INDEX IF NOT EXISTS idx_accounting_entries_date ON accounting_entries(entry_date);
CREATE INDEX IF NOT EXISTS idx_accounting_entry_lines_entry_id ON accounting_entry_lines(entry_id);
CREATE INDEX IF NOT EXISTS idx_accounting_entry_lines_account_code ON accounting_entry_lines(account_code);

-- Add comments
COMMENT ON TABLE accounting_entries IS 'Accounting journal entries';
COMMENT ON TABLE accounting_entry_lines IS 'Individual lines within accounting journal entries';
COMMENT ON COLUMN accounting_entries.entry_number IS 'Unique entry number (e.g., JE-20250101-001)';
COMMENT ON COLUMN accounting_entries.reference_type IS 'Type of reference (sales_receipt, invoice, payment, etc.)';
COMMENT ON COLUMN accounting_entries.reference_id IS 'ID of the referenced record';
COMMENT ON COLUMN accounting_entry_lines.account_code IS 'Chart of accounts code (e.g., 101, 401)';
COMMENT ON COLUMN accounting_entry_lines.account_name IS 'Account name for display';
