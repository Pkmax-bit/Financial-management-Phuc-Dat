-- Migration: Create payments table for payment history
-- Description: Creates payments table to store payment history for invoices
-- Date: 2025-01-XX

-- Create payment_method enum if not exists
DO $$ BEGIN
    CREATE TYPE payment_method_enum AS ENUM ('cash', 'bank_transfer', 'check', 'card', 'digital_wallet', 'other');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create payment_status_enum if not exists (for payments table)
DO $$ BEGIN
    CREATE TYPE payment_status_enum AS ENUM ('pending', 'completed', 'failed', 'cancelled', 'refunded');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create payments table if not exists
CREATE TABLE IF NOT EXISTS payments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    payment_number VARCHAR(50) UNIQUE NOT NULL,
    invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    amount DECIMAL(12,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'VND',
    payment_date TIMESTAMP WITH TIME ZONE NOT NULL,
    payment_method payment_method_enum NOT NULL DEFAULT 'bank_transfer',
    reference_number VARCHAR(255),
    bank_details TEXT,
    status payment_status_enum DEFAULT 'completed',
    notes TEXT,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    processed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Fix foreign key constraints if they reference wrong table
DO $$
BEGIN
    -- Drop incorrect foreign key constraint if exists (references employees instead of users)
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'payments' 
        AND constraint_name = 'payments_created_by_fkey'
        AND constraint_type = 'FOREIGN KEY'
    ) THEN
        ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_created_by_fkey;
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'payments' 
        AND constraint_name = 'payments_processed_by_fkey'
        AND constraint_type = 'FOREIGN KEY'
    ) THEN
        ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_processed_by_fkey;
    END IF;
    
    -- Recreate correct foreign key constraints (references users, not employees)
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'payments' AND column_name = 'created_by'
    ) THEN
        -- Only add constraint if it doesn't exist
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE table_name = 'payments' 
            AND constraint_name = 'payments_created_by_fkey'
        ) THEN
            ALTER TABLE payments 
            ADD CONSTRAINT payments_created_by_fkey 
            FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;
        END IF;
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'payments' AND column_name = 'processed_by'
    ) THEN
        -- Only add constraint if it doesn't exist
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE table_name = 'payments' 
            AND constraint_name = 'payments_processed_by_fkey'
        ) THEN
            ALTER TABLE payments 
            ADD CONSTRAINT payments_processed_by_fkey 
            FOREIGN KEY (processed_by) REFERENCES users(id) ON DELETE SET NULL;
        END IF;
    END IF;
END $$;

-- Add missing columns if table already exists
DO $$ 
BEGIN
    -- Add status column if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'payments' AND column_name = 'status'
    ) THEN
        ALTER TABLE payments ADD COLUMN status payment_status_enum DEFAULT 'completed';
    END IF;
    
    -- Add currency column if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'payments' AND column_name = 'currency'
    ) THEN
        ALTER TABLE payments ADD COLUMN currency VARCHAR(3) DEFAULT 'VND';
    END IF;
    
    -- Add payment_method column if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'payments' AND column_name = 'payment_method'
    ) THEN
        ALTER TABLE payments ADD COLUMN payment_method payment_method_enum NOT NULL DEFAULT 'bank_transfer';
    END IF;
    
    -- Add reference_number column if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'payments' AND column_name = 'reference_number'
    ) THEN
        ALTER TABLE payments ADD COLUMN reference_number VARCHAR(255);
    END IF;
    
    -- Add bank_details column if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'payments' AND column_name = 'bank_details'
    ) THEN
        ALTER TABLE payments ADD COLUMN bank_details TEXT;
    END IF;
    
    -- Add processed_by column if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'payments' AND column_name = 'processed_by'
    ) THEN
        ALTER TABLE payments ADD COLUMN processed_by UUID REFERENCES users(id) ON DELETE SET NULL;
    END IF;
    
    -- Add processed_at column if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'payments' AND column_name = 'processed_at'
    ) THEN
        ALTER TABLE payments ADD COLUMN processed_at TIMESTAMP WITH TIME ZONE;
    END IF;
    
    -- Add updated_at column if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'payments' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE payments ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- Create indexes for better query performance (only if column exists)
DO $$
BEGIN
    -- Create index on invoice_id if column exists
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'payments' AND column_name = 'invoice_id'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_payments_invoice_id ON payments(invoice_id);
    END IF;
    
    -- Create index on customer_id if column exists
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'payments' AND column_name = 'customer_id'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_payments_customer_id ON payments(customer_id);
    END IF;
    
    -- Create index on payment_date if column exists
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'payments' AND column_name = 'payment_date'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_payments_payment_date ON payments(payment_date);
    END IF;
    
    -- Create index on status if column exists
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'payments' AND column_name = 'status'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
    END IF;
    
    -- Create index on payment_method if column exists
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'payments' AND column_name = 'payment_method'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_payments_payment_method ON payments(payment_method);
    END IF;
    
    -- Create index on created_at if column exists
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'payments' AND column_name = 'created_at'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at DESC);
    END IF;
END $$;

-- Add comments
COMMENT ON TABLE payments IS 'Stores payment history for invoices';
COMMENT ON COLUMN payments.payment_number IS 'Unique payment number/identifier';
COMMENT ON COLUMN payments.invoice_id IS 'Reference to the invoice being paid';
COMMENT ON COLUMN payments.customer_id IS 'Reference to the customer making the payment';
COMMENT ON COLUMN payments.amount IS 'Payment amount';
COMMENT ON COLUMN payments.payment_method IS 'Method of payment (cash, bank_transfer, check, card, digital_wallet, other)';
COMMENT ON COLUMN payments.status IS 'Payment status (pending, completed, failed, cancelled, refunded)';
COMMENT ON COLUMN payments.reference_number IS 'Payment reference number (e.g., bank transaction ID)';
COMMENT ON COLUMN payments.bank_details IS 'Bank account details for the payment';
COMMENT ON COLUMN payments.processed_by IS 'User who processed the payment';
COMMENT ON COLUMN payments.processed_at IS 'Timestamp when payment was processed';

