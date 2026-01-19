-- =====================================================
-- DIAGNOSE REALTIME DELAY (29 seconds)
-- Kiểm tra các nguyên nhân có thể gây delay 29 giây
-- =====================================================

-- 1. Kiểm tra trigger có tồn tại và active không
SELECT 
    tgname as trigger_name,
    tgrelid::regclass as table_name,
    tgenabled as is_enabled,
    CASE tgenabled
        WHEN 'O' THEN 'Enabled'
        WHEN 'D' THEN 'Disabled'
        WHEN 'R' THEN 'Replica'
        WHEN 'A' THEN 'Always'
        ELSE 'Unknown'
    END as status
FROM pg_trigger
WHERE tgname = 'messages_broadcast_trigger'
AND tgrelid = 'internal_messages'::regclass;

-- 2. Kiểm tra function có tồn tại không
SELECT 
    proname as function_name,
    prosrc as function_body,
    proconfig as function_config
FROM pg_proc
WHERE proname = 'broadcast_message_changes';

-- 3. Kiểm tra indexes có tồn tại không
SELECT 
    indexname,
    indexdef,
    idx_scan as times_used,
    idx_tup_read as tuples_read,
    idx_tup_fetch as tuples_fetched
FROM pg_indexes
WHERE tablename IN ('internal_messages', 'internal_conversation_participants')
AND indexname IN (
    'idx_internal_messages_conversation_id',
    'idx_internal_messages_created_at',
    'idx_conversation_participants_user_conv'
);

-- 4. Kiểm tra RLS policies trên realtime.messages
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
AND tablename = 'messages'
AND policyname IN (
    'authenticated_users_can_receive_broadcasts',
    'authenticated_users_can_send_broadcasts'
);

-- 5. Kiểm tra xem có messages gần đây không và thời gian tạo
SELECT 
    id,
    conversation_id,
    sender_id,
    message_text,
    created_at,
    NOW() - created_at as age,
    EXTRACT(EPOCH FROM (NOW() - created_at)) as age_seconds
FROM internal_messages
ORDER BY created_at DESC
LIMIT 10;

-- 6. Kiểm tra xem có nhiều messages đang chờ broadcast không
SELECT 
    COUNT(*) as pending_messages,
    MIN(created_at) as oldest_message,
    MAX(created_at) as newest_message,
    NOW() - MAX(created_at) as time_since_last_message
FROM internal_messages
WHERE created_at > NOW() - INTERVAL '1 minute';

-- 7. Kiểm tra performance của RLS policy query
EXPLAIN ANALYZE
SELECT 1
FROM internal_conversation_participants icp
WHERE icp.user_id = auth.uid()
AND 'conversation:test:messages' = 'conversation:' || icp.conversation_id::text || ':messages'
LIMIT 1;

-- 8. Kiểm tra xem có locks trên internal_messages không
SELECT 
    locktype,
    relation::regclass,
    mode,
    granted,
    pid,
    query
FROM pg_locks
WHERE relation = 'internal_messages'::regclass;

-- 9. Kiểm tra xem có slow queries đang chạy không
SELECT 
    pid,
    now() - pg_stat_activity.query_start AS duration,
    query,
    state
FROM pg_stat_activity
WHERE (now() - pg_stat_activity.query_start) > interval '5 seconds'
AND state != 'idle'
ORDER BY duration DESC;

-- 10. Test trigger bằng cách insert một test message
-- (Chỉ chạy nếu muốn test, sẽ tạo một message test)
/*
DO $$
DECLARE
    test_conversation_id UUID;
    test_user_id UUID;
BEGIN
    -- Lấy conversation_id và user_id đầu tiên để test
    SELECT id INTO test_conversation_id FROM internal_conversations LIMIT 1;
    SELECT user_id INTO test_user_id FROM internal_conversation_participants WHERE conversation_id = test_conversation_id LIMIT 1;
    
    IF test_conversation_id IS NOT NULL AND test_user_id IS NOT NULL THEN
        -- Insert test message
        INSERT INTO internal_messages (conversation_id, sender_id, message_text, message_type)
        VALUES (test_conversation_id, test_user_id, 'TEST MESSAGE - ' || NOW()::text, 'text')
        RETURNING id, created_at INTO test_message_id, test_created_at;
        
        RAISE NOTICE 'Test message created: % at %', test_message_id, test_created_at;
        RAISE NOTICE 'Check if broadcast was sent immediately';
    ELSE
        RAISE NOTICE 'No conversation or user found for testing';
    END IF;
END $$;
*/


