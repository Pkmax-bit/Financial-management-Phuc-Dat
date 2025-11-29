-- Migration: Add payment time (hour and minute) to payments table
-- Description: Changes payment_date from DATE to TIMESTAMP to store date and time
-- Date: 2025-01-XX

-- Change payment_date from DATE to TIMESTAMP WITH TIME ZONE
-- This allows storing both date and time (hour, minute, second)
DO $$
BEGIN
    -- Check if payment_date column exists and is DATE type
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'payments' 
        AND column_name = 'payment_date'
        AND data_type = 'date'
    ) THEN
        -- Convert DATE to TIMESTAMP WITH TIME ZONE
        -- Existing dates will be converted to midnight (00:00:00)
        ALTER TABLE payments 
        ALTER COLUMN payment_date TYPE TIMESTAMP WITH TIME ZONE 
        USING payment_date::timestamp with time zone;
        
        -- Add comment
        COMMENT ON COLUMN payments.payment_date IS 'Date and time of payment (includes hour, minute, second)';
    END IF;
END $$;

