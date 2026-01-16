-- =====================================================
-- VERIFY BROADCAST TRIGGER
-- Script để kiểm tra xem trigger broadcast có hoạt động không
-- =====================================================

-- 1. Kiểm tra function có tồn tại không
SELECT 
    proname as function_name,
    prosrc as function_body
FROM pg_proc
WHERE proname = 'broadcast_message_changes';

-- 2. Kiểm tra trigger có tồn tại không
SELECT 
    tgname as trigger_name,
    tgrelid::regclass as table_name,
    tgenabled as enabled,
    pg_get_triggerdef(oid) as trigger_definition
FROM pg_trigger
WHERE tgname = 'messages_broadcast_trigger';

-- 3. Kiểm tra RLS policies trên realtime.messages
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'realtime' 
  AND tablename = 'messages';

-- 4. Test trigger bằng cách insert một message test (sẽ không lưu vào DB)
-- Lưu ý: Chỉ chạy nếu muốn test thực tế
-- INSERT INTO internal_messages (id, conversation_id, sender_id, content, created_at)
-- VALUES (
--     gen_random_uuid(),
--     'test-conversation-id',  -- Thay bằng conversation_id thực tế
--     'test-sender-id',        -- Thay bằng sender_id thực tế
--     'Test message',
--     NOW()
-- );

-- 5. Kiểm tra xem có messages nào trong realtime.messages không (chỉ admin mới thấy)
-- SELECT COUNT(*) FROM realtime.messages;

-- =====================================================
-- Nếu trigger không hoạt động, có thể cần:
-- 1. Chạy lại migration migrate_chat_to_broadcast.sql
-- 2. Kiểm tra xem Realtime extension có enabled không
-- 3. Kiểm tra xem publication có được setup đúng không
-- =====================================================

