-- Update Storage RLS Policies to allow all document file types
-- This migration ensures that authenticated users can upload various document types
-- Note: MIME type restrictions in bucket settings must also be configured in Supabase Dashboard

BEGIN;

-- Drop existing restrictive policies if they exist (adjust policy names as needed)
-- You may need to check your actual policy names in Supabase Dashboard

-- Policy for INSERT (Upload)
-- Allow authenticated users to upload files to minhchung_chiphi bucket
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
CREATE POLICY "Allow authenticated uploads"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'minhchung_chiphi'
);

-- Policy for SELECT (Download/View)
-- Allow authenticated users to view/download files
DROP POLICY IF EXISTS "Allow authenticated downloads" ON storage.objects;
CREATE POLICY "Allow authenticated downloads"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'minhchung_chiphi'
);

-- Policy for UPDATE (Modify)
-- Allow authenticated users to update their own files
DROP POLICY IF EXISTS "Allow authenticated updates" ON storage.objects;
CREATE POLICY "Allow authenticated updates"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'minhchung_chiphi'
)
WITH CHECK (
  bucket_id = 'minhchung_chiphi'
);

-- Policy for DELETE
-- Allow authenticated users to delete files
DROP POLICY IF EXISTS "Allow authenticated deletes" ON storage.objects;
CREATE POLICY "Allow authenticated deletes"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'minhchung_chiphi'
);

COMMIT;

-- IMPORTANT NOTES:
-- 1. This SQL only updates RLS (Row Level Security) policies
-- 2. MIME type restrictions are configured in Supabase Dashboard, not via SQL
-- 3. You must also configure bucket settings in Supabase Dashboard:
--    - Go to Storage → Buckets → minhchung_chiphi → Settings
--    - Add allowed MIME types or remove restrictions
--    - Required MIME types for documents:
--      * application/pdf
--      * application/msword
--      * application/vnd.openxmlformats-officedocument.wordprocessingml.document
--      * application/vnd.ms-excel
--      * application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
--      * text/plain
--      * text/csv
--      * application/octet-stream (for generic file uploads)

