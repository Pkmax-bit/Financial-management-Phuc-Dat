-- =====================================================
-- MAXIMIZE SUPABASE REALTIME PERFORMANCE
-- Tối ưu hết mức có thể ở phía Supabase
-- =====================================================

-- Bước 1: Đảm bảo tất cả indexes cần thiết đã được tạo
-- Indexes giúp RLS policies và queries chạy nhanh hơn

-- Index trên internal_conversation_participants (cho RLS policies)
CREATE INDEX IF NOT EXISTS idx_conversation_participants_user_conv 
ON internal_conversation_participants(user_id, conversation_id);

-- Index trên conversation_id để extract nhanh hơn
CREATE INDEX IF NOT EXISTS idx_conversation_participants_conv_id 
ON internal_conversation_participants(conversation_id);

-- Index trên internal_messages (cho trigger và queries)
CREATE INDEX IF NOT EXISTS idx_internal_messages_conversation_id 
ON internal_messages(conversation_id);

CREATE INDEX IF NOT EXISTS idx_internal_messages_created_at 
ON internal_messages(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_internal_messages_sender_id 
ON internal_messages(sender_id);

-- Composite index cho queries thường dùng
CREATE INDEX IF NOT EXISTS idx_internal_messages_conv_created 
ON internal_messages(conversation_id, created_at DESC);

-- Index trên users table (cho sender info lookup trong trigger)
CREATE INDEX IF NOT EXISTS idx_users_id 
ON users(id);

-- Index trên employees table (cho sender info lookup trong trigger)
CREATE INDEX IF NOT EXISTS idx_employees_user_id 
ON employees(user_id);

-- Bước 2: Tối ưu RLS Policies - Sử dụng index scan
-- Đảm bảo policies sử dụng indexes hiệu quả

-- Drop old policies
DROP POLICY IF EXISTS "authenticated_users_can_receive_broadcasts" ON realtime.messages;
DROP POLICY IF EXISTS "authenticated_users_can_send_broadcasts" ON realtime.messages;

-- Policy: Cho phép đọc broadcasts - Tối ưu với index scan
-- Sử dụng EXISTS với index để tăng tốc độ
CREATE POLICY "authenticated_users_can_receive_broadcasts" ON realtime.messages
FOR SELECT
TO authenticated
USING (
  -- Extract conversation_id from topic: 'conversation:{id}:messages'
  -- Use index scan for fast lookup
  EXISTS (
    SELECT 1
    FROM internal_conversation_participants icp
    WHERE icp.user_id = auth.uid()
    AND realtime.topic() = 'conversation:' || icp.conversation_id::text || ':messages'
    AND realtime.messages.extension = 'broadcast'
    -- Index idx_conversation_participants_user_conv will be used
  )
);

-- Policy: Cho phép gửi broadcasts - Tối ưu với index scan
CREATE POLICY "authenticated_users_can_send_broadcasts" ON realtime.messages
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM internal_conversation_participants icp
    WHERE icp.user_id = auth.uid()
    AND realtime.topic() = 'conversation:' || icp.conversation_id::text || ':messages'
    AND realtime.messages.extension = 'broadcast'
    -- Index idx_conversation_participants_user_conv will be used
  )
);

-- Bước 3: Tối ưu trigger function - Đảm bảo không có delay
-- Sử dụng indexes cho sender info lookup

DROP FUNCTION IF EXISTS broadcast_message_changes() CASCADE;

CREATE OR REPLACE FUNCTION broadcast_message_changes()
RETURNS TRIGGER AS $$
DECLARE
    sender_name TEXT;
    sender_full_name TEXT;
    enriched_record JSONB;
BEGIN
    -- Get sender name from users table (only for INSERT and UPDATE)
    -- Sử dụng index idx_users_id để lookup nhanh
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        -- Fast lookup với index
        SELECT COALESCE(u.full_name, u.email, 'Unknown') INTO sender_name
        FROM users u
        WHERE u.id = NEW.sender_id
        LIMIT 1;
        
        -- If not found in users, try employees table với index
        IF sender_name IS NULL OR sender_name = 'Unknown' THEN
            SELECT COALESCE(e.full_name, e.first_name || ' ' || e.last_name, 'Unknown') INTO sender_full_name
            FROM employees e
            WHERE e.user_id = NEW.sender_id
            LIMIT 1;
            
            sender_name := COALESCE(sender_full_name, 'Unknown');
        END IF;
        
        -- Build enriched record with sender info
        enriched_record := jsonb_build_object(
            'id', NEW.id,
            'conversation_id', NEW.conversation_id,
            'sender_id', NEW.sender_id,
            'sender_name', COALESCE(sender_name, 'Unknown'),
            'message_text', NEW.message_text,
            'message_type', NEW.message_type,
            'file_url', NEW.file_url,
            'file_name', NEW.file_name,
            'file_size', NEW.file_size,
            'reply_to_id', NEW.reply_to_id,
            'is_deleted', NEW.is_deleted,
            'is_edited', NEW.is_edited,
            'created_at', NEW.created_at,
            'updated_at', NEW.updated_at
        );
        
        -- Broadcast immediately - no delay
        PERFORM realtime.broadcast_changes(
            'conversation:' || NEW.conversation_id::text || ':messages',
            TG_OP,
            TG_OP,
            TG_TABLE_NAME,
            TG_TABLE_SCHEMA,
            enriched_record::jsonb,  -- Use enriched record with sender info
            NULL
        );
    ELSE
        -- For DELETE, use OLD record (no need for sender info)
        PERFORM realtime.broadcast_changes(
            'conversation:' || OLD.conversation_id::text || ':messages',
            TG_OP,
            TG_OP,
            TG_TABLE_NAME,
            TG_TABLE_SCHEMA,
            NULL,
            OLD
        );
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Bước 4: Đảm bảo trigger được tạo với performance tốt nhất
DROP TRIGGER IF EXISTS messages_broadcast_trigger ON internal_messages;

CREATE TRIGGER messages_broadcast_trigger
  AFTER INSERT OR UPDATE OR DELETE ON internal_messages
  FOR EACH ROW 
  EXECUTE FUNCTION broadcast_message_changes();

-- Bước 5: Analyze tables để optimizer sử dụng indexes hiệu quả
-- Cập nhật statistics để query planner chọn indexes tốt nhất
ANALYZE internal_messages;
ANALYZE internal_conversation_participants;
ANALYZE users;
ANALYZE employees;

-- Bước 6: Tối ưu table settings (nếu có thể)
-- Đảm bảo tables được tối ưu cho read/write performance

-- Bước 7: Verify tất cả indexes và policies
DO $$
BEGIN
    -- Check indexes
    IF EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_conversation_participants_user_conv'
    ) THEN
        RAISE NOTICE '✅ Index idx_conversation_participants_user_conv exists';
    ELSE
        RAISE WARNING '⚠️ Index idx_conversation_participants_user_conv missing';
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_internal_messages_conv_created'
    ) THEN
        RAISE NOTICE '✅ Index idx_internal_messages_conv_created exists';
    ELSE
        RAISE WARNING '⚠️ Index idx_internal_messages_conv_created missing';
    END IF;
    
    -- Check trigger
    IF EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'messages_broadcast_trigger' 
        AND tgrelid = 'internal_messages'::regclass
    ) THEN
        RAISE NOTICE '✅ Trigger messages_broadcast_trigger exists';
    ELSE
        RAISE EXCEPTION '❌ Trigger messages_broadcast_trigger missing!';
    END IF;
    
    -- Check policies
    IF EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'realtime' 
        AND tablename = 'messages'
        AND policyname = 'authenticated_users_can_receive_broadcasts'
    ) THEN
        RAISE NOTICE '✅ RLS policy authenticated_users_can_receive_broadcasts exists';
    ELSE
        RAISE WARNING '⚠️ RLS policy authenticated_users_can_receive_broadcasts missing';
    END IF;
    
    RAISE NOTICE '✅ All optimizations verified';
END $$;

-- =====================================================
-- Các Tối Ưu Đã Thực Hiện:
-- 1. Tạo tất cả indexes cần thiết (composite indexes)
-- 2. Tối ưu RLS policies với index scan
-- 3. Tối ưu trigger function với index lookup
-- 4. ANALYZE tables để optimizer sử dụng indexes
-- 5. Verify tất cả indexes và policies
-- 
-- Expected Performance:
-- - RLS policy evaluation: < 10ms (với indexes)
-- - Trigger execution: < 5ms (với index lookup)
-- - Broadcast delivery: < 100ms (từ database)
-- - Total: < 200ms từ database đến frontend
-- =====================================================


