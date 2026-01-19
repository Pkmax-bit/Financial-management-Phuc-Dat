-- Migration: Add HR_MANAGER role to user_role enum
-- This adds the hr_manager role value to the existing user_role enum type

-- Check if enum value exists before adding
DO $$
BEGIN
    -- Check if 'hr_manager' already exists in the enum
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_enum 
        WHERE enumlabel = 'hr_manager' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
    ) THEN
        -- Add hr_manager to the user_role enum
        ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'hr_manager';
        RAISE NOTICE 'Added hr_manager to user_role enum';
    ELSE
        RAISE NOTICE 'hr_manager already exists in user_role enum';
    END IF;
END $$;

-- Also add other missing roles if they don't exist
DO $$
BEGIN
    -- Add sales if not exists
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_enum 
        WHERE enumlabel = 'sales' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
    ) THEN
        ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'sales';
        RAISE NOTICE 'Added sales to user_role enum';
    END IF;
    
    -- Add accountant if not exists
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_enum 
        WHERE enumlabel = 'accountant' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
    ) THEN
        ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'accountant';
        RAISE NOTICE 'Added accountant to user_role enum';
    END IF;
    
    -- Add workshop_employee if not exists
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_enum 
        WHERE enumlabel = 'workshop_employee' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
    ) THEN
        ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'workshop_employee';
        RAISE NOTICE 'Added workshop_employee to user_role enum';
    END IF;
    
    -- Add worker if not exists
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_enum 
        WHERE enumlabel = 'worker' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
    ) THEN
        ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'worker';
        RAISE NOTICE 'Added worker to user_role enum';
    END IF;
    
    -- Add transport if not exists
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_enum 
        WHERE enumlabel = 'transport' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
    ) THEN
        ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'transport';
        RAISE NOTICE 'Added transport to user_role enum';
    END IF;
    
    -- Add customer if not exists
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_enum 
        WHERE enumlabel = 'customer' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
    ) THEN
        ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'customer';
        RAISE NOTICE 'Added customer to user_role enum';
    END IF;
END $$;
