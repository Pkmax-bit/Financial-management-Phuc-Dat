-- Add product_service_id column to quote_items table
-- This column links quote_items to products table
-- Safe to run multiple times due to IF NOT EXISTS guards

BEGIN;

-- ============================
-- Add product_service_id column to quote_items
-- ============================
ALTER TABLE IF EXISTS public.quote_items
  ADD COLUMN IF NOT EXISTS product_service_id UUID NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.quote_items.product_service_id IS 'ID của sản phẩm từ bảng products';

-- ============================
-- Add foreign key constraint
-- ============================
-- Drop existing constraint if exists (to avoid errors on re-run)
-- Check if constraint exists and what table it references
DO $$
DECLARE
  constraint_exists boolean;
  referenced_table text;
BEGIN
  -- Check if constraint exists
  SELECT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'quote_items_product_service_id_fkey'
    AND table_name = 'quote_items'
    AND table_schema = 'public'
  ) INTO constraint_exists;
  
  IF constraint_exists THEN
    -- Get the referenced table name
    SELECT 
      ccu.table_name
    INTO referenced_table
    FROM information_schema.table_constraints tc
    JOIN information_schema.constraint_column_usage ccu
      ON tc.constraint_name = ccu.constraint_name
      AND tc.table_schema = ccu.table_schema
    WHERE tc.constraint_name = 'quote_items_product_service_id_fkey'
      AND tc.table_name = 'quote_items'
      AND tc.table_schema = 'public'
      AND tc.constraint_type = 'FOREIGN KEY';
    
    -- Drop the constraint if it exists (regardless of which table it references)
    ALTER TABLE public.quote_items 
    DROP CONSTRAINT quote_items_product_service_id_fkey;
    
    IF referenced_table IS NOT NULL THEN
      RAISE NOTICE 'Dropped existing constraint quote_items_product_service_id_fkey (referenced: %)', referenced_table;
    ELSE
      RAISE NOTICE 'Dropped existing constraint quote_items_product_service_id_fkey';
    END IF;
  END IF;
END $$;

-- Also check for any foreign key constraint on product_service_id that references products_services
-- This handles cases where the constraint might have a different name
DO $$
DECLARE
  constraint_name_var text;
BEGIN
  -- Find any foreign key constraint on product_service_id that references products_services
  SELECT 
    tc.constraint_name
  INTO constraint_name_var
  FROM information_schema.table_constraints tc
  JOIN information_schema.constraint_column_usage ccu
    ON tc.constraint_name = ccu.constraint_name
    AND tc.table_schema = ccu.table_schema
  JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
  WHERE tc.table_name = 'quote_items'
    AND tc.table_schema = 'public'
    AND tc.constraint_type = 'FOREIGN KEY'
    AND kcu.column_name = 'product_service_id'
    AND ccu.table_name = 'products_services';
  
  IF constraint_name_var IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.quote_items DROP CONSTRAINT IF EXISTS %I', constraint_name_var);
    RAISE NOTICE 'Dropped constraint % that incorrectly referenced products_services', constraint_name_var;
  END IF;
END $$;

-- Clean up invalid product_service_id values (set to NULL if product doesn't exist in products table)
UPDATE public.quote_items qi
SET product_service_id = NULL
WHERE qi.product_service_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.products p 
    WHERE p.id = qi.product_service_id
  );

-- Add foreign key constraint referencing products table
ALTER TABLE IF EXISTS public.quote_items
  ADD CONSTRAINT quote_items_product_service_id_fkey
  FOREIGN KEY (product_service_id)
  REFERENCES public.products(id)
  ON DELETE SET NULL;

-- ============================
-- Add index for better query performance
-- ============================
CREATE INDEX IF NOT EXISTS idx_quote_items_product_service_id
  ON public.quote_items(product_service_id)
  WHERE product_service_id IS NOT NULL;

COMMIT;

-- ============================
-- Verification queries (run separately to check)
-- ============================
-- Check if column exists:
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_schema = 'public'
--   AND table_name = 'quote_items'
--   AND column_name = 'product_service_id';

-- Check if foreign key exists:
-- SELECT constraint_name, constraint_type
-- FROM information_schema.table_constraints
-- WHERE table_schema = 'public'
--   AND table_name = 'quote_items'
--   AND constraint_name = 'quote_items_product_service_id_fkey';

-- Check if index exists:
-- SELECT indexname, indexdef
-- FROM pg_indexes
-- WHERE schemaname = 'public'
--   AND tablename = 'quote_items'
--   AND indexname = 'idx_quote_items_product_service_id';

-- ============================
-- Rollback (if needed):
-- ============================
-- BEGIN;
--   ALTER TABLE IF EXISTS public.quote_items
--     DROP CONSTRAINT IF EXISTS quote_items_product_service_id_fkey;
--   DROP INDEX IF EXISTS idx_quote_items_product_service_id;
--   ALTER TABLE IF EXISTS public.quote_items
--     DROP COLUMN IF EXISTS product_service_id;
-- COMMIT;

