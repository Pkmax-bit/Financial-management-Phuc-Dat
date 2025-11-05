-- Migration: Add custom payment terms and additional notes to email_logs table
-- This allows tracking email edit history for quotes

-- Add columns to store custom email content
ALTER TABLE email_logs
ADD COLUMN IF NOT EXISTS custom_payment_terms JSONB,
ADD COLUMN IF NOT EXISTS additional_notes TEXT,
ADD COLUMN IF NOT EXISTS edited_by UUID,
ADD COLUMN IF NOT EXISTS edited_at TIMESTAMP WITH TIME ZONE;

-- Add foreign key constraint for edited_by
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'email_logs_edited_by_fkey'
    ) THEN
        ALTER TABLE email_logs
        ADD CONSTRAINT email_logs_edited_by_fkey 
        FOREIGN KEY (edited_by) REFERENCES users(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Add comment for documentation
COMMENT ON COLUMN email_logs.custom_payment_terms IS 'Custom payment terms (term1, term2, term3) used when sending quote email';
COMMENT ON COLUMN email_logs.additional_notes IS 'Additional notes added to quote email';
COMMENT ON COLUMN email_logs.edited_by IS 'User who edited/sent the email';
COMMENT ON COLUMN email_logs.edited_at IS 'Timestamp when email was edited/sent';

-- Create indexes for better query performance (if not exist)
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON email_logs(status);
CREATE INDEX IF NOT EXISTS idx_email_logs_entity ON email_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_sent_at ON email_logs(sent_at DESC);

