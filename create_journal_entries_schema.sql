-- Create journal_entries table for double-entry accounting
CREATE TABLE IF NOT EXISTS journal_entries (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    entry_number VARCHAR(50) UNIQUE NOT NULL,
    entry_date TIMESTAMP WITH TIME ZONE NOT NULL,
    description TEXT NOT NULL,
    transaction_type VARCHAR(50) NOT NULL,
    transaction_id UUID NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'posted',
    total_debit NUMERIC(15, 2) NOT NULL DEFAULT 0,
    total_credit NUMERIC(15, 2) NOT NULL DEFAULT 0,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create journal_entry_lines table for individual journal entry lines
CREATE TABLE IF NOT EXISTS journal_entry_lines (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    entry_id UUID NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
    account_code VARCHAR(20) NOT NULL,
    account_name VARCHAR(100) NOT NULL,
    debit_amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
    credit_amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
    description TEXT,
    reference_id UUID,
    reference_type VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_journal_entries_transaction ON journal_entries(transaction_type, transaction_id);
CREATE INDEX IF NOT EXISTS idx_journal_entries_date ON journal_entries(entry_date);
CREATE INDEX IF NOT EXISTS idx_journal_entries_status ON journal_entries(status);
CREATE INDEX IF NOT EXISTS idx_journal_entry_lines_entry_id ON journal_entry_lines(entry_id);
CREATE INDEX IF NOT EXISTS idx_journal_entry_lines_account_code ON journal_entry_lines(account_code);
CREATE INDEX IF NOT EXISTS idx_journal_entry_lines_reference ON journal_entry_lines(reference_type, reference_id);

-- Add comments
COMMENT ON TABLE journal_entries IS 'Double-entry accounting journal entries';
COMMENT ON TABLE journal_entry_lines IS 'Individual lines within journal entries';
COMMENT ON COLUMN journal_entries.entry_number IS 'Unique entry number (e.g., JE-20250101-001)';
COMMENT ON COLUMN journal_entries.transaction_type IS 'Type of transaction (invoice, payment, sales_receipt, etc.)';
COMMENT ON COLUMN journal_entries.transaction_id IS 'ID of the transaction that created this entry';
COMMENT ON COLUMN journal_entries.status IS 'Entry status (draft, posted, reversed)';
COMMENT ON COLUMN journal_entry_lines.account_code IS 'Chart of accounts code (e.g., 101, 131, 511)';
COMMENT ON COLUMN journal_entry_lines.account_name IS 'Account name for display';
COMMENT ON COLUMN journal_entry_lines.debit_amount IS 'Debit amount (must be 0 if credit_amount > 0)';
COMMENT ON COLUMN journal_entry_lines.credit_amount IS 'Credit amount (must be 0 if debit_amount > 0)';

-- Add constraints to ensure double-entry accounting rules
ALTER TABLE journal_entries ADD CONSTRAINT chk_journal_entries_balanced 
    CHECK (total_debit = total_credit);

ALTER TABLE journal_entry_lines ADD CONSTRAINT chk_journal_entry_lines_debit_credit 
    CHECK ((debit_amount > 0 AND credit_amount = 0) OR (debit_amount = 0 AND credit_amount > 0));

-- Create a view for easy reporting
CREATE OR REPLACE VIEW journal_entries_with_lines AS
SELECT 
    je.id,
    je.entry_number,
    je.entry_date,
    je.description,
    je.transaction_type,
    je.transaction_id,
    je.status,
    je.total_debit,
    je.total_credit,
    je.created_by,
    je.created_at,
    je.updated_at,
    json_agg(
        json_build_object(
            'id', jel.id,
            'account_code', jel.account_code,
            'account_name', jel.account_name,
            'debit_amount', jel.debit_amount,
            'credit_amount', jel.credit_amount,
            'description', jel.description,
            'reference_id', jel.reference_id,
            'reference_type', jel.reference_type
        ) ORDER BY jel.created_at
    ) as lines
FROM journal_entries je
LEFT JOIN journal_entry_lines jel ON je.id = jel.entry_id
GROUP BY je.id, je.entry_number, je.entry_date, je.description, 
         je.transaction_type, je.transaction_id, je.status,
         je.total_debit, je.total_credit, je.created_by, 
         je.created_at, je.updated_at;
