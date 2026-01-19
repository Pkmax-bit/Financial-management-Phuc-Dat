-- =====================================================
-- TEST BROADCAST TRIGGER
-- Script để test xem trigger có hoạt động không
-- =====================================================

-- 1. Kiểm tra trigger có tồn tại và enabled
SELECT 
    tgname as trigger_name,
    tgrelid::regclass as table_name,
    tgenabled as enabled,
    pg_get_triggerdef(oid) as trigger_definition
FROM pg_trigger
WHERE tgname = 'messages_broadcast_trigger';

-- 2. Kiểm tra function
SELECT 
    proname as function_name,
    prosrc as function_body
FROM pg_proc
WHERE proname = 'broadcast_message_changes';

-- 3. Test trigger bằng cách insert một message test
-- LƯU Ý: Thay conversation_id và sender_id bằng giá trị thực tế từ database của bạn
DO $$
DECLARE
    test_conversation_id UUID;
    test_sender_id UUID;
    test_message_id UUID;
BEGIN
    -- Lấy conversation_id đầu tiên có participants
    SELECT ic.id INTO test_conversation_id
    FROM internal_conversations ic
    JOIN internal_conversation_participants icp ON ic.id = icp.conversation_id
    LIMIT 1;
    
    -- Lấy sender_id từ participant đầu tiên
    SELECT icp.user_id INTO test_sender_id
    FROM internal_conversation_participants icp
    WHERE icp.conversation_id = test_conversation_id
    LIMIT 1;
    
    IF test_conversation_id IS NULL OR test_sender_id IS NULL THEN
        RAISE NOTICE '⚠️ Không tìm thấy conversation hoặc sender để test';
        RETURN;
    END IF;
    
    RAISE NOTICE '🧪 Testing broadcast trigger...';
    RAISE NOTICE '   Conversation ID: %', test_conversation_id;
    RAISE NOTICE '   Sender ID: %', test_sender_id;
    
    -- Insert test message
    test_message_id := gen_random_uuid();
    INSERT INTO internal_messages (
        id,
        conversation_id,
        sender_id,
        message_text,
        message_type,
        created_at
    ) VALUES (
        test_message_id,
        test_conversation_id,
        test_sender_id,
        'Test message from trigger - ' || NOW()::text,
        'text',
        NOW()
    );
    
    RAISE NOTICE '✅ Test message inserted: %', test_message_id;
    RAISE NOTICE '📡 Trigger should have broadcasted to channel: conversation:%:messages', test_conversation_id;
    RAISE NOTICE '';
    RAISE NOTICE '🔍 Kiểm tra realtime.messages table:';
    RAISE NOTICE '   SELECT * FROM realtime.messages WHERE topic = ''conversation:%:messages'' ORDER BY inserted_at DESC LIMIT 5;', test_conversation_id;
    
    -- Cleanup: Xóa test message
    DELETE FROM internal_messages WHERE id = test_message_id;
    RAISE NOTICE '🧹 Test message deleted';
END $$;

-- 4. Kiểm tra RLS policies
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

-- 5. Kiểm tra xem có messages nào trong realtime.messages không
-- (Chỉ admin mới thấy được)
-- SELECT COUNT(*) as total_messages FROM realtime.messages;
-- SELECT topic, COUNT(*) as count 
-- FROM realtime.messages 
-- WHERE topic LIKE 'conversation:%:messages'
-- GROUP BY topic
-- ORDER BY count DESC
-- LIMIT 10;

-- =====================================================
-- Nếu trigger không hoạt động:
-- 1. Chạy lại migration: \i database/migrations/migrate_chat_to_broadcast.sql
-- 2. Kiểm tra Realtime extension: SELECT * FROM pg_extension WHERE extname = 'realtime';
-- 3. Kiểm tra publication: SELECT * FROM pg_publication WHERE pubname LIKE '%realtime%';
-- =====================================================


