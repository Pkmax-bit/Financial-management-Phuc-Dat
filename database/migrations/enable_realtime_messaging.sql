-- =====================================================
-- Enable Supabase Realtime cho Internal Chat
-- =====================================================
-- File này enable Realtime cho bảng internal_messages
-- để hỗ trợ real-time messaging
-- =====================================================

-- Bước 1: Kiểm tra xem bảng đã được thêm vào publication chưa
DO $$
BEGIN
    -- Kiểm tra xem internal_messages đã có trong publication chưa
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'internal_messages'
    ) THEN
        -- Thêm bảng vào publication
        ALTER PUBLICATION supabase_realtime ADD TABLE internal_messages;
        RAISE NOTICE '✅ Đã enable Realtime cho bảng internal_messages';
    ELSE
        RAISE NOTICE 'ℹ️ Bảng internal_messages đã có trong Realtime publication';
    END IF;
END $$;

-- Bước 2: Verify
SELECT 
    schemaname,
    tablename,
    pubname
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
AND tablename = 'internal_messages';

-- Kết quả mong đợi: Phải có 1 dòng với tablename = 'internal_messages'
-- Nếu không có, có thể cần restart Supabase Realtime service

-- =====================================================
-- Lưu ý:
-- 1. Sau khi chạy script này, cần đợi vài giây để Supabase Realtime service reload
-- 2. Nếu vẫn không hoạt động, thử restart Supabase project
-- 3. Kiểm tra trong Supabase Dashboard > Database > Replication
-- =====================================================

