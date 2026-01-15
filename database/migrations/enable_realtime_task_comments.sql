-- Enable Supabase Realtime for task_comments table
-- This allows real-time updates for task chat messages on both Web and Android

-- Bước 1: Kiểm tra xem bảng đã được thêm vào publication chưa
DO $$
BEGIN
    -- Kiểm tra xem task_comments đã có trong publication chưa
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'task_comments'
    ) THEN
        -- Thêm bảng vào publication
        ALTER PUBLICATION supabase_realtime ADD TABLE task_comments;
        RAISE NOTICE '✅ Đã thêm bảng task_comments vào Supabase Realtime publication';
    ELSE
        RAISE NOTICE 'ℹ️ Bảng task_comments đã có trong Realtime publication';
    END IF;
END $$;

-- Bước 2: Kiểm tra lại để xác nhận
SELECT 
    pubname as publication_name,
    schemaname as schema_name,
    tablename as table_name
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime' 
AND tablename = 'task_comments';

-- Nếu query trên trả về 1 row, nghĩa là đã setup thành công!
-- Bây giờ cả Web và Android đều có thể nhận realtime updates cho task comments



