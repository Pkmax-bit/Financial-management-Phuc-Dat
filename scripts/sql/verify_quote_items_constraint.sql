-- Script kiểm tra constraint và foreign key đã được tạo đúng chưa
-- Chạy script này sau khi chạy migration để verify

-- 1. Kiểm tra column product_service_id có tồn tại không
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'quote_items'
  AND column_name = 'product_service_id';

-- 2. Kiểm tra foreign key constraint và bảng được reference
SELECT 
  tc.constraint_name,
  tc.constraint_type,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS referenced_table_name,
  ccu.column_name AS referenced_column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage ccu
  ON tc.constraint_name = ccu.constraint_name
  AND tc.table_schema = ccu.table_schema
WHERE tc.table_schema = 'public'
  AND tc.table_name = 'quote_items'
  AND tc.constraint_type = 'FOREIGN KEY'
  AND kcu.column_name = 'product_service_id';

-- 3. Kiểm tra index
SELECT 
  indexname, 
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'quote_items'
  AND indexname = 'idx_quote_items_product_service_id';

-- 4. Kiểm tra số lượng quote_items có product_service_id
SELECT 
  COUNT(*) as total_items,
  COUNT(product_service_id) as items_with_product_id,
  COUNT(*) - COUNT(product_service_id) as items_without_product_id
FROM public.quote_items;

-- 5. Kiểm tra quote_items có product_service_id không hợp lệ (không tồn tại trong products)
SELECT 
  qi.id,
  qi.product_service_id,
  qi.name_product,
  qi.quote_id
FROM public.quote_items qi
WHERE qi.product_service_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.products p 
    WHERE p.id = qi.product_service_id
  );

-- Kết quả mong đợi:
-- 1. Column product_service_id phải tồn tại với data_type = 'uuid'
-- 2. Foreign key constraint phải reference bảng 'products' (KHÔNG phải 'products_services')
-- 3. Index phải tồn tại
-- 4. Query #5 phải trả về 0 rows (không có product_service_id nào không hợp lệ)

