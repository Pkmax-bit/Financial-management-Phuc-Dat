-- Update storage policy to allow document files
-- Policy name assumed to be related to the condition provided
-- This SQL updates the policy to include document extensions: pdf, doc, docx, xls, xlsx, ppt, pptx, txt

BEGIN;

-- Drop existing policy if we knew the name, but since we don't, we'll provide the CREATE OR REPLACE statement
-- assuming the user knows the policy name or can use this condition in the dashboard.

-- Example Policy: "Allow Public Uploads"
-- You might need to adjust the policy name "Allow Public Uploads" to match your actual policy name on Supabase Dashboard.

CREATE OR REPLACE POLICY "Allow Public Uploads"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'minhchung_chiphi' AND
  (storage.extension(name) = ANY (ARRAY[
    'jpg', 'jpeg', 'png', 'gif', 'webp', 
    'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt'
  ]::text[]))
);

COMMIT;
